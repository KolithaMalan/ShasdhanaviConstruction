import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { UserModel } from "@/models/User";

export interface MaterialsItem {
  no: number;
  item: string;
  quantity: string;
  remark: string;
}

export interface ContractorMaterials {
  contractorId: string;
  companyName: string;
  items: MaterialsItem[];
}

/**
 * Collects a contractor's full on-site inventory — electrical equipment and
 * non-electrical tools — into a single flat list for the materials gate-pass
 * form / security lookup. Excludes items that have been removed from site.
 */
export async function loadContractorMaterials(
  contractorId: string,
): Promise<ContractorMaterials> {
  const [user, electrical, nonElectrical] = await Promise.all([
    UserModel.findById(contractorId).lean(),
    ElectricalEquipmentModel.find({ contractorId, status: { $ne: "REMOVED" } })
      .sort({ createdAt: 1 })
      .lean(),
    NonElectricalToolModel.find({ contractorId })
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const companyName =
    user?.companyName ||
    electrical[0]?.companyName ||
    nonElectrical[0]?.companyName ||
    user?.name ||
    "";

  const items: MaterialsItem[] = [];
  let no = 0;

  for (const e of electrical) {
    no += 1;
    items.push({
      no,
      item: e.toolName,
      quantity: String(e.quantity),
      remark: ["Electrical", e.category].filter(Boolean).join(" · "),
    });
  }

  for (const t of nonElectrical) {
    no += 1;
    items.push({
      no,
      item: t.toolName,
      quantity: `${t.approvedQuantity}${t.unit ? ` ${t.unit}` : ""}`,
      remark: ["Non-Electrical", t.category].filter(Boolean).join(" · "),
    });
  }

  return { contractorId, companyName, items };
}
