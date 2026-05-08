import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an A4 invoice PDF with customer copy and office copy.
 * @param {Object} invoice  - Full invoice object (with populated customer)
 * @param {Object} settings - Invoice settings (logo, header, footer)
 * @param {boolean} withPaidSeal - Whether to stamp PAID seal
 */
export function generateInvoicePDF(invoice, settings, withPaidSeal = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // A4 = 210mm wide × 297mm tall
  // Draw TWO copies: top half (0–140mm) = customer copy, bottom half (148–297mm) = office copy
  // A dashed divider line at 148mm separates them

  drawCopy(doc, invoice, settings, withPaidSeal, 10,  'Customer Copy');
  
  // Dashed divider line
  doc.setLineDashPattern([3, 3], 0);
  doc.setDrawColor(150, 150, 150);
  doc.line(10, 148, 200, 148);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('✂  Cut here', 10, 151);
  doc.setTextColor(0);

  drawCopy(doc, invoice, settings, withPaidSeal, 155, 'Office Copy');

  const meterNoStr = invoice.customer?.meterNo ? `-${invoice.customer.meterNo}` : '';
  const filename = `${invoice.invoiceNo}-${invoice.customer?.name?.replace(/\s+/g, '_')}${meterNoStr}.pdf`;
  doc.save(filename);
}

/**
 * Draws one invoice copy starting at yStart mm from top.
 * Each copy is ~138mm tall to fit two on A4.
 */
function drawCopy(doc, invoice, settings, withPaidSeal, yStart, copyLabel) {
  const c = invoice.customer || {};
  const s = settings || {};
  const pageWidth = 210;
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  let y = yStart;

  // ── HEADER ──
  // Logo (if provided)
  if (s.logoBase64) {
    try {
      doc.addImage(
        `data:${s.logoMimeType || 'image/png'};base64,${s.logoBase64}`,
        s.logoMimeType?.includes('jpeg') ? 'JPEG' : 'PNG',
        margin, y, 25, 18
      );
    } catch (e) { /* skip bad logo */ }
  }

  // Company info
  const headerX = s.logoBase64 ? margin + 28 : margin;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 60, 120);
  doc.text(s.invoiceTitle || 'ELECTRICITY BILL', headerX, y + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(s.companyName || '', headerX, y + 12);
  doc.text(s.companyAddress || '', headerX, y + 17);
  if (s.companyPhone || s.companyEmail) {
    doc.text(`${s.companyPhone || ''}  ${s.companyEmail || ''}`.trim(), headerX, y + 22);
  }

  // Copy label (top-right)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 180, 180);
  doc.text(copyLabel, pageWidth - margin, y + 6, { align: 'right' });

  // Thin horizontal rule
  y += 26;
  doc.setDrawColor(30, 60, 120);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ── INVOICE META (two columns) ──
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const left = [
    [`Invoice No:`, invoice.invoiceNo],
    [`Bill Month:`, invoice.billMonth],
    [`Issue Date:`, new Date(invoice.issueDate).toLocaleDateString('en-BD')],
    [`Due Date:`,   invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-BD') : 'N/A'],
  ];
  const right = [
    [`Customer:`,  c.name],
    [`Address:`,   c.address],
    [`Meter No:`,  c.meterNo],
    [`Phone:`,     c.phone || 'N/A'],
  ];

  left.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold');  doc.text(k, margin, y + i * 6);
    doc.setFont('helvetica', 'normal'); doc.text(v || '', margin + 22, y + i * 6);
  });
  right.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold');  doc.text(k, 110, y + i * 6);
    doc.setFont('helvetica', 'normal'); doc.text(v || '', 125, y + i * 6);
  });

  y += 28;

  // ── BILL TABLE ──
  const rows = [
    ['Previous Reading', `${invoice.previousReading} kWh`],
    ['Current Reading',  `${invoice.currentReading} kWh`],
    ['Units Consumed',   `${invoice.unitsConsumed} kWh`],
    ['Rate per Unit',    `BDT ${invoice.ratePerUnit?.toFixed(2)}`],
    ['Unit Charge',      `BDT ${invoice.unitCharge?.toFixed(2)}`],
    ['Service Charge',   `BDT ${(invoice.serviceCharge || 0).toFixed(2)}`],
  ];

  if (invoice.fine > 0) {
    rows.push([`Fine${invoice.fineNote ? ` (${invoice.fineNote})` : ''}`, `BDT ${invoice.fine.toFixed(2)}`]);
  }
  if (invoice.vatPercent > 0) {
    rows.push([`VAT (${invoice.vatPercent}%)`, `BDT ${invoice.vatAmount?.toFixed(2)}`]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Amount']],
    body: rows,
    foot: [['TOTAL PAYABLE', `BDT ${invoice.totalAmount?.toFixed(2)}`]],
    theme: 'grid',
    headStyles: { fillColor: [30, 60, 120], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    footStyles: { fillColor: [235, 248, 255], textColor: [30, 60, 120], fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 70, halign: 'right' } },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  y = doc.lastAutoTable.finalY + 4;

  // ── FOOTER ──
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text(s.footerText || '', margin, y + 4, { maxWidth: contentWidth });

  // ── PAID SEAL ──
  if (withPaidSeal && invoice.status === 'paid') {
    drawPaidSeal(doc, pageWidth - 45, yStart + 45, invoice.paidAt);
  }
}

/**
 * Draws a PAID stamp at the given position.
 */
function drawPaidSeal(doc, x, y, paidAt) {
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.25 }));
  doc.setDrawColor(0, 150, 0);
  doc.setLineWidth(1.5);
  doc.roundedRect(x - 18, y - 8, 36, 16, 2, 2, 'S');
  doc.setTextColor(0, 150, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', x, y + 3, { align: 'center' });
  if (paidAt) {
    doc.setFontSize(8);
    doc.text(new Date(paidAt).toLocaleDateString(), x, y + 6.5, { align: 'center' });
  }
  doc.restoreGraphicsState();
}
