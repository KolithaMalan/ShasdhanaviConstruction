import { PermanentEmployeesView } from "@/components/hseq/PermanentEmployeesView";

export const metadata = { title: "Permanent Employees" };

/** Dinesh (HSEQ_OFFICER) — full registration + pass issuance. */
export default function HseqPermanentEmployeesPage() {
  return <PermanentEmployeesView canManage />;
}
