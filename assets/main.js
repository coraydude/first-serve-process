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

// Mobile nav toggle
(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close menu when a link is tapped
    nav.querySelectorAll('.nav-links a, .nav-actions a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

// Quote form — front-end validation + graceful confirmation.
// TODO: wire `action`/`fetch` to your CRM or email endpoint when the backend is ready.
(function () {
  var form = document.getElementById('quoteForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var btn = form.querySelector('button[type="submit"]');
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Request sent ✓';
    btn.style.background = '#278139';
    form.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = true; });
    var fine = form.querySelector('.quote-fine');
    if (fine) fine.textContent = "Thanks! We'll reach out within 15 minutes during business hours.";
    // Reset affordance after a moment in case the visitor wants to send another.
    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = original;
      btn.style.background = '';
      form.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = false; });
      form.reset();
      if (fine) fine.textContent = 'No obligation · Confidential · Licensed Florida process servers';
    }, 6000);
  });
})();
