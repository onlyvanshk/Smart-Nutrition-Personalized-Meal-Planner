// =================================================================================
// ==                             GEMINI API INTEGRATION                          ==
// =================================================================================

// NOTE: Environment automatically provides the key. Keep this empty string.
const apiKey = "AIzaSyDhF_5F15GA0An1cqKfuY4UYLEmu59ntX0"; 

// CORRECTED: Fixed model name and URL parameter syntax
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// Helper delay function for backoff (wait time between retries)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiAPI(prompt, isJson = false, retryCount = 0) {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
    };
    
    // Configure response as JSON if requested (useful for meal plan generation)
    if (isJson) {
        payload.generationConfig = {
            responseMimeType: "application/json",
        };
    }

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Handle rate limits or errors with exponential backoff
        if (!response.ok) {
            // Retry up to 3 times (1s, 2s, 4s wait)
            if (retryCount < 3) {
                const waitTime = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying API call in ${waitTime}ms...`);
                await delay(waitTime);
                return callGeminiAPI(prompt, isJson, retryCount + 1);
            }
            
            const errorBody = await response.json();
            console.error("API Error:", errorBody);
            // Return error message to display in UI
            return { error: `API Error: ${errorBody.error?.message || 'Unknown error'}` };
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            return { text: candidate.content.parts[0].text };
        } else {
            return { error: "Unexpected response format from API." };
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return { error: "Network error or failed to fetch." };
    }
}


// =================================================================================
// ==                             MEAL DATABASE (Indian Focus)                      ==
// =================================================================================
const mealDatabase = {
    // Extensive database with varied options
    'non-vegetarian': {
        breakfast: [
            { name: "Scrambled Eggs with Multigrain Toast", calories: 350, protein: 25, carbs: 5, fat: 25, portion: "2 large eggs, 1 slice toast", ingredients: ["2 Eggs", "1 slice Multigrain Bread", "1 tsp Olive Oil", "Salt", "Pepper"], recipe: "Heat olive oil in a pan. Whisk eggs with salt and pepper, pour into the pan, and scramble until cooked. Serve with toast." },
            { name: "Chicken Sausage & Vegetable Upma", calories: 450, protein: 22, carbs: 40, fat: 20, portion: "2 sausages, 1 bowl Upma", ingredients: ["2 Chicken Sausages", "1/2 cup Rava (Semolina)", "1 cup mixed Vegetables", "1 tsp Oil", "Mustard Seeds", "Curry Leaves"], recipe: "Roast Rava. Sauté vegetables with spices. Add water and Rava, cook until done. Serve with cooked sausages." },
        ],
        lunch: [
            { name: "Chicken Curry with Brown Rice", calories: 500, protein: 45, carbs: 30, fat: 22, portion: "150g chicken, 1 cup rice", ingredients: ["150g Chicken Breast", "1 cup Brown Rice", "1 Onion", "2 Tomatoes", "1 tbsp Low-fat Yogurt", "Indian Spices"], recipe: "Cook chicken with onion, tomatoes, and Indian spices to make a lean curry. Serve with brown rice." },
            { name: "Anda Bhurji (Egg Scramble) with Roti", calories: 480, protein: 30, carbs: 45, fat: 18, portion: "2 eggs, 2 Rotis", ingredients: ["2 Eggs", "1/2 Onion, chopped", "1 Tomato, chopped", "2 Whole Wheat Rotis", "Coriander", "Chili"], recipe: "Scramble eggs with sautéed onion, tomato, and spices. Serve hot with 2 whole wheat rotis." },
        ],
        dinner: [
            { name: "Salmon with Roasted Asparagus", calories: 550, protein: 40, carbs: 15, fat: 35, portion: "150g salmon fillet, 1 cup asparagus", ingredients: ["150g Salmon Fillet", "1 cup Asparagus", "1 tbsp Olive Oil", "1 Lemon", "Salt", "Pepper"], recipe: "Preheat oven to 200°C. Toss asparagus with olive oil, salt, and pepper. Place on a baking sheet with the salmon fillet. Bake for 12-15 minutes. Squeeze lemon over before serving." },
            { name: "Lean Mutton Curry and Salad", calories: 520, protein: 38, carbs: 20, fat: 30, portion: "150g mutton, 1 large salad", ingredients: ["150g Lean Mutton", "1 cup Mixed Greens", "1/2 Cucumber", "Indian Spices"], recipe: "Pressure cook lean mutton with water and spices. Serve with a large side salad of mixed greens and cucumber." },
        ]
    },
    'vegetarian': {
        breakfast: [
            { name: "Masala Oats/Porridge", calories: 300, protein: 12, carbs: 50, fat: 5, portion: "1 cup cooked oats", ingredients: ["1/2 cup Rolled Oats", "1 cup Water", "Mixed Vegetables", "1/2 tsp Masala Spice"], recipe: "Cook oats with water, mixed vegetables, and a pinch of savory masala spice." },
            { name: "Paneer Scramble (Bhurji) with Toast", calories: 400, protein: 25, carbs: 15, fat: 28, portion: "150g paneer, 1 slice toast", ingredients: ["150g Paneer, crumbled", "1 Onion, chopped", "1 Tomato, chopped", "1 tsp Turmeric", "Salt", "1 slice Whole Wheat Toast"], recipe: "Sauté onion and tomato. Add turmeric and salt. Add crumbled paneer and cook for 5 minutes. Serve with toast." },
        ],
        lunch: [
            { name: "Dal Chawal with Curd", calories: 450, protein: 18, carbs: 70, fat: 10, portion: "1 cup Dal, 1 cup Rice", ingredients: ["1 cup cooked Dal (Lentils)", "1 cup Brown Rice", "1/2 cup Low-fat Curd", "Coriander"], recipe: "Serve fresh dal with brown rice and a side of low-fat curd (dahi)." },
            { name: "Rajma Chawal (Kidney Beans & Rice)", calories: 500, protein: 20, carbs: 75, fat: 14, portion: "1 cup Rajma, 1 cup Rice", ingredients: ["1 cup cooked Rajma (Kidney Beans)", "1 cup Brown Rice", "Onion", "Tomato", "Rajma Masala"], recipe: "Prepare a light rajma curry and serve over brown rice." },
        ],
        dinner: [
            { name: "Moong Dal Cheela (Pancakes)", calories: 400, protein: 22, carbs: 60, fat: 8, portion: "2 large Cheelas", ingredients: ["1 cup Moong Dal Batter", "1 Carrot, grated", "1 Onion, chopped", "Mint Chutney"], recipe: "Cook cheelas on a non-stick pan. Stuff with grated vegetables. Serve with mint chutney." },
            { name: "Tofu/Soya Bean Stir-fry with Veggies", calories: 480, protein: 25, carbs: 40, fat: 23, portion: "150g Tofu/Soya, 1 cup vegetables", ingredients: ["150g Firm Tofu/Soya", "1 cup Mixed Vegetables", "2 tbsp Soy Sauce", "1/2 cup Brown Rice"], recipe: "Press and cube tofu/soya. Stir-fry until golden. Add vegetables and soy sauce. Serve over brown rice." },
        ]
    },
    'vegan': {
        breakfast: [
            { name: "Oatmeal with Almond Milk and Fruit", calories: 350, protein: 10, carbs: 60, fat: 10, portion: "1/2 cup oats, 1 cup milk", ingredients: ["1/2 cup Rolled Oats", "1 cup Almond Milk", "1 Banana, sliced", "1 tbsp Chia Seeds"], recipe: "Cook oats with almond milk. Top with banana and chia seeds." },
            { name: "Tofu Scramble (Vegan Bhurji Style)", calories: 320, protein: 20, carbs: 8, fat: 24, portion: "150g tofu", ingredients: ["150g Firm Tofu, crumbled", "1/4 tsp Turmeric", "1/4 tsp Black Salt (Kala Namak)", "1 cup Spinach"], recipe: "Crumble tofu into a pan. Add spices (including Kala Namak for an 'eggy' flavor) and spinach. Cook until heated through." },
        ],
        lunch: [
            { name: "Vegan Chana Masala (Chickpea Curry)", calories: 450, protein: 18, carbs: 75, fat: 10, portion: "1 cup Chana, 1 cup Rice", ingredients: ["1 cup cooked Chickpeas", "1 cup Brown Rice", "Tomato puree", "Chana Masala Spice"], recipe: "Prepare chana masala without cream or dairy. Serve hot with brown rice." },
            { name: "Quinoa Bowl with Black Beans & Corn", calories: 500, protein: 20, carbs: 75, fat: 14, portion: "1 cup quinoa, 1/2 cup beans", ingredients: ["1 cup cooked Quinoa", "1/2 cup Black Beans", "1/2 Avocado", "1/4 cup Corn", "Salsa"], recipe: "Combine all ingredients in a bowl and top with salsa." },
        ],
        dinner: [
            { name: "Masoor Dal (Red Lentil Soup)", calories: 400, protein: 22, carbs: 65, fat: 5, portion: "1 large bowl", ingredients: ["1 cup Red Lentils", "1 Onion", "2 Carrots", "4 cups Vegetable Broth", "Ginger/Garlic"], recipe: "Sauté onion and carrots. Add lentils and broth. Simmer for 25 minutes until lentils are soft. Use minimal oil/ghee for tempering." },
            { name: "Tofu and Vegetable Stir-fry", calories: 480, protein: 25, carbs: 40, fat: 23, portion: "150g tofu, 1 cup vegetables", ingredients: ["150g Firm Tofu, cubed", "1 cup Mixed Vegetables", "2 tbsp Soy Sauce", "1/2 cup Brown Rice"], recipe: "Press and cube tofu. Stir-fry until golden. Add vegetables and soy sauce. Serve over brown rice." },
        ]
    },
    snacks: [
        { name: "Fruit with Peanut Butter", calories: 250, protein: 7, carbs: 30, fat: 15, portion: "1 medium apple, 2 tbsp PB", ingredients: ["1 Apple/Banana", "2 tbsp Peanut Butter"], recipe: "Slice fruit and serve with peanut butter." },
        { name: "Handful of Almonds & Walnuts", calories: 180, protein: 6, carbs: 6, fat: 15, portion: "Approx. 20 nuts", ingredients: ["10 Almonds", "5 Walnuts"], recipe: "Enjoy a handful of raw or roasted nuts." },
        { name: "Protein Shake", calories: 200, protein: 25, carbs: 10, fat: 5, portion: "1 scoop protein powder", ingredients: ["1 scoop Protein Powder", "250ml Water or Milk/Almond Milk"], recipe: "Mix protein powder with water or milk and shake well." },
    ]
};

function getRandomMeal(mealType, dietPreference) {
    const availableMeals = mealDatabase[dietPreference][mealType];
    return availableMeals[Math.floor(Math.random() * availableMeals.length)];
}

function getSnack() {
    return mealDatabase.snacks[Math.floor(Math.random() * mealDatabase.snacks.length)];
}

/**
 * AI Meal Plan Generator
 * Generates a meal plan based on user's target calories.
 * It's a simplified rule-based system.
 */
function generateMealPlan(profile) {
    let plan;
    let totalCalories = 0;
    const maxAttempts = 10;
    let attempts = 0;

    // This loop tries to find a combination of meals that is close to the target calorie count.
    do {
        plan = {
            breakfast: getRandomMeal('breakfast', profile.dietPreference),
            lunch: getRandomMeal('lunch', profile.dietPreference),
            dinner: getRandomMeal('dinner', profile.dietPreference),
            snacks: getSnack()
        };
        totalCalories = plan.breakfast.calories + plan.lunch.calories + plan.dinner.calories + plan.snacks.calories;
        attempts++;
    } while (Math.abs(totalCalories - profile.targetCalories) > 150 && attempts < maxAttempts); // try to get within 150 calories

    return plan;
}


// =================================================================================
// ==                            APPLICATION STATE & LOGIC                        ==
// =================================================================================

let userProfile = {};
let mealPlan = {};
let weightHistory = [];
let weightChart, calorieChart;
let currentRecipeForAI = null;

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupEventListeners();

    if (userProfile.name) {
        initializeApp();
    } else {
        showPage('profile-page');
    }
});

function setupEventListeners() {
    document.getElementById('profile-form').addEventListener('submit', handleProfileSubmit);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('href').substring(1);
            handleNavigation(targetId);
        });
    });

    document.getElementById('save-weight-btn').addEventListener('click', handleSaveWeight);
    document.getElementById('ai-chef-btn').addEventListener('click', handleAIChefQuery);
    document.getElementById('gemini-regenerate-btn').addEventListener('click', handleGeminiRegenerate);
}

function handleNavigation(targetId) {
     document.querySelectorAll('.main-content').forEach(content => content.classList.add('hidden'));
     document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('bg-gray-100', 'font-semibold'));
     
     const activeLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
     if(activeLink) {
        activeLink.classList.add('bg-gray-100', 'font-semibold');
     }
     
    if (targetId === 'dashboard') {
        renderDashboard(); // Re-render to ensure it's up to date
        document.getElementById('dashboard-content').classList.remove('hidden');
    } else if (targetId === 'progress') {
        renderProgressPage();
        document.getElementById('progress-content').classList.remove('hidden');
    } else if (targetId === 'grocery') {
        renderGroceryListPage();
        document.getElementById('grocery-content').classList.remove('hidden');
    } else if (targetId === 'profile') {
        renderProfilePage();
        document.getElementById('profile-content').classList.remove('hidden');
    }
}

function loadState() {
    const savedProfile = localStorage.getItem('userProfile');
    const savedMealPlan = localStorage.getItem('mealPlan');
    const savedWeightHistory = localStorage.getItem('weightHistory');

    // **NOTE ON PERSISTENCE:** In a production system (as per your synopsis), 
    // this data would be fetched from the MongoDB backend, not localStorage.
    if (savedProfile) userProfile = JSON.parse(savedProfile);
    if (savedMealPlan) mealPlan = JSON.parse(savedMealPlan);
    if (savedWeightHistory) weightHistory = JSON.parse(savedWeightHistory);
}

function saveState() {
    // **NOTE ON PERSISTENCE:** In a production system, this data would be sent 
    // to the Node.js/Express.js backend to be saved in MongoDB.
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    localStorage.setItem('weightHistory', JSON.stringify(weightHistory));
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function initializeApp() {
    if (!mealPlan.breakfast) { // Generate a new plan if one doesn't exist
        mealPlan = generateMealPlan(userProfile);
        saveState();
    }
    handleNavigation('dashboard'); // Navigate to dashboard
    showPage('main-app');
}

function handleProfileSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const age = parseInt(document.getElementById('age').value);
    const height = parseInt(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = parseFloat(document.getElementById('activity-level').value);
    const goal = document.getElementById('goal').value;
    const dietPreference = document.getElementById('diet-preference').value;

    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation (as per synopsis)
    let bmr;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityLevel;

    // Adjust calories for goal
    let targetCalories;
    if (goal === 'loss') {
        targetCalories = tdee - 500;
    } else if (goal === 'gain') {
        targetCalories = tdee + 500;
    } else {
        targetCalories = tdee;
    }
    
    userProfile = { name, age, height, weight, gender, activityLevel, goal, dietPreference, tdee: Math.round(tdee), targetCalories: Math.round(targetCalories) };
    
    // Initialize weight history
    weightHistory = [{ date: new Date().toLocaleDateString(), weight: weight }];
    
    mealPlan = generateMealPlan(userProfile);
    saveState();
    initializeApp();
}

function handleSaveWeight() {
    const newWeight = parseFloat(document.getElementById('new-weight-input').value);
    if (!isNaN(newWeight) && newWeight > 0) {
        weightHistory.push({ date: new Date().toLocaleDateString(), weight: newWeight });
        userProfile.weight = newWeight; // Update current weight in profile
        saveState();
        renderProgressPage(); // Re-render the charts
        closeModal('add-weight-modal');
    } else {
        alert("Please enter a valid weight.");
    }
}

async function handleAIChefQuery() {
    const promptInput = document.getElementById('ai-chef-prompt');
    const userQuery = promptInput.value.trim();
    const responseContainer = document.getElementById('ai-chef-response');

    if (!userQuery || !currentRecipeForAI) return;

    responseContainer.innerHTML = '<div class="spinner mx-auto"></div>';

    const fullPrompt = `You are a helpful AI Chef. A user is looking at the recipe for "${currentRecipeForAI.name}". The recipe is: "${currentRecipeForAI.recipe}". The user asks: "${userQuery}". Please provide a helpful and concise answer.`;
    
    const result = await callGeminiAPI(fullPrompt);

    if (result.error) {
        responseContainer.innerHTML = `<p class="text-red-500">${result.error}</p>`;
    } else {
        responseContainer.innerHTML = `<p>${result.text.replace(/\n/g, '<br>')}</p>`;
    }
    promptInput.value = '';
}

async function handleAIFitnessFeedback() {
    const feedbackContainer = document.getElementById('ai-feedback-container');
    if (!feedbackContainer) return;
    
    feedbackContainer.innerHTML = '<div class="spinner mx-auto"></div>';
    
    const prompt = `Act as a positive and encouraging AI fitness and nutrition coach. Here is my data:
    - Profile: ${JSON.stringify(userProfile)}
    - Weight History (last few entries): ${JSON.stringify(weightHistory.slice(-5))}
    
    Based on this, provide a short (2-3 paragraphs), personalized analysis of my progress and one actionable tip for the upcoming week. Address me by my name, ${userProfile.name}.`;

    const result = await callGeminiAPI(prompt);

    if (result.error) {
        feedbackContainer.innerHTML = `<p class="text-red-500">${result.error}</p>`;
    } else {
        feedbackContainer.innerHTML = `<p class="text-gray-700 leading-relaxed">${result.text.replace(/\n/g, '<br>')}</p>`;
    }
}

async function handleGeminiRegenerate() {
    const mealType = document.getElementById('meal-type-select').value;
    const craving = document.getElementById('user-craving-input').value.trim();
    const statusDiv = document.getElementById('gemini-regenerate-status');

    if (!craving) {
        statusDiv.innerHTML = `<p class="text-red-500">Please enter your craving!</p>`;
        return;
    }
    
    statusDiv.innerHTML = '<div class="spinner mx-auto"></div><p class="mt-2 text-sm text-gray-500">AI Chef is thinking...</p>';

    const prompt = `
        Generate a single meal suggestion for a user with the following profile:
        - Dietary Preference: ${userProfile.dietPreference}
        - Calorie Target for the day: ${userProfile.targetCalories}
        - User's craving for ${mealType}: "${craving}"
        - NOTE: The meal MUST be an Indian/South Asian dish.

        The ${mealType} should be roughly ${mealType === 'breakfast' ? '25%' : mealType === 'snacks' ? '15%' : '30%'} of their daily calorie target.
        
        Respond ONLY with a valid JSON object with the following structure:
        {
          "name": "Meal Name (Indian Dish Name)",
          "calories": <number>,
          "protein": <number>,
          "carbs": <number>,
          "fat": <number>,
          "portion": "Description of portion size",
          "ingredients": ["Ingredient 1", "Ingredient 2"],
          "recipe": "Step-by-step instructions"
        }
    `;

    const result = await callGeminiAPI(prompt, true);

    if (result.error) {
        statusDiv.innerHTML = `<p class="text-red-500">${result.error}</p>`;
    } else {
        try {
            const newMeal = JSON.parse(result.text);
            // Basic validation
            if (newMeal.name && newMeal.calories) {
                mealPlan[mealType] = newMeal;
                saveState();
                renderDashboard();
                closeModal('gemini-regenerate-modal');
                statusDiv.innerHTML = ''; // Clear status
                document.getElementById('user-craving-input').value = '';
            } else {
                 throw new Error("Invalid JSON structure received.");
            }
        } catch (e) {
            console.error("JSON Parsing Error:", e, "Received text:", result.text);
            statusDiv.innerHTML = `<p class="text-red-500">AI response was not in the correct format. Please try again.</p>`;
        }
    }
}


// =================================================================================
// ==                             UI RENDERING FUNCTIONS                          ==
// =================================================================================

function renderDashboard() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!mealPlan.breakfast) return; // Guard against rendering without a meal plan
    
    const totalCalories = mealPlan.breakfast.calories + mealPlan.lunch.calories + mealPlan.dinner.calories + mealPlan.snacks.calories;
    const totalProtein = mealPlan.breakfast.protein + mealPlan.lunch.protein + mealPlan.dinner.protein + mealPlan.snacks.protein;
    const totalCarbs = mealPlan.breakfast.carbs + mealPlan.lunch.carbs + mealPlan.dinner.carbs + mealPlan.snacks.carbs;
    const totalFat = mealPlan.breakfast.fat + mealPlan.lunch.fat + mealPlan.dinner.fat + mealPlan.snacks.fat;

    dashboardContent.innerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
                <h2 class="text-3xl font-bold">Hello, ${userProfile.name}!</h2>
                <p class="text-gray-600">Here is your personalized meal plan for today.</p>
            </div>
            <div class="flex gap-2">
                <button id="regenerate-plan-simple" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105 shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 16" />
                    </svg>
                    Quick Regenerate
                </button>
                 <button id="regenerate-plan-gemini" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 shadow">
                    ✨ AI Regenerate
                </button>
            </div>
        </div>

        <!-- AI Suggestion Card -->
        <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6 shadow">
            <p class="font-bold">💡 Smart Suggestion</p>
            <p>Your target is ${userProfile.targetCalories} calories. This plan provides ~${totalCalories} calories. Stick to it for the best results!</p>
        </div>

        <!-- Totals Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${createTotalCard('Calories', totalCalories, userProfile.targetCalories, 'kcal', 'bg-orange-100 text-orange-600')}
            ${createTotalCard('Protein', totalProtein, '150', 'g', 'bg-sky-100 text-sky-600')}
            ${createTotalCard('Carbs', totalCarbs, '200', 'g', 'bg-rose-100 text-rose-600')}
            ${createTotalCard('Fat', totalFat, '70', 'g', 'bg-yellow-100 text-yellow-600')}
        </div>

        <!-- Meal Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${createMealCard('Breakfast', mealPlan.breakfast)}
            ${createMealCard('Lunch', mealPlan.lunch)}
            ${createMealCard('Dinner', mealPlan.dinner)}
            ${createMealCard('Snacks', mealPlan.snacks)}
        </div>
    `;

    // Add event listeners for the new buttons
    document.getElementById('regenerate-plan-simple').addEventListener('click', () => {
        mealPlan = generateMealPlan(userProfile);
        saveState();
        renderDashboard();
    });
    document.getElementById('regenerate-plan-gemini').addEventListener('click', () => {
        openModal('gemini-regenerate-modal');
    });

     // Add event listeners for recipe buttons
    document.querySelectorAll('.view-recipe-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const mealType = e.currentTarget.dataset.meal;
            const mealData = mealPlan[mealType];
            showRecipeModal(mealData);
        });
    });
}

function createTotalCard(title, value, target, unit, colors) {
    return `
        <div class="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
            <p class="text-gray-500 font-medium">${title}</p>
            <div class="flex items-end space-x-2 mt-2">
                 <span class="text-3xl font-bold">${value}</span>
                 <span class="text-gray-400 text-lg">${unit}</span>
            </div>
            <p class="text-sm text-gray-400 mt-1">Target: ${target} ${unit}</p>
        </div>
    `;
}

function createMealCard(mealType, meal) {
    const mealTypeTitle = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    return `
        <div class="bg-white p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 duration-300">
            <h3 class="text-xl font-bold mb-2">${mealTypeTitle}: ${meal.name}</h3>
            <p class="text-gray-500 mb-4">${meal.portion}</p>
            <div class="flex justify-between items-center mb-4 text-sm">
                <span class="font-semibold text-orange-500">${meal.calories} kcal</span>
                <span class="text-sky-500">P: ${meal.protein}g</span>
                <span class="text-rose-500">C: ${meal.carbs}g</span>
                <span class="text-yellow-500">F: ${meal.fat}g</span>
            </div>
            <button class="view-recipe-btn w-full text-center bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg hover:bg-green-200" data-meal="${mealType.toLowerCase()}">
                View Recipe
            </button>
        </div>
    `;
}

function renderProgressPage() {
    const progressContent = document.getElementById('progress-content');
    const bmi = (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1);
    
    progressContent.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Your Progress</h2>
        
        <!-- AI Feedback Section -->
        <div class="bg-white p-6 rounded-xl shadow-md mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-xl mb-2">✨ AI Fitness Coach Feedback</h3>
                    <div id="ai-feedback-container">
                        <p class="text-gray-600">Click the button to get personalized feedback on your progress.</p>
                    </div>
                </div>
                <button id="get-ai-feedback-btn" class="flex-shrink-0 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Get Feedback</button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-white p-6 rounded-xl shadow-md text-center">
                <p class="text-gray-500">Current Weight</p>
                <p class="text-4xl font-bold my-2">${userProfile.weight} kg</p>
                 <button onclick="openModal('add-weight-modal')" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    + Add New Entry
                </button>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md text-center">
                <p class="text-gray-500">Your BMI</p>
                <p class="text-4xl font-bold my-2">${bmi}</p>
                <p class="text-gray-600 mt-2">${getBmiCategory(bmi)}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold mb-4">Weight Progress</h3>
                <div class="chart-container"><canvas id="weightChart"></canvas></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold mb-4">Calorie Intake vs Burn</h3>
                <div class="chart-container"><canvas id="calorieChart"></canvas></div>
            </div>
        </div>
    `;
    
    document.getElementById('get-ai-feedback-btn').addEventListener('click', handleAIFitnessFeedback);
    renderCharts();
}

function renderCharts() {
    // Destroy existing charts if they exist to prevent duplicates
    if (weightChart) weightChart.destroy();
    if (calorieChart) calorieChart.destroy();

    // Weight Chart
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    weightChart = new Chart(weightCtx, {
        type: 'line',
        data: {
            labels: weightHistory.map(entry => entry.date),
            datasets: [{
                label: 'Weight (kg)',
                data: weightHistory.map(entry => entry.weight),
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                borderColor: 'rgb(22, 163, 74)',
                tension: 0.3,
                fill: true,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Calorie Chart
    const calorieCtx = document.getElementById('calorieChart').getContext('2d');
    const totalCalories = mealPlan.breakfast.calories + mealPlan.lunch.calories + mealPlan.dinner.calories + mealPlan.snacks.calories;

    calorieChart = new Chart(calorieCtx, {
        type: 'bar',
        data: {
            labels: ['Today'],
            datasets: [
                {
                    label: 'Calorie Intake',
                    data: [totalCalories],
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                },
                {
                    label: 'Calorie Burn (TDEE)',
                    data: [userProfile.tdee],
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}

function renderGroceryListPage() {
    const groceryContent = document.getElementById('grocery-content');
    const ingredientsMap = new Map();

    // Aggregate ingredients from the entire plan
    [mealPlan.breakfast, mealPlan.lunch, mealPlan.dinner, mealPlan.snacks].forEach(meal => {
        meal.ingredients.forEach(ingredient => {
            // Simple aggregation for now. A more complex system could parse quantities.
            ingredientsMap.set(ingredient, (ingredientsMap.get(ingredient) || 0) + 1);
        });
    });

    let listHtml = Array.from(ingredientsMap.keys()).map(ingredient => 
        `<li class="py-2 px-4 border-b last:border-b-0">${ingredient}</li>`
    ).join('');

    groceryContent.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold">Your Weekly Grocery List</h2>
            <button id="download-pdf-btn" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center shadow">
                 <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download as PDF
            </button>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
            <p class="text-gray-600 mb-4">This list is generated from your current one-day meal plan. Imagine it repeated for a week!</p>
            <ul class="divide-y divide-gray-200">
                ${listHtml}
            </ul>
        </div>
    `;

    document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);
}

function renderProfilePage() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Your Profile</h2>
        <div class="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-600">Name:</span>
                    <span class="text-lg">${userProfile.name}</span>
                </div>
                 <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-600">Age:</span>
                    <span class="text-lg">${userProfile.age}</span>
                </div>
                 <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-600">Height:</span>
                    <span class="text-lg">${userProfile.height} cm</span>
                </div>
                 <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-600">Weight:</span>
                    <span class="text-lg">${userProfile.weight} kg</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-600">Goal:</span>
                    <span class="text-lg capitalize">${userProfile.goal}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-600">Diet:</span>
                    <span class="text-lg capitalize">${userProfile.dietPreference}</span>
                </div>
                <div class="pt-4 mt-4 border-t">
                    <button id="reset-profile-btn" class="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">
                        Reset and Start Over
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('reset-profile-btn').addEventListener('click', () => {
        if(confirm("Are you sure you want to reset your profile? All data will be lost.")) {
            localStorage.clear();
            location.reload();
        }
    });
}


// =================================================================================
// ==                             UTILITY FUNCTIONS                               ==
// =================================================================================

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showRecipeModal(meal) {
    currentRecipeForAI = meal; // Store the current recipe for the AI chef
    const content = document.getElementById('recipe-modal-content');
    content.innerHTML = `
        <h3 class="text-2xl font-bold mb-4">${meal.name}</h3>
        <div class="mb-6">
            <h4 class="font-semibold text-lg mb-2 border-b pb-1">Nutritional Info</h4>
            <div class="flex justify-around text-center p-2 bg-gray-100 rounded-lg">
                <div><span class="font-bold text-orange-500">${meal.calories}</span><p class="text-sm">kcal</p></div>
                <div><span class="font-bold text-sky-500">${meal.protein}</span><p class="text-sm">Protein</p></div>
                <div><span class="font-bold text-rose-500">${meal.carbs}</span><p class="text-sm">Carbs</p></div>
                <div><span class="font-bold text-yellow-500">${meal.fat}</span><p class="text-sm">Fat</p></div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 class="font-semibold text-lg mb-2 border-b pb-1">Ingredients</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-700">
                    ${meal.ingredients.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-lg mb-2 border-b pb-1">Instructions</h4>
                <p class="text-gray-700 leading-relaxed">${meal.recipe}</p>
            </div>
        </div>
    `;
    // Clear previous AI chef response
    document.getElementById('ai-chef-response').innerHTML = '';
    document.getElementById('ai-chef-prompt').value = '';
    openModal('recipe-modal');
}

function getBmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi >= 18.5 && bmi < 24.9) return "Normal weight";
    if (bmi >= 25 && bmi < 29.9) return "Overweight";
    return "Obesity";
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Grocery List", 20, 20);

    doc.setFontSize(12);
    let y = 30;
    const ingredientsMap = new Map();
    [mealPlan.breakfast, mealPlan.lunch, mealPlan.dinner, mealPlan.snacks].forEach(meal => {
        meal.ingredients.forEach(ingredient => {
            ingredientsMap.set(ingredient, (ingredientsMap.get(ingredient) || 0) + 1);
        });
    });

    Array.from(ingredientsMap.keys()).forEach(item => {
        if (y > 280) { // Add new page if content overflows
            doc.addPage();
            y = 20;
        }
        doc.text(`- ${item}`, 20, y);
        y += 7;
    });

    doc.save("grocery-list.pdf");
}