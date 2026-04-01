/**
 * Shared meal presets (per meal type) stored on each profile in localStorage.
 * Used by profile.html and add-meal.html for quick fill.
 */
(function () {
  'use strict';

  var MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

  function ensureShape(user) {
    if (!user) return;
    if (!user.mealPresets || typeof user.mealPresets !== 'object') user.mealPresets = {};
    MEAL_TYPES.forEach(function (t) {
      if (!Array.isArray(user.mealPresets[t])) user.mealPresets[t] = [];
    });
  }

  function normalizePreset(p) {
    if (!p || typeof p !== 'object') return null;
    var name = String(p.name || '').trim();
    if (!name) return null;
    function num(v) {
      if (v === '' || v == null) return null;
      var n = Number(v);
      return isNaN(n) ? null : n;
    }
    return {
      name: name,
      calories: num(p.calories),
      protein: num(p.protein),
      carbs: num(p.carbs),
      fat: num(p.fat),
      sugar: num(p.sugar),
      veggies: num(p.veggies),
    };
  }

  function fillLogFoodForm(preset) {
    var p = normalizePreset(preset);
    if (!p) return;

    var mealEl = document.getElementById('meal');
    var searchEl = document.getElementById('foodSearchInput');
    if (searchEl) searchEl.value = '';
    var legacySearch = document.getElementById('foodSearch');
    if (legacySearch) legacySearch.value = '';
    if (mealEl) mealEl.value = p.name;

    function setNum(id, v) {
      var el = document.getElementById(id);
      if (!el) return;
      if (v != null && !isNaN(v)) el.value = String(v);
      else el.value = '';
    }
    setNum('calories', p.calories);
    setNum('protein', p.protein);
    setNum('carbs', p.carbs);
    setNum('fat', p.fat);
    setNum('sugar', p.sugar);
    setNum('veggies', p.veggies);

    if (typeof window.updateVeggieGramsForCaloriEat === 'function') {
      window.updateVeggieGramsForCaloriEat();
    } else {
      var veg = document.getElementById('veggies');
      var disp = document.getElementById('veggiesGrams');
      if (veg && disp) {
        var cups = parseFloat(veg.value, 10) || 0;
        disp.textContent = '≈ ' + Math.round(cups * 90) + 'g';
      }
    }

    var displayDiv = document.getElementById('selectedMealDisplay');
    var nameDiv = document.getElementById('selectedMealName');
    if (displayDiv && nameDiv) {
      nameDiv.textContent = p.name;
      displayDiv.classList.add('active');
    }
  }

  window.CaloriEatMealPresets = {
    MEAL_TYPES: MEAL_TYPES,
    ensureShape: ensureShape,
    normalize: normalizePreset,
    fillLogFoodForm: fillLogFoodForm,
  };
})();
