import { WorkersView } from "@/components/hseq/WorkersView";

export const metadata = { title: "Workers" };

export default function AdminWorkersPage() {
  return <WorkersView canManage={false} />;
}
