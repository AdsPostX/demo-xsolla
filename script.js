// =============================================================================
// DEMO-XSOLLA — Script
// Reads from window.DEMO_CONFIG. Handles:
//   1. Populate order data from config
//   2. Screen 1 → Screen 2 transition on Pay click
//   3. MomentScience REST API fetch + gaming offer overlay
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
  var cfg   = window.DEMO_CONFIG;
  var order = cfg.order;

  // ---------------------------------------------------------------------------
  // Populate checkout screen (Screen 1)
  // ---------------------------------------------------------------------------
  setText('c-item-name',  order.itemName);
  setText('c-item-price', order.itemTotal);
  setText('c-subtotal',   order.itemTotal);
  setText('c-total',      order.itemTotal);

  // ---------------------------------------------------------------------------
  // Populate success screen (Screen 2)
  // ---------------------------------------------------------------------------
  setText('r-txn',        order.orderNumber);
  setText('r-date',       order.itemDate);
  setText('r-item-name',  order.itemName);
  setText('r-item-price', order.itemTotal);
  setText('r-subtotal',   order.itemTotal);
  setText('r-total',      order.itemTotal);
  setText('r-email-text', 'We sent your receipt to ' + order.email);

  // ---------------------------------------------------------------------------
  // Cookie notice dismiss
  // ---------------------------------------------------------------------------
  var cookie = document.getElementById('cookie-notice');
  function dismissCookie() {
    if (cookie) cookie.classList.add('is-hidden');
  }
  var cookieClose   = document.getElementById('cookie-close');
  var cookieDismiss = document.getElementById('cookie-dismiss');
  if (cookieClose)   cookieClose.addEventListener('click', dismissCookie);
  if (cookieDismiss) cookieDismiss.addEventListener('click', dismissCookie);

  // ---------------------------------------------------------------------------
  // Payment tab switching (UI only — no real payment processing)
  // ---------------------------------------------------------------------------
  var tabs = document.querySelectorAll('.pay-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) {
        t.classList.remove('pay-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('pay-tab--active');
      tab.setAttribute('aria-selected', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // PAY BUTTON → transition to Screen 2
  // ---------------------------------------------------------------------------
  var btnPay         = document.getElementById('btn-pay');
  var screenCheckout = document.getElementById('screen-checkout');
  var screenSuccess  = document.getElementById('screen-success');

  if (btnPay) {
    btnPay.addEventListener('click', function() {
      btnPay.textContent = 'Processing…';
      btnPay.disabled = true;
      btnPay.style.opacity = '0.7';

      setTimeout(function() {
        showSuccessScreen();
      }, 900);
    });
  }

  function showSuccessScreen() {
    screenCheckout.style.transition = 'opacity 0.25s ease';
    screenCheckout.style.opacity    = '0';

    setTimeout(function() {
      screenCheckout.hidden = true;
      screenSuccess.hidden  = false;
      screenSuccess.style.opacity = '0';
      screenSuccess.style.transition = 'opacity 0.25s ease';

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          screenSuccess.style.opacity = '1';
        });
      });

      // Fetch MS offers after success is visible
      setTimeout(function() {
        fetchMSOffers();
      }, 1400);

    }, 260);
  }

  // ---------------------------------------------------------------------------
  // Overlay + panel close buttons (demo UX — reload to restart)
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.overlay-close, .panel-close').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.body.style.transition = 'opacity 0.2s ease';
      document.body.style.opacity    = '0';
      setTimeout(function() { location.reload(); }, 220);
    });
  });

  // ---------------------------------------------------------------------------
  // MomentScience — REST API integration
  // POST https://api.adspostx.com/native/v2/offers.json?api_key=KEY
  // ---------------------------------------------------------------------------
  var msCfg      = cfg.momentscience;
  var msOffers   = [];
  var msSettings = {};
  var msIdx      = 0;
  var msOverlay  = document.getElementById('ms-overlay');

  // ---------------------------------------------------------------------------
  // Creative selection — pick the best image from offer.creatives[]
  // Creative selection — use icon_image (brand logo) exclusively for all offers.
  // Returns { url }
  //
  // icon_image is the one asset guaranteed to be consistent across every offer —
  // always a clean square brand logo on a transparent/white bg. offer_image and
  // hero_image vary wildly in aspect ratio and content, causing layout inconsistency.
  // ---------------------------------------------------------------------------
  function selectCreatives(offer) {
    var creatives = offer.creatives || [];
    var icon = null;

    creatives.forEach(function(c) {
      if (c.creative_type === 'icon_image' && !icon) icon = c;
    });

    return {
      url: icon ? icon.url : (offer.image || '')
    };
  }

  function fetchMSOffers() {
    var url = 'https://api.adspostx.com/native/v2/offers.json?api_key=' + msCfg.apiKey;

    var payload = {
      placement:   msCfg.placement,
      pub_user_id: 'demo_' + Math.random().toString(36).substr(2, 9),
      adpx_fp:     'fp_' + Date.now(),
      ua:          navigator.userAgent,
      creative:    '1'
    };

    if (msCfg.devMode) {
      payload.dev = '1';
    }

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      var offers = (data && data.data && Array.isArray(data.data.offers))
        ? data.data.offers : [];

      // Capture settings from API response
      msSettings = (data && data.data && data.data.settings) || {};

      if (offers.length === 0) {
        console.log('[MS] No offers returned');
        return;
      }

      msOffers = offers.slice(0, msCfg.maxOffers || 3);
      msIdx    = 0;

      // Apply close delay from API settings
      var closeBtn   = document.getElementById('ms-close');
      var closeDelay = msSettings.enable_close_delay ? (msSettings.close_delay || 0) : 0;
      if (closeDelay > 0) {
        closeBtn.style.visibility = 'hidden';
        closeBtn.style.pointerEvents = 'none';
        setTimeout(function() {
          closeBtn.style.visibility = '';
          closeBtn.style.pointerEvents = '';
        }, closeDelay * 1000);
      }

      // Update SFL button label from API settings
      var sflLabel = msSettings.perkswallet_cta || 'Save for later';
      document.getElementById('ms-cta-save').textContent = sflLabel.charAt(0).toUpperCase() + sflLabel.slice(1).toLowerCase();

      renderMSOffer(msIdx);
      msOverlay.hidden = false;
    })
    .catch(function(err) {
      console.warn('[MS] Fetch error:', err);
    });
  }

  function renderMSOffer(idx) {
    var offer = msOffers[idx];
    if (!offer) return;

    // Fire impression pixel (skip in devMode)
    if (offer.pixel && !msCfg.devMode) {
      new Image().src = offer.pixel;
    }

    // Logo image (icon_image) — consistent brand logo for every offer
    var creatives  = selectCreatives(offer);
    var imageWrap  = document.getElementById('ms-image-wrap');
    var imgEl      = document.getElementById('ms-image');

    if (creatives.url) {
      imgEl.src = creatives.url;
      imgEl.alt = offer.advertiser_name || 'Sponsored offer';
      imageWrap.hidden = false;
    } else {
      imageWrap.hidden = true;
    }

    // Text content
    setText('ms-advertiser', offer.advertiser_name || '');
    // short_headline is punchy single-line copy; title is verbose SEO copy
    setText('ms-title', offer.short_headline || offer.title || '');
    // short_description fits the card better; fall back to description
    setText('ms-desc',  offer.short_description || offer.description || '');

    // T&C
    var tcWrap   = document.getElementById('ms-tc-wrap');
    var tcToggle = document.getElementById('ms-tc-toggle');
    var tcText   = document.getElementById('ms-tc-text');

    if (offer.terms_and_conditions) {
      tcText.textContent = offer.terms_and_conditions;
      tcText.classList.remove('is-open');
      tcToggle.setAttribute('aria-expanded', 'false');
      tcWrap.hidden = false;
    } else {
      tcWrap.hidden = true;
    }

    // CTA label from API or sensible fallback
    var claimBtn = document.getElementById('ms-cta-claim');
    claimBtn.textContent = offer.cta_yes || 'Claim Reward';
    claimBtn.disabled    = false;
    claimBtn.onclick     = function() { handleClaim(offer); };

    // Save for Later — always visible (design element; fallback gracefully if no URL)
    var sflBtn = document.getElementById('ms-cta-save');
    sflBtn.textContent = 'Save for later';
    sflBtn.disabled    = false;
    sflBtn.hidden      = false;
    sflBtn.onclick     = function() { handleSaveForLater(offer); };

    // Navigation dots
    renderMSDots(idx);
  }

  function handleClaim(offer) {
    if (offer.click_url) {
      window.open(offer.click_url, '_blank', 'noopener');
    }
    advanceMSOffer();
  }

  function handleSaveForLater(offer) {
    var sflBtn = document.getElementById('ms-cta-save');

    sflBtn.textContent = 'Saving…';
    sflBtn.disabled    = true;

    if (offer.save_for_later_url) {
      // Hosted PerksWallet: open the save URL directly in a new tab.
      // The URL is the hosted perkswallet.com save-offer page — user registers
      // there and the offer lands in their wallet. Must call window.open()
      // synchronously in the click handler so popup blockers allow it.
      window.open(offer.save_for_later_url, '_blank', 'noopener');
    }

    sflBtn.textContent = '✓ Saved!';
    setTimeout(function() { advanceMSOffer(); }, 900);
  }

  function advanceMSOffer() {
    if (msIdx < msOffers.length - 1) {
      // Fire no_thanks beacon on the offer being skipped
      var skipped = msOffers[msIdx];
      fireBeacon(skipped, 'no_thanks_click');
      msIdx++;
      renderMSOffer(msIdx);
    } else {
      closeMSOverlay();
    }
  }

  function closeMSOverlay() {
    fireBeacon(msOffers[msIdx], 'close');
    msOverlay.style.transition = 'opacity 0.2s ease';
    msOverlay.style.opacity    = '0';
    setTimeout(function() {
      msOverlay.hidden = true;
      msOverlay.style.opacity    = '';
      msOverlay.style.transition = '';
    }, 210);
  }

  function fireBeacon(offer, key) {
    if (offer && offer.beacons && offer.beacons[key]) {
      new Image().src = offer.beacons[key];
    }
  }

  function renderMSDots(activeIdx) {
    var dotsEl  = document.getElementById('ms-dots');
    var prevBtn = document.getElementById('ms-prev');
    var nextBtn = document.getElementById('ms-next');

    dotsEl.innerHTML = '';
    msOffers.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className   = 'ms-dot' + (i === activeIdx ? ' ms-dot--active' : '');
      dot.setAttribute('aria-label', 'Offer ' + (i + 1));
      dot.onclick = function() {
        msIdx = i;
        renderMSOffer(i);
      };
      dotsEl.appendChild(dot);
    });

    // Reflect position in arrow buttons
    if (prevBtn) prevBtn.disabled = (activeIdx === 0);
    if (nextBtn) nextBtn.disabled = (activeIdx >= msOffers.length - 1);
  }

  // T&C toggle
  document.getElementById('ms-tc-toggle').addEventListener('click', function() {
    var tcText = document.getElementById('ms-tc-text');
    var isOpen = tcText.classList.toggle('is-open');
    this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Prev / Next offer navigation
  document.getElementById('ms-prev').addEventListener('click', function() {
    if (msIdx > 0) { msIdx--; renderMSOffer(msIdx); }
  });
  document.getElementById('ms-next').addEventListener('click', function() {
    if (msIdx < msOffers.length - 1) { msIdx++; renderMSOffer(msIdx); }
  });

  // MS overlay close button
  document.getElementById('ms-close').addEventListener('click', function() {
    closeMSOverlay();
  });

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.textContent = val;
  }
});
