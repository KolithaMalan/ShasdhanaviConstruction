import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { ToolMovementModel } from "@/models/ToolMovement";
import { requireRole, jsonError } from "@/lib/api";
import { withOptionalTransaction } from "@/lib/tools";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notificationService";
import { SCAN_DIRECTIONS, TOOL_MOVEMENT_TYPES } from "@/types";

export const runtime = "nodejs";

const itemSchema = z.object({
  toolType: z.enum(TOOL_MOVEMENT_TYPES),
  toolId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), { message: "Invalid toolId" }),
  quantity: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
  direction: z.enum(SCAN_DIRECTIONS),
  contractorId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  gatePassId: z.string().min(1, "Gate pass ID is required").max(80),
  notes: z.string().max(2000).optional().default(""),
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

export async function POST(req: Request) {
  const guard = await requireRole(["INTERNAL_SECURITY", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { direction, contractorId, gatePassId, notes, items } = parsed.data;

  await connectDB();
  const contractor = await UserModel.findOne({ _id: contractorId, role: "CONTRACTOR" }).lean();
  if (!contractor) return jsonError("Contractor not found", 404);
  const companyName = contractor.companyName ?? contractor.name;
  const officerId = new mongoose.Types.ObjectId(guard.session.user.id);
  const officerName = guard.session.user.name ?? "Officer";

  try {
    const result = await withOptionalTransaction(async (session) => {
      const sessionOpt = session ? { session } : {};
      const movementIds: string[] = [];

      for (const item of items) {
        if (item.toolType === "ELECTRICAL") {
          const tool = await ElectricalEquipmentModel
            .findOne({ _id: item.toolId, contractorId })
            .session(session ?? null);
          if (!tool) throw new Error("Electrical equipment not found or not owned by contractor");
          if (tool.status !== "APPROVED_INVENTORY") {
            throw new Error(`${tool.toolName} (${tool.equipmentId}) is not approved for movement`);
          }

          const before = tool.currentBalance;
          if (direction === "OUT" && item.quantity > before) {
            throw new Error(`${tool.toolName}: cannot remove ${item.quantity} — only ${before} on site`);
          }
          const after = direction === "OUT" ? before - item.quantity : before + item.quantity;
          tool.currentBalance = after;
          await tool.save(sessionOpt);

          const mv = await ToolMovementModel.create(
            [{
              contractorId,
              companyName,
              toolType: "ELECTRICAL",
              toolId: tool._id,
              toolName: tool.toolName,
              toolIdentifier: tool.equipmentId,
              direction,
              quantity: item.quantity,
              balanceBefore: before,
              balanceAfter: after,
              gatePassId,
              processedBy: officerId,
              processedByName: officerName,
              notes,
            }],
            session ? { session } : undefined,
          );
          movementIds.push(String(mv[0]!._id));
        } else {
          const tool = await NonElectricalToolModel
            .findOne({ _id: item.toolId, contractorId })
            .session(session ?? null);
          if (!tool) throw new Error("Non-electrical tool not found or not owned by contractor");
          if (tool.status === "BLOCKED") {
            throw new Error(`${tool.toolName} (${tool.toolId}) is BLOCKED`);
          }

          const before = tool.currentBalance;
          if (direction === "OUT" && item.quantity > before) {
            throw new Error(`${tool.toolName}: cannot remove ${item.quantity} — only ${before} on site`);
          }
          let after = direction === "OUT" ? before - item.quantity : before + item.quantity;
          if (direction === "IN" && after > tool.approvedQuantity) {
            throw new Error(`${tool.toolName}: incoming ${item.quantity} would exceed approved quantity ${tool.approvedQuantity}`);
          }

          tool.currentBalance = after;
          /* Re-activate if balance recovers from zero, or mark depleted if it hits zero. */
          if (after === 0) tool.status = "DEPLETED";
          else if (tool.status === "DEPLETED") tool.status = "ACTIVE";
          await tool.save(sessionOpt);

          const mv = await ToolMovementModel.create(
            [{
              contractorId,
              companyName,
              toolType: "NON_ELECTRICAL",
              toolId: tool._id,
              toolName: tool.toolName,
              toolIdentifier: tool.toolId,
              direction,
              quantity: item.quantity,
              balanceBefore: before,
              balanceAfter: after,
              gatePassId,
              processedBy: officerId,
              processedByName: officerName,
              notes,
            }],
            session ? { session } : undefined,
          );
          movementIds.push(String(mv[0]!._id));
        }
      }

      return { movementIds };
    });

    void logAction({
      userId: guard.session.user.id, userName: officerName,
      userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
      action: "GATE_PASS", entityType: "ToolMovement",
      entityId: gatePassId,
      description: `${direction} · ${items.length} item(s) · ${companyName} · pass ${gatePassId}`,
      request: req,
    });

    void createNotification({
      userId: contractorId,
      type: "GATE_PASS_PROCESSED",
      title: `Gate pass ${direction}`,
      message: `Pass ${gatePassId}: ${items.length} item(s) marked ${direction} by ${officerName}.`,
      link: "/contractor/tool-movements",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Movement failed" },
      { status: 400 },
    );
  }
}
