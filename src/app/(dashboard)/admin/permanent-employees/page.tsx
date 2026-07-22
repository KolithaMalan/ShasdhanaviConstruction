import { PermanentEmployeesView } from "@/components/hseq/PermanentEmployeesView";

export const metadata = { title: "Permanent Employees" };

/** Nuwan (ADMIN_HSEQ) — read-only monitoring. Registration moved to Dinesh. */
export default function AdminPermanentEmployeesPage() {
  return <PermanentEmployeesView canManage={false} />;
}
