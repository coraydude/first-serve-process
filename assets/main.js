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

/* Direct ServeManager sync — set this to the deployed intake worker URL
   (see intake-worker/worker.js). When set, the homepage widget and the
   contact form POST fields + documents straight to ServeManager through
   the relay, with the email handoff as automatic fallback on failure. */
var INTAKE_API_URL = '';

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

// Intake forms. This is a static site with no backend, so the working intake
// path is a prefilled email to the dispatcher (or the ServeManager order form
// when ORDER_FORM_URL is set). File pickers list the chosen documents and the
// email tells the sender to attach exactly those files — no fake success.
var INTAKE_EMAIL = 'serve@firstserveprocess.com';

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
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.style.borderColor = 'var(--action)'; drop.style.background = '#FAFAFA'; });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.style.borderColor = ''; drop.style.background = ''; });
    });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileInput.dispatchEvent(new Event('change')); } });
  }

  // Contact page attach row: real picker that lists the chosen files.
  var attach = document.getElementById('attachFile');
  var attachLabel = document.getElementById('attachLabel');
  if (attach && attachLabel) {
    var attachDefault = attachLabel.textContent;
    attach.addEventListener('change', function () {
      if (attach.files && attach.files.length) {
        var names = Array.prototype.map.call(attach.files, function (f) { return f.name; });
        attachLabel.textContent = (names.length === 1 ? names[0] : names.length + ' files') + ' ready. They go on the email that opens next.';
      } else {
        attachLabel.textContent = attachDefault;
      }
    });
  }

  // Quote/serve form submit: validate, then open the real intake — the
  // ServeManager order form when configured, otherwise a prefilled email.
  var form = document.getElementById('quoteForm');
  if (!form) return;
  var LABELS = { name: 'Name', company: 'Company / firm', phone: 'Phone', email: 'Email', service: 'Service needed', county: 'County', urgency: 'Urgency', address: 'Service address', details: 'Details' };
  function emailHandoff() {
    var lines = [];
    Object.keys(LABELS).forEach(function (key) {
      var el = form.elements[key];
      if (el && el.value) lines.push(LABELS[key] + ': ' + el.value);
    });
    var fileNames = [];
    Array.prototype.forEach.call(form.querySelectorAll('input[type="file"]'), function (inp) {
      Array.prototype.forEach.call(inp.files || [], function (f) { fileNames.push(f.name); });
    });
    lines.push('');
    if (fileNames.length) {
      lines.push('Documents to serve, please attach to this email before sending: ' + fileNames.join(', '));
    } else {
      lines.push('Please attach the documents to be served to this email before sending.');
    }
    lines.push('');
    lines.push('Sent from firstserveprocess.com');
    var service = form.elements.service ? form.elements.service.value : '';
    var county = form.elements.county ? form.elements.county.value : '';
    var subject = 'Service request' + (service ? ': ' + service : '') + (county ? ' (' + county + ' County)' : '');
    window.location.href = 'mailto:' + INTAKE_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\r\n'));
    setBtn('Email opened. Attach documents & send', false, 6000);
  }

  var submitBtn = form.querySelector('button[type="submit"]');
  var submitDefault = submitBtn ? submitBtn.textContent : '';
  function setBtn(text, disabled, revertMs) {
    if (!submitBtn) return;
    submitBtn.textContent = text;
    submitBtn.disabled = !!disabled;
    if (revertMs) setTimeout(function () { submitBtn.textContent = submitDefault; submitBtn.disabled = false; }, revertMs);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.reportValidity && !form.reportValidity()) return;
    if (INTAKE_API_URL) {
      var fd = new FormData(form);
      setBtn('Sending to our dispatch system…', true);
      fetch(INTAKE_API_URL, { method: 'POST', body: fd })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error((data && data.error) || 'intake failed');
          if (data.failed && data.failed.length) {
            setBtn('Received — please email: ' + data.failed.join(', '), false, 12000);
          } else {
            setBtn('Received ✓ We are on it', false, 12000);
            form.reset();
            var big = document.querySelector('.serve-drop .big');
            if (big) big.textContent = 'Drag & Drop Your Documents Here';
            var attach = document.getElementById('attachLabel');
            if (attach) attach.textContent = '⇧ Select documents (PDF)';
          }
        })
        .catch(function () {
          // Relay or ServeManager down: fall back to the email handoff so
          // the request is never lost.
          setBtn(submitDefault, false);
          emailHandoff();
        });
      return;
    }
    if (typeof ORDER_FORM_URL !== 'undefined' && ORDER_FORM_URL) {
      window.open(ORDER_FORM_URL, '_blank', 'noopener');
      return;
    }
    emailHandoff();
  });
})();

// Scroll reveal — the About page personality, site-wide. Elements get .rv
// only when JS runs, so content is always visible without it.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('.svc-card,.ab-commit-row,.qa,.step,.ab-panel,.split-card,.related-card,.stat-tile,.ab-portal,.ab-map-panel,.faq details,.ab-doc,.ab-sms,.ab-timeline,.ab-daybar,.ab-locate,.ab-log,.ab-seal-card,.ab-evidence');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('rv-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  els.forEach(function (el, i) {
    el.classList.add('rv');
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });
})();
