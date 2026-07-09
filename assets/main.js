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
