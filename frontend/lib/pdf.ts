// frontend/lib/pdf.ts
"use client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResponse } from "./api";

export interface PdfInput {
  query: string;
  response: AnalysisResponse;
  location?: string;
  region?: string;
  kind?: string;
  beforeImage?: string;
  afterImage?: string;
  singleImage?: string;
}

export function exportPDF(input: PdfInput) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header bar
  doc.setFillColor(4, 6, 12);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SatQuery", margin, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 240);
  doc.text("Ask. Analyze. Understand Earth.", margin, 22);
  doc.text("Team DELVE · SIH 2026 · ISRO", pageW - margin, 22, { align: "right" });
  y = 40;

  // Title
  doc.setTextColor(20, 20, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Analysis Report", margin, y);
  y += 8;

  // Meta
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  doc.text(`Query: ${input.query}`, margin, y);
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 6;
  doc.text(`Intent: ${input.response.intent}`, margin, y);
  y += 6;
  if (input.location) {
    doc.text(`Location: ${input.location}`, margin, y);
    y += 6;
  }
  if (input.region) {
    doc.text(`Region: ${input.region}`, margin, y);
    y += 6;
  }
  y += 4;

  // Executive Summary
  const summary = input.response.summary || input.response.answer.slice(0, 300);
  if (summary) {
    doc.setTextColor(20, 20, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const sLines = doc.splitTextToSize(summary, pageW - margin * 2);
    doc.text(sLines, margin, y);
    y += sLines.length * 5 + 8;
  }

  // Detailed Answer
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Answer", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(input.response.answer, pageW - margin * 2);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 8;

  // Images
  if (input.beforeImage || input.singleImage) {
    if (y > pageH - 80) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Imagery", margin, y);
    y += 4;
    try {
      if (input.singleImage) {
        doc.addImage(input.singleImage, "JPEG", margin, y, 80, 60, undefined, "FAST");
        y += 66;
      } else if (input.beforeImage && input.afterImage) {
        doc.addImage(input.beforeImage, "JPEG", margin, y, 80, 60, undefined, "FAST");
        doc.addImage(input.afterImage, "JPEG", margin + 90, y, 80, 60, undefined, "FAST");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 140);
        doc.text("Before", margin + 34, y + 64);
        doc.text("After", margin + 124, y + 64);
        y += 72;
      }
    } catch {
      /* skip images if format unsupported */
    }
  }

  // Stats
  if (input.response.stats && input.response.stats.length > 0) {
    if (y > pageH - 60) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 40);
    doc.text("Land Cover Percentages", margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Layer", "Percentage", "Area (km²)", "Confidence"]],
      body: input.response.stats.map((s) => [
        s.layer,
        `${s.percentage.toFixed(1)}%`,
        s.area_km2?.toFixed(1) ?? "—",
        s.confidence != null ? `${s.confidence}%` : "—",
      ]),
      theme: "grid",
      headStyles: { fillColor: [34, 211, 238], textColor: [4, 6, 12] },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Evidence
  if (y > pageH - 50) {
    doc.addPage();
    y = margin;
  }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Evidence & Provenance", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const ev = input.response.evidence;
  [
    `Source: ${ev.source || "—"}`,
    `Date: ${ev.date || "—"}`,
    `Confidence: ${ev.confidence != null ? `${ev.confidence}%` : "—"}`,
    `Methodology: ${ev.methodology || "—"}`,
    `Limitations: ${ev.limitations || "—"}`,
  ].forEach((line) => {
    const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 1;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text(
    "Generated by SatQuery · Data: NASA GIBS, Esri, Copernicus, Sentinel-2, Landsat",
    margin,
    pageH - 10
  );
  doc.text("SatQuery · Team DELVE", pageW - margin, pageH - 10, { align: "right" });

  doc.save(`SatQuery_Report_${Date.now()}.pdf`);
}