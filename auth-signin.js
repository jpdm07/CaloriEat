/**
 * Sign-in page only: local login, guest, and links to sign-up on index.
 */
(function () {
  function goTracker() {
    window.location.href = 'index.html?page=dashboard';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var profiles = JSON.parse(localStorage.getItem('profiles')) || {};

    var loginBtn = document.getElementById('loginBtn');
    var guestBtn = document.getElementById('guestBtn');
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var errorPopup = document.getElementById('errorPopup');
    var signUpLink = document.getElementById('signUpLink');
    var forgotLink = document.getElementById('forgotLink');
    var resetPopup = document.getElementById('resetPopup');
    var closeResetPopup = document.getElementById('closeResetPopup');
    var resetLink = document.getElementById('resetLink');

    if (usernameInput && passwordInput && loginBtn) {
      usernameInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          passwordInput.focus();
        }
      });
      passwordInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          loginBtn.click();
        }
      });
    }

    if (loginBtn && usernameInput && passwordInput) {
      loginBtn.addEventListener('click', function () {
        var username = usernameInput.value.trim();
        var pwd = passwordInput.value;

        if (profiles[username] && profiles[username].password === pwd) {
          localStorage.setItem('currentUser', username);
          goTracker();
          return;
        }

        if (errorPopup) {
          errorPopup.style.display = 'block';
          setTimeout(function () {
            errorPopup.style.display = 'none';
          }, 2500);
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener('click', function () {
        if (typeof window.ensureCaloriEatGuestProfile !== 'function' || typeof window.CALORIEAT_GUEST_KEY === 'undefined') {
          return;
        }
        profiles = JSON.parse(localStorage.getItem('profiles')) || {};
        profiles = window.ensureCaloriEatGuestProfile(profiles);
        localStorage.setItem('profiles', JSON.stringify(profiles));
        localStorage.setItem('currentUser', window.CALORIEAT_GUEST_KEY);
        window.location.href = 'index.html?guest=1';
      });
    }

    if (signUpLink) {
      signUpLink.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'index.html?signup=1';
      });
    }

    if (forgotLink && resetPopup) {
      forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        resetPopup.classList.remove('hidden');
        resetPopup.style.display = 'block';
      });
    }

    if (closeResetPopup && resetPopup) {
      closeResetPopup.addEventListener('click', function () {
        resetPopup.classList.add('hidden');
        resetPopup.style.display = 'none';
      });
    }

    if (resetLink) {
      resetLink.addEventListener('click', function (e) {
        e.preventDefault();
        alert(
          'CaloriEat stores accounts only in your browser. Use “Create an account” with a new username, or “Continue as guest.” There is no server-side password reset in this version.'
        );
      });
    }
  });
})();
