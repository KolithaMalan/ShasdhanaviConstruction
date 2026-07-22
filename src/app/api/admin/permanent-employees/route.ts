import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { requireRole, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";
import { createPermanentEmployee, serializePermanentEmployee } from "@/lib/permanentEmployee";
import { decodeImageDataUrl, processProfilePhoto } from "@/lib/photoService";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Nuwan (ADMIN_HSEQ) keeps view access; Dinesh (HSEQ_OFFICER) + Super Admin manage.
  const guard = await requireRole(["ADMIN_HSEQ", "HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { nicNumber: { $regex: q, $options: "i" } },
      { permanentId: { $regex: q, $options: "i" } },
      { designation: { $regex: q, $options: "i" } },
      { department: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await PermanentEmployeeModel.find(filter).sort({ createdAt: -1 }).limit(1000);

  return NextResponse.json({ items: docs.map(serializePermanentEmployee) });
}

interface Body {
  name?: string;
  designation?: string;
  department?: string;
  nicNumber?: string;
  photoDataUrl?: string;
}

export async function POST(req: Request) {
  // Registration authority moved from Nuwan to Dinesh (HSEQ_OFFICER).
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:permanent.register");
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim();
  const designation = body.designation?.trim() ?? "";
  const department = body.department?.trim() ?? "";
  const nicNumber = body.nicNumber?.trim().toUpperCase();

  if (!name) return jsonError("Name is required", 400);
  if (!nicNumber) return jsonError("NIC is required", 400);

  await connectDB();

  const existing = await PermanentEmployeeModel.exists({ nicNumber });
  if (existing) return jsonError("A permanent employee with this NIC already exists", 409);

  /* Process the optional photo before we create anything, so a bad image
     fails fast without leaving an orphan record. */
  let photo: Buffer | null = null;
  if (body.photoDataUrl) {
    try {
      photo = await processProfilePhoto(decodeImageDataUrl(body.photoDataUrl));
    } catch {
      return jsonError("Invalid photo data", 422);
    }
  }

  let doc;
  try {
    doc = await createPermanentEmployee({
      name,
      designation,
      department,
      nicNumber,
      createdBy: guard.session.user.id,
      createdByName: guard.session.user.name ?? "",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create";
    if (/duplicate key/i.test(message)) return jsonError("Duplicate NIC", 409);
    return jsonError(message, 500);
  }

  if (photo) {
    const photoUrl = `/api/admin/permanent-employees/${doc._id}/photo`;
    await PermanentEmployeeModel.updateOne(
      { _id: doc._id },
      { $set: { photoData: photo, photoMimeType: "image/jpeg", photoUrl } },
    );
    doc.photoUrl = photoUrl;
  }

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "CREATE",
    entityType: "PermanentEmployee",
    entityId: doc.permanentId ?? "",
    description: `Created permanent employee ${name} (${doc.permanentId ?? ""})`,
    request: req,
  });

  return NextResponse.json({ item: serializePermanentEmployee(doc) }, { status: 201 });
}
