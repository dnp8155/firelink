import { jsPDF } from "jspdf";

const PRIMARY = [225, 29, 72];    // #e11d48 (rose)
const FIRE = [249, 115, 22];      // #f97316 (orange)
const DARK = [15, 23, 42];        // slate-900
const GRAY = [100, 116, 139];     // slate-500
const LIGHT = [241, 245, 249];    // slate-100
const WHITE = [255, 255, 255];

function fmtINR(v) {
  if (v == null) return "Rs.0";
  return "Rs." + Number(v).toLocaleString("en-IN");
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ---- Shared header + footer for both invoice & PO ----
function drawHeader(doc, opts) {
  const { title, docNumber, accent } = opts;
  // Accent bar
  doc.setFillColor(...accent); doc.rect(0, 0, 210, 4, "F");
  // Brand
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...DARK);
  doc.text("FIRE", 14, 18);
  doc.setTextColor(...FIRE); doc.text("LINK", 33, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRAY);
  doc.text("Fire & Safety Connect", 14, 24);
  doc.text(window.location.host, 14, 28);

  // Doc title (right)
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...accent);
  doc.text(title, 196, 18, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text(`${opts.numberLabel}: ${docNumber}`, 196, 25, { align: "right" });
  doc.text(`Date: ${fmtDate(opts.date)}`, 196, 30, { align: "right" });

  // Separator
  doc.setDrawColor(...LIGHT); doc.setLineWidth(0.5); doc.line(14, 34, 196, 34);
}

function drawParties(doc, opts) {
  // Left: Bill To
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...GRAY);
  doc.text(opts.billToLabel.toUpperCase(), 14, 42);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...DARK);
  doc.text(opts.billToName, 14, 48);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  const billLines = doc.splitTextToSize(opts.billToAddr || "", 80);
  doc.text(billLines, 14, 54);

  // Right: From / Vendor
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...GRAY);
  doc.text(opts.fromLabel.toUpperCase(), 120, 42);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...DARK);
  doc.text(opts.fromName, 120, 48);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  const fromLines = doc.splitTextToSize(opts.fromAddr || "", 76);
  doc.text(fromLines, 120, 54);
}

function drawItems(doc, order, startY) {
  let y = startY;
  // Table header
  doc.setFillColor(...DARK); doc.rect(14, y, 182, 7, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...WHITE);
  doc.text("DESCRIPTION", 16, y + 5);
  doc.text("HSN", 110, y + 5);
  doc.text("QTY", 125, y + 5, { align: "right" });
  doc.text("RATE", 150, y + 5, { align: "right" });
  doc.text("AMOUNT", 193, y + 5, { align: "right" });
  y += 7;

  // Items
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...DARK);
  (order.items || []).forEach((it, idx) => {
    if (y > 250) { doc.addPage(); y = 20; }
    if (idx % 2 === 1) { doc.setFillColor(248, 250, 252); doc.rect(14, y, 182, 7, "F"); }
    const name = String(it.name || "").slice(0, 58);
    doc.text(name, 16, y + 5);
    doc.setTextColor(...GRAY); doc.text(String(it.sku || it.hsn_code || "—"), 110, y + 5);
    doc.text(String(it.qty || 1), 125, y + 5, { align: "right" });
    doc.text(fmtINR(it.price), 150, y + 5, { align: "right" });
    doc.setTextColor(...DARK); doc.text(fmtINR((it.price || 0) * (it.qty || 1)), 193, y + 5, { align: "right" });
    y += 7;
  });

  doc.setDrawColor(...LIGHT); doc.line(14, y, 196, y);
  return y + 4;
}

function drawTotals(doc, order, startY) {
  let y = startY;
  const x = 130;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text("Subtotal", x, y); doc.text(fmtINR(order.subtotal), 193, y, { align: "right" }); y += 6;

  const taxLabel = "GST / Tax";
  doc.text(taxLabel, x, y); doc.text(fmtINR(order.tax), 193, y, { align: "right" }); y += 6;

  if (order.shipping) {
    doc.text("Shipping", x, y); doc.text(fmtINR(order.shipping), 193, y, { align: "right" }); y += 6;
  }

  // Total box
  y += 2;
  doc.setFillColor(...PRIMARY); doc.rect(x - 2, y - 4, 64, 9, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...WHITE);
  doc.text("TOTAL", x, y + 1); doc.text(fmtINR(order.total), 193, y + 1, { align: "right" });
  y += 12;
  return y;
}

function drawFooter(doc, order, opts) {
  const pageH = doc.internal.pageSize.height;
  let y = pageH - 40;

  // Terms
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GRAY);
  doc.text("TERMS & CONDITIONS", 14, y); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
  const terms = opts.terms || "1. Goods once sold are not returnable unless damaged/defective. 2. Subject to local jurisdiction. 3. Fire safety equipment must be installed by certified professionals.";
  const termLines = doc.splitTextToSize(terms, 120);
  doc.text(termLines, 14, y);

  // Payment info
  if (opts.paymentInfo) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text("PAYMENT DETAILS", 150, pageH - 36);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    const pLines = doc.splitTextToSize(opts.paymentInfo, 44);
    doc.text(pLines, 150, pageH - 32);
  }

  // Bottom bar
  doc.setFillColor(...DARK); doc.rect(0, pageH - 12, 210, 12, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...WHITE);
  doc.text("FIRELINK — Fire & Safety Connect", 14, pageH - 5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(180);
  doc.text("This is a system-generated document.", 196, pageH - 5, { align: "right" });
}

// Main invoice generator (vendor → customer)
export function downloadInvoice(order, vendor) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const invoiceNum = "INV-" + (order.order_number || "").replace("ORD-", "");

  drawHeader(doc, {
    title: "TAX INVOICE",
    numberLabel: "Invoice #",
    docNumber: invoiceNum,
    date: order.created_date,
    accent: PRIMARY,
  });

  drawParties(doc, {
    billToLabel: "Bill To",
    billToName: order.customer_name || "Customer",
    billToAddr: order.shipping_address || "",
    fromLabel: "From (Vendor)",
    fromName: order.vendor_name || vendor?.company_name || "Vendor",
    fromAddr: vendor ? [vendor.address, vendor.city, vendor.state, vendor.gst_number && `GST: ${vendor.gst_number}`].filter(Boolean).join("\n") : "",
  });

  let y = drawItems(doc, order, 66);
  y = drawTotals(doc, order, y);

  // Payment status
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text(`Payment Status: ${order.payment_status || "pending"}`, 14, y);
  doc.text(`Payment Method: ${order.payment_method || "—"}`, 14, y + 6);

  drawFooter(doc, order, {
    terms: "1. Goods once sold are not returnable unless damaged/defective within 7 days. 2. Installation must be done by certified professionals. 3. Subject to local jurisdiction.",
    paymentInfo: vendor ? `${vendor.bank_name}\n${vendor.account_number}\nIFSC: ${vendor.ifsc_code}` : "",
  });

  doc.save(`Invoice-${order.order_number || "order"}.pdf`);
}

// Purchase Order generator (customer → vendor)
export function downloadPurchaseOrder(order, customerOrg) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const poNum = "PO-" + (order.order_number || "").replace("ORD-", "");

  drawHeader(doc, {
    title: "PURCHASE ORDER",
    numberLabel: "PO #",
    docNumber: poNum,
    date: order.created_date,
    accent: FIRE,
  });

  drawParties(doc, {
    billToLabel: "Ship To",
    billToName: order.customer_name || customerOrg?.name || "Customer",
    billToAddr: order.shipping_address || (customerOrg ? [customerOrg.address, customerOrg.city].filter(Boolean).join(", ") : ""),
    fromLabel: "Supplier (Vendor)",
    fromName: order.vendor_name || "Vendor",
    fromAddr: "",
  });

  let y = drawItems(doc, order, 66);
  y = drawTotals(doc, order, y);

  // PO-specific info
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text(`Delivery Address: ${order.shipping_address || "—"}`, 14, y);
  y += 6;
  doc.text(`Preferred Delivery: As per agreed timeline`, 14, y);

  drawFooter(doc, order, {
    terms: "1. Please confirm acceptance of this PO within 48 hours. 2. Goods must be delivered in good condition with proper packaging. 3. Invoice must reference this PO number. 4. Subject to inspection and acceptance.",
    paymentInfo: customerOrg ? `${customerOrg.name}\n${customerOrg.gst_number || ""}` : "",
  });

  doc.save(`PO-${order.order_number || "order"}.pdf`);
}