import { EmployeeQrCodesView } from "@/components/admin/EmployeeQrCodesView";

export const dynamic = "force-dynamic";

export default function AdminEmployeeQrCodesPage() {
  return (
    <EmployeeQrCodesView
      eyebrow="Admin"
      title="Employee QR Code Downloads"
      showContractorFilter
      detailRoutePrefix="/admin"
    />
  );
}
