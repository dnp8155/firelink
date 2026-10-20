import { jsPDF } from "jspdf";

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Generates a certificate PDF with QR code and optional digital signature (client-side)
export async function downloadCertificate(c, vendor = null) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, W - 24, H - 24);

  // Header
  doc.setFontSize(28); doc.setTextColor(220, 38, 38);
  doc.text("FIRELINK", W / 2, 28, { align: "center" });
  doc.setFontSize(10); doc.setTextColor(100);
  doc.text("Fire & Safety Connect — Certificate of Compliance", W / 2, 35, { align: "center" });

  // Title
  doc.setFontSize(18); doc.setTextColor(0);
  doc.text(c.title || "Certificate", W / 2, 55, { align: "center" });

  // Certificate number
  doc.setFontSize(11); doc.setTextColor(120);
  doc.text(`Certificate No: ${c.certificate_number || "—"}`, W / 2, 63, { align: "center" });

  // Body
  doc.setFontSize(10); doc.setTextColor(60);
  let y = 80;
  if (c.organization_name) { doc.text(`Issued to: ${c.organization_name}`, W / 2, y, { align: "center" }); y += 8; }
  if (c.asset_name) { doc.text(`Asset: ${c.asset_name}`, W / 2, y, { align: "center" }); y += 8; }
  doc.text(`Type: ${(c.type || "inspection").replace(/_/g, " ")}`, W / 2, y, { align: "center" }); y += 8;
  if (c.issue_date) { doc.text(`Issue Date: ${c.issue_date}`, W / 2, y, { align: "center" }); y += 8; }
  if (c.expiry_date) { doc.text(`Valid Until: ${c.expiry_date}`, W / 2, y, { align: "center" }); y += 8; }

  // Status
  doc.setFontSize(12); doc.setTextColor(220, 38, 38);
  doc.text(`Status: ${(c.status || "valid").toUpperCase()}`, W / 2, y + 5, { align: "center" });

  // QR code — always points at the deployment this PDF was generated from
  const verifyUrl = `${window.location.origin}/verify/${c.qr_code}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
  try {
    const qrImg = await loadImage(qrImgUrl);
    doc.addImage(qrImg, "PNG", 20, H - 55, 35, 35);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text("Scan to verify", 37.5, H - 17, { align: "center" });
  } catch {}

  // Digital signature
  if (vendor?.digital_signature_url) {
    try {
      const sigImg = await loadImage(vendor.digital_signature_url);
      doc.addImage(sigImg, "PNG", W - 70, H - 50, 50, 25);
    } catch {}
  }
  doc.setDrawColor(150); doc.setLineWidth(0.5);
  doc.line(W - 75, H - 22, W - 20, H - 22);
  doc.setFontSize(9); doc.setTextColor(80);
  doc.text(vendor?.company_name || c.issued_by || "Authorized Signatory", W - 47.5, H - 17, { align: "center" });

  doc.save(`Certificate-${c.certificate_number || "cert"}.pdf`);
}

// Generates a small QR label PDF for printing on stickers
export async function downloadQrLabel(c) {
  const doc = new jsPDF({ unit: "mm", format: [50, 30], orientation: "landscape" });
  doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.8);
  doc.rect(1, 1, 48, 28);

  const verifyUrl = `${window.location.origin}/verify/${c.qr_code}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`;
  try {
    const qrImg = await loadImage(qrImgUrl);
    doc.addImage(qrImg, "PNG", 3, 4, 22, 22);
  } catch {}

  doc.setFontSize(7); doc.setTextColor(220, 38, 38);
  doc.text("FIRELINK", 27, 7);
  doc.setFontSize(5); doc.setTextColor(80);
  doc.text(c.title || "Certificate", 27, 11);
  doc.text(`No: ${c.certificate_number || "—"}`, 27, 15);
  if (c.expiry_date) doc.text(`Exp: ${c.expiry_date}`, 27, 19);
  doc.setFontSize(4); doc.setTextColor(120);
  doc.text("Scan QR to verify", 27, 25);

  doc.save(`QR-Label-${c.qr_code || "label"}.pdf`);
}