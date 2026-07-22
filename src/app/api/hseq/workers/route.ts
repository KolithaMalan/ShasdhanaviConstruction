import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { WorkerModel } from "@/models/Worker";
import { requireRole, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";
import { createWorker, serializeWorker } from "@/lib/worker";
import { decodeImageDataUrl, processProfilePhoto } from "@/lib/photoService";
import { logAction } from "@/lib/auditLogger";
import { WORKER_COMPANIES, type WorkerCompany } from "@/types";

export const runtime = "nodejs";

/* Nuwan (ADMIN_HSEQ) may view; Dinesh (HSEQ_OFFICER) + Super Admin manage. */
const VIEW_ROLES = ["ADMIN_HSEQ", "HSEQ_OFFICER", "SUPER_ADMIN"] as const;
const MANAGE_ROLES = ["HSEQ_OFFICER", "SUPER_ADMIN"] as const;

export async function GET(req: Request) {
  const guard = await requireRole([...VIEW_ROLES]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const company = searchParams.get("company")?.trim();

  const filter: Record<string, unknown> = {};
  if (company && WORKER_COMPANIES.includes(company as WorkerCompany)) {
    filter.company = company;
  }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { nicNumber: { $regex: q, $options: "i" } },
      { workerId: { $regex: q, $options: "i" } },
      { designation: { $regex: q, $options: "i" } },
      { department: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await WorkerModel.find(filter).sort({ createdAt: -1 }).limit(1000);

  return NextResponse.json({ items: docs.map(serializeWorker) });
}

interface Body {
  name?: string;
  company?: string;
  designation?: string;
  department?: string;
  nicNumber?: string;
  mobileNumber?: string;
  photoDataUrl?: string;
}

export async function POST(req: Request) {
  const guard = await requireRole([...MANAGE_ROLES]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:worker.register");
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim();
  const company = body.company?.trim();
  const designation = body.designation?.trim() ?? "";
  const department = body.department?.trim() ?? "";
  const nicNumber = body.nicNumber?.trim().toUpperCase();
  const mobileNumber = body.mobileNumber?.trim() ?? "";

  if (!name) return jsonError("Name is required", 400);
  if (!company || !WORKER_COMPANIES.includes(company as WorkerCompany)) {
    return jsonError("A valid company (Yugadhanavi or Sobadhanavi) is required", 400);
  }
  if (!nicNumber) return jsonError("NIC is required", 400);

  await connectDB();

  const existing = await WorkerModel.exists({ nicNumber });
  if (existing) return jsonError("A worker with this NIC already exists", 409);

  /* Process the optional photo first, so a bad image fails fast. */
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
    doc = await createWorker({
      name,
      company: company as WorkerCompany,
      designation,
      department,
      nicNumber,
      mobileNumber,
      createdBy: guard.session.user.id,
      createdByName: guard.session.user.name ?? "",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create";
    if (/duplicate key/i.test(message)) return jsonError("Duplicate NIC", 409);
    return jsonError(message, 500);
  }

  if (photo) {
    const photoUrl = `/api/hseq/workers/${doc._id}/photo`;
    await WorkerModel.updateOne(
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
    entityType: "Worker",
    entityId: doc.workerId ?? "",
    description: `Registered ${company} worker ${name} (${doc.workerId ?? ""})`,
    request: req,
  });

  return NextResponse.json({ item: serializeWorker(doc) }, { status: 201 });
}
