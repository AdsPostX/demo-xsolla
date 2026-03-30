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
  var msCfg     = cfg.momentscience;
  var msOffers  = [];
  var msIdx     = 0;
  var msOverlay = document.getElementById('ms-overlay');

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

      if (offers.length === 0) {
        console.log('[MS] No offers returned');
        return;
      }

      msOffers = offers.slice(0, msCfg.maxOffers || 3);
      msIdx    = 0;
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

    // Image
    var imageWrap = document.getElementById('ms-image-wrap');
    var imgEl     = document.getElementById('ms-image');
    var imgSrc = offer.image ||
      (offer.creatives && offer.creatives[0] && offer.creatives[0].url) || '';

    if (imgSrc) {
      imgEl.src = imgSrc;
      imgEl.alt = offer.advertiser_name || 'Sponsored offer';
      imageWrap.hidden = false;
    } else {
      imageWrap.hidden = true;
    }

    // Text content
    setText('ms-advertiser', offer.advertiser_name || '');
    setText('ms-title',      offer.title || offer.short_headline || '');
    setText('ms-desc',       offer.short_description || offer.description || '');

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

    // Save for Later
    var sflBtn = document.getElementById('ms-cta-save');
    sflBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M7 4.5v2.8l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Save for Later';
    sflBtn.disabled  = false;
    sflBtn.onclick   = function() { handleSaveForLater(offer); };

    // Hide SFL if no URL
    sflBtn.hidden = !offer.save_for_later_url;

    // PerksWallet link
    var offersLink = document.getElementById('ms-offers-link');
    if (offer.offerwall_enabled && offer.offerwall_url) {
      offersLink.href   = offer.offerwall_url;
      offersLink.hidden = false;
    } else {
      offersLink.hidden = true;
    }

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
    if (!offer.save_for_later_url) return;

    var sflBtn = document.getElementById('ms-cta-save');
    sflBtn.textContent = 'Saving…';
    sflBtn.disabled    = true;

    fetch(offer.save_for_later_url, { method: 'POST' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        sflBtn.textContent = '✓ Saved!';
        if (data && data.url) {
          window.open(data.url, '_blank', 'noopener');
        }
        setTimeout(function() { advanceMSOffer(); }, 900);
      })
      .catch(function() {
        sflBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M7 4.5v2.8l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Save for Later';
        sflBtn.disabled  = false;
      });
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
    var dotsEl = document.getElementById('ms-dots');
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
  }

  // T&C toggle
  document.getElementById('ms-tc-toggle').addEventListener('click', function() {
    var tcText = document.getElementById('ms-tc-text');
    var isOpen = tcText.classList.toggle('is-open');
    this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
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
