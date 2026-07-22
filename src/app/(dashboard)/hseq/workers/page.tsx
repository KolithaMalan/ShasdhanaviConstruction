import { WorkersView } from "@/components/hseq/WorkersView";

export const metadata = { title: "Worker Registration" };

export default function HseqWorkersPage() {
  return <WorkersView canManage />;
}
