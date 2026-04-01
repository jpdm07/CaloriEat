/**
 * Shared menu + sign-out for pages that do not load app.js (welcome, legal, sign-in, etc.).
 * Hamburger + flyout at all viewport sizes (no inline wrapping nav row).
 */
(function () {
  function syncDropdownLayout() {
    var menuDropdown = document.getElementById('menuDropdown');
    if (!menuDropdown) return;
    if (menuDropdown.style.display !== 'block') {
      menuDropdown.style.display = 'none';
    }
  }

  function syncMenuAuth() {
    var loggedIn = !!localStorage.getItem('currentUser');
    document.querySelectorAll('.menu-auth-only').forEach(function (el) {
      el.style.display = loggedIn ? '' : 'none';
    });
    document.querySelectorAll('.menu-public-only').forEach(function (el) {
      el.style.display = loggedIn ? 'none' : '';
    });
    if (typeof window.syncCaloriEatNavLabels === 'function') {
      window.syncCaloriEatNavLabels();
    }
    syncDropdownLayout();
  }

  function bindMenu() {
    var menuIcon = document.getElementById('menuIcon');
    var menuDropdown = document.getElementById('menuDropdown');
    if (!menuIcon || !menuDropdown) return;

    function setOpen(open) {
      menuDropdown.style.display = open ? 'block' : 'none';
      menuIcon.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    menuIcon.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(menuDropdown.style.display !== 'block');
    });

    menuIcon.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(menuDropdown.style.display !== 'block');
      }
    });

    document.addEventListener('click', function (e) {
      if (menuIcon.contains(e.target) || menuDropdown.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    menuDropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    window.addEventListener('resize', syncDropdownLayout);
  }

  function bindLogout() {
    var lo = document.getElementById('menuLogout');
    if (!lo) return;
    lo.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'welcome.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindLogout();
    syncMenuAuth();
  });
})();
