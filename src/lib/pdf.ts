import jsPDF from "jspdf";
import type { Trip } from "@/types";

export function generateTripPDF(trip: Trip) {
  const plan = trip.plan;
  if (!plan) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Header background
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TravelMate AI", margin, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Your AI-Powered Travel Plan", margin, 28);

  y = 55;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(trip.title, margin, y);

  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Destination: ${trip.destination}`, margin, y); y += 6;
  doc.text(`Duration: ${trip.days} days | Travelers: ${trip.travelers} | Budget: ${trip.currency} ${Number(trip.budget_total).toLocaleString()}`, margin, y); y += 6;
  if (trip.start_date) { doc.text(`Start Date: ${trip.start_date}`, margin, y); y += 6; }
  if (trip.interests?.length) { doc.text(`Interests: ${trip.interests.join(", ")}`, margin, y); y += 6; }

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(plan.summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 6;

  // Itinerary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text("Day-wise Itinerary", margin, y);
  y += 6;
  doc.setTextColor(30, 30, 30);

  for (const day of plan.itinerary) {
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(day.title, margin, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Morning (${day.morning.time}): ${day.morning.activity} — ${day.morning.note}`, margin + 4, y); y += 5;
    doc.text(`Afternoon (${day.afternoon.time}): ${day.afternoon.activity} — ${day.afternoon.note}`, margin + 4, y); y += 5;
    doc.text(`Evening (${day.evening.time}): ${day.evening.activity} — ${day.evening.note}`, margin + 4, y); y += 5;
    doc.text(`Meals: ${day.meals.breakfast} | ${day.meals.lunch} | ${day.meals.dinner}`, margin + 4, y); y += 8;
  }

  // Budget
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text("Budget Breakdown", margin, y); y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const b of plan.budget) {
    doc.text(`${b.category}: ${trip.currency} ${b.amount.toLocaleString()} (${b.percentage}%)`, margin + 4, y); y += 6;
  }

  // Hotels
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text("Hotel Suggestions", margin, y); y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const h of plan.hotels) {
    if (y > pageHeight - 30) { doc.addPage(); y = 20; }
    doc.text(`${h.name} (${h.tier}) — ${trip.currency} ${h.pricePerNight}/night, Rating: ${h.rating}`, margin + 4, y); y += 5;
    doc.setFontSize(9);
    doc.text(`Amenities: ${h.amenities.join(", ")}`, margin + 8, y); y += 5;
    doc.text(`Why: ${h.reason}`, margin + 8, y); y += 7;
    doc.setFontSize(10);
  }

  // Transport
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text("Transport Options", margin, y); y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const t of plan.transport) {
    doc.text(`${t.mode} (${t.type}) — ${trip.currency} ${t.estimatedCost}, ${t.duration}`, margin + 4, y); y += 5;
    doc.setFontSize(9);
    doc.text(t.notes, margin + 8, y); y += 7;
    doc.setFontSize(10);
  }

  // Packing
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text("Packing Checklist", margin, y); y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const p of plan.packing) {
    doc.text(`${p.essential ? "[*]" : "[ ]"} ${p.item} (${p.category})`, margin + 4, y); y += 5;
  }

  // Tips
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text("Travel Tips", margin, y); y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const tip of plan.tips) {
    const lines = doc.splitTextToSize(`[${tip.category}] ${tip.tip}`, pageWidth - margin * 2);
    doc.text(lines, margin, y); y += lines.length * 5 + 2;
  }

  // Emergency
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text("Emergency Contacts", margin, y); y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const e of plan.emergency) {
    doc.text(`${e.label}: ${e.number} — ${e.note}`, margin + 4, y); y += 6;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by TravelMate AI — Page ${i} of ${pageCount}`, margin, pageHeight - 8);
  }

  doc.save(`TravelMate-${trip.destination}-${trip.days}days.pdf`);
}
