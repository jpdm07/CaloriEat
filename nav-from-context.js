/**
 * Remembers which hamburger / bottom-nav label was clicked and shows a short
 * banner after navigation so page titles (e.g. "Today at a Glance") match the menu.
 */
(function () {
  'use strict';
  var STORAGE_LABEL = 'ce_nav_from_label';
  var STORAGE_TS = 'ce_nav_from_ts';
  var MAX_AGE_MS = 15000;

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function removeBanner() {
    var bar = document.getElementById('ce-nav-from-banner');
    if (bar) bar.remove();
  }

  function tryShowCaloriEatNavFromBanner() {
    var label = sessionStorage.getItem(STORAGE_LABEL);
    var ts = sessionStorage.getItem(STORAGE_TS);
    if (!label || !ts) return;
    var age = Date.now() - Number(ts);
    if (isNaN(age) || age > MAX_AGE_MS || age < 0) {
      sessionStorage.removeItem(STORAGE_LABEL);
      sessionStorage.removeItem(STORAGE_TS);
      return;
    }
    sessionStorage.removeItem(STORAGE_LABEL);
    sessionStorage.removeItem(STORAGE_TS);

    var header = document.querySelector('.site-header');
    if (!header) return;
    removeBanner();
    var bar = document.createElement('div');
    bar.id = 'ce-nav-from-banner';
    bar.className = 'ce-nav-from-banner';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML =
      '<span class="ce-nav-from-banner__inner">You opened <strong class="ce-nav-from-banner__name">' +
      escapeHtml(label) +
      '</strong> from the menu.</span><button type="button" class="ce-nav-from-banner__dismiss" aria-label="Dismiss notice">×</button>';
    header.insertAdjacentElement('afterend', bar);
    var dismiss = bar.querySelector('.ce-nav-from-banner__dismiss');
    if (dismiss) dismiss.addEventListener('click', removeBanner);
    setTimeout(removeBanner, 6500);
  }

  document.addEventListener(
    'click',
    function (e) {
      var a =
        e.target.closest &&
        e.target.closest('#menuDropdown a, #appBottomNav a, #headerCoreNav a');
      if (!a || a.id === 'menuLogout') return;
      var href = a.getAttribute('href');
      if (!href || href.trim() === '#' || href.trim().toLowerCase().indexOf('javascript:') === 0) return;
      var label = a.getAttribute('data-ce-nav-label');
      if (!label) label = a.textContent.replace(/\s+/g, ' ').trim();
      if (!label) return;
      try {
        sessionStorage.setItem(STORAGE_LABEL, label);
        sessionStorage.setItem(STORAGE_TS, String(Date.now()));
      } catch (err) {}
    },
    true
  );

  window.tryShowCaloriEatNavFromBanner = tryShowCaloriEatNavFromBanner;

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('dashboardSection')) return;
    tryShowCaloriEatNavFromBanner();
  });
})();
