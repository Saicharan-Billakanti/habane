/* HABÄNE ADMIN — Order Details Module */

import { db, escHTML } from './utils.js';
import { showToast, refreshNotifications } from './ui.js';

export function render(container, orderId) {
  if (!orderId) {
    container.innerHTML = `
      <div class="glass-card stat-card" style="border-color:var(--danger); padding:2rem; text-align:center;">
        <i data-lucide="shield-alert" style="width:48px; height:48px; color:var(--danger); margin:0 auto 1rem;"></i>
        <h3 style="color:var(--danger); font-family:'Conthrax';">Invalid Access</h3>
        <p style="font-size:0.84rem; color:var(--text-muted); margin-top:0.5rem;">No Order ID specified. Please select an order from the list.</p>
      </div>
    `;
    return;
  }

  const orders = db.getOrders();
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    container.innerHTML = `
      <div class="glass-card stat-card" style="border-color:var(--danger); padding:2rem; text-align:center;">
        <i data-lucide="shield-alert" style="width:48px; height:48px; color:var(--danger); margin:0 auto 1rem;"></i>
        <h3 style="color:var(--danger); font-family:'Conthrax';">Order Not Found</h3>
        <p style="font-size:0.84rem; color:var(--text-muted); margin-top:0.5rem;">
          Order "${escHTML(orderId)}" does not exist in the administrative database.
        </p>
        <button class="admin-btn admin-btn--secondary" id="backToOrdersErrorBtn" style="margin-top:1rem;">
          <i data-lucide="arrow-left"></i> Back to Orders
        </button>
      </div>
    `;
    document.getElementById('backToOrdersErrorBtn')?.addEventListener('click', () => {
      window.location.hash = 'orders';
    });
    if (window.lucide) window.lucide.createIcons({ root: container });
    return;
  }

  // Initialize helper data
  if (!order.notes) order.notes = [];
  if (!order.payment_status) {
    order.payment_status = order.status === 'Cancelled' ? 'Voided' : (order.status === 'Delivered' ? 'Paid' : 'Authorized');
  }
  if (!order.timeline) {
    // Generate seeded timeline events for high fidelity demo
    const createdTime = new Date(order.created_at).getTime();
    order.timeline = [
      { event: "Order Created", timestamp: new Date(createdTime).toISOString() },
      { event: "Payment Authorized", timestamp: new Date(createdTime + 5 * 60 * 1000).toISOString() }
    ];
    if (order.status !== 'New') {
      order.timeline.push({ event: "Order Marked as Packed", timestamp: new Date(createdTime + 2 * 60 * 60 * 1000).toISOString() });
    }
    if (order.status === 'Shipped' || order.status === 'Delivered') {
      order.timeline.push({ event: "Order Marked as Dispatched & In Transit", timestamp: new Date(createdTime + 12 * 60 * 60 * 1000).toISOString() });
    }
    if (order.status === 'Delivered') {
      order.timeline.push({ event: "Order Delivered", timestamp: new Date(createdTime + 36 * 60 * 60 * 1000).toISOString() });
      order.timeline.push({ event: "Payment Completed", timestamp: new Date(createdTime + 36 * 10 * 60 * 1000).toISOString() });
    }
    if (order.status === 'Cancelled') {
      order.timeline.push({ event: "Order Cancelled", timestamp: new Date(createdTime + 4 * 60 * 60 * 1000).toISOString() });
    }
    db.saveOrder(order);
  }

  const symbol = getCurrencySymbol(order.currency);
  const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Main UI template
  container.innerHTML = `
    <!-- Top Action Breadcrumb Header -->
    <div class="module-header" style="margin-bottom:1.5rem;">
      <div class="module-header__title">
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <a href="#orders" class="breadcrumb-link"><i data-lucide="arrow-left" style="width:14px; height:14px;"></i> Back to Orders</a>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <h1>${order.id}</h1>
          <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
          <span class="badge ${getPaymentBadgeClass(order.payment_status)}">${order.payment_status}</span>
        </div>
        <p style="margin-top:0.25rem;">Placed on ${formattedDate}</p>
      </div>
      <div class="module-actions" style="gap:0.5rem; flex-wrap:wrap;">
        <button class="admin-btn admin-btn--secondary" id="printInvoiceBtn">
          <i data-lucide="printer"></i> Print Invoice
        </button>
        <button class="admin-btn admin-btn--secondary" id="downloadPdfBtn">
          <i data-lucide="download"></i> Download Invoice
        </button>
        <button class="admin-btn admin-btn--secondary" id="emailCustomerBtn">
          <i data-lucide="mail"></i> Email Customer
        </button>
      </div>
    </div>

    <!-- Layout Columns: Left Column (Main Info), Right Column (Customer & Notes) -->
    <div class="order-details-layout">
      
      <!-- 1. LEFT MAIN COLUMN -->
      <div class="order-main-col">
        
        <!-- Ordered Products Section -->
        <div class="glass-card detail-section">
          <div class="detail-section__header">
            <h3>Ordered Items</h3>
            <span class="count-bubble">${order.products.reduce((acc, x) => acc + x.qty, 0)} Items</span>
          </div>
          
          <div class="products-detail-list">
            ${order.products.map(p => {
              const catalogProduct = window.HABANE?.PRODUCTS.find(x => x.id === p.id);
              const brand = catalogProduct ? (catalogProduct.brand || 'HABÄNE') : 'HABÄNE';
              const sku = catalogProduct ? (catalogProduct.sku || `HB-${p.id.toUpperCase()}-${p.color.toUpperCase()}`) : `HB-${p.id.toUpperCase()}-${p.color.toUpperCase()}`;
              const desc = catalogProduct ? catalogProduct.desc : '';
              const category = catalogProduct ? catalogProduct.catLabel : 'Carryall';
              
              // Calculate individual price/discounts
              const individualPrice = p.price;
              const discount = catalogProduct?.was ? (catalogProduct.was - catalogProduct.price) : 0;
              const finalPrice = individualPrice * p.qty;

              return `
                <div class="ordered-product-card" data-id="${p.id}">
                  <div class="prod-card-img-wrap">
                    <img src="../${catalogProduct?.img || 'assets/products/p1-olive-skyline-duffel.jpg'}" alt="${escHTML(p.name)}">
                  </div>
                  <div class="prod-card-details">
                    <div class="prod-card-details__top">
                      <div>
                        <h4><a href="../product.html?id=${p.id}" target="_blank" class="storefront-product-link">${escHTML(p.name)} <i data-lucide="external-link" class="inline-icon"></i></a></h4>
                        <span class="prod-sku">SKU: ${escHTML(sku)} · Brand: ${escHTML(brand)} · Category: ${escHTML(category)}</span>
                      </div>
                      <span class="prod-price-calc">${symbol}${individualPrice.toLocaleString()} &times; ${p.qty}</span>
                    </div>
                    
                    <div class="prod-card-details__bottom">
                      <div class="variant-chips">
                        <span class="variant-chip">Color: ${escHTML(p.color)}</span>
                        ${p.size ? `<span class="variant-chip">Size: ${escHTML(p.size)}</span>` : ''}
                      </div>
                      <div class="price-calculations">
                        ${discount > 0 ? `<span class="calc-was">${symbol}${(individualPrice + discount).toLocaleString()}</span>` : ''}
                        <strong class="calc-final">${symbol}${finalPrice.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Shipping timeline and Direct Status Updates -->
        <div class="glass-card detail-section">
          <div class="detail-section__header">
            <h3>Shipping Workflow</h3>
            <div class="inline-status-picker">
              <label for="timelineStatusSelect">Workflow Status:</label>
              <select id="timelineStatusSelect" class="filter-select">
                <option value="New" ${order.status === 'New' ? 'selected' : ''}>Order Received</option>
                <option value="Packed" ${order.status === 'Packed' ? 'selected' : ''}>Packed</option>
                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Dispatched</option>
                <option value="In Transit" ${order.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
          </div>
          
          <!-- Visual Timeline Node Steps -->
          <div class="shipping-timeline-steps">
            ${getTimelineStepsHtml(order.status)}
          </div>
        </div>

        <!-- Financial Order Summary Details -->
        <div class="glass-card detail-section">
          <div class="detail-section__header">
            <h3>Order Financial Summary</h3>
          </div>
          <table class="financial-summary-table">
            <tr>
              <td>Subtotal</td>
              <td>${symbol}${order.subtotal.toLocaleString()}</td>
            </tr>
            ${order.discount > 0 ? `
            <tr class="discount-row">
              <td>Discount (Promo Code: ${order.promo_code || 'Applied'})</td>
              <td>&minus;${symbol}${order.discount.toLocaleString()}</td>
            </tr>` : ''}
            <tr>
              <td>Shipping & Handling Charges</td>
              <td>${order.shipping_fee === 0 ? 'FREE' : `${symbol}${order.shipping_fee.toLocaleString()}`}</td>
            </tr>
            <tr class="total-row">
              <td>Grand Total</td>
              <td>${symbol}${order.total.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <!-- Customer Timeline Event Logs -->
        <div class="glass-card detail-section">
          <div class="detail-section__header">
            <h3>Activity History Log</h3>
          </div>
          <div class="customer-event-logs">
            ${order.timeline.map(t => {
              const eventDate = new Date(t.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              return `
                <div class="event-log-item">
                  <div class="event-log-bullet"></div>
                  <div class="event-log-content">
                    <span class="event-log-title">${escHTML(t.event)}</span>
                    <span class="event-log-time">${eventDate}</span>
                  </div>
                </div>
              `;
            }).reverse().join('')}
          </div>
        </div>
      </div>

      <!-- 2. RIGHT SIDEBAR COLUMN -->
      <div class="order-side-col">
        
        <!-- Order Actions Quick Access -->
        <div class="glass-card side-section">
          <h3>Administrative Actions</h3>
          <div class="side-action-buttons">
            <button class="action-btn-item primary-action" id="actionPackBtn" ${order.status !== 'New' ? 'disabled' : ''}>
              <i data-lucide="package"></i> Mark as Packed
            </button>
            <button class="action-btn-item primary-action" id="actionShipBtn" ${order.status !== 'Packed' ? 'disabled' : ''}>
              <i data-lucide="truck"></i> Mark as Shipped
            </button>
            <button class="action-btn-item primary-action" id="actionDeliverBtn" ${(order.status === 'Delivered' || order.status === 'Cancelled') ? 'disabled' : ''}>
              <i data-lucide="check-circle"></i> Mark as Delivered
            </button>
            <button class="action-btn-item danger-action" id="actionCancelBtn" ${(order.status === 'Delivered' || order.status === 'Cancelled') ? 'disabled' : ''}>
              <i data-lucide="x-circle"></i> Cancel Order
            </button>
            <button class="action-btn-item warning-action" id="actionRefundBtn" ${order.payment_status === 'Refunded' ? 'disabled' : ''}>
              <i data-lucide="rotate-ccw"></i> Issue Refund
            </button>
          </div>
        </div>

        <!-- Customer Card -->
        <div class="glass-card side-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3>Customer</h3>
            <button class="icon-text-btn" id="copyEmailBtn" data-email="${escHTML(order.customer_email)}">
              <i data-lucide="copy"></i> Copy Email
            </button>
          </div>
          
          <div class="customer-info-box">
            <strong>${escHTML(order.customer_name)}</strong>
            <p>${escHTML(order.customer_email)}</p>
            <p>${escHTML(order.phone || 'No phone number available')}</p>
          </div>

          <hr class="section-divider">

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; margin-bottom:0.5rem;">
            <h4>Shipping Address</h4>
            <button class="icon-text-btn" id="copyAddressBtn" data-addr="${escHTML(order.address)}">
              <i data-lucide="copy"></i> Copy Address
            </button>
          </div>
          <div class="customer-address-box">
            <p>${escHTML(order.address)}</p>
            <span class="country-badge">Country: ${order.country}</span>
          </div>

          <hr class="section-divider">

          <h4 style="margin-top:1rem; margin-bottom:0.5rem;">Billing Address</h4>
          <div class="customer-address-box">
            <p>${escHTML(order.billing_address || order.address)}</p>
          </div>
        </div>

        <!-- Administrative Notes Section -->
        <div class="glass-card side-section">
          <h3>Internal Dispatch Notes</h3>
          
          <div class="add-note-wrap">
            <textarea id="newOrderNoteInput" placeholder="Add private staff update... (e.g. customer requested delivery after 5 PM)"></textarea>
            <button class="admin-btn admin-btn--primary" id="saveOrderNoteBtn" style="justify-content:center; width:100%; margin-top:0.5rem;">
              <i data-lucide="plus"></i> Add Note
            </button>
          </div>
          
          <div class="order-notes-list" id="orderNotesList">
            ${renderNotesList(order.notes)}
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });

  // Attach Event Listeners
  attachEventHandlers(container, order, container);
}

function getCurrencySymbol(code) {
  const countries = window.HABANE?.COUNTRIES || [];
  const c = countries.find(x => x.currency === code);
  return c ? c.symbol : (code === 'INR' ? '₹' : code);
}

function getStatusBadgeClass(status) {
  if (status === 'New') return 'badge--new';
  if (status === 'Packed') return 'badge--packed';
  if (status === 'Shipped' || status === 'In Transit' || status === 'Out for Delivery') return 'badge--shipped';
  if (status === 'Delivered') return 'badge--delivered';
  return 'badge--cancelled';
}

function getPaymentBadgeClass(pStatus) {
  if (pStatus === 'Paid') return 'badge--delivered';
  if (pStatus === 'Authorized') return 'badge--new';
  if (pStatus === 'Refunded') return 'badge--packed';
  return 'badge--cancelled';
}

function getTimelineStepsHtml(currentStatus) {
  const stages = [
    { key: "New", title: "Received" },
    { key: "Packed", title: "Packed" },
    { key: "Shipped", title: "Dispatched" },
    { key: "In Transit", title: "In Transit" },
    { key: "Out for Delivery", title: "Out for Delivery" },
    { key: "Delivered", title: "Delivered" }
  ];

  const currentIndex = stages.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'Cancelled';

  if (isCancelled) {
    return `
      <div class="timeline-cancelled-banner">
        <i data-lucide="x-circle"></i>
        <span>This order has been cancelled and administrative dispatch workflows have been voided.</span>
      </div>
    `;
  }

  return stages.map((stage, i) => {
    let nodeClass = 'timeline-node';
    if (i < currentIndex) nodeClass += ' completed';
    else if (i === currentIndex) nodeClass += ' active';
    else nodeClass += ' pending';

    return `
      <div class="${nodeClass}">
        <div class="node-indicator">
          ${i < currentIndex ? '<i data-lucide="check"></i>' : (i === currentIndex ? '<i data-lucide="play"></i>' : i + 1)}
        </div>
        <span class="node-title">${stage.title}</span>
      </div>
    `;
  }).join('<div class="timeline-line"></div>');
}

function renderNotesList(notes) {
  if (!notes || notes.length === 0) {
    return '<p class="empty-notes-hint">No notes logged yet.</p>';
  }
  return notes.map(n => {
    const noteDate = new Date(n.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `
      <div class="note-card-item">
        <p class="note-card-content">${escHTML(n.note)}</p>
        <span class="note-card-meta">Logged by System Admin · ${noteDate}</span>
      </div>
    `;
  }).reverse().join('');
}

function attachEventHandlers(container, order, rootContainer) {
  // Update status dropdown
  const statusSelect = document.getElementById('timelineStatusSelect');
  statusSelect?.addEventListener('change', (e) => {
    updateWorkflowStatus(order, e.target.value, rootContainer);
  });

  // Action Pack
  document.getElementById('actionPackBtn')?.addEventListener('click', () => {
    updateWorkflowStatus(order, 'Packed', rootContainer);
  });

  // Action Ship
  document.getElementById('actionShipBtn')?.addEventListener('click', () => {
    updateWorkflowStatus(order, 'Shipped', rootContainer);
  });

  // Action Deliver
  document.getElementById('actionDeliverBtn')?.addEventListener('click', () => {
    updateWorkflowStatus(order, 'Delivered', rootContainer);
  });

  // Action Cancel
  document.getElementById('actionCancelBtn')?.addEventListener('click', () => {
    if (confirm("Are you sure you want to cancel this order? This cannot be undone.")) {
      updateWorkflowStatus(order, 'Cancelled', rootContainer);
    }
  });

  // Action Refund
  document.getElementById('actionRefundBtn')?.addEventListener('click', () => {
    if (confirm(`Do you want to initiate a full refund of ${getCurrencySymbol(order.currency)}${order.total.toLocaleString()}?`)) {
      order.payment_status = 'Refunded';
      order.timeline.push({ event: `Refund Initiated of ${getCurrencySymbol(order.currency)}${order.total.toLocaleString()}`, timestamp: new Date().toISOString() });
      db.saveOrder(order);
      showToast(`Refund of ${getCurrencySymbol(order.currency)}${order.total.toLocaleString()} processed successfully!`, "success");
      render(rootContainer, order.id);
    }
  });

  // Save dispatch note
  document.getElementById('saveOrderNoteBtn')?.addEventListener('click', () => {
    const input = document.getElementById('newOrderNoteInput');
    const noteText = input.value.trim();
    if (!noteText) return;

    order.notes.push({
      note: noteText,
      timestamp: new Date().toISOString()
    });
    db.saveOrder(order);
    input.value = '';
    
    // Rerender notes list directly
    document.getElementById('orderNotesList').innerHTML = renderNotesList(order.notes);
    showToast("Internal note logged.", "info");
  });

  // Copy Email Address
  document.getElementById('copyEmailBtn')?.addEventListener('click', (e) => {
    const email = e.currentTarget.dataset.email;
    navigator.clipboard.writeText(email).then(() => {
      showToast("Email address copied to clipboard!", "success");
    });
  });

  // Copy Shipping Address
  document.getElementById('copyAddressBtn')?.addEventListener('click', (e) => {
    const addr = e.currentTarget.dataset.addr;
    navigator.clipboard.writeText(addr).then(() => {
      showToast("Shipping address copied to clipboard!", "success");
    });
  });

  // Invoice Printing
  const printFn = () => {
    const printWindow = window.open('', '_blank');
    const symbol = getCurrencySymbol(order.currency);
    const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const productRows = order.products.map(p => `
      <tr>
        <td>${escHTML(p.name)}<br><small style="color:#666;">Color: ${escHTML(p.color)} · Size: ${escHTML(p.size)}</small></td>
        <td>${symbol}${p.price.toLocaleString()}</td>
        <td style="text-align:center;">${p.qty}</td>
        <td style="text-align:right;">${symbol}${(p.price * p.qty).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 3rem; color: #111; line-height: 1.5; }
          .invoice-box { max-width: 800px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0b1240; padding-bottom: 1.5rem; margin-bottom: 2rem; }
          .logo { font-size: 2rem; font-weight: bold; color: #0b1240; letter-spacing: 0.15em; font-family: sans-serif; }
          .inv-title { text-align: right; }
          .inv-title h2 { margin: 0; color: #0b1240; }
          .details { display: flex; justify-content: space-between; margin-bottom: 2.5rem; }
          .details-col { width: 48%; }
          .details-col h4 { border-bottom: 1px solid #ddd; margin-bottom: 0.5rem; padding-bottom: 0.25rem; color: #555; }
          .details-col p { margin: 0.2rem 0; font-size: 0.9rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
          th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
          th { background-color: #0b1240; color: #fff; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { font-size: 0.9rem; }
          .totals { margin-top: 2rem; width: 40%; margin-left: 60%; }
          .totals-row { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; border-bottom: 1px solid #f2f2f2; }
          .totals-row.grand { border-top: 2px solid #0b1240; font-weight: bold; font-size: 1.1rem; border-bottom: none; padding-top: 0.75rem; color: #0b1240; }
          .footer { text-align: center; margin-top: 5rem; font-size: 0.8rem; color: #888; border-top: 1px solid #eee; padding-top: 1.5rem; }
        </style>
      </head>
      <body onload="window.print();">
        <div class="invoice-box">
          <div class="header">
            <div class="logo">HABÄNE</div>
            <div class="inv-title">
              <h2>INVOICE</h2>
              <p style="margin: 0.25rem 0 0;">Order: ${order.id}</p>
              <p style="margin: 0.1rem 0 0; font-size: 0.85rem; color: #555;">Date: ${dateStr}</p>
            </div>
          </div>
          
          <div class="details">
            <div class="details-col">
              <h4>Billed To:</h4>
              <p><strong>${escHTML(order.customer_name)}</strong></p>
              <p>${escHTML(order.customer_email)}</p>
              <p>${escHTML(order.phone || '')}</p>
              <p>${escHTML(order.billing_address || order.address)}</p>
            </div>
            <div class="details-col">
              <h4>Shipped To:</h4>
              <p><strong>${escHTML(order.customer_name)}</strong></p>
              <p>${escHTML(order.address)}</p>
              <p>Country Code: ${order.country}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Unit Price</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${symbol}${order.subtotal.toLocaleString()}</span>
            </div>
            ${order.discount > 0 ? `
            <div class="totals-row" style="color: #c00;">
              <span>Discount (${order.promo_code || 'Promo'}):</span>
              <span>&minus;${symbol}${order.discount.toLocaleString()}</span>
            </div>` : ''}
            <div class="totals-row">
              <span>Shipping Charges:</span>
              <span>${order.shipping_fee === 0 ? 'FREE' : `${symbol}${order.shipping_fee.toLocaleString()}`}</span>
            </div>
            <div class="totals-row grand">
              <span>Grand Total:</span>
              <span>${symbol}${order.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing HABÄNE. Engineered to travel as far as you do.</p>
            <p style="margin-top:0.25rem;">For support, inquiries, or zipper warranty registrations: support@habane.com</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  document.getElementById('printInvoiceBtn')?.addEventListener('click', printFn);
  document.getElementById('downloadPdfBtn')?.addEventListener('click', printFn);

  // Email Customer
  document.getElementById('emailCustomerBtn')?.addEventListener('click', () => {
    const subject = encodeURIComponent(`Update regarding your Habäne Order ${order.id}`);
    const body = encodeURIComponent(`Dear ${order.customer_name},\n\nThank you for shopping with Habäne. We are writing to update you on your order ${order.id}.\n\nYour current order status is: ${order.status}.\n\nIf you have any questions or need to register your lifetime zipper warranty, please do not hesitate to contact our team.\n\nWarm regards,\nHabäne Customer Relations`);
    window.location.href = `mailto:${order.customer_email}?subject=${subject}&body=${body}`;
  });
}

function updateWorkflowStatus(order, newStatus, rootContainer) {
  const success = db.updateOrderStatus(order.id, newStatus);
  if (success) {
    order.status = newStatus;
    
    // Sync payment status for delivered/cancelled
    if (newStatus === 'Delivered') {
      order.payment_status = 'Paid';
    } else if (newStatus === 'Cancelled') {
      order.payment_status = 'Voided';
    }

    order.timeline.push({
      event: `Status updated to ${newStatus}`,
      timestamp: new Date().toISOString()
    });
    db.saveOrder(order);

    showToast(`Order status updated to "${newStatus}"`, "success");
    refreshNotifications();
    
    // Complete re-render
    render(rootContainer, order.id);
  } else {
    showToast("Failed to update status in database.", "danger");
  }
}
