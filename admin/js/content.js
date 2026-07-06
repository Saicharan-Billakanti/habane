/* HABÄNE ADMIN — Content Overrides Editor Module */

import { db, escHTML } from './utils.js';
import { showToast } from './ui.js';

export function render(container) {
  const overrides = db.getContentOverrides();

  // Storefront Default Content for pre-population
  const defaults = {
    hero_image: 'assets/brand/engineered-banner.jpg',
    hero_alt: 'Habäne — engineered to the last detail',
    ribbon_text: 'FREE SHIPPING OVER ₹4,999  ·  LIFETIME ZIPPER WARRANTY  ·  7-DAY EASY RETURNS  ·  COD AVAILABLE NATIONWIDE  ·  CARRY THE CITY',
    announcement_text: 'CARRY THE CITY · MIDNIGHT NAVY · METALLIC SILVER · SMART INSIDE',
    story_title: `We make bags for people who<br><span>can't sit still.</span>`,
    story_desc: `Habäne started with one idea — your luggage should keep up with your life, not slow it down. Every piece is built in our signature midnight navy and metallic silver, printed with hand-drawn skylines, and engineered to survive the chaos of actually going places.`,
    smart_hero_title: 'SMART SERIES',
    smart_hero_desc: 'The cutting edge of travel technology. Biometric fingerprint scanners, active RGB indicator lights, built-in device check-in panel, and charging cores.',
    footer_acc_1_title: 'RETURN POLICY',
    footer_acc_1_desc: "7-day easy returns. If it's not giving what you wanted, send it back for a refund or exchange.",
    footer_acc_2_title: 'SHIPPING',
    footer_acc_2_desc: 'Free shipping over ₹4,999. Metro cities 2–4 days, rest of India 4–7. COD available nationwide.',
    footer_acc_3_title: 'WARRANTY',
    footer_acc_3_desc: 'Lifetime zipper warranty, reinforced stitching and water-repellent canvas on every carry.'
  };

  // Base FAQs
  const defaultFaqs = [
    { q: 'Is the Smart Duffel actually smart?', a: 'Yes — integrated 10,000mAh fast-charge core, RGB trim lighting, device check-in panel and water-repellent tech canvas. Engineered, not just styled.', img: 'assets/products/p4-smart-duffel-ivory.jpg', tag: 'SMART SERIES' },
    { q: 'How fast is shipping?', a: 'Metro cities 2–4 business days, rest of India 4–7. Free shipping over ₹4,999 with tracking from dispatch.', img: 'assets/products/p2-navy-metropolitan-duffel.jpg', tag: 'SHIPPING' },
    { q: 'What if it does not meet expectations?', a: '7-day easy returns. Full refund or exchange — no drama. We want you to love your carry.', img: 'assets/products/p1-olive-skyline-duffel.jpg', tag: 'RETURNS' },
    { q: 'How durable are Habäne bags?', a: 'Lifetime zipper warranty, reinforced stitching and water-repellent canvas. Built for years of daily use.', img: 'assets/products/p7-heritage-backpack.jpg', tag: 'QUALITY' },
    { q: 'Do you offer Cash on Delivery?', a: 'COD available nationwide. Pay when your order arrives at your door.', img: 'assets/products/p5-steel-blue-weekender.jpg', tag: 'PAYMENTS' }
  ];

  const currentFaqs = overrides.faqs || defaultFaqs;

  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Content Overrides</h1>
        <p>Edit homepage visuals, marquees, stories, smart descriptions, FAQs, and footer disclosures.</p>
      </div>
    </div>

    <form id="contentOverridesForm" class="form-grid">
      <!-- 1. Hero & Marquees -->
      <div class="glass-card" style="grid-column: span 2;">
        <h3 style="font-family:'Conthrax';font-size:0.85rem;margin-bottom:1rem;color:var(--navy);">Homepage Hero & Marquees</h3>
        <div class="form-grid" style="grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label for="heroImage">Hero Banner Image Path</label>
            <input type="text" id="heroImage" value="${overrides.hero_image ?? defaults.hero_image}">
          </div>
          <div class="form-group">
            <label for="heroAlt">Hero Image Alt Text</label>
            <input type="text" id="heroAlt" value="${overrides.hero_alt ?? defaults.hero_alt}">
          </div>
          <div class="form-group">
            <label for="ribbonText">Scrolling Ribbon Text (Uppercase)</label>
            <input type="text" id="ribbonText" value="${overrides.ribbon_text ?? defaults.ribbon_text}">
          </div>
          <div class="form-group">
            <label for="announcementText">Announcements Marquee Text</label>
            <input type="text" id="announcementText" value="${overrides.announcement_text ?? defaults.announcement_text}">
          </div>
        </div>
      </div>

      <!-- 2. Brand Story & Smart Series -->
      <div class="glass-card">
        <h3 style="font-family:'Conthrax';font-size:0.85rem;margin-bottom:1rem;color:var(--navy);">Brand Story & Smart Series</h3>
        <div class="form-group">
          <label for="storyTitle">Story Section Title (HTML allowed)</label>
          <input type="text" id="storyTitle" value="${escVal(overrides.story_title ?? defaults.story_title)}">
        </div>
        <div class="form-group">
          <label for="storyDesc">Story Description</label>
          <textarea id="storyDesc" rows="3">${overrides.story_desc ?? defaults.story_desc}</textarea>
        </div>
        <div class="form-group">
          <label for="smartHeroTitle">Smart Series Hero Title</label>
          <input type="text" id="smartHeroTitle" value="${overrides.smart_hero_title ?? defaults.smart_hero_title}">
        </div>
        <div class="form-group">
          <label for="smartHeroDesc">Smart Series Hero Description</label>
          <textarea id="smartHeroDesc" rows="3">${overrides.smart_hero_desc ?? defaults.smart_hero_desc}</textarea>
        </div>
      </div>

      <!-- 3. Policy Footer Accordions -->
      <div class="glass-card">
        <h3 style="font-family:'Conthrax';font-size:0.85rem;margin-bottom:1rem;color:var(--navy);">Footer Accordions</h3>
        
        <!-- Accordion 1 -->
        <div style="border-bottom: 1px solid var(--silver-bg); padding-bottom:1rem; margin-bottom:1rem;">
          <div class="form-group">
            <label for="footerAcc1Title">Accordion 1 Summary (Title)</label>
            <input type="text" id="footerAcc1Title" value="${overrides.footer_acc_1_title ?? defaults.footer_acc_1_title}">
          </div>
          <div class="form-group">
            <label for="footerAcc1Desc">Accordion 1 Content (Paragraph)</label>
            <textarea id="footerAcc1Desc" rows="2">${overrides.footer_acc_1_desc ?? defaults.footer_acc_1_desc}</textarea>
          </div>
        </div>

        <!-- Accordion 2 -->
        <div style="border-bottom: 1px solid var(--silver-bg); padding-bottom:1rem; margin-bottom:1rem;">
          <div class="form-group">
            <label for="footerAcc2Title">Accordion 2 Summary (Title)</label>
            <input type="text" id="footerAcc2Title" value="${overrides.footer_acc_2_title ?? defaults.footer_acc_2_title}">
          </div>
          <div class="form-group">
            <label for="footerAcc2Desc">Accordion 2 Content (Paragraph)</label>
            <textarea id="footerAcc2Desc" rows="2">${overrides.footer_acc_2_desc ?? defaults.footer_acc_2_desc}</textarea>
          </div>
        </div>

        <!-- Accordion 3 -->
        <div>
          <div class="form-group">
            <label for="footerAcc3Title">Accordion 3 Summary (Title)</label>
            <input type="text" id="footerAcc3Title" value="${overrides.footer_acc_3_title ?? defaults.footer_acc_3_title}">
          </div>
          <div class="form-group">
            <label for="footerAcc3Desc">Accordion 3 Content (Paragraph)</label>
            <textarea id="footerAcc3Desc" rows="2">${overrides.footer_acc_3_desc ?? defaults.footer_acc_3_desc}</textarea>
          </div>
        </div>
      </div>

      <!-- 4. Frequently Asked Questions (FAQs Carousel) -->
      <div class="glass-card" style="grid-column: span 2;">
        <h3 style="font-family:'Conthrax';font-size:0.85rem;margin-bottom:1rem;color:var(--navy);">Frequently Asked Questions (5 Cards)</h3>
        
        <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
          ${currentFaqs.map((faq, idx) => `
            <div class="faq-edit-item" data-index="${idx}">
              <h4 style="font-family:'Conthrax';font-size:0.75rem;margin-bottom:0.75rem;color:var(--text-muted);display:flex;justify-content:space-between;">
                <span>FAQ Card ${idx + 1}</span>
                <span style="font-size:0.65rem; background:var(--silver-bg); padding:0.1rem 0.4rem; border-radius:4px;">${escHTML(faq.tag)}</span>
              </h4>
              <div class="form-group">
                <label for="faqTag-${idx}">Card Tag</label>
                <input type="text" id="faqTag-${idx}" value="${escVal(faq.tag)}" required>
              </div>
              <div class="form-group">
                <label for="faqQ-${idx}">Question (Quotes allowed)</label>
                <input type="text" id="faqQ-${idx}" value="${escVal(faq.q)}" required>
              </div>
              <div class="form-group">
                <label for="faqA-${idx}">Answer</label>
                <textarea id="faqA-${idx}" rows="3" required>${faq.a}</textarea>
              </div>
              <div class="form-group">
                <label for="faqImg-${idx}">Card Image Path</label>
                <input type="text" id="faqImg-${idx}" value="${escVal(faq.img)}" required>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Submit Block -->
      <div style="grid-column: span 2; display:flex; justify-content:flex-end; gap:1rem; border-top: 1px solid var(--border-glass); padding-top:1.5rem; margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--secondary" id="resetContentDefaultsBtn">Reset Default Contents</button>
        <button type="submit" class="admin-btn admin-btn--primary">Save Content Changes</button>
      </div>
    </form>
  `;

  // Attach Event Listeners
  const form = document.getElementById('contentOverridesForm');
  const resetBtn = document.getElementById('resetContentDefaultsBtn');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reconstruct FAQs array
    const faqs = [];
    for (let i = 0; i < 5; i++) {
      faqs.push({
        tag: document.getElementById(`faqTag-${i}`).value.trim(),
        q: document.getElementById(`faqQ-${i}`).value.trim(),
        a: document.getElementById(`faqA-${i}`).value.trim(),
        img: document.getElementById(`faqImg-${i}`).value.trim()
      });
    }

    const payload = {
      hero_image: document.getElementById('heroImage').value.trim(),
      hero_alt: document.getElementById('heroAlt').value.trim(),
      ribbon_text: document.getElementById('ribbonText').value.trim(),
      announcement_text: document.getElementById('announcementText').value.trim(),
      story_title: document.getElementById('storyTitle').value.trim(),
      story_desc: document.getElementById('storyDesc').value.trim(),
      smart_hero_title: document.getElementById('smartHeroTitle').value.trim(),
      smart_hero_desc: document.getElementById('smartHeroDesc').value.trim(),
      footer_acc_1_title: document.getElementById('footerAcc1Title').value.trim(),
      footer_acc_1_desc: document.getElementById('footerAcc1Desc').value.trim(),
      footer_acc_2_title: document.getElementById('footerAcc2Title').value.trim(),
      footer_acc_2_desc: document.getElementById('footerAcc2Desc').value.trim(),
      footer_acc_3_title: document.getElementById('footerAcc3Title').value.trim(),
      footer_acc_3_desc: document.getElementById('footerAcc3Desc').value.trim(),
      faqs: faqs
    };

    db.saveContentOverrides(payload);
    
    // Dynamically apply to active window.HABANE variables if matching storefront variables are initialized
    if (window.HABANE) {
      window.HABANE.FAQ_ITEMS.length = 0;
      window.HABANE.FAQ_ITEMS.push(...faqs);
    }

    showToast("Content overrides successfully saved!", "success");
    render(container);
  });

  resetBtn?.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all text overrides? This resets the storefront back to its default strings.")) {
      localStorage.removeItem('habane_content_overrides');
      // Reset window.HABANE reference
      if (window.HABANE) {
        window.HABANE.FAQ_ITEMS.length = 0;
        window.HABANE.FAQ_ITEMS.push(...defaultFaqs);
      }
      showToast("Content overrides cleared.", "warning");
      render(container);
    }
  });
}

// Help escape text content inside HTML attributes safely
function escVal(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
