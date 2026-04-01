/********************************
 * STATE
 ********************************/
let currentUser = localStorage.getItem('currentUser') || null;

let profiles = JSON.parse(localStorage.getItem('profiles')) || {};
let userGoal = { type: 'maintain', target: 2000 };

/** Set from Log Food / Profile so index can reload profiles when user returns (incl. another tab). */
const CE_PROFILES_DIRTY_KEY = 'ce_calorieat_profiles_dirty';

function markCaloriEatProfilesDirty() {
  try {
    sessionStorage.setItem(CE_PROFILES_DIRTY_KEY, '1');
  } catch (e) {
    /* private mode */
  }
}

function reloadProfilesFromStorageIfDirty() {
  try {
    if (sessionStorage.getItem(CE_PROFILES_DIRTY_KEY) === '1') {
      profiles = JSON.parse(localStorage.getItem('profiles')) || {};
      sessionStorage.removeItem(CE_PROFILES_DIRTY_KEY);
      return true;
    }
  } catch (e) {
    /* ignore */
  }
  return false;
}

window.markCaloriEatProfilesDirty = markCaloriEatProfilesDirty;

/** Sage / muted palette — matches premium.css (no bright UI blues) */
const CE_PALETTE = {
  ringProgress: '#5a8f7b',
  ringOver: '#6fa08e',
  protein: '#6b8cae',
  proteinFill: 'rgba(107, 140, 174, 0.16)',
  carbs: '#8aa4a0',
  carbsFill: 'rgba(138, 164, 160, 0.16)',
  fat: '#c4a574',
  fatFill: 'rgba(196, 165, 116, 0.16)',
  sugar: '#b87a6a',
  sugarFill: 'rgba(184, 122, 106, 0.16)',
  caloriesBar: '#5a8f7b',
  caloriesBarHover: '#4a7a68',
  breakfast: '#c9a227',
  breakfastFill: 'rgba(201, 162, 39, 0.14)',
  lunch: '#d4b84a',
  lunchFill: 'rgba(212, 184, 74, 0.14)',
  dinner: '#5a9278',
  dinnerFill: 'rgba(90, 146, 120, 0.14)',
  snack: '#8a7a9a',
  snackFill: 'rgba(138, 122, 154, 0.14)',
  weightLine: '#7a9e92',
  weightFill: 'rgba(122, 158, 146, 0.14)',
  projection: '#c4a574',
  projectionFill: 'rgba(196, 165, 116, 0.08)',
  pieSliceBorder: '#141816',
  tooltipBg: '#1b201e',
  tooltipTitle: '#9ebfb4',
  tooltipBorder: '#3d5248',
};

// Time period state for charts
let categoriesTimePeriod = 'overall';
let macrosTimePeriod = 'overall';
let mealTypeTimePeriod = 'overall';
let categoriesSelectedDate = null;
let macrosSelectedDate = null;
let mealTypeSelectedDate = null;

// Toggle state for chart visibility
let macrosToggleState = {
  protein: true,
  carbs: true,
  fat: true,
  sugar: true
};

let categoriesToggleState = {
  fruits: true,
  veggies: true,
  wholeGrains: true,
  leanProteins: true,
  processedFoods: true,
  sugaryFoods: true
};

let mealTypeToggleState = {
  breakfast: true,
  lunch: true,
  dinner: true,
  snack: true
};

let mealTypeMetric = 'calories';

const foodDB = [
  { name: 'Apple', calories: 95 }, { name: 'Banana', calories: 105 },
  { name: 'Chicken Breast', calories: 165 }, { name: 'Rice (1 cup)', calories: 206 },
  { name: 'Egg', calories: 78 }, { name: 'Burger', calories: 354 },
  { name: 'Salad', calories: 150 }, { name: 'Steak', calories: 679 }
];

// Food Category Database - comprehensive keyword matching
const foodCategories = {
  fruits: [
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
    'blackberry', 'mango', 'pineapple', 'watermelon', 'cantaloupe', 'honeydew',
    'peach', 'pear', 'plum', 'cherry', 'kiwi', 'papaya', 'guava', 'lemon', 'lime',
    'grapefruit', 'tangerine', 'clementine', 'apricot', 'nectarine', 'pomegranate',
    'cranberry', 'fig', 'date', 'raisin', 'prune', 'melon', 'berries', 'fruit'
  ],
  veggies: [
    'broccoli', 'carrot', 'spinach', 'kale', 'lettuce', 'tomato', 'cucumber',
    'pepper', 'onion', 'garlic', 'celery', 'cauliflower', 'cabbage', 'zucchini',
    'squash', 'eggplant', 'asparagus', 'green beans', 'peas', 'corn', 'potato',
    'sweet potato', 'yam', 'beet', 'radish', 'turnip', 'mushroom', 'arugula',
    'chard', 'collard', 'brussels sprout', 'artichoke', 'leek', 'shallot',
    'scallion', 'bok choy', 'salad', 'veggie', 'vegetable', 'greens'
  ],
  wholeGrains: [
    'brown rice', 'quinoa', 'oats', 'oatmeal', 'barley', 'bulgur', 'farro',
    'millet', 'buckwheat', 'whole wheat', 'whole grain', 'wild rice', 'rye',
    'spelt', 'amaranth', 'wheat berry', 'whole wheat bread', 'whole grain bread',
    'whole wheat pasta', 'whole grain cereal', 'granola', 'muesli', 'bran',
    'grain', 'grains', 'wheat', 'multigrain', 'rice cake', 'popcorn'
  ],
  leanProteins: [
    'chicken breast', 'chicken', 'turkey', 'fish', 'salmon', 'tuna', 'cod',
    'tilapia', 'halibut', 'trout', 'sardine', 'anchovy', 'shrimp', 'crab',
    'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'egg white', 'egg',
    'tofu', 'tempeh', 'edamame', 'lentil', 'chickpea', 'black bean', 'kidney bean',
    'pinto bean', 'navy bean', 'white bean', 'beans', 'legume', 'greek yogurt',
    'cottage cheese', 'protein powder', 'protein shake', 'lean beef', 'venison',
    'bison', 'turkey breast', 'lean pork', 'pork loin'
  ],
  processedFoods: [
    'burger', 'pizza', 'hot dog', 'sausage', 'bacon', 'ham', 'deli meat',
    'nugget', 'fried chicken', 'french fries', 'fries', 'chips', 'nachos',
    'taco', 'burrito', 'quesadilla', 'sandwich', 'sub', 'wrap', 'panini',
    'bagel', 'muffin', 'croissant', 'donut', 'doughnut', 'pastry', 'white bread',
    'white rice', 'pasta', 'mac and cheese', 'ramen', 'instant noodle',
    'frozen dinner', 'tv dinner', 'fast food', 'takeout', 'delivery',
    'canned soup', 'boxed', 'packaged', 'processed', 'frozen pizza',
    'corn dog', 'chicken wing', 'rib', 'battered', 'breaded'
  ],
  sugaryFoods: [
    'candy', 'chocolate', 'cookie', 'cake', 'brownie', 'ice cream', 'gelato',
    'sorbet', 'pie', 'tart', 'cupcake', 'frosting', 'icing', 'pudding',
    'jello', 'gummy', 'lollipop', 'caramel', 'fudge', 'truffle', 'bonbon',
    'soda', 'pop', 'cola', 'juice', 'fruit juice', 'sweetened', 'sugar',
    'syrup', 'honey', 'jam', 'jelly', 'preserves', 'sweet', 'dessert',
    'pastry', 'danish', 'cinnamon roll', 'energy drink', 'sports drink',
    'milkshake', 'frappuccino', 'smoothie', 'slushie', 'popsicle',
    'cereal', 'granola bar', 'protein bar', 'candy bar', 'chocolate bar',
    'sugary', 'candies', 'cookies', 'cakes', 'sweets', 'treats', 'confection'
  ]
};

// Function to categorize a meal based on its name
function categorizeMeal(mealName) {
  const name = mealName.toLowerCase();
  
  let bestMatch = { category: 'other', keywordLength: 0 };
  
  // Check each category for keyword matches
  // Priority: longer keywords = more specific matches
  for (const [category, keywords] of Object.entries(foodCategories)) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        // Prefer longer, more specific keywords
        if (keyword.length > bestMatch.keywordLength) {
          bestMatch = { category, keywordLength: keyword.length };
        }
      }
    }
  }
  
  return bestMatch.category;
}

// Function to get category display name
function getCategoryDisplayName(category) {
  const names = {
    fruits: 'Fruits',
    veggies: 'Veggies',
    wholeGrains: 'Whole Grains',
    leanProteins: 'Lean Proteins',
    processedFoods: 'Processed Foods',
    sugaryFoods: 'Sugary Foods',
    other: 'Other'
  };
  return names[category] || 'Other';
}

// Function to get category color
function getCategoryColor(category) {
  const colors = {
    fruits: { border: '#b87a8f', bg: 'rgba(184, 122, 143, 0.14)' },
    veggies: { border: '#5a9278', bg: 'rgba(90, 146, 120, 0.14)' },
    wholeGrains: { border: '#a68f6e', bg: 'rgba(166, 143, 110, 0.14)' },
    leanProteins: { border: '#6b8cae', bg: 'rgba(107, 140, 174, 0.14)' },
    processedFoods: { border: '#b8835a', bg: 'rgba(184, 131, 90, 0.14)' },
    sugaryFoods: { border: '#a85a5a', bg: 'rgba(168, 90, 90, 0.14)' },
    other: { border: '#6b7280', bg: 'rgba(107, 116, 128, 0.1)' }
  };
  return colors[category] || colors.other;
}

/********************************
 * DOM ELEMENTS
 ********************************/
const sections = {
  login: document.getElementById('loginSection'),
  profile: document.getElementById('profileSection'),
  app: document.getElementById('appSection'),
  dashboard: document.getElementById('dashboardSection'),
  help: document.getElementById('helpSection'),
  contact: document.getElementById('contactSection')
};

const menuIcon = document.getElementById('menuIcon');
const menuDropdown = document.getElementById('menuDropdown');

function syncCaloriEatMenuDropdownLayout() {
  if (!menuDropdown) return;
  if (menuDropdown.style.display !== 'block') {
    menuDropdown.style.display = 'none';
  }
}
const menuDashboard = document.getElementById('menuDashboard');
const menuMeals = document.getElementById('menuMeals');
const menuAccount = document.getElementById('menuAccount');
const menuAppHelp = document.getElementById('menuAppHelp');
const menuLogout = document.getElementById('menuLogout');

function isCaloriEatIndexSpa() {
  return !!document.getElementById('dashboardSection');
}

const saveProfileBtn = document.getElementById('saveProfileBtn');
const setupUsername = document.getElementById('setupUsername');
const setupEmail = document.getElementById('setupEmail');
const setupPassword = document.getElementById('setupPassword');
const birthdateSignup = document.getElementById('birthdateSignup');
const heightFtInInput = document.getElementById('heightFtIn');
const weightLbsInput = document.getElementById('weightLbs');
const genderInput = document.getElementById('gender');
const signupErrorBox = document.getElementById('signupError');
const backToLoginLink = document.getElementById('backToLoginLink');

const welcomeMsg = document.getElementById('welcomeMsg');
const goalSelect = document.getElementById('goal');
const targetCaloriesInput = document.getElementById('targetCalories');
const saveGoalBtn = document.getElementById('saveGoalBtn');

const proteinTargetInput = document.getElementById('proteinTarget');
const carbsTargetInput = document.getElementById('carbsTarget');
const fatTargetInput = document.getElementById('fatTarget');
const sugarTargetInput = document.getElementById('sugarTarget');
const veggiesTargetInput = document.getElementById('veggiesTarget');
const saveTargetsBtn = document.getElementById('saveTargetsBtn');

const mealInput = document.getElementById('meal');
const calInput = document.getElementById('calories');
const proteinInput = document.getElementById('protein');
const carbsInput = document.getElementById('carbs');
const fatInput = document.getElementById('fat');
const sugarInput = document.getElementById('sugar');
const veggiesInput = document.getElementById('veggies');
const addMealBtn = document.getElementById('addMealBtn');
const mealList = document.getElementById('mealList');

const totalCalories = document.getElementById('totalCalories');
const remainingCalories = document.getElementById('remainingCalories');
const goalDisplay = document.getElementById('goalDisplay');
const userDisplay = document.getElementById('userDisplay');
const profileDisplay = document.getElementById('profileDisplay');

const weighInLbsInput = document.getElementById('weighInLbs');
const addWeighInBtn = document.getElementById('addWeighInBtn');

const foodSearch = document.getElementById('foodSearch');
const foodResults = document.getElementById('foodResults');

const sendMessageBtn = document.getElementById('sendMessageBtn');

const linkGoals = document.getElementById('linkGoals');
const linkMeals = document.getElementById('linkMeals');
const linkWeighIn = document.getElementById('linkWeighIn');

const ringCaloriesCanvas = document.getElementById('ringCalories');
const ringProteinCanvas = document.getElementById('ringProtein');
const ringCarbsCanvas = document.getElementById('ringCarbs');
const ringFatCanvas = document.getElementById('ringFat');
const ringSugarCanvas = document.getElementById('ringSugar');
const ringVeggiesCanvas = document.getElementById('ringVeggies');

const ringCaloriesText = document.getElementById('ringCaloriesText');
const ringProteinText = document.getElementById('ringProteinText');
const ringCarbsText = document.getElementById('ringCarbsText');
const ringFatText = document.getElementById('ringFatText');
const ringSugarText = document.getElementById('ringSugarText');
const ringVeggiesText = document.getElementById('ringVeggiesText');

/********************************
 * MENU VISIBILITY HELPER - WITH FIX
 ********************************/
function updateMenuVisibility() {
  const loggedIn = !!currentUser;

  const menuDropdownEl = document.getElementById('menuDropdown');
  const appBottomNav = document.getElementById('appBottomNav');

  if (menuDropdownEl) {
    syncCaloriEatMenuDropdownLayout();
  }

  if (appBottomNav) {
    if (loggedIn) {
      appBottomNav.classList.add("is-visible");
      document.body.classList.add("ce-pad-bottom");
    } else {
      appBottomNav.classList.remove("is-visible");
      document.body.classList.remove("ce-pad-bottom");
    }
  }

  document.querySelectorAll('.menu-auth-only').forEach((el) => {
    el.style.display = loggedIn ? '' : 'none';
  });
  document.querySelectorAll('.menu-public-only').forEach((el) => {
    el.style.display = loggedIn ? 'none' : '';
  });

  if (typeof window.syncCaloriEatNavLabels === 'function') {
    window.syncCaloriEatNavLabels();
  }
}

/********************************
 * GENERAL HELPERS
 ********************************/
function showSection(sectionEl) {
  if (sectionEl && sectionEl.id === 'dashboardSection') {
    reloadProfilesFromStorageIfDirty();
  }
  Object.values(sections).forEach(s => {
    if (s) s.classList.add('hidden');
  });
  if (sectionEl) sectionEl.classList.remove('hidden');
  syncCaloriEatMenuDropdownLayout();
  window.scrollTo(0, 0);
  if (typeof window.tryShowCaloriEatNavFromBanner === 'function') {
    window.tryShowCaloriEatNavFromBanner();
  }
  if (
    sectionEl &&
    sectionEl.id === 'dashboardSection' &&
    typeof window.refreshCaloriEatDashboardInsights === 'function'
  ) {
    window.refreshCaloriEatDashboardInsights();
  }
}

window.sections = sections;
window.showSection = showSection;
window.updateMenuVisibility = updateMenuVisibility;
window.renderMeals = renderMeals;
window.renderDashboardRings = renderDashboardRings;
window.renderCharts = renderCharts;
window.showApp = showApp;

function clearProfileSetupFields() {
  if (setupUsername) setupUsername.value = '';
  if (setupEmail) setupEmail.value = '';
  if (setupPassword) setupPassword.value = '';
  if (birthdateSignup) birthdateSignup.value = '';
  if (heightFtInInput) heightFtInInput.value = '';
  if (weightLbsInput) weightLbsInput.value = '';
  if (genderInput) genderInput.selectedIndex = 0;
}

function parseHeightFtIn(raw) {
  if (!raw) return null;
  let txt = raw.toLowerCase().trim();
  txt = txt.replace(/feet|ft/g, "'");
  txt = txt.replace(/inches|inch|in/g, '"');
  txt = txt.replace(/\s+/g, ' ');

  const mA = txt.match(/^(\d+)'[\s]?(\d+)"?$/);
  const mB = txt.match(/^(\d+)'$/);
  const mC = txt.match(/^(\d+)\s+(\d+)$/);
  const mD = txt.match(/^(\d+)$/);

  if (mA) {
    const feet = +mA[1];
    const inches = +mA[2];
    return { feet, inches, totalInches: feet * 12 + inches };
  }
  if (mB) {
    const feet = +mB[1];
    return { feet, inches: 0, totalInches: feet * 12 };
  }
  if (mC) {
    const feet = +mC[1];
    const inches = +mC[2];
    return { feet, inches, totalInches: feet * 12 + inches };
  }
  if (mD) {
    const totalInches = +mD[1];
    return {
      feet: Math.floor(totalInches / 12),
      inches: totalInches % 12,
      totalInches
    };
  }
  return null;
}

function formatHeightDisplay(hObj) {
  if (!hObj) return 'N/A';
  return `${hObj.feet}'${hObj.inches}"`;
}

function todayStr() {
  return new Date().toLocaleDateString();
}

// Helper to convert local date string to YYYY-MM-DD format for date input
function toDateInputValue(dateStr) {
  if (!dateStr) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Parse the local date string (e.g., "11/22/2024")
  const parsed = new Date(dateStr);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Tooltip helper for chart details
function showChartTooltip(event, content) {
  // Remove any existing tooltip
  const existing = document.querySelector('.chart-tooltip');
  if (existing) existing.remove();
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.innerHTML = content;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'chart-tooltip-close';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = () => tooltip.remove();
  tooltip.appendChild(closeBtn);
  
  // Position tooltip
  document.body.appendChild(tooltip);
  
  // Get click position and tooltip dimensions
  const clickX = event.clientX || (event.touches && event.touches[0].clientX) || window.innerWidth / 2;
  const clickY = event.clientY || (event.touches && event.touches[0].clientY) || window.innerHeight / 2;
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Position to the right of click, or left if not enough space
  let left = clickX + 20;
  let top = clickY - tooltipRect.height / 2;
  
  // Adjust if tooltip would go off screen
  if (left + tooltipRect.width > window.innerWidth - 20) {
    left = clickX - tooltipRect.width - 20;
  }
  if (top < 20) top = 20;
  if (top + tooltipRect.height > window.innerHeight - 20) {
    top = window.innerHeight - tooltipRect.height - 20;
  }
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  
  // Close tooltip when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeTooltip(e) {
      if (!tooltip.contains(e.target)) {
        tooltip.remove();
        document.removeEventListener('click', closeTooltip);
      }
    });
  }, 100);
}

/********************************
 * NAV MENU EVENTS
 ********************************/
if (menuIcon && menuDropdown) {
  menuIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menuDropdown.style.display !== 'block';
    menuDropdown.style.display = open ? 'block' : 'none';
    menuIcon.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

document.addEventListener('click', (e) => {
  if (!menuDropdown || !menuIcon) return;
  if (menuIcon.contains(e.target) || menuDropdown.contains(e.target)) return;
  menuDropdown.style.display = 'none';
  menuIcon.setAttribute('aria-expanded', 'false');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuDropdown && menuIcon) {
    menuDropdown.style.display = 'none';
    menuIcon.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('resize', () => {
  syncCaloriEatMenuDropdownLayout();
});

if (menuDashboard) {
  menuDashboard.addEventListener('click', (e) => {
    if (isCaloriEatIndexSpa() && currentUser) {
      e.preventDefault();
      showApp();
    }
    if (menuDropdown) menuDropdown.style.display = 'none';
    if (menuIcon) menuIcon.setAttribute('aria-expanded', 'false');
  });
}

if (menuMeals) {
  menuMeals.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'add-meal.html';
  });
}

function bindHeaderProfileNav(link) {
  if (!link) return;
  link.addEventListener('click', () => {
    if (menuDropdown) menuDropdown.style.display = 'none';
    if (menuIcon) menuIcon.setAttribute('aria-expanded', 'false');
  });
}

bindHeaderProfileNav(menuAccount);
bindHeaderProfileNav(document.getElementById('headerNavProfile'));

if (menuAppHelp) {
  menuAppHelp.addEventListener('click', (e) => {
    if (isCaloriEatIndexSpa() && currentUser) {
      e.preventDefault();
      showSection(sections.help);
    }
    if (menuDropdown) menuDropdown.style.display = 'none';
    if (menuIcon) menuIcon.setAttribute('aria-expanded', 'false');
  });
}

if (menuLogout) {
  menuLogout.addEventListener('click', (e) => {
    e.preventDefault();
    doLogout();
    if (menuDropdown) menuDropdown.style.display = 'none';
    if (menuIcon) menuIcon.setAttribute('aria-expanded', 'false');
  });
}

if (linkGoals) {
  linkGoals.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'set-goals.html';
  });
}

if (linkMeals) {
  linkMeals.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'add-meal.html';
  });
}

if (linkWeighIn) {
  linkWeighIn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'weigh-in.html';
  });
}

/********************************
 * AUTH / SIGNUP / PROFILE
 ********************************/
function doLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  window.location.href = 'welcome.html';
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', () => {
    if (signupErrorBox) {
      signupErrorBox.style.display = 'none';
      signupErrorBox.textContent = '';
    }

    const username = setupUsername.value.trim();
    const email = setupEmail.value.trim();
    const pwd = setupPassword.value.trim();
    const birthdateVal = birthdateSignup.value.trim();
    const heightVal = heightFtInInput.value.trim();
    const weightVal = weightLbsInput.value.trim();
    const genderVal = genderInput ? genderInput.value : "";

    if (!username || !email || !pwd) {
      if (signupErrorBox) {
        signupErrorBox.textContent = 'Please complete username, email, and password.';
        signupErrorBox.style.display = 'block';
      } else {
        alert('Please complete username, email, and password.');
      }
      return;
    }

    if (typeof window.CALORIEAT_GUEST_KEY !== 'undefined' && username === window.CALORIEAT_GUEST_KEY) {
      if (signupErrorBox) {
        signupErrorBox.textContent = 'That username is reserved. Please choose a different one.';
        signupErrorBox.style.display = 'block';
      } else {
        alert('That username is reserved. Please choose a different one.');
      }
      return;
    }

    if (profiles[username]) {
      if (signupErrorBox) {
        signupErrorBox.textContent = 'That username is already taken. Please choose a different one.';
        signupErrorBox.style.display = 'block';
      } else {
        alert('That username is already taken. Please choose a different one.');
      }
      return;
    }

    const parsedHeight = parseHeightFtIn(heightVal);
    if (heightVal && !parsedHeight) {
      if (signupErrorBox) {
        signupErrorBox.textContent = "Please enter height like 6'1\", 5 11, or 62 for 6'2\".";
        signupErrorBox.style.display = 'block';
      } else {
        alert("Please enter height like 6'1\", 5 11, or 62 for 6'2\".");
      }
      return;
    }

    profiles[username] = {
      username,
      displayName: username,
      email,
      password: pwd,
      contactPhone: '',
      profileNotes: '',
      eatingPattern: '',
      birthdate: birthdateVal || "",
      height: parsedHeight,
      weightLbs: weightVal ? parseFloat(weightVal) : null,
      gender: genderVal,
      goal: userGoal,
      meals: [],
      weighIns: weightVal
        ? [{ date: todayStr(), weightLbs: parseFloat(weightVal) }]
        : [],
      macroGoals: {
        proteinTarget: 150,
        carbsTarget: 200,
        fatTarget: 70,
        sugarTarget: 50,
        veggiesTarget: 5
      }
    };

    localStorage.setItem('profiles', JSON.stringify(profiles));
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);

    showApp();
    updateMenuVisibility();
  });
}

/********************************
 * GOALS & TARGETS
 ********************************/
if (saveGoalBtn) {
  saveGoalBtn.addEventListener('click', () => {
    const goalType = goalSelect.value;
    const target = parseInt(targetCaloriesInput.value);

    if (isNaN(target) || target <= 0) {
      alert('Enter valid calorie goal.');
      return;
    }

    userGoal = { type: goalType, target };

    if (currentUser && profiles[currentUser]) {
      profiles[currentUser].goal = userGoal;
      localStorage.setItem('profiles', JSON.stringify(profiles));
      markCaloriEatProfilesDirty();
    }

    alert('Goal saved successfully!');
    renderMeals();
  });
}

if (saveTargetsBtn) {
  saveTargetsBtn.addEventListener('click', () => {
    const pT = parseFloat(proteinTargetInput.value) || 0;
    const cT = parseFloat(carbsTargetInput.value) || 0;
    const fT = parseFloat(fatTargetInput.value) || 0;
    const sT = parseFloat(sugarTargetInput.value) || 0;
    const vT = parseFloat(veggiesTargetInput.value) || 0;

    const u = profiles[currentUser];
    if (!u.macroGoals) u.macroGoals = {};
    u.macroGoals.proteinTarget = pT;
    u.macroGoals.carbsTarget = cT;
    u.macroGoals.fatTarget = fT;
    u.macroGoals.sugarTarget = sT;
    u.macroGoals.veggiesTarget = vT;

    localStorage.setItem('profiles', JSON.stringify(profiles));
    markCaloriEatProfilesDirty();
    alert('Daily targets saved.');
  });
}

function loadTargetsUI() {
  const u = profiles[currentUser];
  if (!u) return;

  if (u.goal && goalSelect && targetCaloriesInput) {
    goalSelect.value = u.goal.type || 'maintain';
    targetCaloriesInput.value = u.goal.target || '';
  }

  if (!u.macroGoals) {
    if (proteinTargetInput) proteinTargetInput.value = '';
    if (carbsTargetInput) carbsTargetInput.value = '';
    if (fatTargetInput) fatTargetInput.value = '';
    if (sugarTargetInput) sugarTargetInput.value = '';
    if (veggiesTargetInput) veggiesTargetInput.value = '';
  } else {
    if (proteinTargetInput) proteinTargetInput.value = u.macroGoals.proteinTarget || '';
    if (carbsTargetInput) carbsTargetInput.value = u.macroGoals.carbsTarget || '';
    if (fatTargetInput) fatTargetInput.value = u.macroGoals.fatTarget || '';
    if (sugarTargetInput) sugarTargetInput.value = u.macroGoals.sugarTarget || '';
    if (veggiesTargetInput) veggiesTargetInput.value = u.macroGoals.veggiesTarget || '';
  }
}

/********************************
 * ADD MEAL + WEIGH IN
 ********************************/
if (addMealBtn) {
  addMealBtn.addEventListener('click', () => {
    const mealName = mealInput.value.trim();
    const mealCalories = parseInt(calInput.value);
    const mealProtein = parseFloat(proteinInput.value) || 0;
    const mealCarbs = parseFloat(carbsInput.value) || 0;
    const mealFat = parseFloat(fatInput.value) || 0;
    const mealSugar = parseFloat(sugarInput.value) || 0;
    const mealVeg = parseFloat(veggiesInput.value) || 0;

    if (!mealName || isNaN(mealCalories)) {
      alert('Please enter valid meal info.');
      return;
    }

    if (!profiles[currentUser]) {
      profiles[currentUser] = {
        username: currentUser,
        displayName: currentUser,
        password: '',
        meals: [],
        goal: userGoal,
        weighIns: [],
        macroGoals: {},
        eatingPattern: '',
        profileNotes: ''
      };
    }

    profiles[currentUser].meals.push({
      name: mealName,
      calories: mealCalories,
      protein: mealProtein,
      carbs: mealCarbs,
      fat: mealFat,
      sugar: mealSugar,
      veggies: mealVeg,
      date: todayStr()
    });

    localStorage.setItem('profiles', JSON.stringify(profiles));
    markCaloriEatProfilesDirty();

    mealInput.value = '';
    calInput.value = '';
    proteinInput.value = '';
    carbsInput.value = '';
    fatInput.value = '';
    sugarInput.value = '';
    veggiesInput.value = '';

    renderMeals();
    alert('Meal added successfully!');
  });
}

if (addWeighInBtn) {
  addWeighInBtn.addEventListener('click', () => {
    const wVal = weighInLbsInput.value.trim();
    if (!wVal || isNaN(parseFloat(wVal))) {
      alert('Enter a valid weight in lbs.');
      return;
    }

    const user = profiles[currentUser];
    if (!user.weighIns) {
      user.weighIns = [];
    }

    user.weighIns.push({
      date: todayStr(),
      weightLbs: parseFloat(wVal)
    });

    user.weightLbs = parseFloat(wVal);

    localStorage.setItem('profiles', JSON.stringify(profiles));
    markCaloriEatProfilesDirty();
    weighInLbsInput.value = '';

    alert('Weight recorded successfully!');
    renderMeals();
  });
}

if (foodSearch) {
  foodSearch.addEventListener('input', () => {
    const query = foodSearch.value.toLowerCase();
    foodResults.innerHTML = '';
    if (query.length === 0) return;

    const results = foodDB.filter(f => f.name.toLowerCase().includes(query));
    results.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ${item.calories} cal`;
      li.style.cursor = 'pointer';
      li.style.fontSize = '0.9rem';
      li.addEventListener('click', () => {
        mealInput.value = item.name;
        calInput.value = item.calories;
        foodResults.innerHTML = '';
      });
      foodResults.appendChild(li);
    });
  });
}

/********************************
 * MEAL LIST: EDIT / DELETE
 ********************************/
function buildMealRow(meal, index) {
  const row = document.createElement('div');
  row.className = 'meal-row';

  const top = document.createElement('div');
  top.className = 'meal-topline';

  const info = document.createElement('div');
  info.className = 'meal-info';
  info.innerHTML = `
    <strong>${meal.name}</strong> - ${meal.calories} cal (${meal.date})<br>
    <span class="meal-macros">
      P:${meal.protein ?? 0}g |
      C:${meal.carbs ?? 0}g |
      F:${meal.fat ?? 0}g |
      Sugar:${meal.sugar ?? 0}g |
      Veg:${meal.veggies ?? 0}
    </span>
  `;

  const actions = document.createElement('div');
  actions.className = 'meal-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'small-btn edit';
  editBtn.textContent = '✏️ Edit';
  editBtn.addEventListener('click', () => {
    showMealEditor(row, meal, index);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'small-btn delete';
  delBtn.textContent = '🗑 Delete';
  delBtn.addEventListener('click', () => {
    deleteMeal(index);
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  top.appendChild(info);
  top.appendChild(actions);

  row.appendChild(top);

  return row;
}

function showMealEditor(row, meal, index) {
  const existing = row.querySelector('.meal-edit-block');
  if (existing) existing.remove();

  const editor = document.createElement('div');
  editor.className = 'meal-edit-block';

  // Convert date string to YYYY-MM-DD format for date input
  const dateValue = toDateInputValue(meal.date);
  
  editor.innerHTML = `
    <div class="inline-grid-2col">
      <div>
        <label>Meal Name</label>
        <input type="text" class="editName" value="${meal.name}">
      </div>
      <div>
        <label>Calories</label>
        <input type="number" class="editCalories" value="${meal.calories}">
      </div>
    </div>

    <div class="inline-grid-2col" style="margin-top:0.5rem;">
      <div>
        <label>Date</label>
        <input type="date" class="editDate" value="${dateValue}">
      </div>
      <div>
        <label>Protein (g)</label>
        <input type="number" class="editProtein" value="${meal.protein ?? 0}">
      </div>
    </div>

    <div class="inline-grid-3col" style="margin-top:0.5rem;">
      <div>
        <label>Carbs (g)</label>
        <input type="number" class="editCarbs" value="${meal.carbs ?? 0}">
      </div>
      <div>
        <label>Fat (g)</label>
        <input type="number" class="editFat" value="${meal.fat ?? 0}">
      </div>
      <div>
        <label>Sugar (g)</label>
        <input type="number" class="editSugar" value="${meal.sugar ?? 0}">
      </div>
    </div>

    <div class="inline-grid-2col" style="margin-top:0.5rem;">
      <div>
        <label>Veggies (servings)</label>
        <input type="number" class="editVeggies" value="${meal.veggies ?? 0}">
      </div>
    </div>

    <div class="inline-flex-end">
      <button class="small-btn save">Save</button>
      <button class="small-btn cancel">Cancel</button>
    </div>
  `;

  const saveBtn = editor.querySelector('.save');
  const cancelBtn = editor.querySelector('.cancel');

  saveBtn.addEventListener('click', () => {
    const newName = editor.querySelector('.editName').value.trim();
    const newCals = parseInt(editor.querySelector('.editCalories').value);
    const newDate = editor.querySelector('.editDate').value;
    const newProtein = parseFloat(editor.querySelector('.editProtein').value) || 0;
    const newCarbs = parseFloat(editor.querySelector('.editCarbs').value) || 0;
    const newFat = parseFloat(editor.querySelector('.editFat').value) || 0;
    const newSugar = parseFloat(editor.querySelector('.editSugar').value) || 0;
    const newVeg = parseFloat(editor.querySelector('.editVeggies').value) || 0;

    if (!newName || isNaN(newCals)) {
      alert('Please enter a valid name and calories.');
      return;
    }

    const user = profiles[currentUser];
    user.meals[index].name = newName;
    user.meals[index].calories = newCals;
    // Fix: Parse date properly to avoid timezone offset issues
    const [year, month, day] = newDate.split('-');
    user.meals[index].date = new Date(year, month - 1, day).toLocaleDateString();
    user.meals[index].protein = newProtein;
    user.meals[index].carbs = newCarbs;
    user.meals[index].fat = newFat;
    user.meals[index].sugar = newSugar;
    user.meals[index].veggies = newVeg;

    localStorage.setItem('profiles', JSON.stringify(profiles));
    markCaloriEatProfilesDirty();
    renderMeals();
  });

  cancelBtn.addEventListener('click', () => {
    editor.remove();
  });

  row.appendChild(editor);
}

function deleteMeal(index) {
  if (!confirm('Delete this meal?')) return;
  const user = profiles[currentUser];
  user.meals.splice(index, 1);
  localStorage.setItem('profiles', JSON.stringify(profiles));
  markCaloriEatProfilesDirty();
  renderMeals();
}

/********************************
 * SUMMARY RENDER
 ********************************/
function renderMeals() {
  const user = profiles[currentUser];
  if (!user) return;

  if (mealList) {
    mealList.innerHTML = '';

    const today = todayStr();
    let total = 0;
    
    // Only count TODAY's meals for the summary
    user.meals.forEach((meal, index) => {
      if (meal.date === today) {
        total += meal.calories;
      }
      const row = buildMealRow(meal, index);
      mealList.appendChild(row);
    });

    if (totalCalories) totalCalories.textContent = `${total.toLocaleString()} kcal`;

    const dailyTarget = (user.goal && user.goal.target) ? user.goal.target : 2000;
    const remaining = dailyTarget - total;

    if (remainingCalories) remainingCalories.textContent = `${remaining.toLocaleString()} kcal`;
    if (goalDisplay) {
      const gtype = (user.goal && user.goal.type) ? user.goal.type : 'maintain';
      const typeLabel = { maintain: 'Maintain', lose: 'Lose', gain: 'Gain' }[gtype] || gtype;
      goalDisplay.textContent = `${typeLabel} · ${dailyTarget.toLocaleString()} kcal`;
    }
  }

  const nameToShow = user.displayName || user.username || currentUser || 'User';
  if (welcomeMsg) {
    welcomeMsg.textContent = `Hi, ${nameToShow}`;
  }
  if (userDisplay) {
    userDisplay.textContent = nameToShow;
  }

  const heightStr = user.height ? formatHeightDisplay(user.height) : '—';
  const weightStr = (user.weightLbs !== undefined && user.weightLbs !== null)
    ? `${user.weightLbs} lb`
    : '—';

  if (profileDisplay) {
    profileDisplay.textContent = `${heightStr} · ${weightStr}`;
  }

  const dashEl = document.getElementById('dashboardSection');
  if (
    dashEl &&
    !dashEl.classList.contains('hidden') &&
    typeof window.refreshCaloriEatDashboardInsights === 'function'
  ) {
    window.refreshCaloriEatDashboardInsights();
  }
}

/********************************
 * DASHBOARD RINGS
 ********************************/
function getDailyTargets(user) {
  const baseCalories = (user.goal && user.goal.target) ? user.goal.target : 2000;
  const mg = user.macroGoals || {};

  return {
    calories: baseCalories,
    protein: mg.proteinTarget || 150,
    carbs: mg.carbsTarget || 200,
    fat: mg.fatTarget || 70,
    sugar: mg.sugarTarget || 50,
    veggies: mg.veggiesTarget || 5
  };
}

function getTodayTotals(user) {
  const today = todayStr();
  let totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
    veggies: 0
  };

  (user.meals || []).forEach(m => {
    if (m.date === today) {
      totals.calories += m.calories || 0;
      totals.protein += m.protein || 0;
      totals.carbs += m.carbs || 0;
      totals.fat += m.fat || 0;
      totals.sugar += m.sugar || 0;
      totals.veggies += m.veggies || 0;
    }
  });

  return totals;
}

function drawRing(canvas, value, goal, unitLabel, labelEl) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const baseRadius = size / 2 - 8;
  const baseWidth = 10;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(center, center, baseRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = baseWidth;
  ctx.stroke();

  const safeGoal = goal > 0 ? goal : 1;
  const pctBase = Math.min(value / safeGoal, 1);
  const pctOver = value > safeGoal
    ? Math.min((value - safeGoal) / safeGoal, 1)
    : 0;

  const startAngle = -Math.PI / 2;
  const blueEndAngle = startAngle + pctBase * 2 * Math.PI;

  ctx.beginPath();
  ctx.arc(center, center, baseRadius, startAngle, blueEndAngle);
  ctx.lineWidth = baseWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = CE_PALETTE.ringProgress;
  ctx.stroke();

  if (pctOver > 0) {
    const greenEndAngle = startAngle + pctOver * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(center, center, baseRadius + 3, startAngle, greenEndAngle);
    ctx.lineWidth = baseWidth - 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = CE_PALETTE.ringOver;
    ctx.stroke();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(unitLabel, center, center);

  if (labelEl) {
    // Round value and goal to 1 decimal place for display
    const displayValue = Math.round(value * 10) / 10;
    const displayGoal = Math.round(goal * 10) / 10;
    labelEl.textContent = `${displayValue} / ${displayGoal}`;
  }
}

function renderDashboardRings() {
  const user = profiles[currentUser];
  if (!user) return;

  const targets = getDailyTargets(user);
  const totals = getTodayTotals(user);

  // Round all values to 1 decimal place for display
  const roundedTotals = {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    sugar: Math.round(totals.sugar * 10) / 10,
    veggies: Math.round(totals.veggies * 10) / 10
  };

  drawRing(ringCaloriesCanvas, roundedTotals.calories, targets.calories, `${roundedTotals.calories}`, ringCaloriesText);
  drawRing(ringProteinCanvas, roundedTotals.protein, targets.protein, `${roundedTotals.protein}g`, ringProteinText);
  drawRing(ringCarbsCanvas, roundedTotals.carbs, targets.carbs, `${roundedTotals.carbs}g`, ringCarbsText);
  drawRing(ringFatCanvas, roundedTotals.fat, targets.fat, `${roundedTotals.fat}g`, ringFatText);
  drawRing(ringSugarCanvas, roundedTotals.sugar, targets.sugar, `${roundedTotals.sugar}g`, ringSugarText);
  drawRing(ringVeggiesCanvas, roundedTotals.veggies, targets.veggies, `${roundedTotals.veggies}`, ringVeggiesText);
  
  // Render average calories
  renderAverageCalories();
}

// Calculate and display average calories per time period
function renderAverageCalories() {
  const avgCaloriesDisplay = document.getElementById('avgCaloriesDisplay');
  const avgCaloriesPeriod = document.getElementById('avgCaloriesPeriod');
  
  if (!avgCaloriesDisplay || !avgCaloriesPeriod) return;
  
  const user = profiles[currentUser];
  if (!user || !user.meals || user.meals.length === 0) {
    avgCaloriesDisplay.innerHTML = '<strong>0 kcal / day</strong> <span class="avg-cal-sub">(no meals yet)</span>';
    return;
  }
  
  const period = avgCaloriesPeriod.value;
  const avgCals = calculateAverageCalories(user.meals, period);
  
  const periodLabels = {
    'day': 'kcal / day',
    'week': 'kcal / week',
    'month': 'kcal / month',
    'year': 'kcal / year'
  };
  
  avgCaloriesDisplay.innerHTML = `<strong>${Math.round(avgCals).toLocaleString()} ${periodLabels[period]}</strong>`;
}

// Calculate average calories based on period
function calculateAverageCalories(meals, period) {
  if (!meals || meals.length === 0) return 0;
  
  // Group meals by date
  const mealsByDate = {};
  meals.forEach(meal => {
    if (!mealsByDate[meal.date]) {
      mealsByDate[meal.date] = 0;
    }
    mealsByDate[meal.date] += meal.calories || 0;
  });
  
  const dates = Object.keys(mealsByDate);
  if (dates.length === 0) return 0;
  
  // Calculate total calories
  const totalCalories = Object.values(mealsByDate).reduce((sum, cal) => sum + cal, 0);
  
  switch (period) {
    case 'day':
      // Average calories per day (only days with meals)
      return totalCalories / dates.length;
      
    case 'week':
      // Average calories per week (only weeks with meals)
      // Group dates by week and count unique weeks
      const weeksSet = new Set();
      dates.forEach(date => {
        const d = new Date(date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
        weeksSet.add(weekStart.toLocaleDateString());
      });
      return totalCalories / weeksSet.size;
      
    case 'month':
      // Average calories per month (only months with meals)
      const monthsSet = new Set();
      dates.forEach(date => {
        const d = new Date(date);
        monthsSet.add(`${d.getFullYear()}-${d.getMonth()}`);
      });
      return totalCalories / monthsSet.size;
      
    case 'year':
      // Average calories per year (only years with meals)
      const yearsSet = new Set();
      dates.forEach(date => {
        const d = new Date(date);
        yearsSet.add(d.getFullYear());
      });
      return totalCalories / yearsSet.size;
      
    default:
      return totalCalories / dates.length;
  }
}

// Setup average calories period selector
function setupAverageCaloriesSelector() {
  const avgCaloriesPeriod = document.getElementById('avgCaloriesPeriod');
  if (avgCaloriesPeriod) {
    avgCaloriesPeriod.addEventListener('change', renderAverageCalories);
  }
}

/********************************
 * PIE CHARTS FUNCTIONS
 ********************************/

// Global variables for pie chart instances
let macrosPieChartInstance = null;
let categoriesPieChartInstance = null;
let mealTypePieChartInstance = null;

// Render Macros Pie Chart
function renderMacrosPieChart() {
  const canvas = document.getElementById('macrosPieChart');
  const periodSelect = document.getElementById('macrosPiePeriod');
  
  if (!canvas || !periodSelect) return;
  
  const user = profiles[currentUser];
  if (!user || !user.meals || user.meals.length === 0) {
    // Show no data message
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#9e9e9e';
    ctx.textAlign = 'center';
    ctx.fillText('No meals logged', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const period = periodSelect.value;
  const averages = calculateMacrosAverages(user.meals, period);
  
  // Prepare data for pie chart
  const labels = ['Protein', 'Carbs', 'Fat', 'Sugar'];
  const data = [averages.protein, averages.carbs, averages.fat, averages.sugar];
  const colors = [CE_PALETTE.protein, CE_PALETTE.carbs, CE_PALETTE.fat, CE_PALETTE.sugar];
  
  // Destroy existing chart if it exists
  if (macrosPieChartInstance) {
    macrosPieChartInstance.destroy();
  }
  
  // Create new chart
  const ctx = canvas.getContext('2d');
  macrosPieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: CE_PALETTE.pieSliceBorder,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#f0f0f0',
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: CE_PALETTE.tooltipBg,
          titleColor: CE_PALETTE.tooltipTitle,
          bodyColor: '#f0f0f0',
          borderColor: CE_PALETTE.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value.toFixed(1)}g (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Render Categories Pie Chart
function renderCategoriesPieChart() {
  const canvas = document.getElementById('categoriesPieChart');
  const periodSelect = document.getElementById('categoriesPiePeriod');
  
  if (!canvas || !periodSelect) return;
  
  const user = profiles[currentUser];
  if (!user || !user.meals || user.meals.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#9e9e9e';
    ctx.textAlign = 'center';
    ctx.fillText('No meals logged', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const period = periodSelect.value;
  const averages = calculateCategoriesAverages(user.meals, period);
  
  // Prepare data for pie chart
  const labels = ['Veggies', 'Fruits', 'Whole Grains', 'Lean Proteins', 'Processed Foods', 'Sugary Foods'];
  const data = [
    averages.veggies,
    averages.fruits,
    averages.wholeGrains,
    averages.leanProteins,
    averages.processedFoods,
    averages.sugaryFoods
  ];
  const colors = ['#5a9278', '#b87a8f', '#a68f6e', '#6b8cae', '#b8835a', '#a85a5a'];
  
  // Destroy existing chart
  if (categoriesPieChartInstance) {
    categoriesPieChartInstance.destroy();
  }
  
  // Create new chart
  const ctx = canvas.getContext('2d');
  categoriesPieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: CE_PALETTE.pieSliceBorder,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#f0f0f0',
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: CE_PALETTE.tooltipBg,
          titleColor: CE_PALETTE.tooltipTitle,
          bodyColor: '#f0f0f0',
          borderColor: CE_PALETTE.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const percentage = context.parsed || 0;
              return `${label}: ${percentage.toFixed(1)}% of meals`;
            }
          }
        }
      }
    }
  });
}

// Render Meal Type Pie Chart
function renderMealTypePieChart() {
  const canvas = document.getElementById('mealTypePieChart');
  const periodSelect = document.getElementById('mealTypePiePeriod');
  
  if (!canvas || !periodSelect) return;
  
  const user = profiles[currentUser];
  if (!user || !user.meals || user.meals.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#9e9e9e';
    ctx.textAlign = 'center';
    ctx.fillText('No meals logged', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const period = periodSelect.value;
  const averages = calculateMealTypeAverages(user.meals, period);
  
  // Prepare data for pie chart
  const labels = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const data = [averages.breakfast, averages.lunch, averages.dinner, averages.snack];
  const colors = [CE_PALETTE.breakfast, CE_PALETTE.lunch, CE_PALETTE.dinner, CE_PALETTE.snack];
  
  // Destroy existing chart
  if (mealTypePieChartInstance) {
    mealTypePieChartInstance.destroy();
  }
  
  // Create new chart
  const ctx = canvas.getContext('2d');
  mealTypePieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: CE_PALETTE.pieSliceBorder,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#f0f0f0',
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: CE_PALETTE.tooltipBg,
          titleColor: CE_PALETTE.tooltipTitle,
          bodyColor: '#f0f0f0',
          borderColor: CE_PALETTE.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value.toFixed(0)} cal (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Calculate macros averages
function calculateMacrosAverages(meals, period) {
  const mealsByPeriod = groupMealsByPeriod(meals, period);
  const periods = Object.keys(mealsByPeriod);
  
  if (periods.length === 0) {
    return { protein: 0, carbs: 0, fat: 0, sugar: 0 };
  }
  
  let totalProtein = 0, totalCarbs = 0, totalFat = 0, totalSugar = 0;
  
  periods.forEach(periodKey => {
    const periodMeals = mealsByPeriod[periodKey];
    periodMeals.forEach(meal => {
      totalProtein += meal.protein || 0;
      totalCarbs += meal.carbs || 0;
      totalFat += meal.fat || 0;
      totalSugar += meal.sugar || 0;
    });
  });
  
  const numPeriods = periods.length;
  
  return {
    protein: totalProtein / numPeriods,
    carbs: totalCarbs / numPeriods,
    fat: totalFat / numPeriods,
    sugar: totalSugar / numPeriods
  };
}

// Calculate categories averages
function calculateCategoriesAverages(meals, period) {
  if (!meals || meals.length === 0) {
    return { veggies: 0, fruits: 0, wholeGrains: 0, leanProteins: 0, processedFoods: 0, sugaryFoods: 0 };
  }
  
  // Count total meals in each category (across all meals, not grouped by period)
  let totalVeggies = 0, totalFruits = 0, totalGrains = 0, totalProteins = 0, totalProcessed = 0, totalSugary = 0;
  
  meals.forEach(meal => {
    const category = categorizeMeal(meal.name);
    if (category === 'veggies') totalVeggies++;
    else if (category === 'fruits') totalFruits++;
    else if (category === 'wholeGrains') totalGrains++;
    else if (category === 'leanProteins') totalProteins++;
    else if (category === 'processedFoods') totalProcessed++;
    else if (category === 'sugaryFoods') totalSugary++;
  });
  
  const totalMeals = meals.length;
  
  // Return percentages of total meals
  return {
    veggies: totalMeals > 0 ? (totalVeggies / totalMeals) * 100 : 0,
    fruits: totalMeals > 0 ? (totalFruits / totalMeals) * 100 : 0,
    wholeGrains: totalMeals > 0 ? (totalGrains / totalMeals) * 100 : 0,
    leanProteins: totalMeals > 0 ? (totalProteins / totalMeals) * 100 : 0,
    processedFoods: totalMeals > 0 ? (totalProcessed / totalMeals) * 100 : 0,
    sugaryFoods: totalMeals > 0 ? (totalSugary / totalMeals) * 100 : 0
  };
}

// Calculate meal type averages
function calculateMealTypeAverages(meals, period) {
  const mealsByPeriod = groupMealsByPeriod(meals, period);
  const periods = Object.keys(mealsByPeriod);
  
  if (periods.length === 0) {
    return { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  }
  
  let totalBreakfast = 0, totalLunch = 0, totalDinner = 0, totalSnack = 0;
  
  periods.forEach(periodKey => {
    const periodMeals = mealsByPeriod[periodKey];
    periodMeals.forEach(meal => {
      const mealType = meal.mealType || 'snack';
      const calories = meal.calories || 0;
      
      if (mealType === 'breakfast') totalBreakfast += calories;
      else if (mealType === 'lunch') totalLunch += calories;
      else if (mealType === 'dinner') totalDinner += calories;
      else totalSnack += calories;
    });
  });
  
  const numPeriods = periods.length;
  
  return {
    breakfast: totalBreakfast / numPeriods,
    lunch: totalLunch / numPeriods,
    dinner: totalDinner / numPeriods,
    snack: totalSnack / numPeriods
  };
}

// Group meals by time period
function groupMealsByPeriod(meals, period) {
  const grouped = {};
  
  meals.forEach(meal => {
    const date = new Date(meal.date);
    let key;
    
    switch (period) {
      case 'day':
        key = meal.date; // Each day is a separate period
        break;
      case 'week':
        // Group by week (Sunday to Saturday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toLocaleDateString();
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = meal.date;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(meal);
  });
  
  return grouped;
}

// Setup pie chart period selectors
function setupPieChartSelectors() {
  const macrosPeriod = document.getElementById('macrosPiePeriod');
  const categoriesPeriod = document.getElementById('categoriesPiePeriod');
  const mealTypePeriod = document.getElementById('mealTypePiePeriod');
  
  if (macrosPeriod) {
    macrosPeriod.addEventListener('change', renderMacrosPieChart);
  }
  
  if (categoriesPeriod) {
    categoriesPeriod.addEventListener('change', renderCategoriesPieChart);
  }
  
  if (mealTypePeriod) {
    mealTypePeriod.addEventListener('change', renderMealTypePieChart);
  }
}

// Render all pie charts
function renderAllPieCharts() {
  renderMacrosPieChart();
  renderCategoriesPieChart();
  renderMealTypePieChart();
}

/********************************
 * TIME PERIOD HELPER FUNCTIONS
 ********************************/
function getWeekDates(centerDate) {
  const date = new Date(centerDate);
  const dayOfWeek = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - dayOfWeek);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d.toLocaleDateString());
  }
  return dates;
}

function getMonthDates(year, month) {
  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    dates.push(date.toLocaleDateString());
  }
  return dates;
}

function getYearMonths(year) {
  const months = [];
  for (let month = 0; month < 12; month++) {
    months.push(new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }
  return months;
}

function getMonthLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function filterMealsByTimePeriod(meals, period, selectedDate) {
  if (!meals || meals.length === 0) return [];
  
  if (period === 'overall') {
    return meals;
  }
  
  if (!selectedDate) {
    selectedDate = new Date();
  } else if (typeof selectedDate === 'string') {
    selectedDate = new Date(selectedDate);
  }
  
  return meals.filter(meal => {
    const mealDate = new Date(meal.date);
    
    switch (period) {
      case 'daily':
        return mealDate.toLocaleDateString() === selectedDate.toLocaleDateString();
        
      case 'weekly':
        const weekDates = getWeekDates(selectedDate);
        return weekDates.includes(mealDate.toLocaleDateString());
        
      case 'monthly':
        return mealDate.getMonth() === selectedDate.getMonth() &&
               mealDate.getFullYear() === selectedDate.getFullYear();
        
      case 'yearly':
        return mealDate.getFullYear() === selectedDate.getFullYear();
        
      default:
        return true;
    }
  });
}

function getDateLabelsForPeriod(meals, period, selectedDate) {
  if (period === 'overall') {
    const dateSet = new Set();
    meals.forEach(meal => dateSet.add(meal.date));
    return Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
  }
  
  if (!selectedDate) {
    selectedDate = new Date();
  } else if (typeof selectedDate === 'string') {
    selectedDate = new Date(selectedDate);
  }
  
  switch (period) {
    case 'weekly':
      // Only return dates from the week that actually have meals
      const weekDates = getWeekDates(selectedDate);
      const mealDatesInWeek = new Set(meals.map(m => m.date));
      return weekDates.filter(date => mealDatesInWeek.has(date));
      
    case 'monthly':
      // Only return dates from the month that actually have meals
      const monthDates = getMonthDates(selectedDate.getFullYear(), selectedDate.getMonth());
      const mealDatesInMonth = new Set(meals.map(m => m.date));
      return monthDates.filter(date => mealDatesInMonth.has(date));
      
    case 'yearly':
      // Only return months that actually have meals
      const allMonths = getYearMonths(selectedDate.getFullYear());
      const mealsGroupedByMonth = {};
      meals.forEach(meal => {
        const monthLabel = getMonthLabel(meal.date);
        mealsGroupedByMonth[monthLabel] = true;
      });
      return allMonths.filter(month => mealsGroupedByMonth[month]);
      
    default:
      const dateSet = new Set();
      meals.forEach(meal => dateSet.add(meal.date));
      return Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
  }
}

function hasMultiplePeriods(meals, period) {
  if (!meals || meals.length === 0) return false;
  
  const dates = meals.map(m => new Date(m.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  switch (period) {
    case 'yearly':
      return maxDate.getFullYear() - minDate.getFullYear() > 0;
      
    case 'monthly':
      const monthDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
                        (maxDate.getMonth() - minDate.getMonth());
      return monthDiff > 0;
      
    case 'weekly':
      const weekDiff = Math.floor((maxDate - minDate) / (7 * 24 * 60 * 60 * 1000));
      return weekDiff > 0;
      
    default:
      return false;
  }
}

function calculateCategoryPercentages(meals, categories) {
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  
  if (totalCalories === 0) {
    const percentages = {};
    categories.forEach(cat => percentages[cat] = 0);
    return percentages;
  }
  
  const percentages = {};
  categories.forEach(cat => {
    const categoryCalories = meals
      .filter(meal => categorizeMeal(meal.name) === cat)
      .reduce((sum, meal) => sum + (meal.calories || 0), 0);
    percentages[cat] = ((categoryCalories / totalCalories) * 100).toFixed(1);
  });
  
  return percentages;
}

function calculateMacroPercentages(meals) {
  const totals = {
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0
  };
  
  meals.forEach(meal => {
    totals.protein += meal.protein || 0;
    totals.carbs += meal.carbs || 0;
    totals.fat += meal.fat || 0;
    totals.sugar += meal.sugar || 0;
  });
  
  const grandTotal = totals.protein + totals.carbs + totals.fat + totals.sugar;
  
  if (grandTotal === 0) {
    return {
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0
    };
  }
  
  return {
    protein: ((totals.protein / grandTotal) * 100).toFixed(1),
    carbs: ((totals.carbs / grandTotal) * 100).toFixed(1),
    fat: ((totals.fat / grandTotal) * 100).toFixed(1),
    sugar: ((totals.sugar / grandTotal) * 100).toFixed(1)
  };
}

function renderCategoriesLegend(meals) {
  const legendEl = document.getElementById('categoriesLegend');
  if (!legendEl) return;
  
  const categories = ['fruits', 'veggies', 'wholeGrains', 'leanProteins', 'processedFoods', 'sugaryFoods'];
  const percentages = calculateCategoryPercentages(meals, categories);
  
  let html = '<div class="legend-title">Diet Composition</div><div class="legend-grid">';
  
  categories.forEach(cat => {
    const displayName = getCategoryDisplayName(cat);
    const color = getCategoryColor(cat).border;
    const percentage = percentages[cat];
    
    html += `
      <div class="legend-item" style="border-left-color: ${color}">
        <div class="legend-item-label">
          <div class="legend-color-box" style="background: ${color}"></div>
          <span>${displayName}</span>
        </div>
        <div class="legend-item-value">${percentage}%</div>
      </div>
    `;
  });
  
  html += '</div>';
  legendEl.innerHTML = html;
}

function renderMacrosLegend(meals) {
  const legendEl = document.getElementById('macrosLegend');
  if (!legendEl) return;
  
  const percentages = calculateMacroPercentages(meals);
  
  const macros = [
    { key: 'protein', label: '💪 Protein', color: CE_PALETTE.protein },
    { key: 'carbs', label: '🍞 Carbs', color: CE_PALETTE.carbs },
    { key: 'fat', label: '🥑 Fat', color: CE_PALETTE.fat },
    { key: 'sugar', label: '🍬 Sugar', color: CE_PALETTE.sugar }
  ];
  
  let html = '<div class="legend-title">Macro Distribution</div><div class="legend-grid">';
  
  macros.forEach(macro => {
    const percentage = percentages[macro.key];
    
    html += `
      <div class="legend-item" style="border-left-color: ${macro.color}">
        <div class="legend-item-label">
          <div class="legend-color-box" style="background: ${macro.color}"></div>
          <span>${macro.label}</span>
        </div>
        <div class="legend-item-value">${percentage}%</div>
      </div>
    `;
  });
  
  html += '</div>';
  legendEl.innerHTML = html;
}

/********************************
 * CHARTS (Chart.js) - CLICK-TO-SHOW VERSION
 ********************************/
let macrosChartInstance = null;
let veggiesChartInstance = null;
let caloriesChartInstance = null;
let weightChartInstance = null;
let mealTypeChartInstance = null;

function renderCharts() {
  const user = profiles[currentUser];
  if (!user) return;

  const allMeals = user.meals || [];
  
  // Prepare data by date
  const dataByDate = {};
  
  allMeals.forEach(meal => {
    if (!dataByDate[meal.date]) {
      dataByDate[meal.date] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        veggies: 0,
        meals: []
      };
    }
    
    dataByDate[meal.date].calories += meal.calories || 0;
    dataByDate[meal.date].protein += meal.protein || 0;
    dataByDate[meal.date].carbs += meal.carbs || 0;
    dataByDate[meal.date].fat += meal.fat || 0;
    dataByDate[meal.date].sugar += meal.sugar || 0;
    dataByDate[meal.date].veggies += meal.veggies || 0;
    dataByDate[meal.date].meals.push(meal);
  });

  const dates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));
  
  // Render calorie and weight charts (these don't use time filtering)
  renderCaloriesChart(dates, dataByDate);
  renderWeightChart(user);
  
  // Prepare data for macros chart with time filtering
  const macrosFilteredMeals = filterMealsByTimePeriod(allMeals, macrosTimePeriod, macrosSelectedDate);
  const macrosLegendMeals = macrosFilteredMeals;
  
  const macrosFilteredDates = getDateLabelsForPeriod(macrosFilteredMeals, macrosTimePeriod, macrosSelectedDate);
  const macrosFilteredDataByDate = {};
  
  // For yearly view, aggregate by month
  if (macrosTimePeriod === 'yearly') {
    macrosFilteredMeals.forEach(meal => {
      const monthLabel = getMonthLabel(meal.date);
      if (!macrosFilteredDataByDate[monthLabel]) {
        macrosFilteredDataByDate[monthLabel] = {
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          meals: [],
          mealsByDate: {},
          counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
        };
      }
      macrosFilteredDataByDate[monthLabel].protein += meal.protein || 0;
      macrosFilteredDataByDate[monthLabel].carbs += meal.carbs || 0;
      macrosFilteredDataByDate[monthLabel].fat += meal.fat || 0;
      macrosFilteredDataByDate[monthLabel].sugar += meal.sugar || 0;
      macrosFilteredDataByDate[monthLabel].meals.push(meal);
      
      // Count items that have each macro
      if ((meal.protein || 0) > 0) macrosFilteredDataByDate[monthLabel].counts.protein++;
      if ((meal.carbs || 0) > 0) macrosFilteredDataByDate[monthLabel].counts.carbs++;
      if ((meal.fat || 0) > 0) macrosFilteredDataByDate[monthLabel].counts.fat++;
      if ((meal.sugar || 0) > 0) macrosFilteredDataByDate[monthLabel].counts.sugar++;
      
      // Track by date for weekly breakdown
      if (!macrosFilteredDataByDate[monthLabel].mealsByDate) {
        macrosFilteredDataByDate[monthLabel].mealsByDate = {};
      }
      if (!macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date]) {
        macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date] = {
          protein: 0, carbs: 0, fat: 0, sugar: 0,
          counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
        };
      }
      macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].protein += meal.protein || 0;
      macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].carbs += meal.carbs || 0;
      macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].fat += meal.fat || 0;
      macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].sugar += meal.sugar || 0;
      
      if ((meal.protein || 0) > 0) macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].counts.protein++;
      if ((meal.carbs || 0) > 0) macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].counts.carbs++;
      if ((meal.fat || 0) > 0) macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].counts.fat++;
      if ((meal.sugar || 0) > 0) macrosFilteredDataByDate[monthLabel].mealsByDate[meal.date].counts.sugar++;
    });
  } else {
    macrosFilteredMeals.forEach(meal => {
      if (!macrosFilteredDataByDate[meal.date]) {
        macrosFilteredDataByDate[meal.date] = {
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          meals: [],
          counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
        };
      }
      macrosFilteredDataByDate[meal.date].protein += meal.protein || 0;
      macrosFilteredDataByDate[meal.date].carbs += meal.carbs || 0;
      macrosFilteredDataByDate[meal.date].fat += meal.fat || 0;
      macrosFilteredDataByDate[meal.date].sugar += meal.sugar || 0;
      macrosFilteredDataByDate[meal.date].meals.push(meal);
      
      // Count items that have each macro
      if ((meal.protein || 0) > 0) macrosFilteredDataByDate[meal.date].counts.protein++;
      if ((meal.carbs || 0) > 0) macrosFilteredDataByDate[meal.date].counts.carbs++;
      if ((meal.fat || 0) > 0) macrosFilteredDataByDate[meal.date].counts.fat++;
      if ((meal.sugar || 0) > 0) macrosFilteredDataByDate[meal.date].counts.sugar++;
    });
  }
  
  macrosFilteredDates.forEach(date => {
    if (!macrosFilteredDataByDate[date]) {
      macrosFilteredDataByDate[date] = {
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        meals: [],
        counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
      };
    }
  });
  
  // Prepare data for categories chart with time filtering
  let categoriesFilteredMeals, categoriesLegendMeals;
  
  if (categoriesTimePeriod === 'daily') {
    // Chart shows the whole week
    const selectedDate = categoriesSelectedDate ? new Date(categoriesSelectedDate) : new Date();
    const weekDates = getWeekDates(selectedDate);
    categoriesFilteredMeals = allMeals.filter(meal => weekDates.includes(meal.date));
    // Legend shows only the selected day
    categoriesLegendMeals = allMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate.toLocaleDateString() === selectedDate.toLocaleDateString();
    });
  } else {
    categoriesFilteredMeals = filterMealsByTimePeriod(allMeals, categoriesTimePeriod, categoriesSelectedDate);
    categoriesLegendMeals = categoriesFilteredMeals;
  }
  
  const categoriesFilteredDates = getDateLabelsForPeriod(categoriesFilteredMeals, categoriesTimePeriod, categoriesSelectedDate);
  const categoriesFilteredDataByDate = {};
  
  // For yearly view, aggregate by month
  if (categoriesTimePeriod === 'yearly') {
    categoriesFilteredMeals.forEach(meal => {
      const monthLabel = getMonthLabel(meal.date);
      if (!categoriesFilteredDataByDate[monthLabel]) {
        categoriesFilteredDataByDate[monthLabel] = {
          calories: 0,
          meals: []
        };
      }
      categoriesFilteredDataByDate[monthLabel].calories += meal.calories || 0;
      categoriesFilteredDataByDate[monthLabel].meals.push(meal);
    });
  } else {
    categoriesFilteredMeals.forEach(meal => {
      if (!categoriesFilteredDataByDate[meal.date]) {
        categoriesFilteredDataByDate[meal.date] = {
          calories: 0,
          meals: []
        };
      }
      categoriesFilteredDataByDate[meal.date].calories += meal.calories || 0;
      categoriesFilteredDataByDate[meal.date].meals.push(meal);
    });
  }
  
  categoriesFilteredDates.forEach(date => {
    if (!categoriesFilteredDataByDate[date]) {
      categoriesFilteredDataByDate[date] = {
        calories: 0,
        meals: []
      };
    }
  });
  
  // Render filtered charts
  renderMacrosChart(macrosFilteredDates, macrosFilteredDataByDate);
  renderFoodCategoriesChart(categoriesFilteredDates, categoriesFilteredDataByDate);
  
  // Prepare and render meal type chart
  const mealTypeFilteredMeals = filterMealsByTimePeriod(allMeals, mealTypeTimePeriod, mealTypeSelectedDate);
  const mealTypeFilteredDates = getDateLabelsForPeriod(mealTypeFilteredMeals, mealTypeTimePeriod, mealTypeSelectedDate);
  const mealTypeFilteredDataByDate = {};
  
  if (mealTypeTimePeriod === 'yearly') {
    mealTypeFilteredMeals.forEach(meal => {
      const monthLabel = getMonthLabel(meal.date);
      if (!mealTypeFilteredDataByDate[monthLabel]) {
        mealTypeFilteredDataByDate[monthLabel] = {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, mealsByDate: {} },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, mealsByDate: {} },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, mealsByDate: {} },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, mealsByDate: {} }
        };
      }
      const mealType = meal.mealType || 'snack';
      const category = categorizeMeal(meal.name);
      
      mealTypeFilteredDataByDate[monthLabel][mealType].calories += meal.calories || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].protein += meal.protein || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].carbs += meal.carbs || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].fat += meal.fat || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].sugar += meal.sugar || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].veggies += meal.veggies || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].count += 1;
      
      // Track veggie and fruit data - use meal calories for categorized foods
      if (category === 'veggies') {
        mealTypeFilteredDataByDate[monthLabel][mealType].veggiesCal += meal.calories || 0;
        // Only track cups/grams if this meal has veggie data
        if (meal.veggieCups) {
          mealTypeFilteredDataByDate[monthLabel][mealType].veggieCups += meal.veggieCups || 0;
          mealTypeFilteredDataByDate[monthLabel][mealType].veggieGrams += meal.veggieGrams || 0;
        }
      }
      
      // Track food categories
      if (category === 'fruits') {
        mealTypeFilteredDataByDate[monthLabel][mealType].fruits += 1;
        mealTypeFilteredDataByDate[monthLabel][mealType].fruitsCal += meal.calories || 0;
      } else if (category === 'wholeGrains') {
        mealTypeFilteredDataByDate[monthLabel][mealType].grains += meal.calories || 0;
      } else if (category === 'processedFoods') {
        mealTypeFilteredDataByDate[monthLabel][mealType].processedFoods += meal.calories || 0;
      }
      
      // Track by date for weekly breakdown
      if (!mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date]) {
        mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date] = {
          calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0,
          veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0
        };
      }
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].calories += meal.calories || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].protein += meal.protein || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].carbs += meal.carbs || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].fat += meal.fat || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].sugar += meal.sugar || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggies += meal.veggies || 0;
      mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].count += 1;
      
      if (category === 'veggies') {
        mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggiesCal += meal.calories || 0;
        if (meal.veggieCups) {
          mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggieCups += meal.veggieCups || 0;
          mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggieGrams += meal.veggieGrams || 0;
        }
      }
      if (category === 'fruits') {
        mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].fruits += 1;
        mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].fruitsCal += meal.calories || 0;
      }
      if (category === 'wholeGrains') {
        mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].grains += meal.calories || 0;
      }
      if (category === 'processedFoods') {
        mealTypeFilteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].processedFoods += meal.calories || 0;
      }
    });
  } else {
    mealTypeFilteredMeals.forEach(meal => {
      if (!mealTypeFilteredDataByDate[meal.date]) {
        mealTypeFilteredDataByDate[meal.date] = {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, meals: [] },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, meals: [] },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, meals: [] },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, fruitsCups: 0, fruitsGrams: 0, count: 0, meals: [] }
        };
      }
      const mealType = meal.mealType || 'snack';
      const category = categorizeMeal(meal.name);
      
      mealTypeFilteredDataByDate[meal.date][mealType].calories += meal.calories || 0;
      mealTypeFilteredDataByDate[meal.date][mealType].protein += meal.protein || 0;
      mealTypeFilteredDataByDate[meal.date][mealType].carbs += meal.carbs || 0;
      mealTypeFilteredDataByDate[meal.date][mealType].fat += meal.fat || 0;
      mealTypeFilteredDataByDate[meal.date][mealType].sugar += meal.sugar || 0;
      mealTypeFilteredDataByDate[meal.date][mealType].veggies += meal.veggies || 0;
      mealTypeFilteredDataByDate[meal.date][mealType].meals.push(meal);
      mealTypeFilteredDataByDate[meal.date][mealType].count += 1;
      
      // Track veggie and fruit data - use meal calories for categorized foods
      if (category === 'veggies') {
        mealTypeFilteredDataByDate[meal.date][mealType].veggiesCal += meal.calories || 0;
        if (meal.veggieCups) {
          mealTypeFilteredDataByDate[meal.date][mealType].veggieCups += meal.veggieCups || 0;
          mealTypeFilteredDataByDate[meal.date][mealType].veggieGrams += meal.veggieGrams || 0;
        }
      }
      
      // Track food categories
      if (category === 'fruits') {
        mealTypeFilteredDataByDate[meal.date][mealType].fruits += 1;
        mealTypeFilteredDataByDate[meal.date][mealType].fruitsCal += meal.calories || 0;
      } else if (category === 'wholeGrains') {
        mealTypeFilteredDataByDate[meal.date][mealType].grains += meal.calories || 0;
      } else if (category === 'processedFoods') {
        mealTypeFilteredDataByDate[meal.date][mealType].processedFoods += meal.calories || 0;
      }
    });
  }
  
  renderMealTypeChart(mealTypeFilteredDates, mealTypeFilteredDataByDate);
  
  // Render legends with appropriate meals (for daily: selected day only, for others: all filtered)
  renderCategoriesLegend(categoriesLegendMeals.length > 0 ? categoriesLegendMeals : allMeals);
  renderMacrosLegend(macrosLegendMeals.length > 0 ? macrosLegendMeals : allMeals);
  renderMealTypeLegend(mealTypeFilteredMeals.length > 0 ? mealTypeFilteredMeals : allMeals);
  
  // Setup time period selectors
  setupTimePeriodSelectors();

  if (typeof window.refreshCaloriEatDashboardInsights === 'function') {
    window.refreshCaloriEatDashboardInsights();
  }
}

function setupTimePeriodSelectors() {
  // Categories period selector
  const categoriesPeriodSelect = document.getElementById('categoriesPeriod');
  const categoriesCalendarBtn = document.getElementById('categoriesCalendarBtn');
  const categoriesDatePicker = document.getElementById('categoriesDatePicker');
  
  if (categoriesPeriodSelect) {
    categoriesPeriodSelect.value = categoriesTimePeriod;
    categoriesPeriodSelect.addEventListener('change', (e) => {
      categoriesTimePeriod = e.target.value;
      categoriesSelectedDate = null;
      
      const user = profiles[currentUser];
      const allMeals = user?.meals || [];
      
      // Show/hide calendar button based on whether there are multiple periods
      if (categoriesTimePeriod !== 'overall' && hasMultiplePeriods(allMeals, categoriesTimePeriod)) {
        categoriesCalendarBtn.classList.remove('hidden');
      } else {
        categoriesCalendarBtn.classList.add('hidden');
        categoriesDatePicker.classList.add('hidden');
      }
      
      // Only update the categories chart and legend
      updateCategoriesChartOnly();
    });
  }
  
  if (categoriesCalendarBtn) {
    categoriesCalendarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      categoriesDatePicker.classList.toggle('hidden');
      if (!categoriesDatePicker.classList.contains('hidden')) {
        categoriesDatePicker.focus();
      }
    });
  }
  
  if (categoriesDatePicker) {
    categoriesDatePicker.addEventListener('change', (e) => {
      categoriesSelectedDate = e.target.value;
      // Only update the categories chart and legend
      updateCategoriesChartOnly();
    });
  }
  
  // Macros period selector
  const macrosPeriodSelect = document.getElementById('macrosPeriod');
  const macrosCalendarBtn = document.getElementById('macrosCalendarBtn');
  const macrosDatePicker = document.getElementById('macrosDatePicker');
  
  if (macrosPeriodSelect) {
    macrosPeriodSelect.value = macrosTimePeriod;
    macrosPeriodSelect.addEventListener('change', (e) => {
      macrosTimePeriod = e.target.value;
      macrosSelectedDate = null;
      
      const user = profiles[currentUser];
      const allMeals = user?.meals || [];
      
      // Show/hide calendar button
      if (macrosTimePeriod !== 'overall' && hasMultiplePeriods(allMeals, macrosTimePeriod)) {
        macrosCalendarBtn.classList.remove('hidden');
      } else {
        macrosCalendarBtn.classList.add('hidden');
        macrosDatePicker.classList.add('hidden');
      }
      
      // Only update the macros chart and legend
      updateMacrosChartOnly();
    });
  }
  
  if (macrosCalendarBtn) {
    macrosCalendarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      macrosDatePicker.classList.toggle('hidden');
      if (!macrosDatePicker.classList.contains('hidden')) {
        macrosDatePicker.focus();
      }
    });
  }
  
  if (macrosDatePicker) {
    macrosDatePicker.addEventListener('change', (e) => {
      macrosSelectedDate = e.target.value;
      // Only update the macros chart and legend
      updateMacrosChartOnly();
    });
  }
  
  // Check if calendar buttons should be visible on load
  const user = profiles[currentUser];
  const allMeals = user?.meals || [];
  
  if (categoriesTimePeriod !== 'overall' && hasMultiplePeriods(allMeals, categoriesTimePeriod)) {
    if (categoriesCalendarBtn) categoriesCalendarBtn.classList.remove('hidden');
  }
  
  if (macrosTimePeriod !== 'overall' && hasMultiplePeriods(allMeals, macrosTimePeriod)) {
    if (macrosCalendarBtn) macrosCalendarBtn.classList.remove('hidden');
  }
  
  // Meal Type period selector
  const mealTypePeriodSelect = document.getElementById('mealTypePeriod');
  const mealTypeCalendarBtn = document.getElementById('mealTypeCalendarBtn');
  const mealTypeDatePicker = document.getElementById('mealTypeDatePicker');
  
  if (mealTypePeriodSelect) {
    mealTypePeriodSelect.value = mealTypeTimePeriod;
    mealTypePeriodSelect.addEventListener('change', (e) => {
      mealTypeTimePeriod = e.target.value;
      mealTypeSelectedDate = null;
      
      const user = profiles[currentUser];
      const allMeals = user?.meals || [];
      
      if (mealTypeTimePeriod === 'overall') {
        if (mealTypeCalendarBtn) mealTypeCalendarBtn.classList.add('hidden');
        if (mealTypeDatePicker) mealTypeDatePicker.classList.add('hidden');
      } else if (hasMultiplePeriods(allMeals, mealTypeTimePeriod)) {
        if (mealTypeCalendarBtn) mealTypeCalendarBtn.classList.remove('hidden');
      }
      
      updateMealTypeChartOnly();
    });
  }
  
  if (mealTypeCalendarBtn) {
    mealTypeCalendarBtn.addEventListener('click', () => {
      if (mealTypeDatePicker) {
        mealTypeDatePicker.classList.toggle('hidden');
      }
    });
  }
  
  if (mealTypeDatePicker) {
    mealTypeDatePicker.addEventListener('change', (e) => {
      mealTypeSelectedDate = e.target.value;
      updateMealTypeChartOnly();
    });
  }
  
  if (mealTypeTimePeriod !== 'overall' && hasMultiplePeriods(allMeals, mealTypeTimePeriod)) {
    if (mealTypeCalendarBtn) mealTypeCalendarBtn.classList.remove('hidden');
  }
  
  // Meal Type metric selector
  const mealTypeMetricSelect = document.getElementById('mealTypeMetric');
  if (mealTypeMetricSelect) {
    mealTypeMetricSelect.value = mealTypeMetric;
    mealTypeMetricSelect.addEventListener('change', (e) => {
      mealTypeMetric = e.target.value;
      updateMealTypeChartOnly();
    });
  }
}

// Helper function to update only the categories chart
function updateCategoriesChartOnly() {
  const user = profiles[currentUser];
  if (!user) return;
  
  const allMeals = user.meals || [];
  
  // Filter meals based on time period
  const filteredMeals = filterMealsByTimePeriod(allMeals, categoriesTimePeriod, categoriesSelectedDate);
  const legendMeals = filteredMeals;
  
  // Prepare data for chart
  const filteredDates = getDateLabelsForPeriod(filteredMeals, categoriesTimePeriod, categoriesSelectedDate);
  const filteredDataByDate = {};
  
  // For yearly view, aggregate by month but keep meal dates for weekly breakdown
  if (categoriesTimePeriod === 'yearly') {
    filteredMeals.forEach(meal => {
      const monthLabel = getMonthLabel(meal.date);
      if (!filteredDataByDate[monthLabel]) {
        filteredDataByDate[monthLabel] = {
          calories: 0,
          meals: [],
          mealsByDate: {}
        };
      }
      filteredDataByDate[monthLabel].calories += meal.calories || 0;
      filteredDataByDate[monthLabel].meals.push(meal);
      
      // Track by date for weekly breakdown
      if (!filteredDataByDate[monthLabel].mealsByDate[meal.date]) {
        filteredDataByDate[monthLabel].mealsByDate[meal.date] = {
          calories: 0,
          meals: [],
          categoryCounts: {}  // Track counts by category
        };
      }
      filteredDataByDate[monthLabel].mealsByDate[meal.date].calories += meal.calories || 0;
      filteredDataByDate[monthLabel].mealsByDate[meal.date].meals.push(meal);
      
      // Track category counts
      const category = categorizeMeal(meal.name);
      if (!filteredDataByDate[monthLabel].mealsByDate[meal.date].categoryCounts[category]) {
        filteredDataByDate[monthLabel].mealsByDate[meal.date].categoryCounts[category] = 0;
      }
      filteredDataByDate[monthLabel].mealsByDate[meal.date].categoryCounts[category]++;
    });
  } else {
    // For other views, use normal date
    filteredMeals.forEach(meal => {
      if (!filteredDataByDate[meal.date]) {
        filteredDataByDate[meal.date] = {
          calories: 0,
          meals: [],
          categoryCounts: {}  // Track counts by category
        };
      }
      filteredDataByDate[meal.date].calories += meal.calories || 0;
      filteredDataByDate[meal.date].meals.push(meal);
      
      // Track category counts
      const category = categorizeMeal(meal.name);
      if (!filteredDataByDate[meal.date].categoryCounts[category]) {
        filteredDataByDate[meal.date].categoryCounts[category] = 0;
      }
      filteredDataByDate[meal.date].categoryCounts[category]++;
    });
  }
  
  // Fill in missing dates
  filteredDates.forEach(date => {
    if (!filteredDataByDate[date]) {
      filteredDataByDate[date] = {
        calories: 0,
        meals: []
      };
    }
  });
  
  // Render just the categories chart
  renderFoodCategoriesChart(filteredDates, filteredDataByDate);
  
  // Render legend with the appropriate meals (selected day for daily, all for others)
  renderCategoriesLegend(legendMeals.length > 0 ? legendMeals : allMeals);
}

// Helper function to update only the macros chart
function updateMacrosChartOnly() {
  const user = profiles[currentUser];
  if (!user) return;
  
  const allMeals = user.meals || [];
  
  // Filter meals based on time period
  const filteredMeals = filterMealsByTimePeriod(allMeals, macrosTimePeriod, macrosSelectedDate);
  const legendMeals = filteredMeals;
  
  // Prepare data for chart
  const filteredDates = getDateLabelsForPeriod(filteredMeals, macrosTimePeriod, macrosSelectedDate);
  const filteredDataByDate = {};
  
  // For yearly view, aggregate by month but keep meal dates
  if (macrosTimePeriod === 'yearly') {
    filteredMeals.forEach(meal => {
      const monthLabel = getMonthLabel(meal.date);
      if (!filteredDataByDate[monthLabel]) {
        filteredDataByDate[monthLabel] = {
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          meals: [],
          counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 },
          mealsByDate: {}
        };
      }
      filteredDataByDate[monthLabel].protein += meal.protein || 0;
      filteredDataByDate[monthLabel].carbs += meal.carbs || 0;
      filteredDataByDate[monthLabel].fat += meal.fat || 0;
      filteredDataByDate[monthLabel].sugar += meal.sugar || 0;
      filteredDataByDate[monthLabel].meals.push(meal);
      
      // Count items with each macro
      if ((meal.protein || 0) > 0) filteredDataByDate[monthLabel].counts.protein++;
      if ((meal.carbs || 0) > 0) filteredDataByDate[monthLabel].counts.carbs++;
      if ((meal.fat || 0) > 0) filteredDataByDate[monthLabel].counts.fat++;
      if ((meal.sugar || 0) > 0) filteredDataByDate[monthLabel].counts.sugar++;
      
      // Group meals by actual date within the month
      if (!filteredDataByDate[monthLabel].mealsByDate[meal.date]) {
        filteredDataByDate[monthLabel].mealsByDate[meal.date] = {
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          meals: [],
          counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
        };
      }
      filteredDataByDate[monthLabel].mealsByDate[meal.date].protein += meal.protein || 0;
      filteredDataByDate[monthLabel].mealsByDate[meal.date].carbs += meal.carbs || 0;
      filteredDataByDate[monthLabel].mealsByDate[meal.date].fat += meal.fat || 0;
      filteredDataByDate[monthLabel].mealsByDate[meal.date].sugar += meal.sugar || 0;
      filteredDataByDate[monthLabel].mealsByDate[meal.date].meals.push(meal);
      
      // Count items for daily breakdown
      if ((meal.protein || 0) > 0) filteredDataByDate[monthLabel].mealsByDate[meal.date].counts.protein++;
      if ((meal.carbs || 0) > 0) filteredDataByDate[monthLabel].mealsByDate[meal.date].counts.carbs++;
      if ((meal.fat || 0) > 0) filteredDataByDate[monthLabel].mealsByDate[meal.date].counts.fat++;
      if ((meal.sugar || 0) > 0) filteredDataByDate[monthLabel].mealsByDate[meal.date].counts.sugar++;
    });
  } else {
    // For other views, use normal date
    filteredMeals.forEach(meal => {
      if (!filteredDataByDate[meal.date]) {
        filteredDataByDate[meal.date] = {
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          meals: [],
          counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
        };
      }
      filteredDataByDate[meal.date].protein += meal.protein || 0;
      filteredDataByDate[meal.date].carbs += meal.carbs || 0;
      filteredDataByDate[meal.date].fat += meal.fat || 0;
      filteredDataByDate[meal.date].sugar += meal.sugar || 0;
      filteredDataByDate[meal.date].meals.push(meal);
      
      // Count items with each macro
      if ((meal.protein || 0) > 0) filteredDataByDate[meal.date].counts.protein++;
      if ((meal.carbs || 0) > 0) filteredDataByDate[meal.date].counts.carbs++;
      if ((meal.fat || 0) > 0) filteredDataByDate[meal.date].counts.fat++;
      if ((meal.sugar || 0) > 0) filteredDataByDate[meal.date].counts.sugar++;
    });
  }
  
  // Fill in missing dates
  filteredDates.forEach(date => {
    if (!filteredDataByDate[date]) {
      filteredDataByDate[date] = {
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        meals: [],
        counts: { protein: 0, carbs: 0, fat: 0, sugar: 0 }
      };
    }
  });
  
  // Render just the macros chart
  renderMacrosChart(filteredDates, filteredDataByDate);
  
  // Render legend with the appropriate meals (selected day for daily, all for others)
  renderMacrosLegend(legendMeals.length > 0 ? legendMeals : allMeals);
}

// Helper function to update only the meal type chart
function updateMealTypeChartOnly() {
  const user = profiles[currentUser];
  if (!user) return;
  
  const allMeals = user.meals || [];
  
  const filteredMeals = filterMealsByTimePeriod(allMeals, mealTypeTimePeriod, mealTypeSelectedDate);
  const filteredDates = getDateLabelsForPeriod(filteredMeals, mealTypeTimePeriod, mealTypeSelectedDate);
  const filteredDataByDate = {};
  
  // For yearly view, aggregate by month but keep daily data for weekly breakdown
  if (mealTypeTimePeriod === 'yearly') {
    filteredMeals.forEach(meal => {
      const monthLabel = getMonthLabel(meal.date);
      if (!filteredDataByDate[monthLabel]) {
        filteredDataByDate[monthLabel] = {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, mealsByDate: {} },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, mealsByDate: {} },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, mealsByDate: {} },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, mealsByDate: {} }
        };
      }
      const mealType = meal.mealType || 'snack';
      const category = categorizeMeal(meal.name);
      
      filteredDataByDate[monthLabel][mealType].calories += meal.calories || 0;
      filteredDataByDate[monthLabel][mealType].protein += meal.protein || 0;
      filteredDataByDate[monthLabel][mealType].carbs += meal.carbs || 0;
      filteredDataByDate[monthLabel][mealType].fat += meal.fat || 0;
      filteredDataByDate[monthLabel][mealType].sugar += meal.sugar || 0;
      filteredDataByDate[monthLabel][mealType].veggies += meal.veggies || 0;
      filteredDataByDate[monthLabel][mealType].count += 1;
      
      // Track veggie and fruit data
      if (category === 'veggies') {
        filteredDataByDate[monthLabel][mealType].veggiesCal += meal.calories || 0;
        if (meal.veggieCups) {
          filteredDataByDate[monthLabel][mealType].veggieCups += meal.veggieCups || 0;
          filteredDataByDate[monthLabel][mealType].veggieGrams += meal.veggieGrams || 0;
        }
      }
      
      // Track food categories
      if (category === 'fruits') {
        filteredDataByDate[monthLabel][mealType].fruits += 1;
        filteredDataByDate[monthLabel][mealType].fruitsCal += meal.calories || 0;
      } else if (category === 'wholeGrains') {
        filteredDataByDate[monthLabel][mealType].grains += meal.calories || 0;
      } else if (category === 'processedFoods') {
        filteredDataByDate[monthLabel][mealType].processedFoods += meal.calories || 0;
      }
      
      // Also track by date for weekly breakdown
      if (!filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date]) {
        filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date] = {
          calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0,
          veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0
        };
      }
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].calories += meal.calories || 0;
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].protein += meal.protein || 0;
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].carbs += meal.carbs || 0;
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].fat += meal.fat || 0;
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].sugar += meal.sugar || 0;
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggies += meal.veggies || 0;
      filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].count += 1;
      
      // Track veggies/fruits for weekly breakdown
      if (category === 'veggies') {
        filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggiesCal += meal.calories || 0;
        if (meal.veggieCups) {
          filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggieCups += meal.veggieCups || 0;
          filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].veggieGrams += meal.veggieGrams || 0;
        }
      }
      if (category === 'fruits') {
        filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].fruits += 1;
        filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].fruitsCal += meal.calories || 0;
      }
      if (category === 'wholeGrains') {
        filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].grains += meal.calories || 0;
      }
      if (category === 'processedFoods') {
        filteredDataByDate[monthLabel][mealType].mealsByDate[meal.date].processedFoods += meal.calories || 0;
      }
    });
  } else {
    // For other views, use normal date
    filteredMeals.forEach(meal => {
      if (!filteredDataByDate[meal.date]) {
        filteredDataByDate[meal.date] = {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, meals: [] },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, meals: [] },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, meals: [] },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, veggiesCal: 0, fruitsCal: 0, veggieCups: 0, veggieGrams: 0, count: 0, meals: [] }
        };
      }
      const mealType = meal.mealType || 'snack';
      const category = categorizeMeal(meal.name);
      
      filteredDataByDate[meal.date][mealType].calories += meal.calories || 0;
      filteredDataByDate[meal.date][mealType].protein += meal.protein || 0;
      filteredDataByDate[meal.date][mealType].carbs += meal.carbs || 0;
      filteredDataByDate[meal.date][mealType].fat += meal.fat || 0;
      filteredDataByDate[meal.date][mealType].sugar += meal.sugar || 0;
      filteredDataByDate[meal.date][mealType].veggies += meal.veggies || 0;
      filteredDataByDate[meal.date][mealType].meals.push(meal);
      filteredDataByDate[meal.date][mealType].count += 1;
      
      // Track veggie and fruit data
      if (category === 'veggies') {
        filteredDataByDate[meal.date][mealType].veggiesCal += meal.calories || 0;
        if (meal.veggieCups) {
          filteredDataByDate[meal.date][mealType].veggieCups += meal.veggieCups || 0;
          filteredDataByDate[meal.date][mealType].veggieGrams += meal.veggieGrams || 0;
        }
      }
      
      // Track food categories
      if (category === 'fruits') {
        filteredDataByDate[meal.date][mealType].fruits += 1;
        filteredDataByDate[meal.date][mealType].fruitsCal += meal.calories || 0;
      } else if (category === 'wholeGrains') {
        filteredDataByDate[meal.date][mealType].grains += meal.calories || 0;
      } else if (category === 'processedFoods') {
        filteredDataByDate[meal.date][mealType].processedFoods += meal.calories || 0;
      }
    });
  }
  
  // Fill in missing dates
  filteredDates.forEach(date => {
    if (!filteredDataByDate[date]) {
      filteredDataByDate[date] = {
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, count: 0, meals: [] },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, count: 0, meals: [] },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, count: 0, meals: [] },
        snack: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0, count: 0, meals: [] }
      };
    }
  });
  
  // Render just the meal type chart
  renderMealTypeChart(filteredDates, filteredDataByDate);
  
  // Render legend
  renderMealTypeLegend(filteredMeals.length > 0 ? filteredMeals : allMeals);
}

function renderCaloriesChart(dates, dataByDate) {
  const calChartEl = document.getElementById('calorieChart');
  if (!calChartEl) return;

  // Destroy existing chart
  if (caloriesChartInstance) {
    caloriesChartInstance.destroy();
  }

  const caloriesData = dates.map(date => dataByDate[date].calories);
  const calCtx = calChartEl.getContext('2d');
  
  caloriesChartInstance = new Chart(calCtx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        label: 'Calories Per Day',
        data: caloriesData,
        backgroundColor: CE_PALETTE.caloriesBar,
        hoverBackgroundColor: CE_PALETTE.caloriesBarHover
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, activeElements, chart) => {
        // Use 'index' mode to get entire vertical slice - perfect for bars!
        const items = chart.getElementsAtEventForMode(
          event,
          'index',
          { intersect: false },
          false
        );
        
        if (items && items.length > 0) {
          const index = items[0].index;
          const date = dates[index];
          const total = dataByDate[date].calories;
          const meals = dataByDate[date].meals;
          
          let content = `
            <div class="chart-tooltip-header">📅 ${date}</div>
            <div class="chart-tooltip-total">🔥 Total Calories: ${total}</div>
            <div class="chart-tooltip-breakdown">
              <strong>📋 Breakdown:</strong><br>
          `;
          
          meals.forEach(meal => {
            content += `<div class="chart-tooltip-item">• ${meal.name}: ${meal.calories} cal</div>`;
          });
          
          content += '</div>';
          showChartTooltip(event, content);
        }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          ticks: { color: '#f0f0f0' },
          grid: { color: '#333' },
          title: {
            display: true,
            text: 'Calories',
            color: '#f0f0f0'
          }
        },
        x: {
          ticks: { color: '#f0f0f0' },
          grid: { color: '#333' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f0f0f0' }
        },
        tooltip: {
          enabled: false // Disable hover tooltips
        }
      }
    }
  });
}

function renderMacrosChart(filteredDates, filteredDataByDate) {
  const ctx = document.getElementById('macrosChart');
  if (!ctx) return;

  // Destroy existing chart
  if (macrosChartInstance) {
    macrosChartInstance.destroy();
  }

  const proteinData = filteredDates.map(date => filteredDataByDate[date]?.protein || 0);
  const carbsData = filteredDates.map(date => filteredDataByDate[date]?.carbs || 0);
  const fatData = filteredDates.map(date => filteredDataByDate[date]?.fat || 0);
  const sugarData = filteredDates.map(date => filteredDataByDate[date]?.sugar || 0);

  macrosChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredDates,
      datasets: [
        {
          label: 'Protein',
          data: proteinData,
          borderColor: CE_PALETTE.protein,
          backgroundColor: CE_PALETTE.proteinFill,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          metric: 'protein'
        },
        {
          label: 'Carbs',
          data: carbsData,
          borderColor: CE_PALETTE.carbs,
          backgroundColor: CE_PALETTE.carbsFill,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          metric: 'carbs'
        },
        {
          label: 'Fat',
          data: fatData,
          borderColor: CE_PALETTE.fat,
          backgroundColor: CE_PALETTE.fatFill,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          metric: 'fat'
        },
        {
          label: 'Sugar',
          data: sugarData,
          borderColor: CE_PALETTE.sugar,
          backgroundColor: CE_PALETTE.sugarFill,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          metric: 'sugar'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, activeElements, chart) => {
        // Get all points at the click location using different modes
        const nearestPoints = chart.getElementsAtEventForMode(
          event,
          'nearest',
          { intersect: false },
          false
        );
        
        if (!nearestPoints || nearestPoints.length === 0) return;
        
        // Chart.js already calculated the correct position - use event.x and event.y
        // These are in canvas pixel coordinates
        const clickX = event.x;
        const clickY = event.y;
        
        // Find the X index by getting the closest point's index
        const xIndex = nearestPoints[0].index;
        
        // Now find which dataset's point at this X index is closest to the click Y
        let closestDatasetIndex = -1;
        let minYDistance = Infinity;
        
        for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
          const dataset = chart.data.datasets[datasetIndex];
          if (dataset.hidden) continue;
          
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || !meta.data || !meta.data[xIndex]) continue;
          
          const point = meta.data[xIndex];
          const yDistance = Math.abs(clickY - point.y);
          
          if (yDistance < minYDistance) {
            minYDistance = yDistance;
            closestDatasetIndex = datasetIndex;
          }
        }
        
        if (closestDatasetIndex === -1) return;
        
        const index = xIndex;
        const datasetIndex = closestDatasetIndex;
        const dataset = chart.data.datasets[datasetIndex];
        
        const metric = dataset.metric;
        const metricLabel = dataset.label;
        const dateLabel = filteredDates[index];
        const dateData = filteredDataByDate[dateLabel];
        
        if (!dateData) return;
        
        // For yearly view with mealsByDate, show weekly breakdown
        let content = '';
        if (macrosTimePeriod === 'yearly' && dateData.mealsByDate) {
          // Get all dates in this month and organize by week
          const datesInMonth = Object.keys(dateData.mealsByDate).sort((a, b) => new Date(a) - new Date(b));
          
          if (datesInMonth.length === 0) {
            content = `
              <div class="chart-tooltip-header">📅 ${dateLabel}</div>
              <div class="chart-tooltip-total">📊 ${metricLabel}: 0g (0 Servings)</div>
              <div class="chart-tooltip-breakdown">No data for this month</div>
            `;
          } else {
            // Calculate weekly totals and counts
            const weeklyTotals = { week1: 0, week2: 0, week3: 0, week4: 0 };
            const weeklyCounts = { week1: 0, week2: 0, week3: 0, week4: 0 };
            
            datesInMonth.forEach(date => {
              const dayData = dateData.mealsByDate[date];
              const dayValue = dayData[metric] || 0;
              const dayCount = dayData.counts?.[metric] || 0;
              const day = new Date(date).getDate();
              
              if (day <= 7) {
                weeklyTotals.week1 += dayValue;
                weeklyCounts.week1 += dayCount;
              } else if (day <= 14) {
                weeklyTotals.week2 += dayValue;
                weeklyCounts.week2 += dayCount;
              } else if (day <= 21) {
                weeklyTotals.week3 += dayValue;
                weeklyCounts.week3 += dayCount;
              } else {
                weeklyTotals.week4 += dayValue;
                weeklyCounts.week4 += dayCount;
              }
            });
            
            // Show monthly total and weekly breakdown
            const total = dateData[metric] || 0;
            const totalCount = dateData.counts?.[metric] || 0;
            content = `
              <div class="chart-tooltip-header">📅 ${dateLabel}</div>
              <div class="chart-tooltip-total">📊 ${metricLabel}: ${total.toFixed(1)}g (${totalCount} Servings)</div>
              <div class="chart-tooltip-breakdown">
                <strong>📋 Weekly Breakdown:</strong><br>
            `;
            
            if (weeklyTotals.week1 > 0) content += `<div class="chart-tooltip-item">• Week 1: ${weeklyTotals.week1.toFixed(1)}g (${weeklyCounts.week1} Servings)</div>`;
            if (weeklyTotals.week2 > 0) content += `<div class="chart-tooltip-item">• Week 2: ${weeklyTotals.week2.toFixed(1)}g (${weeklyCounts.week2} Servings)</div>`;
            if (weeklyTotals.week3 > 0) content += `<div class="chart-tooltip-item">• Week 3: ${weeklyTotals.week3.toFixed(1)}g (${weeklyCounts.week3} Servings)</div>`;
            if (weeklyTotals.week4 > 0) content += `<div class="chart-tooltip-item">• Week 4: ${weeklyTotals.week4.toFixed(1)}g (${weeklyCounts.week4} Servings)</div>`;
            
            content += '</div>';
          }
        } else {
          // For non-yearly views, show individual day breakdown
          const total = dateData[metric] || 0;
          const totalCount = dateData.counts?.[metric] || 0;
          const meals = dateData.meals || [];
          
          content = `
            <div class="chart-tooltip-header">📅 ${dateLabel}</div>
            <div class="chart-tooltip-total">📊 ${metricLabel}: ${total.toFixed(1)}g (${totalCount} Servings)</div>
            <div class="chart-tooltip-breakdown">
              <strong>📋 Breakdown:</strong><br>
          `;
          
          let hasValues = false;
          meals.forEach(meal => {
            const value = meal[metric] || 0;
            if (value > 0) {
              content += `<div class="chart-tooltip-item">• ${meal.name}: ${value.toFixed(1)}g</div>`;
              hasValues = true;
            }
          });
          
          if (!hasValues) {
            content += `<div class="chart-tooltip-item">(No ${metricLabel.toLowerCase()} logged for this day)</div>`;
          }
          
          content += '</div>';
        }
        
        showChartTooltip(event, content);
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false // Disable hover tooltips
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#f0f0f0',
            callback: function(value) {
              // Round to whole numbers for cleaner display
              return Math.round(value);
            }
          },
          grid: {
            color: '#333'
          },
          title: {
            display: true,
            text: 'Grams (g)',
            color: '#f0f0f0'
          }
        },
        x: {
          ticks: {
            color: '#f0f0f0'
          },
          grid: {
            color: '#333'
          }
        }
      }
    }
  });

  // Toggle button functionality for each metric
  const metrics = ['protein', 'carbs', 'fat', 'sugar'];
  metrics.forEach((metric, index) => {
    const toggleBtn = document.querySelector(`[data-metric="${metric}"]`);
    if (toggleBtn) {
      // Apply saved toggle state to chart
      macrosChartInstance.data.datasets[index].hidden = !macrosToggleState[metric];
      
      // Update button visual state to match
      if (macrosToggleState[metric]) {
        toggleBtn.classList.add('active');
      } else {
        toggleBtn.classList.remove('active');
      }
      
      // Set up click handler
      toggleBtn.onclick = () => {
        toggleBtn.classList.toggle('active');
        const isActive = toggleBtn.classList.contains('active');
        macrosToggleState[metric] = isActive;
        macrosChartInstance.data.datasets[index].hidden = !isActive;
        macrosChartInstance.update();
      };
    }
  });
  
  // Apply initial hidden state
  macrosChartInstance.update();
}

function renderFoodCategoriesChart(filteredDates, filteredDataByDate) {
  const ctx = document.getElementById('veggiesChart');
  if (!ctx) return;

  // Destroy existing chart
  if (veggiesChartInstance) {
    veggiesChartInstance.destroy();
  }

  // Calculate percentages for each category per date
  const categories = ['fruits', 'veggies', 'wholeGrains', 'leanProteins', 'processedFoods', 'sugaryFoods'];
  const categoryData = {};
  
  categories.forEach(cat => {
    categoryData[cat] = filteredDates.map(date => {
      const dateData = filteredDataByDate[date];
      if (!dateData) return 0;
      
      const meals = dateData.meals || [];
      let totalCalories = dateData.calories || 0;
      
      // Avoid division by zero
      if (totalCalories === 0) return 0;
      
      // Calculate calories for this category
      let categoryCalories = 0;
      meals.forEach(meal => {
        const mealCategory = categorizeMeal(meal.name);
        if (mealCategory === cat) {
          categoryCalories += meal.calories || 0;
        }
      });
      
      // Return percentage
      return ((categoryCalories / totalCalories) * 100).toFixed(1);
    });
  });

  // Create datasets for each category
  const datasets = [
    {
      label: 'Fruits',
      data: categoryData.fruits,
      ...getCategoryColor('fruits'),
      borderColor: getCategoryColor('fruits').border,
      backgroundColor: getCategoryColor('fruits').bg,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
      category: 'fruits'
    },
    {
      label: 'Veggies',
      data: categoryData.veggies,
      ...getCategoryColor('veggies'),
      borderColor: getCategoryColor('veggies').border,
      backgroundColor: getCategoryColor('veggies').bg,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
      category: 'veggies'
    },
    {
      label: 'Whole Grains',
      data: categoryData.wholeGrains,
      ...getCategoryColor('wholeGrains'),
      borderColor: getCategoryColor('wholeGrains').border,
      backgroundColor: getCategoryColor('wholeGrains').bg,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
      category: 'wholeGrains'
    },
    {
      label: 'Lean Proteins',
      data: categoryData.leanProteins,
      ...getCategoryColor('leanProteins'),
      borderColor: getCategoryColor('leanProteins').border,
      backgroundColor: getCategoryColor('leanProteins').bg,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
      category: 'leanProteins'
    },
    {
      label: 'Processed Foods',
      data: categoryData.processedFoods,
      ...getCategoryColor('processedFoods'),
      borderColor: getCategoryColor('processedFoods').border,
      backgroundColor: getCategoryColor('processedFoods').bg,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
      category: 'processedFoods'
    },
    {
      label: 'Sugary Foods',
      data: categoryData.sugaryFoods,
      ...getCategoryColor('sugaryFoods'),
      borderColor: getCategoryColor('sugaryFoods').border,
      backgroundColor: getCategoryColor('sugaryFoods').bg,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
      category: 'sugaryFoods'
    }
  ];

  veggiesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredDates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, activeElements, chart) => {
        const nearestPoints = chart.getElementsAtEventForMode(
          event,
          'nearest',
          { intersect: false },
          false
        );
        
        if (!nearestPoints || nearestPoints.length === 0) return;
        
        // Use Chart.js's internal coordinates
        const clickX = event.x;
        const clickY = event.y;
        
        // Find the X index
        const xIndex = nearestPoints[0].index;
        
        // Find which dataset's point at this X index is closest to the click Y
        let closestDatasetIndex = -1;
        let minYDistance = Infinity;
        
        for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
          const dataset = chart.data.datasets[datasetIndex];
          if (dataset.hidden) continue;
          
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || !meta.data || !meta.data[xIndex]) continue;
          
          const point = meta.data[xIndex];
          const yDistance = Math.abs(clickY - point.y);
          
          if (yDistance < minYDistance) {
            minYDistance = yDistance;
            closestDatasetIndex = datasetIndex;
          }
        }
        
        if (closestDatasetIndex === -1) return;
        
        const dsIdx = closestDatasetIndex;
        const ptIdx = xIndex;
        const dataset = chart.data.datasets[dsIdx];
        const category = dataset.category;
        const categoryLabel = dataset.label;
        const dateLabel = filteredDates[ptIdx];
        const percentage = parseFloat(dataset.data[ptIdx]);
        const dateData = filteredDataByDate[dateLabel];
        
        if (!dateData) return;
        
        let tooltipHTML = '';
        if (categoriesTimePeriod === 'yearly' && dateData.mealsByDate) {
          const dates = Object.keys(dateData.mealsByDate).sort((a, b) => new Date(a) - new Date(b));
          const weeklyCategoryCals = { w1: 0, w2: 0, w3: 0, w4: 0 };
          const weeklyCategoryCounts = { w1: 0, w2: 0, w3: 0, w4: 0 };
          let monthlyTotalCals = 0;
          let monthlyCategoryCals = 0;
          let monthlyCategoryCount = 0;
          
          dates.forEach(d => {
            const dd = dateData.mealsByDate[d];
            const dayTotal = dd.calories || 0;
            const dayMeals = dd.meals || [];
            const catCals = dayMeals.filter(m => categorizeMeal(m.name) === category).reduce((s, m) => s + (m.calories || 0), 0);
            const catCount = dd.categoryCounts?.[category] || 0;
            const day = new Date(d).getDate();
            monthlyTotalCals += dayTotal;
            monthlyCategoryCals += catCals;
            monthlyCategoryCount += catCount;
            if (day <= 7) { weeklyCategoryCals.w1 += catCals; weeklyCategoryCounts.w1 += catCount; }
            else if (day <= 14) { weeklyCategoryCals.w2 += catCals; weeklyCategoryCounts.w2 += catCount; }
            else if (day <= 21) { weeklyCategoryCals.w3 += catCals; weeklyCategoryCounts.w3 += catCount; }
            else { weeklyCategoryCals.w4 += catCals; weeklyCategoryCounts.w4 += catCount; }
          });
          
          tooltipHTML = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">📊 ${categoryLabel}: ${monthlyCategoryCals}cal (${percentage.toFixed(1)}%, ${monthlyCategoryCount} Servings)</div><div class="chart-tooltip-breakdown"><strong>📋 Weekly:</strong><br>`;
          if (monthlyTotalCals > 0) {
            ['w1', 'w2', 'w3', 'w4'].forEach((w, i) => {
              if (weeklyCategoryCals[w] > 0) {
                const weekPct = (weeklyCategoryCals[w] / monthlyTotalCals * 100).toFixed(1);
                tooltipHTML += `<div class="chart-tooltip-item">• Week ${i+1}: ${weekPct}% (${weeklyCategoryCounts[w]} Servings)</div>`;
              }
            });
          }
          tooltipHTML += '</div>';
        } else {
          const meals = dateData.meals || [];
          const catMeals = meals.filter(m => categorizeMeal(m.name) === category);
          const catCals = catMeals.reduce((s, m) => s + (m.calories || 0), 0);
          const catCount = dateData.categoryCounts?.[category] || catMeals.length;
          tooltipHTML = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">📊 ${categoryLabel}: ${catCals}cal (${percentage.toFixed(1)}%, ${catCount} Servings)</div><div class="chart-tooltip-breakdown"><strong>📋 Breakdown:</strong><br>`;
          if (catMeals.length > 0) {
            catMeals.forEach(m => tooltipHTML += `<div class="chart-tooltip-item">• ${m.name}: ${m.calories || 0}cal</div>`);
          } else {
            tooltipHTML += `<div class="chart-tooltip-item">(No ${categoryLabel.toLowerCase()} logged)</div>`;
          }
          tooltipHTML += '</div>';
        }
        
        showChartTooltip(event, tooltipHTML);
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#f0f0f0',
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: '#333'
          },
          title: {
            display: true,
            text: 'Percentage of Diet (%)',
            color: '#f0f0f0'
          }
        },
        x: {
          ticks: {
            color: '#f0f0f0'
          },
          grid: {
            color: '#333'
          }
        }
      }
    }
  });

  // Toggle button functionality for each category
  categories.forEach((category, index) => {
    const toggleBtn = document.querySelector(`[data-metric="${category}"]`);
    if (toggleBtn) {
      // Apply saved toggle state to chart
      veggiesChartInstance.data.datasets[index].hidden = !categoriesToggleState[category];
      
      // Update button visual state to match
      if (categoriesToggleState[category]) {
        toggleBtn.classList.add('active');
      } else {
        toggleBtn.classList.remove('active');
      }
      
      // Set up click handler
      toggleBtn.onclick = () => {
        toggleBtn.classList.toggle('active');
        const isActive = toggleBtn.classList.contains('active');
        categoriesToggleState[category] = isActive;
        veggiesChartInstance.data.datasets[index].hidden = !isActive;
        veggiesChartInstance.update();
      };
    }
  });
  
  // Apply initial hidden state
  veggiesChartInstance.update();
}

function renderMealTypeChart(filteredDates, filteredDataByDate) {
  const chartEl = document.getElementById('mealTypeChart');
  if (!chartEl) return;

  if (mealTypeChartInstance) {
    mealTypeChartInstance.destroy();
  }

  const ctx = chartEl.getContext('2d');

  // Get data for the selected metric
  const breakfastData = filteredDates.map(date => {
    const data = filteredDataByDate[date]?.breakfast;
    if (!data) return 0;
    if (mealTypeMetric === 'veggies') return data.veggiesCal || 0;
    if (mealTypeMetric === 'fruits') return data.fruitsCal || 0;
    return data[mealTypeMetric] || 0;
  });
  const lunchData = filteredDates.map(date => {
    const data = filteredDataByDate[date]?.lunch;
    if (!data) return 0;
    if (mealTypeMetric === 'veggies') return data.veggiesCal || 0;
    if (mealTypeMetric === 'fruits') return data.fruitsCal || 0;
    return data[mealTypeMetric] || 0;
  });
  const dinnerData = filteredDates.map(date => {
    const data = filteredDataByDate[date]?.dinner;
    if (!data) return 0;
    if (mealTypeMetric === 'veggies') return data.veggiesCal || 0;
    if (mealTypeMetric === 'fruits') return data.fruitsCal || 0;
    return data[mealTypeMetric] || 0;
  });
  const snackData = filteredDates.map(date => {
    const data = filteredDataByDate[date]?.snack;
    if (!data) return 0;
    if (mealTypeMetric === 'veggies') return data.veggiesCal || 0;
    if (mealTypeMetric === 'fruits') return data.fruitsCal || 0;
    return data[mealTypeMetric] || 0;
  });

  const metricLabels = {
    calories: 'Calories (cal)',
    protein: 'Protein (g)',
    carbs: 'Carbs (g)',
    fat: 'Fat (g)',
    sugar: 'Sugar (g)',
    veggies: 'Veggies (cal)',
    fruits: 'Fruits (cal)',
    grains: 'Grains (cal)',
    processedFoods: 'Processed Foods (cal)'
  };

  mealTypeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredDates,
      datasets: [
        {
          label: 'Breakfast',
          data: breakfastData,
          borderColor: CE_PALETTE.breakfast,
          backgroundColor: CE_PALETTE.breakfastFill,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: !mealTypeToggleState.breakfast
        },
        {
          label: 'Lunch',
          data: lunchData,
          borderColor: CE_PALETTE.lunch,
          backgroundColor: CE_PALETTE.lunchFill,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: !mealTypeToggleState.lunch
        },
        {
          label: 'Dinner',
          data: dinnerData,
          borderColor: CE_PALETTE.dinner,
          backgroundColor: CE_PALETTE.dinnerFill,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: !mealTypeToggleState.dinner
        },
        {
          label: 'Snack',
          data: snackData,
          borderColor: CE_PALETTE.snack,
          backgroundColor: CE_PALETTE.snackFill,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: !mealTypeToggleState.snack
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#f0f0f0' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          title: {
            display: true,
            text: metricLabels[mealTypeMetric],
            color: '#f0f0f0'
          }
        },
        x: {
          ticks: { color: '#f0f0f0' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      },
      onClick: (event, elements, chart) => {
        const nearestPoints = chart.getElementsAtEventForMode(
          event,
          'nearest',
          { intersect: false },
          false
        );
        
        if (!nearestPoints || nearestPoints.length === 0) return;
        
        // Use Chart.js's internal coordinates
        const clickX = event.x;
        const clickY = event.y;
        
        // Find the X index
        const xIndex = nearestPoints[0].index;
        
        // Find which dataset's point at this X index is closest to the click Y
        let closestDatasetIndex = -1;
        let minYDistance = Infinity;
        
        for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
          const dataset = chart.data.datasets[datasetIndex];
          if (dataset.hidden) continue;
          
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || !meta.data || !meta.data[xIndex]) continue;
          
          const point = meta.data[xIndex];
          const yDistance = Math.abs(clickY - point.y);
          
          if (yDistance < minYDistance) {
            minYDistance = yDistance;
            closestDatasetIndex = datasetIndex;
          }
        }
        
        if (closestDatasetIndex === -1) return;
        
        const datasetIndex = closestDatasetIndex;
        const index = xIndex;
        const dataset = chart.data.datasets[datasetIndex];
        const dateLabel = filteredDates[index];
        const value = dataset.data[index];
        
        // Extract meal type from label (Breakfast, Lunch, Dinner, Snack) and ensure lowercase
        const mealType = dataset.label.toLowerCase().trim();
        
        let unit = 'g';
        if (mealTypeMetric === 'calories' || mealTypeMetric === 'grains' || mealTypeMetric === 'processedFoods' || mealTypeMetric === 'veggies' || mealTypeMetric === 'fruits') {
          unit = 'cal';
        }
        
        let content = '';
        
        if (mealTypeTimePeriod === 'yearly' && filteredDataByDate[dateLabel] && filteredDataByDate[dateLabel][mealType] && filteredDataByDate[dateLabel][mealType].mealsByDate) {
          const dates = Object.keys(filteredDataByDate[dateLabel][mealType].mealsByDate).sort((a, b) => new Date(a) - new Date(b));
          if (dates.length === 0) {
            content = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">📊 ${dataset.label}: 0${unit} (0 Servings)</div><div class="chart-tooltip-breakdown">No data</div>`;
          } else {
            const weeklyTotals = { week1: 0, week2: 0, week3: 0, week4: 0 };
            const weeklyCounts = { week1: 0, week2: 0, week3: 0, week4: 0 };
            
            dates.forEach(date => {
              const dayData = filteredDataByDate[dateLabel][mealType].mealsByDate[date];
              let dayValue = 0;
              if (mealTypeMetric === 'veggies') dayValue = dayData.veggiesCal || 0;
              else if (mealTypeMetric === 'fruits') dayValue = dayData.fruitsCal || 0;
              else dayValue = dayData[mealTypeMetric] || 0;
              const dayCount = dayData.count || 0;
              const day = new Date(date).getDate();
              const weekKey = day <= 7 ? 'week1' : day <= 14 ? 'week2' : day <= 21 ? 'week3' : 'week4';
              weeklyTotals[weekKey] += dayValue;
              weeklyCounts[weekKey] += dayCount;
            });
            
            const monthData = filteredDataByDate[dateLabel][mealType];
            let total = 0;
            if (mealTypeMetric === 'veggies') total = monthData.veggiesCal || 0;
            else if (mealTypeMetric === 'fruits') total = monthData.fruitsCal || 0;
            else total = monthData[mealTypeMetric] || 0;
            
            content = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">📊 ${dataset.label}: ${total.toFixed(1)}${unit} (${monthData.count || 0} Servings)</div><div class="chart-tooltip-breakdown"><strong>📋 Weekly:</strong><br>`;
            ['week1', 'week2', 'week3', 'week4'].forEach((w, i) => {
              if (weeklyTotals[w] > 0) content += `<div class="chart-tooltip-item">• Week ${i+1}: ${weeklyTotals[w].toFixed(1)}${unit} (${weeklyCounts[w]} Servings)</div>`;
            });
            content += '</div>';
          }
        } else {
          const dateData = filteredDataByDate[dateLabel];
          if (!dateData) {
            content = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">No data</div>`;
          } else {
            // Data is structured as dateData[mealType] with meals array and totals
            const mealTypeData = dateData[mealType];
            if (!mealTypeData) {
              content = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">📊 ${dataset.label}: 0${unit} (0 Servings)</div>`;
            } else {
              const meals = mealTypeData.meals || [];
              let total = 0;
              
              // Get the total based on the metric
              if (mealTypeMetric === 'calories') total = mealTypeData.calories || 0;
              else if (mealTypeMetric === 'veggies') total = mealTypeData.veggiesCal || 0;
              else if (mealTypeMetric === 'fruits') total = mealTypeData.fruitsCal || 0;
              else if (mealTypeMetric === 'grains') total = mealTypeData.grains || 0;
              else if (mealTypeMetric === 'processedFoods') total = mealTypeData.processedFoods || 0;
              else total = mealTypeData[mealTypeMetric] || 0;
              
              const count = mealTypeData.count || 0;
              
              content = `<div class="chart-tooltip-header">📅 ${dateLabel}</div><div class="chart-tooltip-total">📊 ${dataset.label}: ${total.toFixed(1)}${unit} (${count} Servings)</div><div class="chart-tooltip-breakdown"><strong>📋 Meals:</strong><br>`;
              
              if (meals.length > 0) {
                meals.forEach(m => {
                  let val = 0;
                  if (mealTypeMetric === 'calories') val = m.calories || 0;
                  else if (mealTypeMetric === 'veggies') val = m.veggieCalories || m.veggies || 0;
                  else if (mealTypeMetric === 'fruits') {
                    const cat = categorizeMeal(m.name);
                    val = (cat === 'fruits') ? (m.calories || 0) : 0;
                  }
                  else if (mealTypeMetric === 'grains') {
                    const cat = categorizeMeal(m.name);
                    val = (cat === 'wholeGrains') ? (m.calories || 0) : 0;
                  }
                  else if (mealTypeMetric === 'processedFoods') {
                    const cat = categorizeMeal(m.name);
                    val = (cat === 'processedFoods') ? (m.calories || 0) : 0;
                  }
                  else val = m[mealTypeMetric] || 0;
                  
                  if (val > 0) content += `<div class="chart-tooltip-item">• ${m.name}: ${val.toFixed(1)}${unit}</div>`;
                });
              } else {
                content += `<div class="chart-tooltip-item">(No ${mealType} meals logged)</div>`;
              }
            }
            content += '</div>';
          }
        }
        
        showChartTooltip(event, content);
      }
    }
  });

  // Setup toggle buttons
  const toggleButtons = document.querySelectorAll('#mealTypeChart').length > 0 
    ? document.querySelectorAll('.chart-container:has(#mealTypeChart) .toggle-btn')
    : [];

  toggleButtons.forEach(btn => {
    const metric = btn.getAttribute('data-metric');
    btn.classList.toggle('active', mealTypeToggleState[metric]);
    
    btn.onclick = () => {
      mealTypeToggleState[metric] = !mealTypeToggleState[metric];
      btn.classList.toggle('active', mealTypeToggleState[metric]);
      
      const datasetIndex = ['breakfast', 'lunch', 'dinner', 'snack'].indexOf(metric);
      if (datasetIndex !== -1) {
        mealTypeChartInstance.data.datasets[datasetIndex].hidden = !mealTypeToggleState[metric];
        mealTypeChartInstance.update();
      }
    };
  });
}

function renderMealTypeLegend(meals) {
  const legendEl = document.getElementById('mealTypeLegend');
  if (!legendEl) return;

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const totals = {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0 },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0 },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, veggies: 0, fruits: 0, grains: 0, processedFoods: 0 }
  };

  meals.forEach(meal => {
    const mealType = meal.mealType || 'snack';
    const category = categorizeMeal(meal.name);
    
    totals[mealType].calories += meal.calories || 0;
    totals[mealType].protein += meal.protein || 0;
    totals[mealType].carbs += meal.carbs || 0;
    totals[mealType].fat += meal.fat || 0;
    totals[mealType].sugar += meal.sugar || 0;
    totals[mealType].veggies += meal.veggies || 0;
    
    // Track food categories
    if (category === 'fruits') {
      totals[mealType].fruits += 1;
    } else if (category === 'wholeGrains') {
      totals[mealType].grains += meal.calories || 0;
    } else if (category === 'processedFoods') {
      totals[mealType].processedFoods += meal.calories || 0;
    }
  });

  const colors = {
    breakfast: CE_PALETTE.breakfast,
    lunch: CE_PALETTE.lunch,
    dinner: CE_PALETTE.dinner,
    snack: CE_PALETTE.snack
  };

  const labels = {
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch',
    dinner: '🌙 Dinner',
    snack: '🍿 Snack'
  };

  // Determine unit based on metric
  let metricUnit = 'g';
  if (mealTypeMetric === 'calories' || mealTypeMetric === 'grains' || mealTypeMetric === 'processedFoods') {
    metricUnit = 'cal';
  } else if (mealTypeMetric === 'veggies' || mealTypeMetric === 'fruits') {
    metricUnit = 'servings';
  }

  legendEl.innerHTML = `
    <div class="legend-title">Total by Meal Type</div>
    <div class="legend-grid">
      ${mealTypes.map(type => `
        <div class="legend-item" style="border-left-color: ${colors[type]};">
          <div class="legend-item-label">
            <div class="legend-color-box" style="background-color: ${colors[type]};"></div>
            <span>${labels[type]}</span>
          </div>
          <div class="legend-item-value">${totals[type][mealTypeMetric].toFixed(1)} ${metricUnit}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderWeightChart(user) {
  const wtChartEl = document.getElementById('weightChart');
  if (!wtChartEl) return;

  // Destroy existing chart
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  const weightDates = [];
  const weightVals = [];
  if (user.weighIns && user.weighIns.length > 0) {
    user.weighIns.forEach(w => {
      weightDates.push(w.date);
      weightVals.push(w.weightLbs);
    });
  } else {
    weightDates.push(todayStr());
    weightVals.push(user.weightLbs || 0);
  }

  // Calculate projected weight using linear regression
  const projectedWeights = [];
  if (weightVals.length >= 2) {
    // Convert dates to numeric values (days since first weight)
    const firstDate = new Date(weightDates[0]);
    const xValues = weightDates.map(d => {
      const currentDate = new Date(d);
      return Math.floor((currentDate - firstDate) / (1000 * 60 * 60 * 24));
    });
    
    // Calculate linear regression: y = mx + b
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = weightVals.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * weightVals[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate projected values for existing dates
    xValues.forEach(x => {
      projectedWeights.push(slope * x + intercept);
    });
    
    // Add 30 days of future projections
    const lastX = xValues[xValues.length - 1];
    for (let i = 1; i <= 30; i++) {
      const futureX = lastX + i;
      const projectedWeight = slope * futureX + intercept;
      projectedWeights.push(projectedWeight);
      
      // Add future date label
      const futureDate = new Date(weightDates[weightDates.length - 1]);
      futureDate.setDate(futureDate.getDate() + i);
      weightDates.push(futureDate.toLocaleDateString());
    }
  }

  const datasets = [{
    label: 'Weight (lbs)',
    data: weightVals,
    borderColor: CE_PALETTE.weightLine,
    backgroundColor: CE_PALETTE.weightFill,
    borderWidth: 3,
    pointRadius: 3,
    pointHoverRadius: 5,
    fill: true,
    tension: 0.3
  }];
  
  // Add projected weight dataset if we have projections
  if (projectedWeights.length > 0) {
    datasets.push({
      label: 'Projected Weight (lbs)',
      data: projectedWeights,
      borderColor: CE_PALETTE.projection,
      backgroundColor: CE_PALETTE.projectionFill,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      fill: false,
      tension: 0.1,
      borderDash: [5, 5]
    });
  }

  const wtCtx = wtChartEl.getContext('2d');
  weightChartInstance = new Chart(wtCtx, {
    type: 'line',
    data: {
      labels: weightDates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, activeElements, chart) => {
        // Use nearest mode with x-axis for reliable line point detection
        const points = chart.getElementsAtEventForMode(
          event,
          'nearest',
          { axis: 'x', intersect: false },
          false
        );
        
        if (points && points.length > 0) {
          const index = points[0].index;
          const datasetIndex = points[0].datasetIndex;
          const date = weightDates[index];
          
          let content = `<div class="chart-tooltip-header">📅 ${date}</div>`;
          
          if (datasetIndex === 0 && index < weightVals.length) {
            // Actual weight
            const weight = weightVals[index];
            content += `<div class="chart-tooltip-total">⚖️ Weight: ${weight} lbs</div>`;
          } else if (datasetIndex === 1 && index < projectedWeights.length) {
            // Projected weight
            const projWeight = projectedWeights[index].toFixed(1);
            content += `<div class="chart-tooltip-total">📈 Projected: ${projWeight} lbs</div>`;
          }
          
          showChartTooltip(event, content);
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { color: '#f0f0f0' }
        },
        tooltip: {
          enabled: false
        }
      },
      scales: { 
        y: { 
          beginAtZero: false,
          ticks: { color: '#f0f0f0' },
          grid: { color: '#333' },
          title: {
            display: true,
            text: 'Weight (lbs)',
            color: '#f0f0f0'
          }
        },
        x: {
          ticks: { color: '#f0f0f0' },
          grid: { color: '#333' }
        }
      }
    }
  });
}

/********************************
 * CONTACT
 ********************************/
if (sendMessageBtn) {
  sendMessageBtn.addEventListener('click', () => {
    alert('Your message has been sent. Thank you!');
    const nameEl = document.getElementById('contactName');
    const emailEl = document.getElementById('contactEmail');
    const msgEl = document.getElementById('contactMessage');
    if (nameEl) nameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (msgEl) msgEl.value = '';
  });
}

/********************************
 * INIT / STARTUP
 ********************************/
function showApp() {
  reloadProfilesFromStorageIfDirty();
  // Dashboard is now the main / home view
  showSection(sections.dashboard);

  // load dashboard content
  renderMeals();
  renderDashboardRings();
  renderCharts();
  
  // Render pie charts
  renderAllPieCharts();

  // ensure header reflects logged-in state
  updateMenuVisibility();

  // keep targets in memory for other pages
  loadTargetsUI();
}

document.addEventListener('DOMContentLoaded', () => {
  const qpBoot = new URLSearchParams(window.location.search);
  if (qpBoot.get('guest') === '1' && typeof bootstrapCaloriEatGuestIfNeeded === 'function') {
    bootstrapCaloriEatGuestIfNeeded();
  }

  if (!currentUser) currentUser = localStorage.getItem('currentUser') || null;
  profiles = JSON.parse(localStorage.getItem('profiles')) || {};
  if (typeof window.ensureCaloriEatGuestProfile === 'function' && typeof window.CALORIEAT_GUEST_KEY !== 'undefined' && currentUser === window.CALORIEAT_GUEST_KEY) {
    profiles = window.ensureCaloriEatGuestProfile(profiles);
    localStorage.setItem('profiles', JSON.stringify(profiles));
    if (profiles[currentUser] && profiles[currentUser].goal) userGoal = profiles[currentUser].goal;
  }
  updateMenuVisibility();

  if (sections && sections.dashboard && typeof showSection === 'function') {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const go = urlParams.get('go');

    if (currentUser) {
      if (page === 'account') {
        window.location.replace('profile.html');
        return;
      } else if (page === 'help') {
        showSection(sections.help);
      } else if (page === 'contact') {
        showSection(sections.contact);
      } else if (go === 'dashboard' || page === 'dashboard') {
        showApp();
      } else {
        showApp();
      }
    } else {
      const signup = urlParams.get('signup');
      if (signup === '1') {
        clearProfileSetupFields();
        showSection(sections.profile);
        updateMenuVisibility();
      } else {
        showSection(sections.login);
        updateMenuVisibility();
      }
    }
  }

  if (!currentUser && window.location.hash === '#loginSection') {
    window.location.replace('sign-in.html');
  }
  
  // Setup average calories selector
  setupAverageCaloriesSelector();
  
  // Setup pie chart selectors
  setupPieChartSelectors();

  // After Log Food (or another tab) updates localStorage, refresh dashboard when user comes back
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !currentUser) return;
    if (!sections || !sections.dashboard) return;
    if (sections.dashboard.classList.contains('hidden')) return;
    if (!reloadProfilesFromStorageIfDirty()) return;
    renderMeals();
    renderDashboardRings();
    renderCharts();
    if (typeof renderAllPieCharts === 'function') renderAllPieCharts();
  });
});

/********************************
 * FULLSCREEN CHART FUNCTIONALITY
 ********************************/

// Setup fullscreen handlers for all charts
function setupFullscreenHandlers() {
  const chartContainers = document.querySelectorAll('.chart-container[data-chart]');
  
  chartContainers.forEach(container => {
    const expandBtn = container.querySelector('.expand-btn');
    const canvas = container.querySelector('canvas');
    
    // Position expand button at top-right of canvas
    if (expandBtn && canvas) {
      positionExpandButton(container, expandBtn, canvas);
    }
    
    // Expand button click
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen(container);
      });
    }
    
    // Double-click disabled - users must use expand button to go fullscreen
  });
  
  // Reposition buttons on window resize
  window.addEventListener('resize', () => {
    chartContainers.forEach(container => {
      const expandBtn = container.querySelector('.expand-btn');
      const canvas = container.querySelector('canvas');
      if (expandBtn && canvas && !container.classList.contains('fullscreen')) {
        positionExpandButton(container, expandBtn, canvas);
      }
    });
  });
  
  // ESC key to exit fullscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const fullscreenChart = document.querySelector('.chart-container.fullscreen');
      if (fullscreenChart) {
        toggleFullscreen(fullscreenChart);
      }
    }
  });
}

function positionExpandButton(container, button, canvas) {
  if (container.querySelector('.chart-canvas-head')) {
    button.style.top = '';
    button.style.right = '';
    button.style.position = '';
    return;
  }
  const containerRect = container.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const hasComplexControls = container.querySelector('.chart-header');
  const offset = hasComplexControls ? 35 : 10;
  const topOffset = canvasRect.top - containerRect.top - offset;
  button.style.top = `${topOffset}px`;
}

function toggleFullscreen(container) {
  const isFullscreen = container.classList.contains('fullscreen');
  const chartType = container.getAttribute('data-chart');
  const expandBtn = container.querySelector('.expand-btn');
  
  if (isFullscreen) {
    // Exit fullscreen
    container.classList.remove('fullscreen');
    document.body.classList.remove('fullscreen-active');
    
    // Remove any active tooltips
    const existingTooltips = document.querySelectorAll('.chart-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());
    
    if (expandBtn) {
      expandBtn.setAttribute('title', 'Expand to fullscreen');
    }
    
    // Resize chart back to normal
    setTimeout(() => {
      resizeChart(chartType, false);
      // Reposition button after resize
      const canvas = container.querySelector('canvas');
      if (expandBtn && canvas) {
        positionExpandButton(container, expandBtn, canvas);
      }
    }, 100);
  } else {
    // Enter fullscreen
    container.classList.add('fullscreen');
    document.body.classList.add('fullscreen-active');
    
    if (expandBtn) {
      expandBtn.setAttribute('title', 'Exit fullscreen');
    }
    
    // Resize chart to fullscreen with longer delay for DOM to settle
    setTimeout(() => {
      resizeChart(chartType, true);
    }, 200);
  }
}

function resizeChart(chartType, isFullscreen) {
  // Map chart types to their instances
  const chartInstances = {
    'calorie': caloriesChartInstance,
    'macros': macrosChartInstance,
    'mealType': mealTypeChartInstance,
    'categories': veggiesChartInstance,
    'weight': weightChartInstance
  };
  
  const chartInstance = chartInstances[chartType];
  
  if (chartInstance) {
    // Update chart with new dimensions
    setTimeout(() => {
      chartInstance.resize();
      // Force chart to recalculate its scales and positions
      chartInstance.update('none'); // 'none' = no animation for instant update
    }, 150);
  }
}

function resizeAllDashboardCharts() {
  [
    caloriesChartInstance,
    macrosChartInstance,
    veggiesChartInstance,
    mealTypeChartInstance,
    weightChartInstance,
    macrosPieChartInstance,
    categoriesPieChartInstance,
    mealTypePieChartInstance
  ].forEach((ch) => {
    try {
      if (ch && typeof ch.resize === 'function') ch.resize();
    } catch (e) { /* ignore */ }
  });
}

/** After panels open or when data is sparse, force layout so screenshots still render. */
function updateAllDashboardCharts() {
  [
    caloriesChartInstance,
    macrosChartInstance,
    veggiesChartInstance,
    mealTypeChartInstance,
    weightChartInstance,
    macrosPieChartInstance,
    categoriesPieChartInstance,
    mealTypePieChartInstance
  ].forEach((ch) => {
    try {
      if (ch && typeof ch.resize === 'function') ch.resize();
      if (ch && typeof ch.update === 'function') ch.update('none');
    } catch (e) { /* ignore */ }
  });
}

window.resizeAllDashboardCharts = resizeAllDashboardCharts;
window.updateAllDashboardCharts = updateAllDashboardCharts;

function resizeDashboardChartsInPanel(bodyEl) {
  if (!bodyEl) return;
  const map = [
    ['calorieChart', () => caloriesChartInstance],
    ['macrosChart', () => macrosChartInstance],
    ['veggiesChart', () => veggiesChartInstance],
    ['mealTypeChart', () => mealTypeChartInstance],
    ['weightChart', () => weightChartInstance],
    ['macrosPieChart', () => macrosPieChartInstance],
    ['categoriesPieChart', () => categoriesPieChartInstance],
    ['mealTypePieChart', () => mealTypePieChartInstance]
  ];
  map.forEach(([id, getInst]) => {
    const canvas = document.getElementById(id);
    if (!canvas || !bodyEl.contains(canvas)) return;
    const inst = getInst();
    if (inst && typeof inst.resize === 'function') {
      try {
        inst.resize();
      } catch (e) { /* ignore */ }
    }
  });
}

function initDashboardChartPanels() {
  const root = document.getElementById('dashboardSection');
  if (!root) return;
  const chartByCanvasId = {
    calorieChart: () => caloriesChartInstance,
    macrosChart: () => macrosChartInstance,
    veggiesChart: () => veggiesChartInstance,
    mealTypeChart: () => mealTypeChartInstance,
    weightChart: () => weightChartInstance,
    macrosPieChart: () => macrosPieChartInstance,
    categoriesPieChart: () => categoriesPieChartInstance,
    mealTypePieChart: () => mealTypePieChartInstance
  };
  root.querySelectorAll('[data-dash-chart-panel]').forEach((panel) => {
    const btn = panel.querySelector('.dash-chart-panel__toggle');
    const body = panel.querySelector('.dash-chart-panel__body');
    if (!btn || !body) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      const next = !open;
      btn.setAttribute('aria-expanded', next ? 'true' : 'false');
      body.hidden = !next;
      panel.classList.toggle('dash-chart-panel--open', next);
      if (next) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resizeDashboardChartsInPanel(body);
            body.querySelectorAll('canvas[id]').forEach((canvas) => {
              const getInst = chartByCanvasId[canvas.id];
              const inst = getInst ? getInst() : null;
              try {
                if (inst && typeof inst.update === 'function') inst.update('none');
              } catch (e) { /* ignore */ }
            });
            root.querySelectorAll('.chart-container[data-chart]').forEach((container) => {
              const expandBtn = container.querySelector('.expand-btn');
              const canvas = container.querySelector('canvas');
              if (expandBtn && canvas && !container.classList.contains('fullscreen')) {
                positionExpandButton(container, expandBtn, canvas);
              }
            });
          });
        });
      }
    });
  });
}

// Initialize fullscreen handlers when DOM is ready
function setupDashboardChartUi() {
  setupFullscreenHandlers();
  initDashboardChartPanels();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDashboardChartUi);
} else {
  setupDashboardChartUi();
}