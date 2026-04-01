/**
 * Standalone profile editor: personal fields + usual meals per slot (localStorage).
 */
(function () {
  'use strict';

  function todayStr() {
    return new Date().toLocaleDateString();
  }

  function parseHeightFtIn(raw) {
    if (!raw) return null;
    var txt = raw.toLowerCase().trim();
    txt = txt.replace(/feet|ft/g, "'");
    txt = txt.replace(/inches|inch|in/g, '"');
    txt = txt.replace(/\s+/g, ' ');

    var mA = txt.match(/^(\d+)'[\s]?(\d+)"?$/);
    var mB = txt.match(/^(\d+)'$/);
    var mC = txt.match(/^(\d+)\s+(\d+)$/);
    var mD = txt.match(/^(\d+)$/);

    if (mA) {
      var feetA = +mA[1];
      var inchesA = +mA[2];
      return { feet: feetA, inches: inchesA, totalInches: feetA * 12 + inchesA };
    }
    if (mB) {
      var feetB = +mB[1];
      return { feet: feetB, inches: 0, totalInches: feetB * 12 };
    }
    if (mC) {
      var feetC = +mC[1];
      var inchesC = +mC[2];
      return { feet: feetC, inches: inchesC, totalInches: feetC * 12 + inchesC };
    }
    if (mD) {
      var totalInches = +mD[1];
      return {
        feet: Math.floor(totalInches / 12),
        inches: totalInches % 12,
        totalInches: totalInches,
      };
    }
    return null;
  }

  function formatHeightDisplay(hObj) {
    if (!hObj) return '';
    return hObj.feet + "'" + hObj.inches + '"';
  }

  function addPresetRow(container, type, preset) {
    preset = preset || {};
    var row = document.createElement('div');
    row.className = 'meal-preset-row';
    row.setAttribute('data-meal-type', type);
    row.innerHTML =
      '<div class="meal-preset-row__fields">' +
      '<div class="ce-field meal-preset-row__name">' +
      '<label class="meal-preset-row__label">Name</label>' +
      '<input type="text" class="preset-in-name" placeholder="e.g. Oatmeal & berries" autocomplete="off">' +
      '</div>' +
      '<div class="meal-preset-row__nums">' +
      '<div class="ce-field"><label class="meal-preset-row__label">kcal</label><input type="number" class="preset-in-cal" min="0" step="1" placeholder="0"></div>' +
      '<div class="ce-field"><label class="meal-preset-row__label">P</label><input type="number" class="preset-in-p" min="0" step="0.1" placeholder="g"></div>' +
      '<div class="ce-field"><label class="meal-preset-row__label">C</label><input type="number" class="preset-in-c" min="0" step="0.1" placeholder="g"></div>' +
      '<div class="ce-field"><label class="meal-preset-row__label">F</label><input type="number" class="preset-in-f" min="0" step="0.1" placeholder="g"></div>' +
      '<div class="ce-field"><label class="meal-preset-row__label">Sugar</label><input type="number" class="preset-in-sugar" min="0" step="0.1" placeholder="g"></div>' +
      '<div class="ce-field"><label class="meal-preset-row__label">Veg</label><input type="number" class="preset-in-veg" min="0" step="0.1" placeholder="cups"></div>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="btn-remove-preset small-btn">Remove</button>';

    row.querySelector('.preset-in-name').value = preset.name || '';
    row.querySelector('.preset-in-cal').value =
      preset.calories != null && preset.calories !== '' ? preset.calories : '';
    row.querySelector('.preset-in-p').value =
      preset.protein != null && preset.protein !== '' ? preset.protein : '';
    row.querySelector('.preset-in-c').value =
      preset.carbs != null && preset.carbs !== '' ? preset.carbs : '';
    row.querySelector('.preset-in-f').value = preset.fat != null && preset.fat !== '' ? preset.fat : '';
    row.querySelector('.preset-in-sugar').value =
      preset.sugar != null && preset.sugar !== '' ? preset.sugar : '';
    row.querySelector('.preset-in-veg').value =
      preset.veggies != null && preset.veggies !== '' ? preset.veggies : '';

    row.querySelector('.btn-remove-preset').addEventListener('click', function () {
      row.remove();
    });

    container.appendChild(row);
  }

  function collectPresetsFromDom(type) {
    var container = document.getElementById('preset-rows-' + type);
    if (!container) return [];
    var out = [];
    container.querySelectorAll('.meal-preset-row').forEach(function (row) {
      var name = row.querySelector('.preset-in-name').value.trim();
      if (!name) return;
      var cal = row.querySelector('.preset-in-cal').value.trim();
      var calNum = parseFloat(cal, 10);
      if (isNaN(calNum) || calNum <= 0) return;
      out.push({
        name: name,
        calories: calNum,
        protein: parseFloat(row.querySelector('.preset-in-p').value, 10) || 0,
        carbs: parseFloat(row.querySelector('.preset-in-c').value, 10) || 0,
        fat: parseFloat(row.querySelector('.preset-in-f').value, 10) || 0,
        sugar: parseFloat(row.querySelector('.preset-in-sugar').value, 10) || 0,
        veggies: parseFloat(row.querySelector('.preset-in-veg').value, 10) || 0,
      });
    });
    return out;
  }

  function renderAllPresetRows(u) {
    window.CaloriEatMealPresets.ensureShape(u);
    window.CaloriEatMealPresets.MEAL_TYPES.forEach(function (type) {
      var container = document.getElementById('preset-rows-' + type);
      if (!container) return;
      container.innerHTML = '';
      var list = u.mealPresets[type] || [];
      if (list.length === 0) {
        addPresetRow(container, type, {});
      } else {
        list.forEach(function (p) {
          addPresetRow(container, type, p);
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var statusEl = document.getElementById('profileStatus');
    var usernameRo = document.getElementById('profileUsernameRo');

    var currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      window.location.href = 'sign-in.html';
      return;
    }

    var profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
    var u = profiles[currentUser];
    if (!u) {
      window.location.href = 'sign-in.html';
      return;
    }

    window.CaloriEatMealPresets.ensureShape(u);

    if (usernameRo) usernameRo.textContent = currentUser;

    var acctDisplayName = document.getElementById('acctDisplayName');
    var acctEmail = document.getElementById('acctEmail');
    var acctPhone = document.getElementById('acctPhone');
    var acctNotes = document.getElementById('acctNotes');
    var acctBirthdate = document.getElementById('acctBirthdate');
    var acctHeight = document.getElementById('acctHeightFtIn');
    var acctWeight = document.getElementById('acctWeightLbs');
    var acctGender = document.getElementById('acctGender');
    var acctEatingPattern = document.getElementById('acctEatingPattern');

    if (acctDisplayName) acctDisplayName.value = u.displayName || u.username || '';
    if (acctEmail) acctEmail.value = u.email || '';
    if (acctPhone) acctPhone.value = u.contactPhone || '';
    if (acctNotes) acctNotes.value = u.profileNotes || '';
    if (acctBirthdate) acctBirthdate.value = u.birthdate || '';
    if (acctHeight) acctHeight.value = u.height ? formatHeightDisplay(u.height) : '';
    if (acctWeight)
      acctWeight.value =
        u.weightLbs !== undefined && u.weightLbs !== null ? String(u.weightLbs) : '';
    if (acctGender) acctGender.value = u.gender || 'male';
    if (acctEatingPattern) acctEatingPattern.value = u.eatingPattern || '';

    renderAllPresetRows(u);

    window.CaloriEatMealPresets.MEAL_TYPES.forEach(function (type) {
      var btn = document.querySelector('.add-preset-btn[data-meal-type="' + type + '"]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var container = document.getElementById('preset-rows-' + type);
        if (container) addPresetRow(container, type, {});
      });
    });

    var saveBtn = document.getElementById('saveProfilePageBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
        u = profiles[currentUser];
        if (!u) {
          alert('Session expired. Please sign in again.');
          window.location.href = 'sign-in.html';
          return;
        }

        var newDisplayName = acctDisplayName ? acctDisplayName.value.trim() : '';
        var newEmail = acctEmail ? acctEmail.value.trim() : '';
        var newPhone = acctPhone ? acctPhone.value.trim() : '';
        var newNotes = acctNotes ? acctNotes.value.trim() : '';
        var newBirthdate = acctBirthdate ? acctBirthdate.value.trim() : '';
        var newHeightRaw = acctHeight ? acctHeight.value.trim() : '';
        var newWeight = acctWeight ? acctWeight.value.trim() : '';
        var newGender = acctGender ? acctGender.value : '';

        var updatedHeight = u.height;
        if (newHeightRaw !== '') {
          var parsedHeight = parseHeightFtIn(newHeightRaw);
          if (!parsedHeight) {
            alert("Please enter height like 6'1\", 5 11, or 72 for total inches.");
            return;
          }
          updatedHeight = parsedHeight;
        }

        var updatedWeight = u.weightLbs;
        var newWeighInNeeded = false;
        if (newWeight !== '' && !isNaN(parseFloat(newWeight))) {
          var weightNum = parseFloat(newWeight);
          updatedWeight = weightNum;
          if (u.weightLbs !== weightNum) newWeighInNeeded = true;
        }

        u.displayName = newDisplayName || u.displayName || u.username;
        u.email = newEmail || u.email || '';
        u.contactPhone = newPhone;
        u.profileNotes = newNotes;
        u.birthdate = newBirthdate || u.birthdate || '';
        u.height = updatedHeight;
        u.weightLbs = updatedWeight;
        u.gender = newGender || u.gender;
        if (acctEatingPattern) u.eatingPattern = acctEatingPattern.value || '';

        if (newWeighInNeeded) {
          if (!u.weighIns) u.weighIns = [];
          u.weighIns.push({ date: todayStr(), weightLbs: updatedWeight });
        }

        window.CaloriEatMealPresets.ensureShape(u);
        window.CaloriEatMealPresets.MEAL_TYPES.forEach(function (type) {
          u.mealPresets[type] = collectPresetsFromDom(type);
        });

        localStorage.setItem('profiles', JSON.stringify(profiles));

        try {
          sessionStorage.setItem('ce_calorieat_profiles_dirty', '1');
        } catch (e) {
          /* ignore */
        }

        if (statusEl) {
          statusEl.textContent = 'Saved to this device.';
          statusEl.hidden = false;
          setTimeout(function () {
            statusEl.hidden = true;
          }, 4000);
        } else {
          alert('Profile saved on this device.');
        }
      });
    }

    var clearBtn = document.getElementById('clearLoggedDataBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!confirm('Clear all logged meals and weigh-ins for this profile? Profile settings stay.')) return;
        profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
        u = profiles[currentUser];
        if (!u) return;
        u.meals = [];
        u.weighIns = [];
        localStorage.setItem('profiles', JSON.stringify(profiles));
        try {
          sessionStorage.setItem('ce_calorieat_profiles_dirty', '1');
        } catch (e) {
          /* ignore */
        }
        alert('Meals and weigh-ins cleared.');
      });
    }
  });
})();
