import { EmployeeQrCodesView } from "@/components/admin/EmployeeQrCodesView";

export const dynamic = "force-dynamic";

export default function HseqEmployeeQrCodesPage() {
  return (
    <EmployeeQrCodesView
      eyebrow="HSEQ"
      title="Employee QR Code Downloads"
      showContractorFilter
      detailRoutePrefix="/hseq"
    />
  );
}
