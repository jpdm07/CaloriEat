/**
 * FOOD DATABASE SEARCH INTEGRATION
 * 
 * This file provides the complete search functionality for the CaloriEat app.
 * It includes:
 * - Loading the food database
 * - Searching foods by name/keywords
 * - Auto-filling the meal form
 * - Category detection
 * 
 * ADD THIS CODE TO YOUR standalone-meal.js or app.js file
 */

/********************************
 * FOOD DATABASE MANAGER
 ********************************/

const FoodDatabase = {
  foods: [],
  loaded: false,
  
  /**
   * Initialize and load the food database
   */
  async initialize() {
    try {
      console.log('Loading food database...');
      const response = await fetch('foods-database.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.foods = data.foods || [];
      this.loaded = true;
      
      console.log(`✓ Loaded ${this.foods.length} foods from database`);
      console.log(`✓ Categories: ${data.categories.join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('Failed to load food database:', error);
      this.loaded = false;
      return false;
    }
  },
  
  /**
   * Search foods by query string
   * @param {string} query - Search term
   * @param {number} maxResults - Maximum results to return (default: 20)
   * @returns {Array} - Array of matching foods
   */
  search(query, maxResults = 20) {
    if (!this.loaded || !query) {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
      return [];
    }
    
    // Search foods
    const results = this.foods.filter(food => {
      // Check food name
      if (food.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Check keywords
      if (food.keywords && food.keywords.some(keyword => keyword.includes(searchTerm))) {
        return true;
      }
      
      // Check restaurant name
      if (food.restaurant && food.restaurant.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      return false;
    });
    
    // Sort results by relevance
    results.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match first
      if (aName === searchTerm) return -1;
      if (bName === searchTerm) return 1;
      
      // Starts with match second
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;
      
      // Alphabetical
      return aName.localeCompare(bName);
    });
    
    return results.slice(0, maxResults);
  },
  
  /**
   * Get food by ID
   * @param {number} id - Food ID
   * @returns {Object|null} - Food object or null
   */
  getById(id) {
    return this.foods.find(food => food.id === id) || null;
  },
  
  /**
   * Get foods by category
   * @param {string} category - Category name
   * @returns {Array} - Array of foods in category
   */
  getByCategory(category) {
    return this.foods.filter(food => food.category === category);
  },
  
  /**
   * Get all restaurant foods
   * @returns {Array} - Array of restaurant foods
   */
  getRestaurantFoods() {
    return this.foods.filter(food => food.restaurant);
  },
  
  /**
   * Get statistics about the database
   * @returns {Object} - Database statistics
   */
  getStats() {
    const stats = {
      total: this.foods.length,
      byCategory: {},
      restaurants: new Set()
    };
    
    this.foods.forEach(food => {
      // Count by category
      stats.byCategory[food.category] = (stats.byCategory[food.category] || 0) + 1;
      
      // Collect restaurant names
      if (food.restaurant) {
        stats.restaurants.add(food.restaurant);
      }
    });
    
    stats.restaurantCount = stats.restaurants.size;
    stats.restaurants = Array.from(stats.restaurants);
    
    return stats;
  }
};


/********************************
 * UI COMPONENTS
 ********************************/

/**
 * Create search UI for add-meal.html
 * Call this function when the page loads
 */
function createFoodSearchUI() {
  // Find the meal name input
  const mealInput = document.getElementById('meal');
  
  if (!mealInput) {
    console.error('Meal input not found');
    return;
  }
  
  // Create search container
  const searchContainer = document.createElement('div');
  searchContainer.id = 'foodSearchContainer';
  searchContainer.className = 'food-search-container';
  searchContainer.innerHTML = `
    <div class="food-search-header">
      <div class="ce-label-row">
        <label for="foodSearchInput">Search foods</label>
        <button type="button" class="ce-help-trigger" aria-expanded="false" aria-controls="help-foodSearchInput" title="What is this?">
          <span class="visually-hidden">Help: food search</span>
          <svg class="ce-help-trigger__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </button>
      </div>
      <div id="help-foodSearchInput" class="ce-help-panel" hidden>
        <p>Type a food or restaurant item. Results come from the bundled list—tap one to fill meal name and nutrition when available. You can still edit numbers or skip search and type a custom meal.</p>
      </div>
      <p class="food-search-status" id="foodSearchStatus" aria-live="polite">(Ready)</p>
    </div>
    <input 
      type="text" 
      id="foodSearchInput" 
      class="food-search-input"
      autocomplete="off"
    />
    <div id="foodSearchResults" class="food-search-results"></div>
    <div class="food-search-tip">💡 Tip: Search includes restaurant items from McDonald's, Subway, Chipotle, and more!</div>
  `;
  
  // Insert before the meal input
  mealInput.parentNode.insertBefore(searchContainer, mealInput);
  
  // Add CSS
  addFoodSearchCSS();
  
  // Setup event listeners
  setupFoodSearchListeners();
  
  console.log('✓ Food search UI created');
}

/**
 * Add CSS styles for food search
 */
function addFoodSearchCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .food-search-container {
      margin-bottom: 1.5rem;
    }
    
    .food-search-header {
      margin-bottom: 0.5rem;
    }

    .food-search-header .ce-label-row {
      justify-content: flex-start;
      gap: 0.2rem;
    }

    .food-search-header .ce-label-row label {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--ce-text, #e6eae8);
      flex: 0 1 auto;
      min-width: 0;
    }

    .food-search-status {
      font-size: 0.82rem;
      color: var(--ce-text-muted, #8b9691);
      font-weight: normal;
      margin: 0.25rem 0 0;
    }
    
    .food-search-input {
      display: block;
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid #2a302e;
      border-radius: 5px;
      color: #e6eae8;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }
    
    .food-search-input:focus {
      outline: none;
      border-color: #5a8f7b;
    }
    
    .food-search-results {
      max-height: 300px;
      overflow-y: auto;
      margin-top: 0.5rem;
      background: #141816;
      border-radius: 6px;
      display: none;
    }
    
    .food-search-results.active {
      display: block;
      border: 1px solid #2a302e;
    }
    
    .food-result-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #2a302e;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .food-result-item:last-child {
      border-bottom: none;
    }
    
    .food-result-item:hover {
      background: #1b201e;
    }
    
    .food-result-name {
      color: #fff;
      font-weight: 500;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
    
    .food-result-restaurant {
      color: #d4b84a;
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
    }
    
    .food-result-category {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      background: #1b201e;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #9ebfb4;
      margin-right: 0.5rem;
    }
    
    .food-result-nutrition {
      color: #9e9e9e;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    
    .food-search-tip {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #9e9e9e;
      font-style: italic;
      display: block;
      width: 100%;
    }
    
    .food-search-no-results {
      padding: 1rem;
      text-align: center;
      color: #9e9e9e;
      font-size: 0.9rem;
    }
    
    /* Category colors (sage / muted — matches dashboard charts) */
    .category-fruits { background: #b87a8f !important; }
    .category-veggies { background: #5a9278 !important; }
    .category-wholeGrains { background: #a68f6e !important; }
    .category-leanProteins { background: #6b8cae !important; }
    .category-processedFoods { background: #b8835a !important; }
    .category-sugaryFoods { background: #a85a5a !important; }
  `;
  document.head.appendChild(style);
}

/**
 * Setup event listeners for food search
 */
function setupFoodSearchListeners() {
  const searchInput = document.getElementById('foodSearchInput');
  const resultsContainer = document.getElementById('foodSearchResults');
  const statusEl = document.getElementById('foodSearchStatus');
  
  if (!searchInput || !resultsContainer) {
    return;
  }
  
  let searchTimeout;
  
  // Search as user types
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      resultsContainer.classList.remove('active');
      resultsContainer.innerHTML = '';
      return;
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
      performFoodSearch(query);
    }, 300);
  });
  
  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#foodSearchContainer')) {
      resultsContainer.classList.remove('active');
    }
  });
  
  // Update status when database loads
  if (FoodDatabase.loaded) {
    const stats = FoodDatabase.getStats();
    statusEl.textContent = `(${stats.total} foods available)`;
    statusEl.style.color = '#6fa08e';
  } else {
    statusEl.textContent = '(Loading...)';
    statusEl.style.color = '#d4b84a';
  }
}

/**
 * Perform food search and display results
 * @param {string} query - Search query
 */
function performFoodSearch(query) {
  const resultsContainer = document.getElementById('foodSearchResults');
  
  if (!FoodDatabase.loaded) {
    resultsContainer.innerHTML = '<div class="food-search-no-results">Database not loaded yet...</div>';
    resultsContainer.classList.add('active');
    return;
  }
  
  const results = FoodDatabase.search(query, 15);
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div class="food-search-no-results">No foods found. Try a different search term.</div>';
    resultsContainer.classList.add('active');
    return;
  }
  
  // Build results HTML
  let html = '';
  results.forEach(food => {
    html += `
      <div class="food-result-item" data-food-id="${food.id}">
        <div class="food-result-name">${food.name}</div>
        ${food.restaurant ? `<div class="food-result-restaurant">📍 ${food.restaurant}</div>` : ''}
        <div>
          <span class="food-result-category category-${food.category}">${getCategoryDisplayName(food.category)}</span>
        </div>
        <div class="food-result-nutrition">
          ${Math.round(food.calories)} cal | 
          ${food.protein.toFixed(1)}g protein | 
          ${food.carbs.toFixed(1)}g carbs | 
          ${food.fat.toFixed(1)}g fat
        </div>
      </div>
    `;
  });
  
  resultsContainer.innerHTML = html;
  resultsContainer.classList.add('active');
  
  // Add click handlers
  resultsContainer.querySelectorAll('.food-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const foodId = parseInt(item.dataset.foodId);
      selectFood(foodId);
    });
  });
}

/**
 * Select a food and auto-fill the form
 * @param {number} foodId - Food ID
 */
function selectFood(foodId) {
  const food = FoodDatabase.getById(foodId);
  
  if (!food) {
    console.error('Food not found:', foodId);
    return;
  }
  
  console.log('Selected food:', food);
  
  // Fill in the form
  const mealInput = document.getElementById('meal');
  const caloriesInput = document.getElementById('calories');
  const proteinInput = document.getElementById('protein');
  const carbsInput = document.getElementById('carbs');
  const fatInput = document.getElementById('fat');
  const sugarInput = document.getElementById('sugar');
  const veggiesInput = document.getElementById('veggies');
  
  if (mealInput) mealInput.value = food.name;
  if (caloriesInput) caloriesInput.value = Math.round(food.calories);
  if (proteinInput) proteinInput.value = food.protein.toFixed(1);
  if (carbsInput) carbsInput.value = food.carbs.toFixed(1);
  if (fatInput) fatInput.value = food.fat.toFixed(1);
  if (sugarInput) sugarInput.value = food.sugar.toFixed(1);
  
  // AUTO-FILL VEGGIES: If food is in "veggies" category, auto-fill 1 serving
  if (veggiesInput && food.category === 'veggies') {
    veggiesInput.value = '1';
    
    // Trigger the veggie grams display update
    const event = new Event('input', { bubbles: true });
    veggiesInput.dispatchEvent(event);
    
    console.log('✓ Auto-filled veggies: 1 serving (food is a vegetable)');
  } else if (veggiesInput) {
    // Clear veggies if not a vegetable
    veggiesInput.value = '';
    
    // Trigger the veggie grams display update
    const event = new Event('input', { bubbles: true });
    veggiesInput.dispatchEvent(event);
  }
  
  // Close search results
  const resultsContainer = document.getElementById('foodSearchResults');
  if (resultsContainer) {
    resultsContainer.classList.remove('active');
  }
  
  // Keep the food name visible in search box
  // This way if validation fails, user can see what they selected
  const searchInput = document.getElementById('foodSearchInput');
  if (searchInput) {
    searchInput.value = food.name; // Keep food name visible
  }
  
  // Show success message with veggie info
  let message = `✓ Auto-filled: ${food.name}`;
  if (food.category === 'veggies') {
    message += ' (1 veggie serving)';
  }
  showNotification(message, 'success');
  
  // Log category for debugging
  console.log('Category:', food.category, '-', getCategoryDisplayName(food.category));
}

/**
 * Show a notification message
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `food-notification notification-${type}`;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'ce-toast-in 0.28s cubic-bezier(0.4, 0, 1, 1) reverse forwards';
    setTimeout(() => notification.remove(), 280);
  }, 3000);
}

/**
 * Get category display name
 * (This should match your existing function in app.js)
 */
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


/********************************
 * INITIALIZATION
 ********************************/

/**
 * Initialize the food database system
 * Call this when the page loads
 */
async function initializeFoodDatabase() {
  console.log('Initializing food database...');
  
  // Load database
  const loaded = await FoodDatabase.initialize();
  
  if (loaded) {
    const stats = FoodDatabase.getStats();
    console.log('✓ Database ready!');
    console.log('  - Total foods:', stats.total);
    console.log('  - Categories:', Object.keys(stats.byCategory).length);
    console.log('  - Restaurants:', stats.restaurantCount);
    console.log('  - Breakdown:', stats.byCategory);
    
    // Create search UI if on add-meal page
    if (document.getElementById('meal')) {
      createFoodSearchUI();
    }
  } else {
    console.error('✗ Failed to load database');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFoodDatabase);
} else {
  initializeFoodDatabase();
}


/********************************
 * EXPORT FOR USE IN OTHER FILES
 ********************************/

// If using modules, export these
// export { FoodDatabase, selectFood, performFoodSearch, initializeFoodDatabase };
