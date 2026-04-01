/********************************
 * STANDALONE WEIGH IN PAGE
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
const weighInLbsInput = document.getElementById('weighInLbs');
const addWeighInBtn = document.getElementById('addWeighInBtn');
const weightHistory = document.getElementById('weightHistory');

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

// Logout functionality
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

// Helper function
function todayStr() {
  return new Date().toLocaleDateString();
}

// Display weight history
function displayWeightHistory() {
  const user = profiles[currentUser];
  if (!user || !user.weighIns || user.weighIns.length === 0) {
    weightHistory.innerHTML = '<p style="color: #aaa;">No weight entries yet.</p>';
    return;
  }

  weightHistory.innerHTML = '';
  
  // Show most recent entries first
  const sorted = [...user.weighIns].reverse();
  
  sorted.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.style.cssText = 'background: #2a2a2a; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
    
    const info = document.createElement('span');
    info.textContent = `${entry.date}: ${entry.weightLbs} lbs`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'small-btn delete';
    deleteBtn.textContent = '🗑 Delete';
    deleteBtn.style.width = 'auto';
    deleteBtn.addEventListener('click', () => {
      deleteWeighIn(user.weighIns.length - 1 - index);
    });
    
    entryDiv.appendChild(info);
    entryDiv.appendChild(deleteBtn);
    weightHistory.appendChild(entryDiv);
  });
}

// Add weigh in
if (addWeighInBtn) {
  addWeighInBtn.addEventListener('click', () => {
    const wVal = weighInLbsInput.value.trim();
    if (!wVal || isNaN(parseFloat(wVal))) {
      alert('Please enter a valid weight in lbs.');
      return;
    }

    const user = profiles[currentUser];
    if (!user) return;

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
    displayWeightHistory();
  });
}

// Delete weigh in
function deleteWeighIn(index) {
  if (!confirm('Delete this weight entry?')) return;

  const user = profiles[currentUser];
  user.weighIns.splice(index, 1);
  
  // Update current weight to most recent entry
  if (user.weighIns.length > 0) {
    user.weightLbs = user.weighIns[user.weighIns.length - 1].weightLbs;
  }

  localStorage.setItem('profiles', JSON.stringify(profiles));
  markCaloriEatProfilesDirty();
  displayWeightHistory();
}

// Initial display
refreshStandaloneNavMenu();
displayWeightHistory();

(function showToolBottomNav() {
  const n = document.getElementById('appBottomNav');
  if (n) {
    n.classList.add('is-visible');
    document.body.classList.add('ce-pad-bottom');
  }
})();