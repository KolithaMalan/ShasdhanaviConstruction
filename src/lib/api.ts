import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@/types";

export type Guarded<T> =
  | { ok: true; session: AwaitedSession; value: T }
  | { ok: false; response: Response };

type AwaitedSession = Awaited<ReturnType<typeof auth>> & {};

/** Returns the session if signed in, else 401 response. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.role) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}

/** Returns the session if signed in AND role is in `allowed`, else 401/403. */
export async function requireRole(allowed: Role[]) {
  const guard = await requireSession();
  if (!guard.ok) return guard;
  if (!allowed.includes(guard.session.user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }
  return guard;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
