import jsPDF from "jspdf";

interface ReceiptData {
  receipt_number: string;
  date: string;
  full_name: string;
  email: string;
  amount: number;
  currency: string;
  payment_type: string;
  reference?: string | null;
  balance_remaining?: number;
  business_name?: string;
  business_phone?: string;
  business_email?: string;
}

export function downloadReceiptPDF(d: ReceiptData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(45, 90, 61); // safari green
  doc.rect(0, 0, w, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(d.business_name || "Steve Safari Agency", 40, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Official Payment Receipt", 40, 55);

  // Receipt label
  doc.setTextColor(201, 168, 76); // safari gold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`RECEIPT #${d.receipt_number}`, w - 40, 35, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(d.date, w - 40, 55, { align: "right" });

  // Body
  doc.setTextColor(20, 20, 20);
  let y = 130;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Paid By", 40, y);
  doc.setFont("helvetica", "normal");
  doc.text(d.full_name, 40, y + 18);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(d.email, 40, y + 34);

  // Amount block
  y = 200;
  doc.setFillColor(248, 248, 245);
  doc.rect(40, y, w - 80, 90, "F");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text("Amount Paid", 60, y + 25);
  doc.setTextColor(45, 90, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(`${d.currency} ${Number(d.amount).toLocaleString()}`, 60, y + 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`For: ${d.payment_type.replace(/_/g, " ")}`, 60, y + 80);

  // Details
  y = 320;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Details", 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rows = [
    ["Receipt Number", d.receipt_number],
    ["M-Pesa Reference", d.reference || "-"],
    ["Payment Method", "M-Pesa (Kopo Kopo)"],
    ["Date & Time", d.date],
  ];
  if (d.balance_remaining && d.balance_remaining > 0) {
    rows.push(["Balance Remaining", `${d.currency} ${Number(d.balance_remaining).toLocaleString()}`]);
  } else {
    rows.push(["Status", "Paid in full"]);
  }
  let ry = y + 22;
  rows.forEach(([k, v]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(k, 40, ry);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v), 220, ry);
    ry += 18;
  });

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.line(40, 720, w - 40, 720);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(
    "This is an official receipt. All payments are tracked and verifiable.",
    40,
    740,
  );
  if (d.business_phone || d.business_email) {
    doc.text(
      `Support: ${[d.business_phone, d.business_email].filter(Boolean).join("  •  ")}`,
      40,
      755,
    );
  }
  doc.text("Thank you for trusting us with your journey.", 40, 770);

  doc.save(`receipt-${d.receipt_number}.pdf`);
}
