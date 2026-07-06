/* HABÄNE ADMIN — Products Catalog Editor & Creator Module */

import { db, escHTML } from './utils.js';
import { showToast, refreshNotifications } from './ui.js';

let activeCategoryTab = 'all';

export function render(container) {
  const products = window.HABANE?.PRODUCTS || [];
  const overrides = db.getCatalogOverrides();
  const orders = db.getOrders();
  const events = db.getEvents();

  // Aggregate Metrics per product
  const getProductMetrics = (id) => {
    const unitsSold = orders.reduce((sum, o) => {
      if (o.status !== 'Cancelled') {
        const pItem = o.products.find(item => item.id === id);
        if (pItem) sum += pItem.qty;
      }
      return sum;
    }, 0);

    const adds = events.filter(e => e.product_id === id && e.event_type === 'Wishlist Added').length;
    const rms = events.filter(e => e.product_id === id && e.event_type === 'Wishlist Removed').length;
    const wishlistCount = Math.max(0, adds - rms);

    return { unitsSold, wishlistCount };
  };

  // Build the initial HTML framework
  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Products</h1>
        <p>Manage categories, update pricing/specifications, and upload product assets.</p>
      </div>
      <div class="module-actions">
        <button class="admin-btn admin-btn--primary" id="createProductBtn">
          <i data-lucide="plus"></i> Add Product
        </button>
        <button class="admin-btn admin-btn--secondary" id="exportCatalogJsonBtn">
          <i data-lucide="download"></i> Export Updated Catalog (JSON)
        </button>
      </div>
    </div>

    <!-- Category Tabs Panel -->
    <div class="category-tabs-container">
      <button class="category-tab-btn ${activeCategoryTab === 'all' ? 'active' : ''}" data-cat="all">All</button>
      <button class="category-tab-btn ${activeCategoryTab === 'duffel' ? 'active' : ''}" data-cat="duffel">Duffels</button>
      <button class="category-tab-btn ${activeCategoryTab === 'backpack' ? 'active' : ''}" data-cat="backpack">Backpacks</button>
      <button class="category-tab-btn ${activeCategoryTab === 'smart' ? 'active' : ''}" data-cat="smart">Smart Series</button>
      <button class="category-tab-btn ${activeCategoryTab === 'sling' ? 'active' : ''}" data-cat="sling">Accessories</button>
      <button class="category-tab-btn ${activeCategoryTab === 'laptop-bag' ? 'active' : ''}" data-cat="laptop-bag">Laptop Bags</button>
      <button class="category-tab-btn ${activeCategoryTab === 'travel-bag' ? 'active' : ''}" data-cat="travel-bag">Travel Bags</button>
    </div>

    <!-- Products Table -->
    <div class="glass-card" style="padding: 0; overflow: hidden; margin-top: 1rem;">
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Was Price</th>
              <th>Stock</th>
              <th>Units Sold</th>
              <th>Wishlist</th>
              <th>Featured</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="productsTableBody">
            <!-- Filtered rows injected dynamically -->
          </tbody>
        </table>
      </div>
      <div id="productsTableEmpty" class="notif-empty" style="display: none; padding: 3rem;">
        No products match this category filter.
      </div>
    </div>

    <!-- 2. LARGE MULTI-TAB PRODUCT DRAWER (Sliding Overlay) -->
    <div id="productDrawer" class="login-wall drawer-overlay" style="display: none; justify-content: flex-end; padding:0;">
      <div class="drawer-panel">
        <div class="drawer-header">
          <div>
            <h2 id="drawerTitle">Edit Details</h2>
            <span class="drawer-subtitle" id="drawerSubtitle">Product ID: p1</span>
          </div>
          <button class="drawer-close-x" id="closeDrawerBtn">&times;</button>
        </div>
        
        <!-- Drawer Tabs Navigation -->
        <div class="drawer-tab-nav">
          <button type="button" class="drawer-tab-btn active" data-tab="basic">Basic Info</button>
          <button type="button" class="drawer-tab-btn" data-tab="pricing">Pricing & Stock</button>
          <button type="button" class="drawer-tab-btn" data-tab="images">Images & Media</button>
          <button type="button" class="drawer-tab-btn" data-tab="colors">Colors & Features</button>
          <button type="button" class="drawer-tab-btn" data-tab="specs">Specs & SEO</button>
          <button type="button" class="drawer-tab-btn" data-tab="controls">Controls</button>
        </div>

        <form id="drawerForm" class="drawer-scroll-form">
          <input type="hidden" id="drawerProdId">
          
          <!-- TAB 1: BASIC INFORMATION -->
          <div class="drawer-tab-section active" id="sec-basic">
            <div class="form-group">
              <label for="drawerName">Product Name *</label>
              <input type="text" id="drawerName" required placeholder="e.g. Skyline Duffel V2">
            </div>
            <div class="form-group">
              <label for="drawerSub">Subtitle / Tagline</label>
              <input type="text" id="drawerSub" placeholder="e.g. Our hero carry, engineered to the last detail">
            </div>
            <div class="form-group">
              <label for="drawerDesc">Product Description *</label>
              <textarea id="drawerDesc" required placeholder="Describe the material, lining, pockets, and daily styling..." style="height:110px;"></textarea>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label for="drawerCategory">Category *</label>
                <select id="drawerCategory" class="filter-select">
                  <option value="duffel">Duffel</option>
                  <option value="backpack">Backpack</option>
                  <option value="smart">Smart Series</option>
                  <option value="sling">Accessories (Sling)</option>
                  <option value="laptop-bag">Laptop Bags</option>
                  <option value="travel-bag">Travel Bags</option>
                </select>
              </div>
              <div class="form-group">
                <label for="drawerBrand">Brand</label>
                <input type="text" id="drawerBrand" placeholder="e.g. HABÄNE">
              </div>
            </div>
            <div class="form-group">
              <label for="drawerSku">SKU</label>
              <input type="text" id="drawerSku" placeholder="e.g. HB-SKY-OL-35">
            </div>
          </div>

          <!-- TAB 2: PRICING & INVENTORY -->
          <div class="drawer-tab-section" id="sec-pricing">
            <div class="form-row-2">
              <div class="form-group">
                <label for="drawerPrice">Selling Price (INR) *</label>
                <input type="number" id="drawerPrice" required min="1" placeholder="e.g. 6499">
              </div>
              <div class="form-group">
                <label for="drawerWas">Original Price / Was Price (INR)</label>
                <input type="number" id="drawerWas" placeholder="e.g. 7999 (Optional)">
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label for="drawerDiscount">Discount (%)</label>
                <input type="number" id="drawerDiscount" placeholder="Auto-calculated" readonly style="background:#eef0f2; cursor:not-allowed;">
              </div>
              <div class="form-group">
                <label for="drawerTax">Tax Rate (%)</label>
                <input type="number" id="drawerTax" placeholder="e.g. 18" min="0" max="100" value="18">
              </div>
              <div class="form-group">
                <label for="drawerShippingFee">Shipping Fee (INR)</label>
                <input type="number" id="drawerShippingFee" placeholder="0 for Free Shipping" min="0" value="0">
              </div>
            </div>
            <hr style="margin:1.5rem 0; border:0; border-top:1px solid var(--silver-bg);">
            <div class="form-row-3">
              <div class="form-group">
                <label for="drawerStock">Stock Quantity *</label>
                <input type="number" id="drawerStock" required min="0" value="12">
              </div>
              <div class="form-group">
                <label for="drawerLowStock">Low Stock Threshold</label>
                <input type="number" id="drawerLowStock" min="0" value="5">
              </div>
              <div class="form-group">
                <label for="drawerAvailability">Availability</label>
                <select id="drawerAvailability" class="filter-select">
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="pre_order">Pre-Order</option>
                </select>
              </div>
            </div>
            <div class="toggles-grid-list">
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="drawerFeatured">
                <span>Featured Product (Homepage Hero Carousel)</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="drawerBestseller">
                <span>Mark as Bestseller badge</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="drawerNewArrival">
                <span>Mark as New Arrival badge</span>
              </label>
            </div>
          </div>

          <!-- TAB 3: PRODUCT IMAGES & GALLERY -->
          <div class="drawer-tab-section" id="sec-images">
            <div class="form-group">
              <label>Main Product Image URL / Upload *</label>
              <div style="display:flex; gap:0.5rem;">
                <input type="text" id="drawerMainImgUrl" required placeholder="e.g. assets/products/p1-olive-skyline-duffel.jpg" style="flex:1;">
                <label class="upload-file-label">
                  <i data-lucide="upload"></i> Upload
                  <input type="file" class="file-hidden-picker" id="uploadMainImgFile" accept="image/*">
                </label>
              </div>
              <div class="img-preview-box" style="margin-top:0.5rem;">
                <img id="previewMainImg" src="" alt="Main Image Preview" style="max-height:100px; max-width:100%; border-radius:8px; border:1px solid #ccc; display:none;">
              </div>
            </div>
            
            <hr style="margin:1.5rem 0; border:0; border-top:1px solid var(--silver-bg);">
            
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <label>Gallery Images (URLs/Uploads)</label>
                <button type="button" class="icon-text-btn" id="addGalleryImgBtn"><i data-lucide="plus"></i> Add Gallery Row</button>
              </div>
              <div id="galleryInputsList" style="display:grid; gap:0.75rem;">
                <!-- Dynamically injected gallery items -->
              </div>
            </div>

            <hr style="margin:1.5rem 0; border:0; border-top:1px solid var(--silver-bg);">

            <div class="form-row-2">
              <div class="form-group">
                <label for="drawerVideoUrl">Video URL</label>
                <input type="text" id="drawerVideoUrl" placeholder="e.g. assets/videos/duffel-commercial.mp4">
              </div>
              <div class="form-group">
                <label for="drawerThreeSixtyUrl">360° Image / WebGL Asset</label>
                <input type="text" id="drawerThreeSixtyUrl" placeholder="e.g. assets/3d/duffel.glb">
              </div>
            </div>
          </div>

          <!-- TAB 4: COLORS & FEATURES -->
          <div class="drawer-tab-section" id="sec-colors">
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <label>Color Swatches</label>
                <button type="button" class="icon-text-btn" id="addColorBtn"><i data-lucide="plus"></i> Add Color</button>
              </div>
              <div id="colorsListContainer" class="list-editor-wrap">
                <!-- Color items injected here -->
              </div>
            </div>

            <hr style="margin:2rem 0; border:0; border-top:1px solid var(--silver-bg);">

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <label>Product Features / Electronics</label>
                <button type="button" class="icon-text-btn" id="addFeatureBtn"><i data-lucide="plus"></i> Add Feature Card</button>
              </div>
              <div id="featuresListContainer" class="list-editor-wrap">
                <!-- Features injected here -->
              </div>
            </div>
          </div>

          <!-- TAB 5: SPECIFICATIONS & SEO -->
          <div class="drawer-tab-section" id="sec-specs">
            <h4>Technical Specifications</h4>
            <div class="specs-grid-inputs">
              <div class="form-group">
                <label for="specMaterial">Material</label>
                <input type="text" id="specMaterial" placeholder="e.g. DWR-coated canvas">
              </div>
              <div class="form-group">
                <label for="specCapacity">Capacity</label>
                <input type="text" id="specCapacity" placeholder="e.g. 45L">
              </div>
              <div class="form-group">
                <label for="specWeight">Weight</label>
                <input type="text" id="specWeight" placeholder="e.g. 1.8 kg">
              </div>
              <div class="form-group">
                <label for="specWarranty">Warranty</label>
                <input type="text" id="specWarranty" placeholder="e.g. Lifetime zipper">
              </div>
              <div class="form-group">
                <label for="specDimensions">Dimensions</label>
                <input type="text" id="specDimensions" placeholder="e.g. 52 x 28 x 25 cm">
              </div>
              <div class="form-group">
                <label for="specLaptopSize">Laptop Size Support</label>
                <input type="text" id="specLaptopSize" placeholder="e.g. Up to 16 inches">
              </div>
              <div class="form-group">
                <label for="specWaterResistance">Water Resistance</label>
                <input type="text" id="specWaterResistance" placeholder="e.g. IPX4 splash-proof">
              </div>
              <div class="form-group">
                <label for="specZipperType">Zipper Type</label>
                <input type="text" id="specZipperType" placeholder="e.g. YKK AquaGuard">
              </div>
            </div>

            <hr style="margin:2rem 0; border:0; border-top:1px solid var(--silver-bg);">

            <h4>SEO Parameters</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label for="seoTitle">Meta Title</label>
                <input type="text" id="seoTitle" placeholder="Page title on Google">
              </div>
              <div class="form-group">
                <label for="seoSlug">URL Slug</label>
                <input type="text" id="seoSlug" placeholder="e.g. skyline-duffel-v2">
              </div>
            </div>
            <div class="form-group">
              <label for="seoKeywords">Keywords</label>
              <input type="text" id="seoKeywords" placeholder="e.g. luggage, waterproof duffel, smart bag">
            </div>
            <div class="form-group">
              <label for="seoDesc">Meta Description</label>
              <textarea id="seoDesc" placeholder="Snippet visible in search results..." style="height:60px;"></textarea>
            </div>
          </div>

          <!-- TAB 6: STOREFRONT CONTROLS -->
          <div class="drawer-tab-section" id="sec-controls">
            <h4>Storefront Visibility Locations</h4>
            <div class="toggles-grid-list">
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="showInHome" checked>
                <span>Show in Homepage Layout</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="showInSmart" checked>
                <span>Show in Smart Series Section</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="showInFeatured" checked>
                <span>Show in Featured Carousel</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="showInTrending" checked>
                <span>Show in Trending Products</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="showInNewArrivals" checked>
                <span>Show in New Arrivals Section</span>
              </label>
            </div>

            <hr style="margin:2rem 0; border:0; border-top:1px solid var(--silver-bg);">

            <h4>Purchase & Cart Interactivity</h4>
            <div class="toggles-grid-list">
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="ctrlReviews" checked>
                <span>Enable User Reviews & Ratings</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="ctrlWishlist" checked>
                <span>Enable 'Add to Wishlist' button</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="ctrlAddToCart" checked>
                <span>Enable 'Add to Cart' button</span>
              </label>
              <label class="toggle-checkbox-item">
                <input type="checkbox" id="ctrlBuyNow" checked>
                <span>Enable instant 'Buy Now' button</span>
              </label>
            </div>
          </div>
          
          <!-- Save / Close Actions Footer -->
          <div class="drawer-footer-actions">
            <button type="submit" class="admin-btn admin-btn--primary" style="flex:2; justify-content:center;">Save Product Changes</button>
            <button type="button" class="admin-btn admin-btn--secondary" id="previewStorefrontBtn">
              <i data-lucide="eye"></i> Preview
            </button>
            <button type="button" class="admin-btn admin-btn--secondary" id="drawerDiscardBtn" style="flex:1; justify-content:center;">Discard</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });

  // Add event listener to category tabs
  const tabBtns = container.querySelectorAll('.category-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeCategoryTab = e.currentTarget.dataset.cat;
      updateTable();
    });
  });

  // Export JSON
  document.getElementById('exportCatalogJsonBtn')?.addEventListener('click', triggerCatalogExport);

  // Add Product Button
  document.getElementById('createProductBtn')?.addEventListener('click', openDrawerForCreate);

  // Close Drawer actions
  document.getElementById('closeDrawerBtn')?.addEventListener('click', closeDrawer);
  document.getElementById('drawerDiscardBtn')?.addEventListener('click', closeDrawer);

  // Setup form tab navigation in drawer
  setupDrawerTabNavigation();

  // Setup dynamically adding elements inside drawer
  setupDynamicRowAdders();

  // Setup Pricing Auto discount Calculation
  setupPricingAutoCalculations();

  // Setup File Pickers to Base64
  setupImageFilePickers();

  // Setup Product Save Form Submit
  document.getElementById('drawerForm')?.addEventListener('submit', handleProductFormSubmit);

  // Setup Storefront preview button click
  document.getElementById('previewStorefrontBtn')?.addEventListener('click', () => {
    const prodId = document.getElementById('drawerProdId').value;
    if (prodId) {
      window.open(`../product.html?id=${prodId}`, '_blank');
    } else {
      showToast("Save product first to preview.", "warning");
    }
  });

  // Initial table rendering
  updateTable();
}

function updateTable() {
  const tableBody = document.getElementById('productsTableBody');
  const tableEmpty = document.getElementById('productsTableEmpty');
  if (!tableBody) return;

  const products = window.HABANE?.PRODUCTS || [];
  const overrides = db.getCatalogOverrides();
  const orders = db.getOrders();
  const events = db.getEvents();

  // Filter products by tab
  const filtered = products.filter(p => {
    const over = overrides[p.id] || {};
    const cat = over.cat || p.cat;

    if (activeCategoryTab === 'all') return true;
    if (activeCategoryTab === 'duffel') return cat === 'duffel';
    if (activeCategoryTab === 'backpack') return cat === 'backpack';
    if (activeCategoryTab === 'smart') return cat === 'smart';
    if (activeCategoryTab === 'sling') return cat === 'sling' || cat === 'accessory' || cat === 'accessories';
    if (activeCategoryTab === 'laptop-bag') return cat === 'laptop-bag' || cat === 'laptop';
    if (activeCategoryTab === 'travel-bag') return cat === 'travel-bag' || cat === 'travel';

    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    tableEmpty.style.display = 'block';
    return;
  }

  tableEmpty.style.display = 'none';

  // Aggregate Metrics per product helper
  const getProductMetrics = (id) => {
    const unitsSold = orders.reduce((sum, o) => {
      if (o.status !== 'Cancelled') {
        const pItem = o.products.find(item => item.id === id);
        if (pItem) sum += pItem.qty;
      }
      return sum;
    }, 0);

    const adds = events.filter(e => e.product_id === id && e.event_type === 'Wishlist Added').length;
    const rms = events.filter(e => e.product_id === id && e.event_type === 'Wishlist Removed').length;
    const wishlistCount = Math.max(0, adds - rms);

    return { unitsSold, wishlistCount };
  };

  tableBody.innerHTML = filtered.map(p => {
    const over = overrides[p.id] || {};
    const currentPrice = over.price !== undefined ? over.price : p.price;
    const wasPrice = over.was !== undefined ? over.was : p.was;
    const stock = over.stock !== undefined ? over.stock : 12; // default
    const featured = over.featured !== undefined ? over.featured : p.featured;
    const badge = over.badge !== undefined ? over.badge : p.badge;
    const sku = over.sku || p.sku || `HB-${p.id.toUpperCase()}`;
    const category = over.cat || p.cat || 'duffel';
    
    const { unitsSold, wishlistCount } = getProductMetrics(p.id);

    return `
      <tr data-product-id="${p.id}">
        <td><img src="../${over.img || p.img}" class="table-img" alt="${escHTML(p.name)}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; border:1px solid rgba(11,18,64,0.1);"></td>
        <td>
          <div class="product-cell">
            <div>
              <span class="product-title" style="font-weight:600; color:var(--navy);">${escHTML(p.name)}</span>
              ${badge ? `<br><span class="badge badge--new" style="font-size:0.58rem; padding:0.05rem 0.25rem; display:inline-block; margin-top:0.2rem;">${escHTML(badge)}</span>` : ''}
            </div>
          </div>
        </td>
        <td style="text-transform: capitalize; font-size:0.8rem;">${category}</td>
        <td style="font-size:0.75rem; font-family:monospace; color:var(--text-muted);">${escHTML(sku)}</td>
        <td style="font-weight:600; font-size:0.82rem;">₹${currentPrice.toLocaleString('en-IN')}</td>
        <td style="color:var(--text-muted); text-decoration:line-through; font-size:0.8rem;">
          ${wasPrice ? `₹${wasPrice.toLocaleString('en-IN')}` : '—'}
        </td>
        <td>
          <span style="font-weight:700; font-size:0.82rem; color: ${stock < 5 ? 'var(--danger)' : 'inherit'};">
            ${stock} units
          </span>
        </td>
        <td style="font-size:0.8rem;">${unitsSold} sold</td>
        <td style="font-size:0.8rem;">❤️ ${wishlistCount}</td>
        <td>
          <span class="badge ${featured ? 'badge--delivered' : 'badge--cancelled'}" style="font-size:0.6rem;">
            ${featured ? 'Yes' : 'No'}
          </span>
        </td>
        <td>
          <button class="admin-btn admin-btn--secondary edit-product-btn" data-id="${p.id}" style="padding:0.3rem 0.6rem; font-size:0.68rem;">
            <i data-lucide="edit-3" style="width:12px; height:12px;"></i> Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons({ root: tableBody });

  // Attach Edit Clicks
  tableBody.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      openDrawerForEdit(id);
    });
  });
}

function openDrawerForEdit(id) {
  const products = window.HABANE?.PRODUCTS || [];
  const overrides = db.getCatalogOverrides();
  const p = products.find(x => x.id === id);
  if (!p) return;

  const over = overrides[id] || {};
  const currentPrice = over.price !== undefined ? over.price : p.price;
  const wasPrice = over.was !== undefined ? over.was : (p.was || '');
  const stock = over.stock !== undefined ? over.stock : 12;
  const lowStock = over.lowStockThreshold !== undefined ? over.lowStockThreshold : 5;
  const availability = over.availability !== undefined ? over.availability : (stock > 0 ? 'in_stock' : 'out_of_stock');
  const featured = over.featured !== undefined ? over.featured : p.featured;
  const bestseller = over.bestseller !== undefined ? over.bestseller : p.bestSelling;
  const newArrival = over.newArrival !== undefined ? over.newArrival : p.new;
  const badge = over.badge !== undefined ? over.badge : (p.badge || '');
  
  const sub = over.subtitle || p.subtitle || '';
  const desc = over.desc || p.desc || '';
  const brand = over.brand || p.brand || 'HABÄNE';
  const sku = over.sku || p.sku || `HB-${p.id.toUpperCase()}`;
  const tax = over.tax !== undefined ? over.tax : 18;
  const shippingFee = over.shippingFee !== undefined ? over.shippingFee : 0;
  
  const mainImg = over.img || p.img || '';
  const videoUrl = over.videoUrl || p.videoUrl || '';
  const threeSixtyUrl = over.threeSixtyUrl || p.threeSixtyUrl || '';
  const gallery = over.images || p.images || [p.img, p.img2].filter(Boolean);

  const colors = over.colors || p.colors || [];
  const smartFeatures = over.smartFeatures || p.smartFeatures || [];
  const specs = over.specs || p.specs || {};

  const seoTitle = over.seoTitle || '';
  const seoSlug = over.seoSlug || p.id;
  const seoKeywords = over.seoKeywords || '';
  const seoDesc = over.seoDesc || '';

  // Setup form fields
  document.getElementById('drawerProdId').value = p.id;
  document.getElementById('drawerTitle').textContent = "Edit Catalog Product";
  document.getElementById('drawerSubtitle').textContent = `Product ID: ${p.id}`;

  document.getElementById('drawerName').value = p.name;
  document.getElementById('drawerSub').value = sub;
  document.getElementById('drawerDesc').value = desc;
  document.getElementById('drawerCategory').value = over.cat || p.cat;
  document.getElementById('drawerBrand').value = brand;
  document.getElementById('drawerSku').value = sku;

  document.getElementById('drawerPrice').value = currentPrice;
  document.getElementById('drawerWas').value = wasPrice;
  document.getElementById('drawerTax').value = tax;
  document.getElementById('drawerShippingFee').value = shippingFee;
  document.getElementById('drawerStock').value = stock;
  document.getElementById('drawerLowStock').value = lowStock;
  document.getElementById('drawerAvailability').value = availability;

  document.getElementById('drawerFeatured').checked = featured;
  document.getElementById('drawerBestseller').checked = bestseller;
  document.getElementById('drawerNewArrival').checked = newArrival;

  document.getElementById('drawerMainImgUrl').value = mainImg;
  const preview = document.getElementById('previewMainImg');
  if (mainImg) {
    preview.src = mainImg.startsWith('assets/') ? `../${mainImg}` : mainImg;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  document.getElementById('drawerVideoUrl').value = videoUrl;
  document.getElementById('drawerThreeSixtyUrl').value = threeSixtyUrl;

  // Populating dynamic list editors
  renderGalleryListEditor(gallery);
  renderColorsListEditor(colors);
  renderFeaturesListEditor(smartFeatures);

  // Specifications
  document.getElementById('specMaterial').value = specs.material || '';
  document.getElementById('specCapacity').value = specs.capacity || '';
  document.getElementById('specWeight').value = specs.weight || '';
  document.getElementById('specWarranty').value = specs.warranty || '';
  document.getElementById('specDimensions').value = specs.dimensions || '';
  document.getElementById('specLaptopSize').value = specs.laptopSize || '';
  document.getElementById('specWaterResistance').value = specs.waterResistance || '';
  document.getElementById('specZipperType').value = specs.zipperType || '';

  // SEO parameters
  document.getElementById('seoTitle').value = seoTitle;
  document.getElementById('seoSlug').value = seoSlug;
  document.getElementById('seoKeywords').value = seoKeywords;
  document.getElementById('seoDesc').value = seoDesc;

  // Storefront Controls
  document.getElementById('showInHome').checked = over.showInHome !== false;
  document.getElementById('showInSmart').checked = over.showInSmart !== false;
  document.getElementById('showInFeatured').checked = over.showInFeatured !== false;
  document.getElementById('showInTrending').checked = over.showInTrending !== false;
  document.getElementById('showInNewArrivals').checked = over.showInNewArrivals !== false;
  
  document.getElementById('ctrlReviews').checked = over.ctrlReviews !== false;
  document.getElementById('ctrlWishlist').checked = over.ctrlWishlist !== false;
  document.getElementById('ctrlAddToCart').checked = over.ctrlAddToCart !== false;
  document.getElementById('ctrlBuyNow').checked = over.ctrlBuyNow !== false;

  // Calculate discount percentage
  calculateDiscount();

  // Open the drawer
  const drawer = document.getElementById('productDrawer');
  drawer.style.display = 'flex';
  
  // Set tab back to basic
  const basicTabBtn = drawer.querySelector('.drawer-tab-btn[data-tab="basic"]');
  basicTabBtn.click();

  if (window.gsap) {
    window.gsap.fromTo(drawer.firstElementChild, { x: 850 }, { x: 0, duration: 0.45, ease: 'power3.out' });
  }
}

function openDrawerForCreate() {
  document.getElementById('drawerProdId').value = '';
  document.getElementById('drawerTitle').textContent = "Create Custom Product";
  document.getElementById('drawerSubtitle').textContent = "Product ID: Auto-Generated";

  // Reset fields to empty
  document.getElementById('drawerName').value = '';
  document.getElementById('drawerSub').value = '';
  document.getElementById('drawerDesc').value = '';
  document.getElementById('drawerCategory').value = 'duffel';
  document.getElementById('drawerBrand').value = 'HABÄNE';
  document.getElementById('drawerSku').value = '';

  document.getElementById('drawerPrice').value = '';
  document.getElementById('drawerWas').value = '';
  document.getElementById('drawerTax').value = '18';
  document.getElementById('drawerShippingFee').value = '0';
  document.getElementById('drawerStock').value = '10';
  document.getElementById('drawerLowStock').value = '5';
  document.getElementById('drawerAvailability').value = 'in_stock';

  document.getElementById('drawerFeatured').checked = false;
  document.getElementById('drawerBestseller').checked = false;
  document.getElementById('drawerNewArrival').checked = true;

  document.getElementById('drawerMainImgUrl').value = 'assets/products/p1-olive-skyline-duffel.jpg';
  const preview = document.getElementById('previewMainImg');
  preview.src = '../assets/products/p1-olive-skyline-duffel.jpg';
  preview.style.display = 'block';

  document.getElementById('drawerVideoUrl').value = '';
  document.getElementById('drawerThreeSixtyUrl').value = '';

  // Seed default dynamic items
  renderGalleryListEditor(['assets/products/p1-olive-skyline-duffel.jpg']);
  renderColorsListEditor([{ name: 'Midnight Blue', hex: '#0b1240' }]);
  renderFeaturesListEditor([]);

  // Specifications
  document.getElementById('specMaterial').value = 'Tech Canvas';
  document.getElementById('specCapacity').value = '45L';
  document.getElementById('specWeight').value = '1.2 kg';
  document.getElementById('specWarranty').value = 'Lifetime zipper';
  document.getElementById('specDimensions').value = '';
  document.getElementById('specLaptopSize').value = '';
  document.getElementById('specWaterResistance').value = '';
  document.getElementById('specZipperType').value = '';

  // SEO parameters
  document.getElementById('seoTitle').value = '';
  document.getElementById('seoSlug').value = '';
  document.getElementById('seoKeywords').value = '';
  document.getElementById('seoDesc').value = '';

  // Storefront Controls
  document.getElementById('showInHome').checked = true;
  document.getElementById('showInSmart').checked = true;
  document.getElementById('showInFeatured').checked = true;
  document.getElementById('showInTrending').checked = true;
  document.getElementById('showInNewArrivals').checked = true;
  
  document.getElementById('ctrlReviews').checked = true;
  document.getElementById('ctrlWishlist').checked = true;
  document.getElementById('ctrlAddToCart').checked = true;
  document.getElementById('ctrlBuyNow').checked = true;

  calculateDiscount();

  // Open the drawer
  const drawer = document.getElementById('productDrawer');
  drawer.style.display = 'flex';
  
  // Set tab back to basic
  const basicTabBtn = drawer.querySelector('.drawer-tab-btn[data-tab="basic"]');
  basicTabBtn.click();

  if (window.gsap) {
    window.gsap.fromTo(drawer.firstElementChild, { x: 850 }, { x: 0, duration: 0.45, ease: 'power3.out' });
  }
}

function closeDrawer() {
  const drawer = document.getElementById('productDrawer');
  if (!drawer) return;

  if (window.gsap) {
    window.gsap.to(drawer.firstElementChild, {
      x: 850, duration: 0.4, ease: 'power3.in',
      onComplete: () => { drawer.style.display = 'none'; }
    });
  } else {
    drawer.style.display = 'none';
  }
}

function setupDrawerTabNavigation() {
  const tabBtns = document.querySelectorAll('.drawer-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabName = btn.dataset.tab;
      document.querySelectorAll('.drawer-tab-section').forEach(sec => {
        sec.classList.remove('active');
      });
      document.getElementById(`sec-${tabName}`).classList.add('active');
    });
  });
}

function setupPricingAutoCalculations() {
  const priceInput = document.getElementById('drawerPrice');
  const wasInput = document.getElementById('drawerWas');
  
  priceInput?.addEventListener('input', calculateDiscount);
  wasInput?.addEventListener('input', calculateDiscount);
}

function calculateDiscount() {
  const price = parseFloat(document.getElementById('drawerPrice').value) || 0;
  const was = parseFloat(document.getElementById('drawerWas').value) || 0;
  const discInput = document.getElementById('drawerDiscount');

  if (was > price && price > 0) {
    const pct = Math.round(((was - price) / was) * 100);
    discInput.value = pct;
  } else {
    discInput.value = 0;
  }
}

function setupImageFilePickers() {
  // Main Image File Picker
  const mainInput = document.getElementById('drawerMainImgUrl');
  const mainFile = document.getElementById('uploadMainImgFile');
  const mainPreview = document.getElementById('previewMainImg');

  mainFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => {
        mainInput.value = evt.target.result;
        mainPreview.src = evt.target.result;
        mainPreview.style.display = 'block';
        showToast("Image loaded.", "info");
      };
      r.readAsDataURL(file);
    }
  });

  mainInput?.addEventListener('input', () => {
    const val = mainInput.value.trim();
    if (val) {
      mainPreview.src = val.startsWith('assets/') ? `../${val}` : val;
      mainPreview.style.display = 'block';
    } else {
      mainPreview.style.display = 'none';
    }
  });
}

function setupDynamicRowAdders() {
  // Gallery Row Adder
  document.getElementById('addGalleryImgBtn')?.addEventListener('click', () => {
    addGalleryRow('');
  });

  // Color Swatch Adder
  document.getElementById('addColorBtn')?.addEventListener('click', () => {
    addColorRow('', '#000000', '');
  });

  // Feature Card Adder
  document.getElementById('addFeatureBtn')?.addEventListener('click', () => {
    addFeatureRow('', '', 'shield');
  });
}

// 1. Gallery Rows Management
function renderGalleryListEditor(images) {
  const container = document.getElementById('galleryInputsList');
  if (!container) return;
  container.innerHTML = '';
  images.forEach(img => addGalleryRow(img));
}

function addGalleryRow(srcValue) {
  const container = document.getElementById('galleryInputsList');
  const rowId = 'gal-' + Math.random().toString(36).substring(2, 9);
  
  const div = document.createElement('div');
  div.className = 'gallery-editor-row';
  div.id = rowId;
  div.innerHTML = `
    <div style="display:flex; gap:0.5rem; width:100%; align-items:center;">
      <span class="drag-handle-bar"><i data-lucide="grip-vertical" style="width:14px; height:14px; color:var(--text-muted);"></i></span>
      <input type="text" class="gallery-img-url-input" value="${escHTML(srcValue)}" placeholder="Image URL or upload file" style="flex:1;">
      <label class="upload-file-label" style="padding:0.4rem 0.6rem; font-size:0.7rem;">
        <i data-lucide="upload" style="width:12px; height:12px;"></i>
        <input type="file" class="file-hidden-picker gallery-row-file-picker" accept="image/*">
      </label>
      <button type="button" class="admin-btn admin-btn--secondary remove-gallery-row-btn" style="padding:0.4rem 0.6rem; color:var(--danger); border-color:var(--danger);"><i data-lucide="trash-2" style="width:12px; height:12px;"></i></button>
    </div>
    <div class="row-preview-wrap" style="margin-left:24px; margin-top:0.25rem;">
      <img src="${srcValue ? (srcValue.startsWith('assets/') ? `../${srcValue}` : srcValue) : ''}" style="max-height:40px; border-radius:4px; border:1px solid #ccc; display:${srcValue ? 'block' : 'none'};">
    </div>
  `;
  container.appendChild(div);

  if (window.lucide) window.lucide.createIcons({ root: div });

  // Event Listeners inside row
  const urlInput = div.querySelector('.gallery-img-url-input');
  const filePicker = div.querySelector('.gallery-row-file-picker');
  const previewImg = div.querySelector('img');
  
  filePicker.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => {
        urlInput.value = evt.target.result;
        previewImg.src = evt.target.result;
        previewImg.style.display = 'block';
      };
      r.readAsDataURL(file);
    }
  });

  urlInput.addEventListener('input', () => {
    const val = urlInput.value.trim();
    if (val) {
      previewImg.src = val.startsWith('assets/') ? `../${val}` : val;
      previewImg.style.display = 'block';
    } else {
      previewImg.style.display = 'none';
    }
  });

  div.querySelector('.remove-gallery-row-btn').addEventListener('click', () => {
    div.remove();
  });
}

// 2. Color Swatches Management
function renderColorsListEditor(colors) {
  const container = document.getElementById('colorsListContainer');
  if (!container) return;
  container.innerHTML = '';
  colors.forEach(c => addColorRow(c.name, c.hex, c.img || ''));
}

function addColorRow(name, hex, imgVal) {
  const container = document.getElementById('colorsListContainer');
  const div = document.createElement('div');
  div.className = 'color-editor-row';
  div.innerHTML = `
    <div class="form-row-3" style="margin-bottom:0.75rem; align-items:center; gap:0.5rem; grid-template-columns:1.5fr 1fr 2fr auto;">
      <input type="text" class="color-name-input" value="${escHTML(name)}" placeholder="Color Name (e.g. Ivory)">
      <div style="display:flex; align-items:center; gap:0.25rem;">
        <input type="color" class="color-hex-input" value="${hex || '#000000'}" style="width:30px; height:30px; padding:0; border:none; background:none; cursor:pointer;">
        <input type="text" class="color-hex-text" value="${hex || '#000000'}" style="font-family:monospace; font-size:0.75rem; width:65px;">
      </div>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <input type="text" class="color-img-input" value="${escHTML(imgVal)}" placeholder="Thumbnail image URL" style="font-size:0.75rem; flex:1;">
        <label class="upload-file-label" style="padding:0.4rem 0.5rem; font-size:0.65rem;">
          <i data-lucide="upload" style="width:10px; height:10px;"></i>
          <input type="file" class="file-hidden-picker color-img-file-picker" accept="image/*">
        </label>
      </div>
      <button type="button" class="admin-btn admin-btn--secondary remove-color-row-btn" style="padding:0.4rem; color:var(--danger); border-color:var(--danger);"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
    </div>
  `;
  container.appendChild(div);

  if (window.lucide) window.lucide.createIcons({ root: div });

  const hexInput = div.querySelector('.color-hex-input');
  const hexText = div.querySelector('.color-hex-text');
  const imgInput = div.querySelector('.color-img-input');
  const imgPicker = div.querySelector('.color-img-file-picker');

  // Sync color picker with text hex value
  hexInput.addEventListener('input', () => { hexText.value = hexInput.value; });
  hexText.addEventListener('input', () => { if (hexText.value.startsWith('#')) hexInput.value = hexText.value; });

  // Handle color thumbnail upload
  imgPicker.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => {
        imgInput.value = evt.target.result;
      };
      r.readAsDataURL(file);
    }
  });

  div.querySelector('.remove-color-row-btn').addEventListener('click', () => {
    div.remove();
  });
}

// 3. Feature Cards Management
function renderFeaturesListEditor(featureIds) {
  const container = document.getElementById('featuresListContainer');
  if (!container) return;
  container.innerHTML = '';
  
  // Resolve feature IDs from database
  const smartFeaturesList = window.HABANE?.SMART_FEATURES || [];
  featureIds.forEach(fid => {
    const defaultFeat = smartFeaturesList.find(f => f.id === fid);
    if (defaultFeat) {
      addFeatureRow(defaultFeat.title, defaultFeat.desc, defaultFeat.icon);
    }
  });
}

function addFeatureRow(title, desc, iconName) {
  const container = document.getElementById('featuresListContainer');
  const div = document.createElement('div');
  div.className = 'feature-editor-row';
  
  const iconOptions = [
    { name: 'usb', label: 'USB Port' },
    { name: 'battery-charging', label: 'Power bank' },
    { name: 'fingerprint', label: 'Fingerprint' },
    { name: 'lock', label: 'TSA Lock' },
    { name: 'map-pin', label: 'GPS Pin' },
    { name: 'shield', label: 'Shield' },
    { name: 'laptop', label: 'Laptop Sleeve' },
    { name: 'eye-off', label: 'Hidden Pocket' },
    { name: 'droplets', label: 'Water droplets' },
    { name: 'maximize-2', label: 'Expandable' },
    { name: 'layout-grid', label: 'Grid Organization' },
    { name: 'radio', label: 'RFID pocket' }
  ];

  const selectHtml = iconOptions.map(opt => `
    <option value="${opt.name}" ${opt.name === iconName ? 'selected' : ''}>${opt.label}</option>
  `).join('');

  div.innerHTML = `
    <div class="feature-row-fields" style="background:rgba(11,18,64,0.02); border:1px solid rgba(11,18,64,0.08); border-radius:8px; padding:0.75rem; margin-bottom:0.75rem; display:grid; gap:0.5rem; position:relative;">
      <div class="form-row-2" style="grid-template-columns: 2.5fr 1.5fr;">
        <input type="text" class="feature-title-input" value="${escHTML(title)}" placeholder="Feature Title (e.g. Waterproof Pocket)">
        <select class="feature-icon-select filter-select" style="height:32px;">
          ${selectHtml}
        </select>
      </div>
      <textarea class="feature-desc-input" placeholder="Feature Description..." style="height:50px; font-size:0.75rem; padding:0.4rem;">${escHTML(desc)}</textarea>
      <button type="button" class="admin-btn admin-btn--secondary remove-feature-row-btn" style="position:absolute; top:0.75rem; right:0.75rem; padding:0.25rem 0.4rem; color:var(--danger); border-color:var(--danger); height:26px;"><i data-lucide="trash-2" style="width:12px; height:12px;"></i></button>
    </div>
  `;
  container.appendChild(div);

  if (window.lucide) window.lucide.createIcons({ root: div });

  div.querySelector('.remove-feature-row-btn').addEventListener('click', () => {
    div.remove();
  });
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const products = window.HABANE?.PRODUCTS || [];
  const prodId = document.getElementById('drawerProdId').value;
  const name = document.getElementById('drawerName').value.trim();
  const subtitle = document.getElementById('drawerSub').value.trim();
  const desc = document.getElementById('drawerDesc').value.trim();
  const cat = document.getElementById('drawerCategory').value;
  const brand = document.getElementById('drawerBrand').value.trim() || 'HABÄNE';
  const sku = document.getElementById('drawerSku').value.trim();

  const price = parseInt(document.getElementById('drawerPrice').value, 10);
  const wasVal = document.getElementById('drawerWas').value;
  const was = wasVal ? parseInt(wasVal, 10) : null;
  const tax = parseInt(document.getElementById('drawerTax').value, 10) || 18;
  const shippingFee = parseInt(document.getElementById('drawerShippingFee').value, 10) || 0;
  
  const stock = parseInt(document.getElementById('drawerStock').value, 10);
  const lowStockThreshold = parseInt(document.getElementById('drawerLowStock').value, 10) || 5;
  const availability = document.getElementById('drawerAvailability').value;

  const featured = document.getElementById('drawerFeatured').checked;
  const bestSeller = document.getElementById('drawerBestseller').checked;
  const newArrival = document.getElementById('drawerNewArrival').checked;

  const mainImg = document.getElementById('drawerMainImgUrl').value.trim();
  const videoUrl = document.getElementById('drawerVideoUrl').value.trim();
  const threeSixtyUrl = document.getElementById('drawerThreeSixtyUrl').value.trim();

  // Read dynamic lists
  // 1. Gallery
  const galleryInputs = document.querySelectorAll('.gallery-img-url-input');
  const galleryImages = [];
  galleryInputs.forEach(input => {
    const val = input.value.trim();
    if (val) galleryImages.push(val);
  });
  if (galleryImages.length === 0 && mainImg) {
    galleryImages.push(mainImg);
  }

  // 2. Colors
  const colorRows = document.querySelectorAll('.color-editor-row');
  const colors = [];
  colorRows.forEach(row => {
    const cName = row.querySelector('.color-name-input').value.trim();
    const cHex = row.querySelector('.color-hex-text').value.trim();
    const cImg = row.querySelector('.color-img-input').value.trim();
    if (cName && cHex) {
      colors.push({ name: cName, hex: cHex, img: cImg || null });
    }
  });
  if (colors.length === 0) {
    colors.push({ name: 'Midnight Navy', hex: '#0b1240' });
  }

  // 3. Features
  const featureRows = document.querySelectorAll('.feature-editor-row');
  const smartFeatures = [];
  
  // In our local storage adapter, we need to log custom features as well.
  // We can add them to a global HABANE.SMART_FEATURES list if they are new,
  // or simply map titles/descriptions to smartFeatures ID strings.
  featureRows.forEach(row => {
    const fTitle = row.querySelector('.feature-title-input').value.trim();
    const fDesc = row.querySelector('.feature-desc-input').value.trim();
    const fIcon = row.querySelector('.feature-icon-select').value;
    
    if (fTitle) {
      // Find matching default or create unique custom feature id
      const formattedId = fTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
      smartFeatures.push(formattedId);
      
      // Update global pool
      const exist = window.HABANE?.SMART_FEATURES.find(x => x.id === formattedId);
      if (!exist) {
        window.HABANE?.SMART_FEATURES.push({
          id: formattedId,
          title: fTitle,
          desc: fDesc,
          icon: fIcon
        });
      } else {
        exist.title = fTitle;
        exist.desc = fDesc;
        exist.icon = fIcon;
      }
    }
  });

  // Specs
  const specs = {
    material: document.getElementById('specMaterial').value.trim(),
    capacity: document.getElementById('specCapacity').value.trim(),
    weight: document.getElementById('specWeight').value.trim(),
    warranty: document.getElementById('specWarranty').value.trim(),
    dimensions: document.getElementById('specDimensions').value.trim(),
    laptopSize: document.getElementById('specLaptopSize').value.trim(),
    waterResistance: document.getElementById('specWaterResistance').value.trim(),
    zipperType: document.getElementById('specZipperType').value.trim()
  };

  // SEO parameters
  const seoTitle = document.getElementById('seoTitle').value.trim();
  const seoSlug = document.getElementById('seoSlug').value.trim() || (prodId || 'new-product');
  const seoKeywords = document.getElementById('seoKeywords').value.trim();
  const seoDesc = document.getElementById('seoDesc').value.trim();

  // Visibility Controls
  const showInHome = document.getElementById('showInHome').checked;
  const showInSmart = document.getElementById('showInSmart').checked;
  const showInFeatured = document.getElementById('showInFeatured').checked;
  const showInTrending = document.getElementById('showInTrending').checked;
  const showInNewArrivals = document.getElementById('showInNewArrivals').checked;

  const ctrlReviews = document.getElementById('ctrlReviews').checked;
  const ctrlWishlist = document.getElementById('ctrlWishlist').checked;
  const ctrlAddToCart = document.getElementById('ctrlAddToCart').checked;
  const ctrlBuyNow = document.getElementById('ctrlBuyNow').checked;

  // Build compiled override object
  const productOverrideData = {
    name,
    subtitle,
    desc,
    cat,
    brand,
    sku,
    price,
    was,
    tax,
    shippingFee,
    stock,
    lowStockThreshold,
    availability,
    featured,
    bestSelling: bestSeller,
    bestseller: bestSeller,
    new: newArrival,
    newArrival,
    badge: bestSeller ? 'BESTSELLER' : (newArrival ? 'NEW' : (was ? 'SALE' : null)),
    img: mainImg,
    img2: galleryImages[1] || null,
    images: galleryImages,
    videoUrl,
    threeSixtyUrl,
    colors,
    smartFeatures,
    specs,
    seoTitle,
    seoSlug,
    seoKeywords,
    seoDesc,
    showInHome,
    showInSmart,
    showInFeatured,
    showInTrending,
    showInNewArrivals,
    ctrlReviews,
    ctrlWishlist,
    ctrlAddToCart,
    ctrlBuyNow
  };

  if (prodId) {
    // 1. UPDATE EXISTING
    db.saveCatalogOverride(prodId, productOverrideData);
    
    // Immediate memory sync
    const originalProd = products.find(x => x.id === prodId);
    if (originalProd) {
      Object.assign(originalProd, productOverrideData);
      // Recalculate categories label
      originalProd.catLabel = cat === 'duffel' ? 'Duffel' : 
                             (cat === 'backpack' ? 'Backpack' : 
                             (cat === 'smart' ? 'Smart Series' : cat.charAt(0).toUpperCase() + cat.slice(1)));
    }
    showToast(`Product "${name}" saved successfully!`, "success");
  } else {
    // 2. CREATE NEW
    const existingIds = products.map(p => {
      const match = p.id.match(/^p(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextNum = Math.max(...existingIds, 0) + 1;
    const newProdId = 'p' + nextNum;

    db.saveCatalogOverride(newProdId, productOverrideData);

    // Sync memory
    const catLabel = cat === 'duffel' ? 'Duffel' : 
                     (cat === 'backpack' ? 'Backpack' : 
                     (cat === 'smart' ? 'Smart Series' : cat.charAt(0).toUpperCase() + cat.slice(1)));
                     
    products.push({
      id: newProdId,
      catLabel,
      ...productOverrideData
    });

    showToast(`Product "${name}" created successfully!`, "success");
  }

  closeDrawer();
  refreshNotifications();
  
  // Reload view
  const mainContent = document.getElementById('mainContent');
  render(mainContent);
}

function triggerCatalogExport() {
  const products = window.HABANE?.PRODUCTS || [];
  const overrides = db.getCatalogOverrides();

  const mergedProducts = products.map(p => {
    const over = overrides[p.id] || {};
    return {
      ...p,
      ...over,
      price: over.price !== undefined ? over.price : p.price,
      was: over.was !== undefined ? over.was : p.was,
      stock: over.stock !== undefined ? over.stock : 12,
      badge: over.badge !== undefined ? over.badge : p.badge,
      featured: over.featured !== undefined ? over.featured : p.featured
    };
  });

  const jsonString = JSON.stringify(mergedProducts, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `habane_catalog_merged_${new Date().toISOString().slice(0, 10)}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Product catalog JSON exported!", "success");
}
