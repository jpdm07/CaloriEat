/********************************
 * STANDALONE SET GOALS PAGE - WITH SUGAR TRACKING
 ********************************/

let currentUser;
let profiles;
if (typeof bootstrapCaloriEatGuestIfNeeded === 'function') {
  const boot = bootstrapCaloriEatGuestIfNeeded();
  currentUser = boot.currentUser;
  profiles = boot.profiles;
} else {
  currentUser = localStorage.getItem('currentUser') || null;
  profiles = JSON.parse(localStorage.getItem('profiles')) || {};
  if (!currentUser) {
    alert('Please open CaloriEat from the home page (index.html).');
    window.location.href = 'index.html';
  }
}

function markCaloriEatProfilesDirty() {
  try {
    sessionStorage.setItem('ce_calorieat_profiles_dirty', '1');
  } catch (e) {
    /* ignore */
  }
}

// DOM Elements
const menuIcon = document.getElementById('menuIcon');
const menuDropdown = document.getElementById('menuDropdown');

function syncStandaloneMenuLayout() {
  if (!menuDropdown) return;
  if (menuDropdown.style.display !== 'block') {
    menuDropdown.style.display = 'none';
  }
}
const menuLogout = document.getElementById('menuLogout');
const goalSelect = document.getElementById('goal');
const targetCaloriesInput = document.getElementById('targetCalories');
const saveGoalBtn = document.getElementById('saveGoalBtn');
const proteinTargetInput = document.getElementById('proteinTarget');
const carbsTargetInput = document.getElementById('carbsTarget');
const fatTargetInput = document.getElementById('fatTarget');
const sugarTargetInput = document.getElementById('sugarTarget');
const veggiesTargetInput = document.getElementById('veggiesTarget');
const saveTargetsBtn = document.getElementById('saveTargetsBtn');
const currentGoalDisplay = document.getElementById('currentGoalDisplay');

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

if (menuDropdown) {
  menuDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

window.addEventListener('resize', syncStandaloneMenuLayout);

function refreshStandaloneNavMenu() {
  const loggedIn = !!localStorage.getItem('currentUser');
  document.querySelectorAll('.menu-auth-only').forEach((el) => {
    el.style.display = loggedIn ? '' : 'none';
  });
  document.querySelectorAll('.menu-public-only').forEach((el) => {
    el.style.display = loggedIn ? 'none' : '';
  });
  if (typeof window.syncCaloriEatNavLabels === 'function') {
    window.syncCaloriEatNavLabels();
  }
  syncStandaloneMenuLayout();
}

if (menuLogout) {
  menuLogout.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'welcome.html';
  });
}

// Load current goals
function loadGoals() {
  const user = profiles[currentUser];
  if (!user) return;

  // Load calorie goal
  if (user.goal) {
    goalSelect.value = user.goal.type || 'maintain';
    targetCaloriesInput.value = user.goal.target || '';
  }

  // Load macro targets
  if (user.macroGoals) {
    proteinTargetInput.value = user.macroGoals.proteinTarget || '';
    carbsTargetInput.value = user.macroGoals.carbsTarget || '';
    fatTargetInput.value = user.macroGoals.fatTarget || '';
    sugarTargetInput.value = user.macroGoals.sugarTarget || '';
    veggiesTargetInput.value = user.macroGoals.veggiesTarget || '';
  }

  displayCurrentGoals();
}

// Display current goals
function displayCurrentGoals() {
  const user = profiles[currentUser];
  if (!user) return;

  let goalText = '';

  if (user.goal) {
    goalText += `<strong>Calorie Goal:</strong> ${user.goal.type} - ${user.goal.target} cal/day<br>`;
  } else {
    goalText += `<strong>Calorie Goal:</strong> Not set<br>`;
  }

  if (user.macroGoals) {
    goalText += `<strong>Protein:</strong> ${user.macroGoals.proteinTarget || 0}g | `;
    goalText += `<strong>Carbs:</strong> ${user.macroGoals.carbsTarget || 0}g | `;
    goalText += `<strong>Fat:</strong> ${user.macroGoals.fatTarget || 0}g | `;
    goalText += `<strong>Sugar:</strong> ${user.macroGoals.sugarTarget || 0}g | `;
    goalText += `<strong>Veggies:</strong> ${user.macroGoals.veggiesTarget || 0} servings`;
  } else {
    goalText += `<strong>Macro Targets:</strong> Not set`;
  }

  currentGoalDisplay.innerHTML = goalText;
}

// Save calorie goal
if (saveGoalBtn) {
  saveGoalBtn.addEventListener('click', () => {
    const goalType = goalSelect.value;
    const target = parseInt(targetCaloriesInput.value);

    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid calorie goal.');
      return;
    }

    const user = profiles[currentUser];
    if (!user) return;

    user.goal = { type: goalType, target };
    localStorage.setItem('profiles', JSON.stringify(profiles));
    markCaloriEatProfilesDirty();

    alert('Calorie goal saved successfully!');
    displayCurrentGoals();
  });
}

// Save macro targets
if (saveTargetsBtn) {
  saveTargetsBtn.addEventListener('click', () => {
    const pT = parseFloat(proteinTargetInput.value) || 0;
    const cT = parseFloat(carbsTargetInput.value) || 0;
    const fT = parseFloat(fatTargetInput.value) || 0;
    const sT = parseFloat(sugarTargetInput.value) || 0;
    const vT = parseFloat(veggiesTargetInput.value) || 0;

    const user = profiles[currentUser];
    if (!user) return;

    if (!user.macroGoals) user.macroGoals = {};
    user.macroGoals.proteinTarget = pT;
    user.macroGoals.carbsTarget = cT;
    user.macroGoals.fatTarget = fT;
    user.macroGoals.sugarTarget = sT;
    user.macroGoals.veggiesTarget = vT;

    localStorage.setItem('profiles', JSON.stringify(profiles));
    markCaloriEatProfilesDirty();
    alert('Macro targets saved successfully!');
    displayCurrentGoals();
  });
}

// Initial load
refreshStandaloneNavMenu();
loadGoals();

(function showToolBottomNav() {
  const n = document.getElementById('appBottomNav');
  if (n) {
    n.classList.add('is-visible');
    document.body.classList.add('ce-pad-bottom');
  }
})();