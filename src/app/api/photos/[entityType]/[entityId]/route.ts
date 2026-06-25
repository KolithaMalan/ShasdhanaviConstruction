import { connectDB } from "@/lib/db";
import { PhotoModel } from "@/models/Photo";
import { EmployeeModel } from "@/models/Employee";
import { requireSession, jsonError } from "@/lib/api";
import { PHOTO_ENTITY_TYPES, type PhotoEntityType } from "@/types";
import { deletePhoto } from "@/lib/photoService";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const { entityType, entityId } = await ctx.params;
  const type = entityType.toUpperCase() as PhotoEntityType;
  if (!PHOTO_ENTITY_TYPES.includes(type)) return jsonError("Invalid entity type", 400);

  const decoded = decodeURIComponent(entityId);
  const { searchParams } = new URL(req.url);
  const wantThumb = searchParams.get("size") === "thumbnail";

  await connectDB();

  /* Phase 7 — for EMPLOYEE the authoritative storage is the bytes embedded
     directly on the Employee document. Try this FIRST. A stale Photo
     collection doc (from earlier upload attempts) should never shadow a
     freshly captured photo on the employee record.

     NB: don't use `.lean()` here. `.lean()` returns Buffer fields as raw
     BSON `Binary` objects, and `Buffer.from(binary)` doesn't correctly
     extract the bytes — body.length comes out 0 and the photo silently
     becomes invisible. A non-lean Mongoose query hydrates the field as
     a real Node Buffer for us. */
  if (type === "EMPLOYEE") {
    const emp = await EmployeeModel.findOne({ nicNumber: decoded })
      .select("+photoData +photoMimeType")
      .exec();
    if (emp?.photoData) {
      const raw = emp.photoData as unknown;
      let body: Buffer | null = null;
      if (Buffer.isBuffer(raw)) {
        body = raw;
      } else if (
        raw &&
        typeof raw === "object" &&
        "buffer" in (raw as Record<string, unknown>) &&
        Buffer.isBuffer((raw as { buffer: unknown }).buffer)
      ) {
        /* BSON Binary fallback — should never hit this branch with the
           non-lean query above, but kept defensively. */
        body = (raw as { buffer: Buffer }).buffer;
      }
      if (body && body.length > 0) {
        const empMime = emp.photoMimeType || "image/jpeg";
        const updatedAt = (emp as unknown as { updatedAt: Date }).updatedAt ?? new Date();
        const empEtag = `"e-${decoded}-${new Date(updatedAt).getTime()}"`;
        if (req.headers.get("if-none-match") === empEtag) {
          return new Response(null, {
            status: 304,
            headers: { "Cache-Control": "no-cache", ETag: empEtag },
          });
        }
        return new Response(new Uint8Array(body), {
          headers: {
            "Content-Type": empMime,
            "Content-Length": String(body.length),
            /* `no-cache` forces the browser to revalidate every request,
               so retakes show up immediately instead of being served from
               a stale cached copy. The ETag still avoids re-downloading
               unchanged photos via 304s. */
            "Cache-Control": "no-cache",
            ETag: empEtag,
          },
        });
      }
    }
  }

  const doc = await PhotoModel.findOne({ entityType: type, entityId: decoded })
    .select(wantThumb ? "thumbnail thumbnailMimeType updatedAt" : "data mimeType updatedAt")
    .lean();

  if (!doc) {
    // Tiny 1×1 transparent gif so <img> elements degrade gracefully
    const empty = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64",
    );
    return new Response(empty, {
      status: 404,
      headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
    });
  }

  const buf = wantThumb
    ? ((doc.thumbnail as unknown as Buffer | null) ?? (doc.data as unknown as Buffer))
    : (doc.data as unknown as Buffer);
  const mime = wantThumb
    ? (doc.thumbnailMimeType ?? "image/jpeg")
    : (doc.mimeType ?? "image/jpeg");
  const etag = `"p-${entityType}-${entityId}-${new Date(doc.updatedAt as Date).getTime()}-${wantThumb ? "t" : "f"}"`;

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { "Cache-Control": "public, max-age=86400, immutable", ETag: etag },
    });
  }

  const body = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as unknown as Buffer);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=86400, immutable",
      ETag: etag,
    },
  });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;
  if (!["SUPER_ADMIN", "ADMIN_HSEQ", "HSEQ_OFFICER"].includes(guard.session.user.role)) {
    return jsonError("Forbidden", 403);
  }

  const { entityType, entityId } = await ctx.params;
  const type = entityType.toUpperCase() as PhotoEntityType;
  if (!PHOTO_ENTITY_TYPES.includes(type)) return jsonError("Invalid entity type", 400);
  const decoded = decodeURIComponent(entityId);

  await connectDB();
  await deletePhoto(type, decoded);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DELETE",
    entityType: "Photo",
    entityId: `${type}/${decoded}`,
    description: `Deleted photo for ${type} ${decoded}`,
    request: req,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
