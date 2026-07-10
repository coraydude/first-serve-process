/* =====================================================================
   ServeManager Order Form wiring
   ---------------------------------------------------------------------
   Paste your branded ServeManager Order Form URL below. When set, every
   "Request Service" call-to-action across the site opens it in a new tab.
   While it's empty, those buttons keep their default behavior (the
   contact page / on-page form), so nothing is broken in the meantime.

   To go live: set ORDER_FORM_URL to your hosted form URL, e.g.
   var ORDER_FORM_URL = 'https://www.servemanager.com/order/your-form-id';
   ===================================================================== */
var ORDER_FORM_URL = '';

(function () {
  if (!ORDER_FORM_URL) return;
  // Point every Request Service CTA at the ServeManager order form (new tab).
  // Matches the nav/CTA buttons and any link explicitly marked data-request.
  var selectors = [
    'a.btn[href="contact.html"]',      // nav + CTA-band "Request Service" buttons
    'a[data-request]'                  // any element opted in explicitly
  ];
  document.querySelectorAll(selectors.join(',')).forEach(function (a) {
    // Leave plain text "Contact" footer links alone — only Request Service CTAs.
    var label = (a.textContent || '').toLowerCase();
    if (a.hasAttribute('data-request') || label.indexOf('request service') !== -1) {
      a.setAttribute('href', ORDER_FORM_URL);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
  });
})();

// Nav: mobile drawer toggle + dropdown menus
(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.getElementById('navToggle');
  if (!nav) return;

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close the drawer when a real link is tapped (not a dropdown toggle button)
    nav.querySelectorAll('.nav-links a, .nav-actions a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        nav.querySelectorAll('.nav-item.open').forEach(function (i) { i.classList.remove('open'); });
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Dropdown toggle buttons: on mobile (drawer open) they expand inline;
  // on desktop the CSS :hover handles it, but a click still toggles for touch.
  nav.querySelectorAll('.nav-item > button').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (window.matchMedia('(max-width: 980px)').matches) {
        e.preventDefault();
        var item = btn.parentElement;
        var wasOpen = item.classList.contains('open');
        // close siblings
        nav.querySelectorAll('.nav-item.open').forEach(function (i) { if (i !== item) i.classList.remove('open'); });
        item.classList.toggle('open', !wasOpen);
      }
    });
  });
})();

// "Start Your Serve" upload widget — show picked files, then route to real intake.
// When ORDER_FORM_URL is set it opens the ServeManager order form; otherwise the
// contact page. (True in-browser upload needs the backend/order form — no fake success.)
(function () {
  var fileInput = document.getElementById('serveFile');
  var drop = document.querySelector('.serve-drop');
  if (fileInput && drop) {
    var big = drop.querySelector('.big');
    var defaultBig = big ? big.textContent : '';
    fileInput.addEventListener('change', function () {
      if (!big) return;
      if (fileInput.files && fileInput.files.length) {
        var names = Array.prototype.map.call(fileInput.files, function (f) { return f.name; });
        big.textContent = names.length === 1 ? names[0] : names.length + ' files selected';
      } else {
        big.textContent = defaultBig;
      }
    });
    // Drag-over affordance
    ['dragover', 'dragenter'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.style.borderColor = 'var(--gold)'; drop.style.background = '#fffdf6'; });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.style.borderColor = ''; drop.style.background = ''; });
    });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileInput.dispatchEvent(new Event('change')); } });
  }

  // Generic quote/serve form submit — validate, then hand off to the real intake.
  var form = document.getElementById('quoteForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.reportValidity && !form.reportValidity()) return;
    var dest = (typeof ORDER_FORM_URL !== 'undefined' && ORDER_FORM_URL) ? ORDER_FORM_URL : 'contact.html';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = 'Opening secure intake…'; btn.disabled = true; }
    if (dest === 'contact.html') { window.location.href = dest; }
    else { window.open(dest, '_blank', 'noopener'); if (btn) { btn.disabled = false; btn.textContent = 'Get Started Now →'; } }
  });
})();
