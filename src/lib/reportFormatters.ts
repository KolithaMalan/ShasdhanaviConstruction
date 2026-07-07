import { renderToBuffer } from "@react-pdf/renderer";
import ExcelJS from "exceljs";
import React from "react";

import {
  ReportPdfTemplate,
  type ReportColumn,
  type ReportRow,
  type SummaryStat,
} from "@/components/pdf/ReportPdfTemplate";

export type { ReportColumn, ReportRow, SummaryStat };
export type ReportFormat = "json" | "pdf" | "excel";

export interface ReportSpec {
  title: string;
  subtitle?: string;
  filters?: string;
  generatedBy?: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary?: SummaryStat[];
  orientation?: "portrait" | "landscape";
  sheetName?: string;
}

/** Slugify a title for use in a filename. */
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function buildPdf(spec: ReportSpec): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString("en-GB");
  const element = React.createElement(ReportPdfTemplate, {
    title: spec.title,
    subtitle: spec.subtitle,
    filters: spec.filters,
    generatedBy: spec.generatedBy,
    generatedAt,
    columns: spec.columns,
    rows: spec.rows,
    summary: spec.summary,
    orientation: spec.orientation ?? "portrait",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

export async function buildExcel(spec: ReportSpec): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sahasdhanavi Construction Security System";
  wb.created = new Date();
  const sheet = wb.addWorksheet(spec.sheetName ?? spec.title.slice(0, 31));

  // Brand header row
  sheet.mergeCells(1, 1, 1, spec.columns.length);
  sheet.getCell(1, 1).value = "SAHASDHANAVI CONSTRUCTION";
  sheet.getCell(1, 1).font = { bold: true, size: 11, color: { argb: "FFFFFFF0" } };
  sheet.getCell(1, 1).alignment = { horizontal: "left", vertical: "middle" };
  sheet.getCell(1, 1).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "FF146C94" },
  };
  sheet.getRow(1).height = 24;

  sheet.mergeCells(2, 1, 2, spec.columns.length);
  sheet.getCell(2, 1).value = spec.title;
  sheet.getCell(2, 1).font = { bold: true, size: 14, color: { argb: "FF19183B" } };

  if (spec.subtitle || spec.filters) {
    sheet.mergeCells(3, 1, 3, spec.columns.length);
    sheet.getCell(3, 1).value = [spec.subtitle, spec.filters].filter(Boolean).join(" · ");
    sheet.getCell(3, 1).font = { italic: true, size: 10, color: { argb: "FF708993" } };
  }

  const headerRowNum = 5;
  spec.columns.forEach((c, i) => {
    const cell = sheet.getCell(headerRowNum, i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFF0" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF19183B" } };
    cell.alignment = { horizontal: c.align ?? "left", vertical: "middle" };
    cell.border = {
      top:    { style: "thin", color: { argb: "FFA1C2BD" } },
      bottom: { style: "thin", color: { argb: "FFA1C2BD" } },
      left:   { style: "thin", color: { argb: "FFA1C2BD" } },
      right:  { style: "thin", color: { argb: "FFA1C2BD" } },
    };
  });
  sheet.getRow(headerRowNum).height = 22;

  spec.rows.forEach((row, i) => {
    spec.columns.forEach((c, j) => {
      const cell = sheet.getCell(headerRowNum + 1 + i, j + 1);
      const v = row[c.key];
      cell.value = v === undefined || v === null ? "" : v;
      cell.alignment = { horizontal: c.align ?? "left", vertical: "middle" };
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
      }
    });
  });

  // Auto-size columns (roughly)
  spec.columns.forEach((c, i) => {
    const col = sheet.getColumn(i + 1);
    let max = c.header.length;
    for (const row of spec.rows) {
      const v = row[c.key];
      if (v !== undefined && v !== null) max = Math.max(max, String(v).length);
    }
    col.width = Math.min(50, Math.max(10, max + 2));
  });

  // Workaround for exceljs returning ArrayBuffer / not narrowing properly
  const ab = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;
  return Buffer.from(ab);
}

export async function respondReport(
  spec: ReportSpec,
  format: ReportFormat,
): Promise<Response> {
  if (format === "json") {
    return new Response(
      JSON.stringify({
        title: spec.title,
        subtitle: spec.subtitle ?? null,
        filters: spec.filters ?? null,
        columns: spec.columns,
        rows: spec.rows,
        summary: spec.summary ?? [],
        generatedAt: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
  if (format === "pdf") {
    const buf = await buildPdf(spec);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug(spec.title)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }
  if (format === "excel") {
    const buf = await buildExcel(spec);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${slug(spec.title)}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new Response(JSON.stringify({ message: "Unsupported format" }), { status: 400 });
}

export function parseFormat(req: Request): ReportFormat {
  const { searchParams } = new URL(req.url);
  const f = (searchParams.get("format") ?? "json").toLowerCase();
  if (f === "pdf" || f === "excel") return f;
  return "json";
}
