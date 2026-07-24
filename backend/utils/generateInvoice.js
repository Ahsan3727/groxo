const PDFDocument = require('pdfkit');

// ---------- Small formatting helpers ----------
const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/**
 * Streams a PDF invoice/receipt for a single order directly into the given
 * response. Call sites are responsible for setting the response headers
 * (Content-Type / Content-Disposition) before calling this — see
 * `GET /admin/orders/:id/invoice` in adminRoutes.js.
 *
 * `order` is expected to already be populated with:
 *   customer, rider, wholesaler, wholesalerGroups.wholesaler, items.product,
 *   wholesalerGroups.items.product
 */
function generateInvoicePDF(order, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(res);
 
   
  
  // ---------- Header ----------
  doc
    .fontSize(20)
    .fillColor('#16a34a')
    .text('Groxo', { continued: true })
    .fillColor('#111827')
    .fontSize(20)
    .text(' — Order Receipt');

  doc.moveDown(0.3);
  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text('Wholesale grocery delivery');

  doc.moveDown(1);
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.8);

  // ---------- Order meta ----------
  const orderLabel = order.orderNumber || `#${order._id.toString().slice(-6)}`;
  doc.fontSize(13).fillColor('#111827').text(`Order ${orderLabel}`, { continued: false });
  doc.fontSize(10).fillColor('#6b7280');
  doc.text(`Placed: ${fmtDate(order.createdAt)}`);
  doc.text(`Status: ${(order.status || '').replace(/_/g, ' ')}`);
  if (order.status === 'cancelled' && order.cancellationReason) {
    doc.text(`Cancellation reason: ${order.cancellationReason}`);
  }

  doc.moveDown(0.8);

  // ---------- Customer / rider block ----------
  const colX = 48;
  const col2X = 300;
  const blockTop = doc.y;

  doc.fontSize(11).fillColor('#111827').text('Customer', colX, blockTop);
  doc.fontSize(10).fillColor('#374151');
  doc.text(order.customer?.name || 'N/A', colX, doc.y);
  doc.text(order.customer?.phone || '', colX);
  if (order.deliveryAddress) {
    const a = order.deliveryAddress;
    const addrLine = [a.street, a.city, a.state, a.zip].filter(Boolean).join(', ');
    if (addrLine) doc.text(addrLine, colX, doc.y, { width: 230 });
  }

  doc.fontSize(11).fillColor('#111827').text('Rider', col2X, blockTop);
  doc.fontSize(10).fillColor('#374151');
  doc.text(order.rider?.name || 'Unassigned', col2X, doc.y);
  if (order.rider?.phone) doc.text(order.rider.phone, col2X);

  doc.moveDown(1.2);
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.8);

  // ---------- Line items ----------
  const drawItemsTable = (items, heading) => {
    if (heading) {
      doc.fontSize(11).fillColor('#111827').text(heading, colX);
      doc.moveDown(0.2);
    }

    const tableTop = doc.y;
    doc.fontSize(9).fillColor('#6b7280');
    doc.text('Item', colX, tableTop, { width: 260 });
    doc.text('Qty', colX + 270, tableTop, { width: 50, align: 'right' });
    doc.text('Price', colX + 330, tableTop, { width: 70, align: 'right' });
    doc.text('Total', colX + 410, tableTop, { width: 89, align: 'right' });
    doc.moveDown(0.3);
    doc.strokeColor('#e5e7eb').moveTo(colX, doc.y).lineTo(547, doc.y).stroke();
    doc.moveDown(0.3);

    let subtotal = 0;
    doc.fontSize(10).fillColor('#111827');
    (items || []).forEach((item) => {
      const name = item.product?.name || 'Product';
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const lineTotal = qty * price;
      subtotal += lineTotal;

      const rowY = doc.y;
      doc.text(name, colX, rowY, { width: 260 });
      doc.text(String(qty), colX + 270, rowY, { width: 50, align: 'right' });
      doc.text(rs(price), colX + 330, rowY, { width: 70, align: 'right' });
      doc.text(rs(lineTotal), colX + 410, rowY, { width: 89, align: 'right' });
      doc.moveDown(0.4);
    });

    return subtotal;
  };

  let runningTotal = 0;
  if (order.wholesalerGroups && order.wholesalerGroups.length > 0) {
    order.wholesalerGroups.forEach((group) => {
      const label = `${group.storeName || group.wholesaler?.storeName || group.wholesaler?.name || 'Wholesaler'}${group.paid ? ' (paid)' : ''}`;
      runningTotal += drawItemsTable(group.items, label);
      doc.moveDown(0.5);
    });
  } else {
    runningTotal += drawItemsTable(order.items, order.wholesaler?.storeName || order.wholesaler?.name);
  }

  doc.moveDown(0.4);
  doc.strokeColor('#e5e7eb').moveTo(colX, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.5);

  // ---------- Totals ----------
  const totalsY = doc.y;
  doc.fontSize(10).fillColor('#6b7280').text('Payment method', colX + 270, totalsY, { width: 150, align: 'right' });
  doc.fillColor('#111827').text((order.payment?.method || 'cod').toUpperCase(), colX + 410, totalsY, { width: 89, align: 'right' });
  doc.moveDown(0.3);

  const statusY = doc.y;
  doc.fillColor('#6b7280').text('Payment status', colX + 270, statusY, { width: 150, align: 'right' });
  doc.fillColor('#111827').text((order.payment?.status || 'pending').toUpperCase(), colX + 410, statusY, { width: 89, align: 'right' });
  doc.moveDown(0.5);

  const grandTotalY = doc.y;
  doc.fontSize(12).fillColor('#111827').text('Total', colX + 270, grandTotalY, { width: 150, align: 'right' });
  doc.fontSize(12).fillColor('#16a34a').text(rs(order.payment?.amount ?? runningTotal), colX + 410, grandTotalY, { width: 89, align: 'right' });

  // ---------- Footer ----------
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#9ca3af').text(
    'This is a system-generated receipt from Groxo. For questions about this order, contact support through the app.',
    colX,
    doc.y,
    { width: 499, align: 'center' }
  );

  doc.end();
}

module.exports = generateInvoicePDF;
