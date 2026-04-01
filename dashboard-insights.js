/**
 * Personalized insights under Trends & Insights: uses profile, goals, mealPresets,
 * profile notes, and recent logged meals (names + macros). General wellness ideas only.
 */
(function () {
  'use strict';

  var LOOKBACK_DAYS = 14;
  var MIN_MEALS_FOR_INSIGHTS = 3;

  var CHAIN_HINTS = [
    { keys: ['chick-fil', 'chick fil', 'chickfila', 'cfa '], label: 'Chick-fil-A-style' },
    { keys: ['mcdonald', "mcdonald's", ' big mac', 'mcnugget'], label: 'McDonalds-style' },
    { keys: ['burger king', 'whopper'], label: 'Burger King-style' },
    { keys: ['wendy', "wendy's"], label: 'Wendys-style' },
    { keys: ['taco bell'], label: 'Taco Bell-style' },
    { keys: ['kfc', 'kentucky fried'], label: 'KFC-style' },
    { keys: ['popeyes', "popeye's"], label: 'Popeyes-style' },
    { keys: ['five guys'], label: 'Five Guys-style' },
    { keys: ['in-n-out', 'in n out'], label: 'In-N-Out-style' },
    { keys: ['subway '], label: 'Subway-style' },
    { keys: ['chipotle'], label: 'Chipotle-style' },
    { keys: ['panera'], label: 'Panera-style' },
    { keys: ['starbucks', 'frapp'], label: 'coffee-shop treats' },
    { keys: ['domino', 'pizza hut', 'papa john', 'little caesars'], label: 'pizza takeout' },
    { keys: ['sonic '], label: 'Sonic-style' },
    { keys: ['arbys', "arby's"], label: 'Arbys-style' },
    { keys: ['dairy queen', ' dq '], label: 'DQ-style' },
    { keys: ['shake shack'], label: 'Shake Shack-style' },
    { keys: ['raising cane', 'canes '], label: 'Raising Canes-style' },
    { keys: ['zaxby'], label: 'Zaxbys-style' },
    { keys: ['fried chicken', 'chicken tenders', 'chicken sandwich'], label: 'fried chicken / sandwich' },
    { keys: ['fast food', 'drive-thru', 'drive thru'], label: 'fast food' }
  ];

  function parseMealDate(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function mealsInLookback(meals, days) {
    var cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    return (meals || []).filter(function (m) {
      var d = parseMealDate(m.date);
      return d && d >= cutoff;
    });
  }

  function aggregateByDay(meals) {
    var by = {};
    meals.forEach(function (m) {
      var key = m.date;
      if (!by[key]) {
        by[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, names: [] };
      }
      by[key].calories += m.calories || 0;
      by[key].protein += m.protein || 0;
      by[key].carbs += m.carbs || 0;
      by[key].fat += m.fat || 0;
      by[key].sugar += m.sugar || 0;
      by[key].veggies += m.veggies || 0;
      if (m.name) by[key].names.push(m.name);
    });
    return by;
  }

  function avgDailyFromByDay(by, field) {
    var days = Object.keys(by);
    if (!days.length) return 0;
    var sum = 0;
    days.forEach(function (d) {
      sum += by[d][field] || 0;
    });
    return sum / days.length;
  }

  function detectChainLabels(meals) {
    var found = {};
    meals.forEach(function (m) {
      if (!m.name) return;
      var low = m.name.toLowerCase();
      CHAIN_HINTS.forEach(function (h) {
        for (var i = 0; i < h.keys.length; i++) {
          if (low.indexOf(h.keys[i]) !== -1) {
            found[h.label] = true;
            return;
          }
        }
      });
    });
    return Object.keys(found);
  }

  function countChainMatches(meals) {
    var n = 0;
    meals.forEach(function (m) {
      if (!m.name) return;
      var low = m.name.toLowerCase();
      var hit = false;
      CHAIN_HINTS.forEach(function (h) {
        if (hit) return;
        for (var i = 0; i < h.keys.length; i++) {
          if (low.indexOf(h.keys[i]) !== -1) {
            hit = true;
            return;
          }
        }
      });
      if (hit) n++;
    });
    return n;
  }

  function allPresetNames(u) {
    var out = [];
    if (!u.mealPresets) return out;
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function (t) {
      (u.mealPresets[t] || []).forEach(function (p) {
        if (p && p.name && String(p.name).trim()) out.push(String(p.name).trim());
      });
    });
    return out;
  }

  function presetOverlapSummary(recentMeals, presets) {
    if (!presets.length) return null;
    var lowPresets = presets.map(function (p) {
      return p.toLowerCase();
    });
    var hits = {};
    recentMeals.forEach(function (m) {
      if (!m.name) return;
      var mn = m.name.toLowerCase();
      lowPresets.forEach(function (pn) {
        if (pn.length < 3) return;
        if (mn.indexOf(pn) !== -1 || pn.indexOf(mn) !== -1) {
          hits[m.name] = true;
        }
      });
    });
    var keys = Object.keys(hits);
    if (!keys.length) return null;
    if (keys.length <= 2) return keys.join(' and ');
    return keys.length + ' of your usual meals';
  }

  function scanNotes(notes) {
    var n = (notes || '').toLowerCase();
    return {
      vegetarian: /vegetarian|vegan|plant[- ]based|no meat/.test(n),
      keto: /\bketo\b|low[- ]carb|atkins/.test(n),
      busy: /\bbusy\b|rush|no time|work travel/.test(n),
      allergy: /allerg|intoler|celiac|gluten/.test(n)
    };
  }

  function eatingPatternCopy(pattern) {
    if (pattern === 'often_takeout') {
      return 'You told us you often eat takeout or restaurant meals—small swaps there move the needle fastest.';
    }
    if (pattern === 'mostly_home') {
      return 'You cook mostly at home—batch-cooking proteins and veggies makes hitting your targets easier.';
    }
    if (pattern === 'mixed') {
      return 'With a mix of home meals and dining out, planning one “anchor” healthy meal per day keeps averages steadier.';
    }
    if (pattern === 'night_shift') {
      return 'You noted night-shift or late-hour eating—pack a simple meal before work and keep a protein-rich snack handy so tired cravings don’t dominate your log.';
    }
    if (pattern === 'athlete') {
      return 'You marked higher activity—spread protein across meals and treat your Goals as a baseline; add most extra calories on heavier training days, not every rest day.';
    }
    return 'Add how you usually eat on Profile so tips can match your routine.';
  }

  function getTargets(u) {
    var mg = u.macroGoals || {};
    var cal = u.goal && u.goal.target ? u.goal.target : 2000;
    return {
      calories: cal,
      goalType: (u.goal && u.goal.type) || 'maintain',
      protein: mg.proteinTarget != null ? mg.proteinTarget : 150,
      carbs: mg.carbsTarget != null ? mg.carbsTarget : 200,
      fat: mg.fatTarget != null ? mg.fatTarget : 70,
      sugar: mg.sugarTarget != null ? mg.sugarTarget : 50,
      veggies: mg.veggiesTarget != null ? mg.veggiesTarget : 5
    };
  }

  function clearEl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function appendP(el, text) {
    var p = document.createElement('p');
    p.textContent = text;
    el.appendChild(p);
  }

  window.refreshCaloriEatDashboardInsights = function () {
    var wrap = document.getElementById('dashboardPersonalInsights');
    var summaryEl = document.getElementById('dashboardInsightsSummary');
    var listEl = document.getElementById('dashboardInsightsTips');
    if (!wrap || !summaryEl || !listEl) return;

    var userKey = localStorage.getItem('currentUser');
    var profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
    var u = userKey ? profiles[userKey] : null;

    clearEl(summaryEl);
    clearEl(listEl);

    if (!u) {
      appendP(summaryEl, 'Sign in to see insights based on your profile and logs.');
      return;
    }

    var meals = u.meals || [];
    var recent = mealsInLookback(meals, LOOKBACK_DAYS);
    var t = getTargets(u);
    var notesFlags = scanNotes(u.profileNotes);
    var pattern = u.eatingPattern || '';
    var firstName = (u.displayName || u.username || 'there').split(/\s+/)[0];

    if (recent.length < MIN_MEALS_FOR_INSIGHTS) {
      appendP(
        summaryEl,
        'Hi ' +
          firstName +
          ' — log at least ' +
          MIN_MEALS_FOR_INSIGHTS +
          ' meals over the last couple of weeks to unlock tailored insights. Your goals and Profile (eating habits + notes) will shape suggestions once there’s enough data.'
      );
      var li0 = document.createElement('li');
      li0.textContent = eatingPatternCopy(pattern);
      listEl.appendChild(li0);
      return;
    }

    var byDay = aggregateByDay(recent);
    var dayCount = Object.keys(byDay).length || 1;
    var avgCal = avgDailyFromByDay(byDay, 'calories');
    var avgFat = avgDailyFromByDay(byDay, 'fat');
    var avgSugar = avgDailyFromByDay(byDay, 'sugar');
    var avgProtein = avgDailyFromByDay(byDay, 'protein');
    var avgVeg = avgDailyFromByDay(byDay, 'veggies');

    var chainLabels = detectChainLabels(recent);
    var chainMealCount = countChainMatches(recent);
    var presets = allPresetNames(u);
    var overlap = presetOverlapSummary(recent, presets);

    var fatHigh = t.fat > 0 && avgFat > t.fat * 1.12;
    var sugarHigh = t.sugar > 0 && avgSugar > t.sugar * 1.15;
    var proteinLow = t.protein > 0 && avgProtein < t.protein * 0.82;
    var vegLow = t.veggies > 0 && avgVeg < t.veggies * 0.65;
    var calHigh = avgCal > t.calories * 1.08;
    var calLow = avgCal < t.calories * 0.88;

    var summaryBits = [];
    summaryBits.push(
      'Hi ' +
        firstName +
        ' — here’s what stands out from your last ~' +
        LOOKBACK_DAYS +
        ' days of logging (' +
        recent.length +
        ' meals across ' +
        dayCount +
        ' day' +
        (dayCount === 1 ? '' : 's') +
        '), compared to the targets on your Goals and the details saved on Profile.'
    );
    if (overlap) {
      summaryBits.push('Several entries align with your saved usual meals (' + overlap + '), so your Profile presets are doing real work in your log.');
    }
    if (chainMealCount >= 2 && chainLabels.length) {
      summaryBits.push(
        'We noticed repeated takeout-style items such as ' +
          chainLabels.slice(0, 3).join(', ') +
          (chainLabels.length > 3 ? ', and similar' : '') +
          '. Pairing those with a lean protein + vegetable side often balances fat and calories without giving up convenience.'
      );
    } else if (fatHigh || sugarHigh) {
      summaryBits.push(
        'Macros in this window run higher than your targets in a few areas—see the ideas below for swaps that fit how you eat.'
      );
    }

    appendP(summaryEl, summaryBits.join(' '));

    var tips = [];

    if (notesFlags.allergy) {
      tips.push(
        'Your Profile notes mention allergies or intolerances—keep prioritizing safe swaps you already trust; these tips ignore strict elimination needs.'
      );
    }

    tips.push(eatingPatternCopy(pattern));

    if (notesFlags.vegetarian) {
      tips.push(
        'You noted plant-forward eating in Profile—if protein is short of goal, add beans, lentils, Greek yogurt (if you eat dairy), tofu, or a scoop of plant protein to meals.'
      );
    } else if (notesFlags.keto) {
      tips.push(
        'Your notes suggest lower carb—if fat is high while calories are OK for you, check hidden fats in sauces and cheese; if energy dips, revisit protein per meal.'
      );
    }

    if (pattern === 'athlete' && proteinLow) {
      tips.push(
        'With training plus protein under target, aim for 20–30g protein at breakfast and within an hour after hard sessions—save a post-workout preset on Profile for one-tap logging.'
      );
    }

    if (pattern === 'night_shift' && (calHigh || sugarHigh)) {
      tips.push(
        'Shift schedules often stack calories and sugar late—try moving one snack earlier in your waking “day” and keep logging so the pattern shows clearly on your charts.'
      );
    }

    if (chainMealCount >= 3 || (pattern === 'often_takeout' && fatHigh)) {
      tips.push(
        'Frequent fried or chain-style entries can push fat past your target. Try grilled options, half portions of fries, or a side salad twice this week and watch the fat line on your macros chart.'
      );
    } else if (fatHigh) {
      tips.push(
        'Average daily fat is above your goal. Trim cooking oil, choose leaner proteins, and watch cheese and creamy dressings—small cuts add up across the week.'
      );
    }

    if (sugarHigh && !notesFlags.keto) {
      tips.push(
        'Sugar is running high versus your target. Shift one sugary drink or dessert per day to unsweetened drinks or fruit, and keep logging so the trend line moves.'
      );
    }

    if (proteinLow && (t.goalType === 'lose' || t.goalType === 'gain')) {
      tips.push(
        'Protein is under your daily target while your goal is to ' +
          (t.goalType === 'lose' ? 'lose' : 'gain') +
          ' weight—front-load protein at breakfast and lunch so you’re not chasing it at dinner.'
      );
    } else if (proteinLow) {
      tips.push('Protein is below your target on average—add an egg, yogurt, or a palm-sized lean meat to one meal a day.');
    }

    if (vegLow && !notesFlags.vegetarian) {
      tips.push(
        'Vegetable servings are below your target. Add one cup of something easy (frozen mixed veg, bagged salad, tomato on a sandwich) with two meals this week.'
      );
    } else if (vegLow) {
      tips.push('Even on a plant-based log, cup-equivalents look low—pile greens or roasted veg onto grains or wraps to hit your veggie ring.');
    }

    if (t.goalType === 'lose' && calHigh) {
      tips.push(
        'Calories are averaging above your weight-loss budget. Use your usual meals on Profile to pre-log a lighter template (same food, smaller portion) before the week starts.'
      );
    } else if (t.goalType === 'gain' && calLow) {
      tips.push(
        'Calories sit under your surplus goal—add a planned snack (nuts, peanut butter toast, or a preset from Profile) on training or busy days.'
      );
    } else if (t.goalType === 'maintain' && (calHigh || calLow)) {
      tips.push(
        'For maintenance, your average calories are ' +
          (calHigh ? 'a bit above' : 'a bit below') +
          ' target—nudge portions slightly over a week and re-check the dashboard.'
      );
    }

    if (notesFlags.busy) {
      tips.push(
        'You mentioned a busy schedule in Profile—keep using saved usual meals and quick logs so insights stay accurate; batch one “default lunch” preset to cut decision fatigue.'
      );
    }

    var seen = {};
    tips.forEach(function (text) {
      if (!text || seen[text]) return;
      seen[text] = true;
      var li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });

    var maxItems = 7;
    while (listEl.children.length > maxItems) {
      listEl.removeChild(listEl.lastChild);
    }
  };
})();
