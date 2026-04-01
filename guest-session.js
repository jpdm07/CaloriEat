/**
 * CaloriEat guest mode: track without sign-up (localStorage on this browser only).
 * Load this script before app.js or any standalone-*.js file.
 */
(function () {
  window.CALORIEAT_GUEST_KEY = '__calorieat_guest__';

  window.getDefaultGuestProfile = function () {
    return {
      username: window.CALORIEAT_GUEST_KEY,
      displayName: 'Guest',
      email: '',
      contactPhone: '',
      profileNotes: '',
      eatingPattern: '',
      password: '',
      birthdate: '',
      height: null,
      weightLbs: null,
      gender: 'male',
      goal: { type: 'maintain', target: 2000 },
      meals: [],
      weighIns: [],
      macroGoals: {
        proteinTarget: 150,
        carbsTarget: 200,
        fatTarget: 70,
        sugarTarget: 50,
        veggiesTarget: 5
      }
    };
  };

  window.ensureCaloriEatGuestProfile = function (profiles) {
    var k = window.CALORIEAT_GUEST_KEY;
    if (!profiles[k]) profiles[k] = window.getDefaultGuestProfile();
    return profiles;
  };

  /**
   * Use when opening a standalone page with no currentUser: become guest automatically.
   */
  window.bootstrapCaloriEatGuestIfNeeded = function () {
    var profiles = JSON.parse(localStorage.getItem('profiles')) || {};
    profiles = window.ensureCaloriEatGuestProfile(profiles);
    var currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      currentUser = window.CALORIEAT_GUEST_KEY;
      localStorage.setItem('currentUser', currentUser);
    }
    localStorage.setItem('profiles', JSON.stringify(profiles));
    return { currentUser: currentUser, profiles: profiles };
  };

  window.syncCaloriEatNavLabels = function () {
    var lo = document.getElementById('menuLogout');
    if (!lo) return;
    var u = localStorage.getItem('currentUser');
    if (!u) {
      lo.textContent = 'Sign out';
      return;
    }
    lo.textContent = u === window.CALORIEAT_GUEST_KEY ? 'End guest session' : 'Sign out';
  };
})();
