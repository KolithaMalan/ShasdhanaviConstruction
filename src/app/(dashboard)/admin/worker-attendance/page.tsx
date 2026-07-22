import { WorkerAttendanceView } from "@/components/hseq/WorkerAttendanceView";

export const metadata = { title: "Worker Attendance" };

/** Nuwan (ADMIN_HSEQ) — read-only monitoring (same view). */
export default function AdminWorkerAttendancePage() {
  return <WorkerAttendanceView />;
}
