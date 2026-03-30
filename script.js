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
  // Priority: hero_image > offer_image > is_primary > offer.image
  // Returns { url, isHero, iconUrl }
  // ---------------------------------------------------------------------------
  function selectCreatives(offer) {
    // Skip hero_image — designed for white/light backgrounds, looks wrong in dark card.
    // Consistent square treatment across all offers is better than inconsistent hero mix.
    // Priority: offer_image (purpose-built, high-res) > is_primary > offer.image
    var creatives = offer.creatives || [];
    var offerIm = null;
    var primary = null;
    var icon    = null;

    creatives.forEach(function(c) {
      if (c.creative_type === 'offer_image' && !offerIm) offerIm = c;
      if (c.creative_type === 'icon_image')               icon    = c;
      if (c.is_primary)                                   primary = c;
    });

    var best   = offerIm || primary;
    var imgUrl = (best && best.url) || offer.image || '';

    return {
      url:     imgUrl,
      isHero:  false,
      iconUrl: icon ? icon.url : ''
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
      var sflLabel = msSettings.perkswallet_cta || 'SAVE FOR LATER';
      document.getElementById('ms-cta-save').textContent = sflLabel.toUpperCase();

      // Update Exclusive Offers pill label from API settings
      var pillEl = document.getElementById('ms-offers-link');
      var pillLabel = msSettings.offerwall_cta || 'Exclusive Offers';
      pillEl.textContent = '⭐ ' + pillLabel.toUpperCase();

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

    // Smart creative selection
    var creatives  = selectCreatives(offer);
    var imageWrap  = document.getElementById('ms-image-wrap');
    var imgEl      = document.getElementById('ms-image');

    if (creatives.url) {
      imgEl.src = creatives.url;
      imgEl.alt = offer.advertiser_name || 'Sponsored offer';
      // Hero images: contain (don't crop the wide banner); squares: cover
      imageWrap.classList.toggle('ms-image-wrap--hero',   creatives.isHero);
      imageWrap.classList.toggle('ms-image-wrap--square', !creatives.isHero);
      imageWrap.hidden = false;
    } else {
      imageWrap.hidden = true;
    }

    // Brand icon alongside advertiser name
    var iconEl = document.getElementById('ms-brand-icon');
    if (creatives.iconUrl && iconEl) {
      iconEl.src   = creatives.iconUrl;
      iconEl.style.display = 'inline-block';
    } else if (iconEl) {
      iconEl.style.display = 'none';
    }

    // Text content — prefer short_description, fall back to description
    setText('ms-advertiser', offer.advertiser_name || '');
    setText('ms-title', offer.title || offer.short_headline || '');
    // short_description is tighter — better fit for the card
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
    sflBtn.textContent = 'SAVE FOR LATER';
    sflBtn.disabled    = false;
    sflBtn.hidden      = false;
    sflBtn.onclick     = function() { handleSaveForLater(offer); };

    // PerksWallet / Exclusive Offers link — always show with fallback
    var offersLink = document.getElementById('ms-offers-link');
    offersLink.href   = offer.offerwall_url || 'https://perkswallet.com';
    offersLink.hidden = false;

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

    if (offer.save_for_later_url) {
      // Open PerksWallet NOW — synchronously in the click handler.
      // window.open inside fetch().then() is blocked by popup blockers (async context).
      // The SFL POST response is {"message":"Offer saved successfully"} — no URL returned.
      // We open offerwall_url directly as the PerksWallet destination.
      window.open(offer.offerwall_url || 'https://perkswallet.com', '_blank', 'noopener');

      sflBtn.textContent = 'SAVING…';
      sflBtn.disabled    = true;

      // POST to SFL endpoint in the background to persist the save server-side
      fetch(offer.save_for_later_url, { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function() {
          var savedTxt = (msSettings.saved_offer_text || 'Saved').toUpperCase();
          sflBtn.textContent = '✓ ' + savedTxt + '!';
          setTimeout(function() { advanceMSOffer(); }, 900);
        })
        .catch(function() {
          // POST failed but PW already opened — still mark saved and advance
          var savedTxt = (msSettings.saved_offer_text || 'Saved').toUpperCase();
          sflBtn.textContent = '✓ ' + savedTxt + '!';
          setTimeout(function() { advanceMSOffer(); }, 900);
        });

    } else if (offer.offerwall_url) {
      window.open(offer.offerwall_url, '_blank', 'noopener');
      var savedTxt2 = (msSettings.saved_offer_text || 'Saved').toUpperCase();
      sflBtn.textContent = '✓ ' + savedTxt2 + '!';
      setTimeout(function() { advanceMSOffer(); }, 600);

    } else {
      advanceMSOffer();
    }
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
