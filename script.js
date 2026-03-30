// script.js — reads everything from window.DEMO_CONFIG

document.addEventListener('DOMContentLoaded', function() {
  var c = window.DEMO_CONFIG;
  var p = c.partner;
  var o = c.order;

  // ── Logo ──────────────────────────────────────────────────────────────────
  var headerLogo = document.getElementById('header-logo');
  var footerLogo = document.getElementById('footer-logo');

  function buildTextLogo(container, inverted) {
    var primary = document.createElement('span');
    primary.className = 'logo-text' + (inverted ? ' logo-text--inverted' : '');
    primary.textContent = p.namePrimary;

    var secondary = document.createElement('span');
    secondary.className = 'logo-domain' + (inverted ? ' logo-domain--inverted' : '');
    secondary.textContent = p.nameSecondary;

    container.classList.add('logo');
    container.appendChild(primary);
    container.appendChild(secondary);
  }

  function buildImageLogo(container) {
    var img = document.createElement('img');
    img.src = p.logoUrl;
    img.alt = p.name;
    img.className = 'logo-img';
    container.appendChild(img);
  }

  if (p.logoType === 'image') {
    buildImageLogo(headerLogo);
    buildImageLogo(footerLogo);
  } else {
    buildTextLogo(headerLogo, false);
    buildTextLogo(footerLogo, true);
  }

  // ── Nav phone ─────────────────────────────────────────────────────────────
  var phoneLink = document.getElementById('nav-phone');
  var phoneText = document.getElementById('nav-phone-text');
  if (phoneLink && p.supportPhone) {
    phoneLink.href = 'tel:' + p.supportPhone.replace(/\D/g, '');
    phoneText.textContent = p.supportPhone;
  }

  // ── Confirmation message ──────────────────────────────────────────────────
  var confMsg = document.getElementById('conf-message');
  if (confMsg) confMsg.textContent = 'Your order ' + o.orderNumber + ' has been successfully received.';

  // ── Order details ─────────────────────────────────────────────────────────
  setText('d-order-number', o.orderNumber);
  setText('d-payment',      o.payment);
  setText('d-email',        o.email);

  var addrEl = document.getElementById('d-address');
  if (addrEl) addrEl.innerHTML = o.customerName + '<br>' + o.address;

  var billingEl = document.getElementById('d-billing');
  if (billingEl) billingEl.innerHTML = o.customerName + '<br>' + o.address;

  // ── Order summary ─────────────────────────────────────────────────────────
  setText('s-item-name',    o.itemName);
  setText('s-item-date',    o.itemDate);
  setText('s-item-venue',   o.itemVenue);
  setText('s-item-section', 'Section: ' + o.itemSection);
  setText('s-item-row',     'Row: '     + o.itemRow);
  setText('s-item-qty',     'Quantity: '+ o.itemQuantity);
  setText('s-delivery',     o.itemDelivery);
  setText('s-total',        o.itemTotal);

  // ── Support email ─────────────────────────────────────────────────────────
  var emailLink = document.getElementById('support-email-link');
  if (emailLink && p.supportEmail) {
    emailLink.href        = 'mailto:' + p.supportEmail;
    emailLink.textContent = p.supportEmail;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  setText('footer-email',     'Email Support: ' + p.supportEmail);
  setText('footer-copyright', 'Copyright © '   + p.copyright);

  // ── Print ─────────────────────────────────────────────────────────────────
  document.querySelector('.print-button')
    ?.addEventListener('click', function() { window.print(); });

  // ── Modal / Embed toggle ──────────────────────────────────────────────────
  (function() {
    var urlParams    = new URLSearchParams(window.location.search);
    var currentMode  = urlParams.get('mode') || 'modal';
    var btnModal     = document.getElementById('btn-modal-nav');
    var btnEmbed     = document.getElementById('btn-embed-nav');
    var embedEl      = document.getElementById('adpx-embed');
    var embedPreload = false;

    function loadEmbed() {
      if (!window.Adpx || !window.AdpxConfig || embedPreload) return;
      window.AdpxConfig.settings.theme    = 'embed';
      window.AdpxConfig.settings.embedded = {
        enabled: true, targetElement: 'adpx-embed',
        showHeader: true, showFooter: true, showBorder: true
      };
      window.Adpx.init    && window.Adpx.init(window.AdpxConfig);
      window.Adpx.refresh && window.Adpx.refresh();
      window.Adpx.show    && window.Adpx.show();
      if (embedEl) { embedEl.setAttribute('aria-hidden', 'false'); embedEl.classList.add('adpx-embed-preload'); }
      embedPreload = true;
    }

    function revealEmbed() {
      if (!embedEl) return;
      embedEl.classList.remove('adpx-embed-preload');
      history.replaceState({}, '', window.location.pathname + '?mode=embed');
      btnModal && btnModal.classList.remove('active');
      btnEmbed && btnEmbed.classList.add('active');
      currentMode = 'embed';
    }

    btnModal && btnModal.addEventListener('click', function() {
      if (currentMode === 'modal') return;
      window.location.href = window.location.pathname + '?mode=modal';
    });

    btnEmbed && btnEmbed.addEventListener('click', function() {
      if (currentMode === 'embed') return;
      embedPreload ? revealEmbed() : (window.location.href = window.location.pathname + '?mode=embed');
    });

    if (currentMode === 'embed') {
      btnModal && btnModal.classList.remove('active');
      btnEmbed && btnEmbed.classList.add('active');
    }

    if (currentMode === 'modal') {
      window.addEventListener('load', function() {
        new MutationObserver(function(mutations) {
          for (var i = 0; i < mutations.length; i++) {
            var nodes = mutations[i].removedNodes;
            for (var j = 0; j < nodes.length; j++) {
              var n = nodes[j];
              var id = (n.id || ''); var cn = typeof n.className === 'string' ? n.className : '';
              if (id.indexOf('adpx') >= 0 || cn.indexOf('adpx') >= 0) {
                setTimeout(loadEmbed, 100); return;
              }
            }
          }
        }).observe(document.body, { childList: true, subtree: true });
      });
    }
  })();
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function setText(id, value) {
  var el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}
