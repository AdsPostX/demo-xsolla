// =============================================================================
// DEMO-XSOLLA — Script
// Reads from window.DEMO_CONFIG. Handles:
//   1. Populate order data from config
//   2. Screen 1 → Screen 2 transition on Pay click
//   3. MomentScience SDK trigger after success
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
      // Brief loading state
      btnPay.textContent = 'Processing…';
      btnPay.disabled = true;
      btnPay.style.opacity = '0.7';

      setTimeout(function() {
        showSuccessScreen();
      }, 900);
    });
  }

  function showSuccessScreen() {
    // Fade out checkout
    screenCheckout.style.transition = 'opacity 0.25s ease';
    screenCheckout.style.opacity    = '0';

    setTimeout(function() {
      screenCheckout.hidden = true;
      screenSuccess.hidden  = false;
      screenSuccess.style.opacity = '0';
      screenSuccess.style.transition = 'opacity 0.25s ease';

      // Force reflow then fade in
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          screenSuccess.style.opacity = '1';
        });
      });

      // Fire MomentScience moment after success is visible
      // Save for Later is included automatically via pub_user_id in AdpxUser
      window.msSuccessVisible = true;
      setTimeout(function() {
        triggerMomentScience();
      }, 1500);

    }, 260);
  }

  // ---------------------------------------------------------------------------
  // MomentScience SDK trigger
  // ---------------------------------------------------------------------------
  function triggerMomentScience() {
    var attempts = 0;
    var maxAttempts = 40; // poll up to 12 seconds

    function tryShow() {
      attempts++;

      if (window.Adpx && typeof window.Adpx.show === 'function') {
        // SDK ready — show the moment
        window.Adpx.show();
        console.log('[MomentScience] show() called');

      } else if (window.Adpx && typeof window.Adpx.init === 'function') {
        // SDK present but needs manual init
        window.Adpx.init(window.AdpxConfig, window.AdpxCallback);
        setTimeout(function() {
          if (window.Adpx && window.Adpx.show) {
            window.Adpx.show();
            console.log('[MomentScience] init + show() called');
          }
        }, 400);

      } else if (attempts < maxAttempts) {
        // Not ready yet — keep polling
        setTimeout(tryShow, 300);

      } else {
        console.warn('[MomentScience] SDK unavailable after', attempts, 'attempts');
      }
    }

    // Small extra delay on first call to let the SDK fully initialize
    setTimeout(tryShow, 200);
  }

  // ---------------------------------------------------------------------------
  // Overlay + panel close buttons (demo UX — reload to restart)
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.overlay-close, .panel-close').forEach(function(btn) {
    btn.addEventListener('click', function() {
      // Fade out and reload to restart the demo
      document.body.style.transition = 'opacity 0.2s ease';
      document.body.style.opacity    = '0';
      setTimeout(function() { location.reload(); }, 220);
    });
  });

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el && val) el.textContent = val;
  }
});
