const geminiService = require('./gemini.service');
const { mealPlanZodSchema, mealZodSchema } = require('../validators/nutrition.validator');
const logger = require('../utils/logger');

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

/**
 * Curated Recipe Pools by Dietary Lifestyle & Meal Slot
 * With natural macro variance profiles (calMult: ~0.90 to ~1.10)
 */
const DIETARY_RECIPE_POOLS = {
  vegetarian: {
    breakfast: [
      {
        name: 'Greek Feta & Baby Spinach Power Omelette with Sourdough',
        prepTimeMinutes: 15,
        calMult: 1.0,
        ingredients: [
          { item: 'Free-Range Eggs & Egg Whites', amount: '3 whole + 2 whites', category: 'Dairy & Refrigerated' },
          { item: 'Fresh Baby Spinach', amount: '80g', category: 'Produce' },
          { item: 'Greek Feta Cheese', amount: '40g', category: 'Dairy & Refrigerated' },
          { item: 'Toasted Sourdough Bread', amount: '2 slices', category: 'Grains & Pantry' },
          { item: 'Extra Virgin Olive Oil', amount: '1 tsp', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Whisk eggs and egg whites with cracked black pepper and sea salt.',
          'Wilt spinach in olive oil in a non-stick pan over medium heat.',
          'Pour in eggs, crumble feta over top, and cook until golden; fold gently.',
          'Serve warm with toasted sourdough.',
        ],
      },
      {
        name: 'High-Protein Chia & Berry Overnight Oats with Raw Almond Butter',
        prepTimeMinutes: 10,
        calMult: 0.95,
        ingredients: [
          { item: 'Rolled Oats', amount: '80g', category: 'Grains & Pantry' },
          { item: 'Greek Yogurt 0% Fat', amount: '150g', category: 'Dairy & Refrigerated' },
          { item: 'Chia Seeds', amount: '20g', category: 'Grains & Pantry' },
          { item: 'Fresh Blueberries & Raspberries', amount: '80g', category: 'Produce' },
          { item: 'Raw Almond Butter', amount: '25g', category: 'Grains & Pantry' },
          { item: 'Almond Milk (Unsweetened)', amount: '120ml', category: 'Dairy & Refrigerated' },
        ],
        instructions: [
          'Combine rolled oats, Greek yogurt, chia seeds, and almond milk in a bowl.',
          'Stir well and let rest for 10 minutes (or refrigerate overnight).',
          'Top with fresh mixed berries and creamy almond butter.',
        ],
      },
      {
        name: 'Avocado & Low-Fat Paneer Scramble with Whole Wheat Toast',
        prepTimeMinutes: 12,
        calMult: 1.05,
        ingredients: [
          { item: 'Free-Range Eggs', amount: '3 whole', category: 'Dairy & Refrigerated' },
          { item: 'Low-Fat Paneer / Cottage Cheese', amount: '100g', category: 'Dairy & Refrigerated' },
          { item: 'Fresh Ripe Avocado', amount: '45g', category: 'Produce' },
          { item: 'Whole Wheat Toast', amount: '2 slices', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Gently scramble eggs and paneer in a skillet until soft and creamy.',
          'Spread sliced avocado over warm whole wheat toast.',
          'Layer scramble on toast and season with chili flakes.',
        ],
      },
      {
        name: 'Mediterranean Shakshuka with Free-Range Eggs, Feta & Crusty Bread',
        prepTimeMinutes: 18,
        calMult: 0.92,
        ingredients: [
          { item: 'Free-Range Eggs', amount: '3 large', category: 'Dairy & Refrigerated' },
          { item: 'Spiced Tomato Bell Pepper Sauce', amount: '200g', category: 'Produce' },
          { item: 'Crumbled Feta Cheese', amount: '35g', category: 'Dairy & Refrigerated' },
          { item: 'Crusty Sourdough Bread', amount: '2 thick slices', category: 'Grains & Pantry' },
          { item: 'Fresh Cilantro & Olive Oil', amount: '1 tbsp', category: 'Produce' },
        ],
        instructions: [
          'Simmer crushed tomatoes with garlic, cumin, paprika, and bell peppers in a skillet.',
          'Make wells in the sauce and crack in eggs; cover and cook on low for 6 mins.',
          'Sprinkle feta and fresh cilantro; serve immediately with crusty sourdough.',
        ],
      },
      {
        name: 'Protein Cottage Cheese & Blueberry Fluffy Oat Pancakes',
        prepTimeMinutes: 15,
        calMult: 1.08,
        ingredients: [
          { item: 'Rolled Oats & Whey Protein', amount: '70g', category: 'Grains & Pantry' },
          { item: 'Low-Fat Cottage Cheese', amount: '120g', category: 'Dairy & Refrigerated' },
          { item: 'Egg Whites', amount: '3 large', category: 'Dairy & Refrigerated' },
          { item: 'Fresh Blueberries & Pure Maple Syrup', amount: '60g', category: 'Produce' },
        ],
        instructions: [
          'Blend oats, cottage cheese, egg whites, and a dash of cinnamon into a smooth batter.',
          'Cook 3-4 golden pancakes on a non-stick skillet over medium-low heat.',
          'Stack high with fresh blueberries and a light drizzle of pure maple syrup.',
        ],
      },
    ],
    lunch: [
      {
        name: 'Charred Tofu & Warm Quinoa Power Bowl with Roasted Broccoli & Tahini',
        prepTimeMinutes: 20,
        calMult: 1.0,
        ingredients: [
          { item: 'Extra-Firm Organic Tofu', amount: '220g', category: 'Meat & Seafood / Protein' },
          { item: 'Organic Quinoa', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Roasted Broccoli & Cherry Tomatoes', amount: '150g', category: 'Produce' },
          { item: 'Creamy Lemon Tahini Dressing', amount: '2 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Press and cube extra-firm tofu; sear in a skillet with garlic and olive oil until crispy.',
          'Roast broccoli and tomatoes at 200°C for 12 minutes.',
          'Assemble bowl over warm quinoa and drizzle with lemon tahini dressing.',
        ],
      },
      {
        name: 'Mediterranean Chickpea, Feta & Grilled Halloumi Salad Bowl',
        prepTimeMinutes: 15,
        calMult: 0.94,
        ingredients: [
          { item: 'Organic Cooked Chickpeas', amount: '200g', category: 'Grains & Pantry' },
          { item: 'Grilled Halloumi / Paneer', amount: '80g', category: 'Dairy & Refrigerated' },
          { item: 'Cucumbers, Tomatoes & Kalamata Olives', amount: '150g', category: 'Produce' },
          { item: 'Crumbled Greek Feta', amount: '30g', category: 'Dairy & Refrigerated' },
          { item: 'Extra Virgin Olive Oil & Lemon Juice', amount: '1 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Sear halloumi slices in a dry non-stick skillet for 2 mins per side until golden.',
          'Toss chickpeas, diced cucumbers, tomatoes, and olives with olive oil and lemon.',
          'Top with warm halloumi and crumbled feta.',
        ],
      },
      {
        name: 'High-Protein Black Bean & Sweet Potato Burrito Bowl with Guacamole',
        prepTimeMinutes: 18,
        calMult: 1.06,
        ingredients: [
          { item: 'Organic Black Beans & Sweet Corn', amount: '200g', category: 'Grains & Pantry' },
          { item: 'Roasted Sweet Potato Cubes', amount: '160g', category: 'Produce' },
          { item: 'Brown Basmati Rice', amount: '120g cooked', category: 'Grains & Pantry' },
          { item: 'Fresh Guacamole & Pico de Gallo', amount: '3 tbsp', category: 'Produce' },
          { item: 'Greek Yogurt (Sour Cream Alternative)', amount: '50g', category: 'Dairy & Refrigerated' },
        ],
        instructions: [
          'Warm black beans and corn with cumin, smoked paprika, and lime juice.',
          'Layer over brown basmati rice with roasted sweet potato cubes.',
          'Top with fresh guacamole, salsa, and a dollop of Greek yogurt.',
        ],
      },
      {
        name: 'Grilled Paneer & Roasted Bell Pepper Wrap with Mint Greek Yogurt Dip',
        prepTimeMinutes: 16,
        calMult: 1.04,
        ingredients: [
          { item: 'Spiced Grilled Paneer Slices', amount: '180g', category: 'Dairy & Refrigerated' },
          { item: 'Whole Wheat Lavash / Tortilla Wrap', amount: '2 wraps', category: 'Grains & Pantry' },
          { item: 'Grilled Bell Peppers & Red Onions', amount: '120g', category: 'Produce' },
          { item: 'Cool Mint Cucumber Greek Yogurt Sauce', amount: '3 tbsp', category: 'Dairy & Refrigerated' },
        ],
        instructions: [
          'Grill paneer slices with turmeric, cumin, and sea salt until charred.',
          'Sauté bell peppers and onions.',
          'Roll into warm whole wheat wrap with cool mint yogurt dip.',
        ],
      },
      {
        name: 'Warm Edamame & Lentil Soba Noodle Bowl with Sesame Soy Glaze',
        prepTimeMinutes: 18,
        calMult: 0.92,
        ingredients: [
          { item: 'Shelled Edamame & Brown Lentils', amount: '200g', category: 'Grains & Pantry' },
          { item: '100% Buckwheat Soba Noodles', amount: '140g cooked', category: 'Grains & Pantry' },
          { item: 'Steamed Baby Bok Choy & Carrots', amount: '130g', category: 'Produce' },
          { item: 'Toasted Sesame Ginger Glaze', amount: '2 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Boil soba noodles for 4 mins, drain and rinse in cold water.',
          'Toss with warm edamame, lentils, and steamed bok choy.',
          'Drizzle with toasted sesame ginger glaze.',
        ],
      },
    ],
    snack: [
      {
        name: 'Greek Yogurt Protein Crunch with Raw Almonds & Dark Honey',
        prepTimeMinutes: 5,
        calMult: 1.0,
        ingredients: [
          { item: 'Greek Yogurt 0% Fat', amount: '180g', category: 'Dairy & Refrigerated' },
          { item: 'Raw Almonds & Walnuts', amount: '25g', category: 'Grains & Pantry' },
          { item: 'Raw Honey', amount: '1 tsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Spoon Greek yogurt into a bowl and top with almonds and honey.'],
      },
      {
        name: 'Edamame Sea Salt Crunch & Roasted Pumpkin Seeds',
        prepTimeMinutes: 5,
        calMult: 0.92,
        ingredients: [
          { item: 'Steamed Edamame Pods with Sea Salt', amount: '150g', category: 'Produce' },
          { item: 'Roasted Pumpkin Seeds', amount: '25g', category: 'Grains & Pantry' },
        ],
        instructions: ['Steam edamame pods and season with flaky sea salt and pumpkin seeds.'],
      },
      {
        name: 'Berry Protein Smoothie Bowl with Chia Seeds & Cacao Nibs',
        prepTimeMinutes: 5,
        calMult: 1.08,
        ingredients: [
          { item: 'Whey or Pea Protein Powder', amount: '35g', category: 'Grains & Pantry' },
          { item: 'Frozen Mixed Berries', amount: '120g', category: 'Produce' },
          { item: 'Almond Milk (Unsweetened)', amount: '150ml', category: 'Dairy & Refrigerated' },
          { item: 'Raw Cacao Nibs', amount: '10g', category: 'Grains & Pantry' },
        ],
        instructions: ['Blend thick and serve topped with cacao nibs and chia seeds.'],
      },
      {
        name: 'Low-Fat Cottage Cheese with Pineapple Chunks & Walnuts',
        prepTimeMinutes: 4,
        calMult: 0.95,
        ingredients: [
          { item: 'Low-Fat Cottage Cheese', amount: '180g', category: 'Dairy & Refrigerated' },
          { item: 'Fresh Pineapple Chunks', amount: '80g', category: 'Produce' },
          { item: 'Crushed Walnuts', amount: '20g', category: 'Grains & Pantry' },
        ],
        instructions: ['Combine cottage cheese with pineapple chunks and walnuts for immediate sustained protein.'],
      },
    ],
    dinner: [
      {
        name: 'Golden Paneer & Spinach Saag with Fragrant Brown Basmati Rice',
        prepTimeMinutes: 22,
        calMult: 1.0,
        ingredients: [
          { item: 'Low-Fat Paneer / Organic Tofu Cubes', amount: '200g', category: 'Dairy & Refrigerated' },
          { item: 'Fresh Spinach & Garlic Puree', amount: '180g', category: 'Produce' },
          { item: 'Brown Basmati Rice', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Garam Masala & Turmeric Olive Oil', amount: '1 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Pan-sear paneer cubes until lightly golden on all sides.',
          'Simmer spiced spinach sauce with turmeric, ginger, and garlic.',
          'Fold in warm paneer cubes and serve alongside brown basmati rice.',
        ],
      },
      {
        name: 'Hearty Red Lentil & Vegetable Coconut Curry with Jasmine Rice',
        prepTimeMinutes: 25,
        calMult: 0.95,
        ingredients: [
          { item: 'Red Lentils & Chickpeas', amount: '220g cooked', category: 'Grains & Pantry' },
          { item: 'Light Coconut Milk & Curry Spices', amount: '120ml', category: 'Grains & Pantry' },
          { item: 'Baby Spinach, Carrots & Zucchini', amount: '150g', category: 'Produce' },
          { item: 'Steamed Jasmine Rice', amount: '160g cooked', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Simmer red lentils with coconut milk, ginger, turmeric, and garlic.',
          'Add vegetables and cook until tender.',
          'Serve hot over fragrant steamed jasmine rice.',
        ],
      },
      {
        name: 'Stuffed Bell Peppers with Spiced Quinoa, Black Beans & Melted Cheese',
        prepTimeMinutes: 25,
        calMult: 1.05,
        ingredients: [
          { item: 'Large Bell Peppers', amount: '2 whole', category: 'Produce' },
          { item: 'Quinoa & Black Bean Mix', amount: '200g cooked', category: 'Grains & Pantry' },
          { item: 'Part-Skim Mozzarella / Cheddar', amount: '40g', category: 'Dairy & Refrigerated' },
          { item: 'Avocado Salsa', amount: '3 tbsp', category: 'Produce' },
        ],
        instructions: [
          'Stuff halved bell peppers with spiced quinoa and black bean mixture.',
          'Top with cheese and bake at 190°C for 20 minutes until bubbling.',
          'Serve with fresh avocado salsa.',
        ],
      },
      {
        name: 'High-Protein Tofu Pad Thai with Crushed Peanuts & Bean Sprouts',
        prepTimeMinutes: 20,
        calMult: 1.08,
        ingredients: [
          { item: 'Crispy Pressed Tofu Cubes', amount: '220g', category: 'Meat & Seafood / Protein' },
          { item: 'Brown Rice Flat Noodles', amount: '140g cooked', category: 'Grains & Pantry' },
          { item: 'Fresh Bean Sprouts, Scallions & Lime', amount: '120g', category: 'Produce' },
          { item: 'Tamarind Lime Soy Sauce & Peanuts', amount: '2 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: [
          'Stir-fry tofu cubes in sesame oil until golden brown.',
          'Add rice noodles, bean sprouts, and tangy tamarind lime sauce.',
          'Garnish with crushed roasted peanuts and fresh lime wedges.',
        ],
      },
    ],
  },

  vegan: {
    breakfast: [
      {
        name: 'Spiced Tofu Scramble with Avocado & Sourdough Toast',
        prepTimeMinutes: 12,
        calMult: 1.0,
        ingredients: [
          { item: 'Extra-Firm Organic Tofu', amount: '220g', category: 'Meat & Seafood / Protein' },
          { item: 'Nutritional Yeast & Turmeric', amount: '2 tbsp', category: 'Grains & Pantry' },
          { item: 'Fresh Baby Spinach & Tomatoes', amount: '80g', category: 'Produce' },
          { item: 'Toasted Sourdough Bread', amount: '2 slices', category: 'Grains & Pantry' },
          { item: 'Avocado', amount: '40g', category: 'Produce' },
        ],
        instructions: ['Crumble tofu into skillet with olive oil, turmeric, and nutritional yeast; serve over sourdough with sliced avocado.'],
      },
      {
        name: 'High-Protein Chia & Blueberry Oats with Peanut Butter',
        prepTimeMinutes: 8,
        calMult: 0.95,
        ingredients: [
          { item: 'Rolled Oats & Plant Protein Powder', amount: '100g', category: 'Grains & Pantry' },
          { item: 'Chia Seeds & Flaxseeds', amount: '20g', category: 'Grains & Pantry' },
          { item: 'Fresh Blueberries', amount: '80g', category: 'Produce' },
          { item: 'Natural Peanut Butter', amount: '25g', category: 'Grains & Pantry' },
        ],
        instructions: ['Cook oats with soy milk and plant protein; top with fresh blueberries and peanut butter.'],
      },
    ],
    lunch: [
      {
        name: 'Crispy Tempeh & Edamame Quinoa Power Bowl with Miso Dressing',
        prepTimeMinutes: 18,
        calMult: 1.0,
        ingredients: [
          { item: 'Marinated Organic Tempeh', amount: '200g', category: 'Meat & Seafood / Protein' },
          { item: 'Shelled Edamame & Quinoa', amount: '180g', category: 'Grains & Pantry' },
          { item: 'Steamed Broccoli & Red Cabbage', amount: '150g', category: 'Produce' },
          { item: 'Miso Ginger Tahini Dressing', amount: '2 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Pan-fry tempeh until crispy; assemble over quinoa and edamame with miso tahini dressing.'],
      },
      {
        name: 'Mexican Chipotle Black Bean & Avocado Brown Rice Bowl',
        prepTimeMinutes: 15,
        calMult: 1.04,
        ingredients: [
          { item: 'Chipotle Black Beans', amount: '220g', category: 'Grains & Pantry' },
          { item: 'Brown Rice & Sweet Corn', amount: '160g', category: 'Grains & Pantry' },
          { item: 'Fresh Guacamole & Pico de Gallo', amount: '4 tbsp', category: 'Produce' },
          { item: 'Hemp Hearts (Extra Protein)', amount: '15g', category: 'Grains & Pantry' },
        ],
        instructions: ['Warm black beans with chipotle adobo; serve over brown rice with guacamole and hemp hearts.'],
      },
    ],
    snack: [
      {
        name: 'Almond Butter & Banana Rice Cakes with Hemp Seeds',
        prepTimeMinutes: 5,
        calMult: 0.92,
        ingredients: [
          { item: 'Whole Grain Brown Rice Cakes', amount: '3 cakes', category: 'Grains & Pantry' },
          { item: 'Raw Almond Butter', amount: '30g', category: 'Grains & Pantry' },
          { item: 'Sliced Banana & Hemp Seeds', amount: '1 banana', category: 'Produce' },
        ],
        instructions: ['Spread almond butter over rice cakes and top with banana slices and hemp seeds.'],
      },
    ],
    dinner: [
      {
        name: 'Coconut Chickpea & Sweet Potato Curry with Jasmine Rice',
        prepTimeMinutes: 22,
        calMult: 1.0,
        ingredients: [
          { item: 'Organic Chickpeas', amount: '220g', category: 'Grains & Pantry' },
          { item: 'Roasted Sweet Potato & Spinach', amount: '160g', category: 'Produce' },
          { item: 'Light Coconut Milk & Yellow Curry', amount: '120ml', category: 'Grains & Pantry' },
          { item: 'Steamed Jasmine Rice', amount: '160g', category: 'Grains & Pantry' },
        ],
        instructions: ['Simmer chickpeas and sweet potatoes in coconut curry sauce; serve over jasmine rice.'],
      },
      {
        name: 'Smoky Lentil Bolognese over Whole Grain Penne Pasta',
        prepTimeMinutes: 20,
        calMult: 1.05,
        ingredients: [
          { item: 'Brown & Green Lentils', amount: '200g cooked', category: 'Grains & Pantry' },
          { item: 'Whole Grain Penne Pasta', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Rich Tomato Basil Sauce & Mushrooms', amount: '150g', category: 'Produce' },
          { item: 'Nutritional Yeast (Parmesan Alternative)', amount: '2 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Simmer lentils and mushrooms in marinara sauce; toss with penne and dust with nutritional yeast.'],
      },
    ],
  },

  omnivore: {
    breakfast: [
      {
        name: 'Egg White, Spinach & Avocado Power Omelette with Sourdough',
        prepTimeMinutes: 15,
        calMult: 1.0,
        ingredients: [
          { item: 'Free-Range Eggs / Whites', amount: '3 whole + 2 whites', category: 'Dairy & Refrigerated' },
          { item: 'Sourdough Toast', amount: '2 slices', category: 'Grains & Pantry' },
          { item: 'Fresh Blueberries', amount: '80g', category: 'Produce' },
          { item: 'Avocado', amount: '40g', category: 'Produce' },
        ],
        instructions: ['Whisk eggs with sea salt and black pepper; fold with avocado and serve with sourdough.'],
      },
      {
        name: 'Smoked Salmon & Scrambled Eggs on Whole Grain Rye Toast',
        prepTimeMinutes: 12,
        calMult: 0.95,
        ingredients: [
          { item: 'Wild Smoked Salmon', amount: '100g', category: 'Meat & Seafood / Protein' },
          { item: 'Free-Range Eggs', amount: '3 whole', category: 'Dairy & Refrigerated' },
          { item: 'Whole Grain Rye Toast', amount: '2 slices', category: 'Grains & Pantry' },
          { item: 'Mashed Avocado & Chives', amount: '40g', category: 'Produce' },
        ],
        instructions: ['Scramble eggs in olive oil; top rye toast with avocado, smoked salmon, and fresh chives.'],
      },
      {
        name: 'Protein Banana Pancakes with Greek Yogurt & Honey',
        prepTimeMinutes: 15,
        calMult: 1.06,
        ingredients: [
          { item: 'Rolled Oats & Whey Protein', amount: '80g', category: 'Grains & Pantry' },
          { item: 'Ripe Banana', amount: '1 medium', category: 'Produce' },
          { item: 'Egg Whites', amount: '150ml', category: 'Dairy & Refrigerated' },
          { item: 'Greek Yogurt 0% & Dark Honey', amount: '100g', category: 'Dairy & Refrigerated' },
        ],
        instructions: ['Blend ingredients and cook golden pancakes; top with Greek yogurt and honey.'],
      },
    ],
    lunch: [
      {
        name: 'Grilled Lemon Herb Chicken with Warm Quinoa & Roasted Asparagus',
        prepTimeMinutes: 20,
        calMult: 1.0,
        ingredients: [
          { item: 'Lean Chicken Breast', amount: '220g', category: 'Meat & Seafood / Protein' },
          { item: 'Organic Quinoa', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Fresh Asparagus & Cherry Tomatoes', amount: '150g', category: 'Produce' },
          { item: 'Extra Virgin Olive Oil & Lemon Juice', amount: '1 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Marinate chicken with garlic, oregano, and lemon; grill and serve with warm quinoa.'],
      },
      {
        name: 'Mediterranean Grilled Flank Steak with Roasted Sweet Potatoes & Chimichurri',
        prepTimeMinutes: 20,
        calMult: 1.08,
        ingredients: [
          { item: 'Lean Flank Steak', amount: '200g', category: 'Meat & Seafood / Protein' },
          { item: 'Roasted Sweet Potato Cubes', amount: '180g', category: 'Produce' },
          { item: 'Arugula & Cherry Tomatoes', amount: '100g', category: 'Produce' },
          { item: 'Chimichurri Herb Sauce', amount: '1 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Sear steak 4 mins per side; plate with roasted sweet potatoes and chimichurri.'],
      },
      {
        name: 'Sesame Ginger Turkey Rice Bowl with Steamed Edamame & Bok Choy',
        prepTimeMinutes: 18,
        calMult: 0.94,
        ingredients: [
          { item: 'Lean Ground Turkey 93%', amount: '200g', category: 'Meat & Seafood / Protein' },
          { item: 'Jasmine Rice', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Shelled Edamame & Bok Choy', amount: '120g', category: 'Produce' },
          { item: 'Low Sodium Soy & Sesame Oil', amount: '1 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Brown ground turkey with ginger and garlic; assemble over jasmine rice with edamame.'],
      },
      {
        name: 'Crispy Honey Mustard Chicken Breast Bowl with Brown Basmati & Green Beans',
        prepTimeMinutes: 20,
        calMult: 1.02,
        ingredients: [
          { item: 'Chicken Breast Strips', amount: '220g', category: 'Meat & Seafood / Protein' },
          { item: 'Brown Basmati Rice', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Steamed Tender Green Beans', amount: '140g', category: 'Produce' },
          { item: 'Whole Grain Honey Mustard Glaze', amount: '2 tbsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Sear chicken strips in skillet with honey mustard glaze; serve over brown basmati.'],
      },
    ],
    snack: [
      {
        name: 'Greek Yogurt Protein Crunch with Raw Almonds & Dark Honey',
        prepTimeMinutes: 5,
        calMult: 1.0,
        ingredients: [
          { item: 'Greek Yogurt 0% Fat', amount: '180g', category: 'Dairy & Refrigerated' },
          { item: 'Raw Almonds', amount: '20g', category: 'Grains & Pantry' },
          { item: 'Raw Honey', amount: '1 tsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Spoon Greek yogurt into a bowl and top with almonds and honey.'],
      },
      {
        name: 'Whey Protein Berry Smoothie with Raw Cacao Nibs',
        prepTimeMinutes: 5,
        calMult: 1.06,
        ingredients: [
          { item: 'Whey Isolate Protein', amount: '35g', category: 'Grains & Pantry' },
          { item: 'Frozen Mixed Berries', amount: '120g', category: 'Produce' },
          { item: 'Almond Milk (Unsweetened)', amount: '150ml', category: 'Dairy & Refrigerated' },
          { item: 'Raw Cacao Nibs', amount: '10g', category: 'Grains & Pantry' },
        ],
        instructions: ['Blend protein and berries thick; top with cacao nibs.'],
      },
    ],
    dinner: [
      {
        name: 'Pan-Seared Atlantic Salmon with Jasmine Rice & Tender Green Beans',
        prepTimeMinutes: 22,
        calMult: 1.0,
        ingredients: [
          { item: 'Wild Atlantic Salmon Fillet', amount: '200g', category: 'Meat & Seafood / Protein' },
          { item: 'Jasmine Rice', amount: '180g cooked', category: 'Grains & Pantry' },
          { item: 'Green Beans & Garlic', amount: '120g', category: 'Produce' },
          { item: 'Olive Oil & Lemon', amount: '1 tsp', category: 'Grains & Pantry' },
        ],
        instructions: ['Sear salmon 4 mins per side; steam green beans and serve over jasmine rice.'],
      },
      {
        name: 'Slow-Braised Chicken Breast Fajita Bowl with Black Beans & Guacamole',
        prepTimeMinutes: 20,
        calMult: 0.96,
        ingredients: [
          { item: 'Chicken Breast Strips', amount: '200g', category: 'Meat & Seafood / Protein' },
          { item: 'Black Beans & Corn', amount: '150g', category: 'Grains & Pantry' },
          { item: 'Bell Peppers & Onions', amount: '120g', category: 'Produce' },
          { item: 'Fresh Guacamole', amount: '2 tbsp', category: 'Produce' },
        ],
        instructions: ['Sauté peppers and onions with fajita spices; sear chicken strips and plate over black beans.'],
      },
      {
        name: 'Seared Wild Cod Fillet with Garlic Herb Quinoa & Roasted Broccolini',
        prepTimeMinutes: 20,
        calMult: 0.92,
        ingredients: [
          { item: 'Wild Pacific Cod Fillet', amount: '220g', category: 'Meat & Seafood / Protein' },
          { item: 'Organic Quinoa', amount: '160g cooked', category: 'Grains & Pantry' },
          { item: 'Roasted Broccolini & Lemon', amount: '140g', category: 'Produce' },
          { item: 'Lemon Herb Butter', amount: '1 tbsp', category: 'Dairy & Refrigerated' },
        ],
        instructions: ['Sear cod in lemon herb butter; serve over warm quinoa and roasted broccolini.'],
      },
    ],
  },
};

// Aliases
DIETARY_RECIPE_POOLS.pescatarian = {
  breakfast: DIETARY_RECIPE_POOLS.vegetarian.breakfast,
  lunch: [
    DIETARY_RECIPE_POOLS.omnivore.lunch[0],
    ...DIETARY_RECIPE_POOLS.vegetarian.lunch,
  ],
  snack: DIETARY_RECIPE_POOLS.vegetarian.snack,
  dinner: [
    DIETARY_RECIPE_POOLS.omnivore.dinner[0],
    DIETARY_RECIPE_POOLS.omnivore.dinner[2],
    ...DIETARY_RECIPE_POOLS.vegetarian.dinner,
  ],
};

DIETARY_RECIPE_POOLS.keto = DIETARY_RECIPE_POOLS.omnivore;
DIETARY_RECIPE_POOLS.paleo = DIETARY_RECIPE_POOLS.omnivore;

/**
 * Build System & Prompt for 1-Day Daily Meal Plan
 * Order: Breakfast, Lunch, Snack, Dinner
 */
const buildMealPrompt = (user, targets, options = {}) => {
  const profile = user.profile || {};
  const nutPref = profile.nutritionPreferences || {};
  const diet = options.dietaryPreference || nutPref.dietaryPreference || 'omnivore';
  const calories = options.calorieOverride || targets.targetDailyCalories;
  const macros = targets.targetMacros;
  const favorites = nutPref.favoriteFoods || [];
  const dislikes = nutPref.dislikedFoods || [];
  const restrictions = nutPref.dietaryRestrictions || [];
  const cookTime = nutPref.cookingTimePreference || '15_30_min';

  const systemInstruction = `You are FitPilot AI, an elite sports nutritionist and registered dietitian.
Your task is to design a personalized 1-Day Daily Nutrition & Meal Blueprint.

CRITICAL DIETARY LIFESTYLE ENFORCEMENT:
- Dietary Lifestyle: "${diet.toUpperCase()}".
${diet === 'vegetarian' ? '- STRICT VEGETARIAN: NEVER include chicken, beef, pork, turkey, lamb, fish, or seafood under any circumstance. Only use vegetarian ingredients (tofu, paneer, eggs, dairy, lentils, beans, grains, vegetables, nuts).' : ''}
${diet === 'vegan' ? '- STRICT 100% VEGAN: ZERO animal products (no meat, poultry, fish, eggs, dairy, whey, or honey). Only plant-based ingredients.' : ''}
${diet === 'pescatarian' ? '- PESCATARIAN: Only seafood/fish and plant-based/vegetarian ingredients (no poultry, beef, or pork).' : ''}

STRICT RULES:
1. Daily calories must total approximately ~${calories} kcal (+/- 50 kcal natural variance).
2. Daily protein must reach ~${macros.proteinGrams}g, carbs ~${macros.carbsGrams}g, fats ~${macros.fatsGrams}g.
3. Must include exactly 4 meals in this strict chronological order:
   - 1. breakfast (~25% calories)
   - 2. lunch (~35% calories)
   - 3. snack (~10% calories)
   - 4. dinner (~30% calories)
4. NEVER include disliked foods or restricted allergens: [${[...dislikes, ...restrictions].join(', ')}].
5. Prioritize favorite staples: [${favorites.join(', ')}].
6. Every meal MUST include calories, protein, carbs, fats, prep time, ingredients (with amounts and category), and step-by-step instructions.
7. Generate a categorized grocery list for the day.
8. Output MUST be valid JSON adhering exactly to the required schema.`;

  const prompt = `Generate a 1-day daily meal plan for:
- Athlete: ${user.name}
- Goal: ${profile.primaryGoal || 'muscle_gain'}
- Dietary Lifestyle: ${diet}
- Target Daily Energy: ${calories} kcal
- Target Macros: Protein: ${macros.proteinGrams}g, Carbs: ${macros.carbsGrams}g, Fats: ${macros.fatsGrams}g
- Cooking Speed: ${cookTime.replace('_', ' ')}
- Custom Notes: ${options.customNotes || 'High protein nutrient density'}

Return a JSON object with this exact structure:
{
  "title": "Daily ${diet.toUpperCase()} Nutrition Blueprint (${calories} kcal)",
  "dietaryPreference": "${diet}",
  "targetDailyCalories": ${calories},
  "targetMacros": {
    "proteinGrams": ${macros.proteinGrams},
    "carbsGrams": ${macros.carbsGrams},
    "fatsGrams": ${macros.fatsGrams}
  },
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Daily Performance Blueprint",
      "totalCalories": ${calories},
      "totalProtein": ${macros.proteinGrams},
      "totalCarbs": ${macros.carbsGrams},
      "totalFats": ${macros.fatsGrams},
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Breakfast Recipe Name",
          "calories": ${Math.round(calories * 0.25)},
          "protein": ${Math.round(macros.proteinGrams * 0.25)},
          "carbs": ${Math.round(macros.carbsGrams * 0.25)},
          "fats": ${Math.round(macros.fatsGrams * 0.25)},
          "prepTimeMinutes": 15,
          "ingredients": [
            { "item": "Ingredient Name", "amount": "100g", "category": "Produce" }
          ],
          "instructions": [
            "Cooking step 1",
            "Cooking step 2"
          ]
        },
        {
          "mealType": "lunch",
          "name": "Lunch Recipe Name",
          "calories": ${Math.round(calories * 0.35)},
          "protein": ${Math.round(macros.proteinGrams * 0.35)},
          "carbs": ${Math.round(macros.carbsGrams * 0.35)},
          "fats": ${Math.round(macros.fatsGrams * 0.35)},
          "prepTimeMinutes": 20,
          "ingredients": [
            { "item": "Protein Item", "amount": "200g", "category": "Meat & Seafood / Protein" }
          ],
          "instructions": ["Cooking step 1"]
        },
        {
          "mealType": "snack",
          "name": "Snacks Recipe Name",
          "calories": ${Math.round(calories * 0.10)},
          "protein": ${Math.round(macros.proteinGrams * 0.10)},
          "carbs": ${Math.round(macros.carbsGrams * 0.10)},
          "fats": ${Math.round(macros.fatsGrams * 0.10)},
          "prepTimeMinutes": 5,
          "ingredients": [
            { "item": "Snack Item", "amount": "1 serving", "category": "Dairy & Refrigerated" }
          ],
          "instructions": ["Combine and serve"]
        },
        {
          "mealType": "dinner",
          "name": "Dinner Recipe Name",
          "calories": ${Math.round(calories * 0.30)},
          "protein": ${Math.round(macros.proteinGrams * 0.30)},
          "carbs": ${Math.round(macros.carbsGrams * 0.30)},
          "fats": ${Math.round(macros.fatsGrams * 0.30)},
          "prepTimeMinutes": 20,
          "ingredients": [
            { "item": "Main Item", "amount": "180g", "category": "Meat & Seafood / Protein" }
          ],
          "instructions": ["Cooking step 1"]
        }
      ]
    }
  ],
  "groceryList": [
    {
      "category": "Produce",
      "items": [
        { "name": "Fresh Berries", "amount": "150g", "checked": false }
      ]
    },
    {
      "category": "Meat & Seafood / Protein",
      "items": [
        { "name": "Protein Item", "amount": "200g", "checked": false }
      ]
    }
  ]
}`;

  return { systemInstruction, prompt };
};

/**
 * Algorithmic Fallback 1-Day Daily Meal Plan Generator
 * Order: Breakfast, Lunch, Snack, Dinner
 */
const generateAlgorithmicMealPlan = (user, targets, options = {}) => {
  const profile = user.profile || {};
  const nutPref = profile.nutritionPreferences || {};
  const diet = (options.dietaryPreference || nutPref.dietaryPreference || 'omnivore').toLowerCase();
  const calories = options.calorieOverride || targets.targetDailyCalories;
  const macros = targets.targetMacros;

  const pool = DIETARY_RECIPE_POOLS[diet] || DIETARY_RECIPE_POOLS.omnivore;

  const bDish = pool.breakfast[0];
  const lDish = pool.lunch[0];
  const sDish = pool.snack[0];
  const dDish = pool.dinner[0];

  const bCal = Math.round(calories * 0.25 * (bDish.calMult || 1.0));
  const lCal = Math.round(calories * 0.35 * (lDish.calMult || 1.0));
  const sCal = Math.round(calories * 0.10 * (sDish.calMult || 1.0));
  const dCal = Math.round(calories * 0.30 * (dDish.calMult || 1.0));

  const bProt = Math.round(macros.proteinGrams * 0.25 * (bDish.calMult || 1.0));
  const lProt = Math.round(macros.proteinGrams * 0.35 * (lDish.calMult || 1.0));
  const sProt = Math.round(macros.proteinGrams * 0.10 * (sDish.calMult || 1.0));
  const dProt = Math.round(macros.proteinGrams * 0.30 * (dDish.calMult || 1.0));

  const bCarb = Math.round(macros.carbsGrams * 0.25 * (bDish.calMult || 1.0));
  const lCarb = Math.round(macros.carbsGrams * 0.35 * (lDish.calMult || 1.0));
  const sCarb = Math.round(macros.carbsGrams * 0.10 * (sDish.calMult || 1.0));
  const dCarb = Math.round(macros.carbsGrams * 0.30 * (dDish.calMult || 1.0));

  const bFat = Math.round(macros.fatsGrams * 0.25 * (bDish.calMult || 1.0));
  const lFat = Math.round(macros.fatsGrams * 0.35 * (lDish.calMult || 1.0));
  const sFat = Math.round(macros.fatsGrams * 0.10 * (sDish.calMult || 1.0));
  const dFat = Math.round(macros.fatsGrams * 0.30 * (dDish.calMult || 1.0));

  const meals = [
    {
      mealType: 'breakfast',
      name: bDish.name,
      calories: bCal,
      protein: bProt,
      carbs: bCarb,
      fats: bFat,
      prepTimeMinutes: bDish.prepTimeMinutes,
      ingredients: bDish.ingredients,
      instructions: bDish.instructions,
    },
    {
      mealType: 'lunch',
      name: lDish.name,
      calories: lCal,
      protein: lProt,
      carbs: lCarb,
      fats: lFat,
      prepTimeMinutes: lDish.prepTimeMinutes,
      ingredients: lDish.ingredients,
      instructions: lDish.instructions,
    },
    {
      mealType: 'snack',
      name: sDish.name,
      calories: sCal,
      protein: sProt,
      carbs: sCarb,
      fats: sFat,
      prepTimeMinutes: sDish.prepTimeMinutes,
      ingredients: sDish.ingredients,
      instructions: sDish.instructions,
    },
    {
      mealType: 'dinner',
      name: dDish.name,
      calories: dCal,
      protein: dProt,
      carbs: dCarb,
      fats: dFat,
      prepTimeMinutes: dDish.prepTimeMinutes,
      ingredients: dDish.ingredients,
      instructions: dDish.instructions,
    },
  ];

  const totalCal = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalP = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalC = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalF = meals.reduce((sum, m) => sum + m.fats, 0);

  // Derive initial grocery list
  const categoryMap = {};
  meals.forEach((m) => {
    (m.ingredients || []).forEach((ing) => {
      const cat = ing.category || 'Grains & Pantry';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      if (!categoryMap[cat].some((i) => i.name.toLowerCase() === ing.item.toLowerCase())) {
        categoryMap[cat].push({ name: ing.item, amount: ing.amount, checked: false });
      }
    });
  });

  const groceryList = Object.entries(categoryMap).map(([category, items]) => ({ category, items }));

  return {
    title: `Daily ${diet.toUpperCase()} Nutrition Blueprint (${totalCal} kcal)`,
    dietaryPreference: diet,
    targetDailyCalories: calories,
    targetMacros: macros,
    days: [
      {
        dayNumber: 1,
        dayName: 'Daily Performance Blueprint',
        totalCalories: totalCal,
        totalProtein: totalP,
        totalCarbs: totalC,
        totalFats: totalF,
        meals,
      },
    ],
    groceryList,
  };
};

/**
 * Generate 1-Day AI Meal Plan
 */
const generateMealPlanAI = async (user, targets, options = {}) => {
  const { systemInstruction, prompt } = buildMealPrompt(user, targets, options);

  let rawPlan = await geminiService.generateStructuredJson(systemInstruction, prompt);

  if (rawPlan) {
    const validated = mealPlanZodSchema.safeParse(rawPlan);
    if (validated.success) {
      if (validated.data.days && validated.data.days[0]?.meals) {
        validated.data.days[0].meals.sort(
          (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
        );
      }
      logger.info(`Gemini AI generated daily meal plan: "${validated.data.title}"`);
      return {
        ...validated.data,
        aiMetadata: {
          model: 'gemini-1.5-flash',
          generatedAt: new Date(),
          customInstructions: options.customNotes || '',
        },
      };
    } else {
      logger.warn('Gemini daily meal response failed Zod validation. Using algorithmic meal generator.', validated.error);
    }
  }

  logger.info('Generating algorithmic expert daily meal plan fallback.');
  const fallback = generateAlgorithmicMealPlan(user, targets, options);
  const validatedFallback = mealPlanZodSchema.parse(fallback);
  return {
    ...validatedFallback,
    aiMetadata: {
      model: 'fitpilot-expert-nutrition-rules',
      generatedAt: new Date(),
      customInstructions: options.customNotes || '',
    },
  };
};

/**
 * Swap entire single meal dish with AI (Allowing natural +/- kcal variance and high recipe diversity)
 */
const generateSingleMealAI = async (user, mealType, targetNutrients, existingMeal = null, options = {}) => {
  const profile = user.profile || {};
  const nutPref = profile.nutritionPreferences || {};
  const diet = (options.dietaryPreference || nutPref.dietaryPreference || 'omnivore').toLowerCase();
  const dislikes = nutPref.dislikedFoods || [];
  const restrictions = nutPref.dietaryRestrictions || [];

  const minCal = Math.round(targetNutrients.calories * 0.88);
  const maxCal = Math.round(targetNutrients.calories * 1.12);

  const systemInstruction = `You are FitPilot AI, an elite sports dietitian and culinary nutritionist.
The athlete is requesting a fresh, delicious alternative recipe for the meal slot "${mealType.toUpperCase()}".

CRITICAL DIETARY LIFESTYLE ENFORCEMENT:
- Dietary Lifestyle: "${diet.toUpperCase()}".
${diet === 'vegetarian' ? '- STRICT VEGETARIAN: NEVER include chicken, beef, pork, turkey, fish, or seafood under any circumstance. Only use vegetarian ingredients (tofu, paneer, eggs, dairy, lentils, beans, grains, vegetables, nuts).' : ''}
${diet === 'vegan' ? '- STRICT 100% VEGAN: ZERO animal products (no meat, poultry, fish, eggs, dairy, whey, or honey). Only plant-based ingredients.' : ''}
${diet === 'pescatarian' ? '- PESCATARIAN: Only seafood/fish and plant-based/vegetarian ingredients (no poultry, beef, or pork).' : ''}

FLEXIBLE CALORIE & MACRO VARIANCE:
1. Target Calories: between ${minCal} kcal and ${maxCal} kcal (natural realistic portion variance of +/- 10% is encouraged).
2. Target Protein: approximately ~${targetNutrients.protein}g (+/- 10g), Carbs ~${targetNutrients.carbs}g, Fats ~${targetNutrients.fats}g.
3. Generate a creative, distinct recipe. Do NOT duplicate the previous recipe: "${existingMeal ? existingMeal.name : 'none'}".
4. Follow dietary lifestyle: ${diet}. Avoid allergens: [${[...dislikes, ...restrictions].join(', ')}].
5. Include full ingredients (with precise amounts and categories) and clear step-by-step instructions.
6. Output MUST be valid JSON adhering to the meal schema.`;

  const prompt = `Generate a new alternative ${mealType} dish for athlete:
- Athlete: ${user.name}
- Dietary Lifestyle: ${diet}
- Target Energy Window: ${minCal} - ${maxCal} kcal (Target ~${targetNutrients.calories} kcal)
- Target Macros: Protein: ~${targetNutrients.protein}g, Carbs: ~${targetNutrients.carbs}g, Fats: ~${targetNutrients.fats}g

Output JSON:
{
  "mealType": "${mealType}",
  "name": "Creative Recipe Name",
  "calories": ${targetNutrients.calories},
  "protein": ${targetNutrients.protein},
  "carbs": ${targetNutrients.carbs},
  "fats": ${targetNutrients.fats},
  "prepTimeMinutes": 20,
  "ingredients": [
    { "item": "Item 1", "amount": "150g", "category": "Produce" }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ]
}`;

  try {
    const rawMeal = await geminiService.generateStructuredJson(systemInstruction, prompt);
    if (rawMeal) {
      const validated = mealZodSchema.safeParse(rawMeal);
      if (validated.success) {
        logger.info(`Gemini generated swapped meal for ${mealType}: "${validated.data.name}" (${validated.data.calories} kcal)`);
        return validated.data;
      }
    }
  } catch (err) {
    logger.warn('Gemini single meal swap failed. Using algorithmic fallback.', err.message);
  }

  // Algorithmic Fallback for whole dish swap with natural calorie variance (+/- 10%)
  const poolContainer = DIETARY_RECIPE_POOLS[diet] || DIETARY_RECIPE_POOLS.omnivore;
  const pool = poolContainer[mealType] || poolContainer.lunch;

  // Avoid repeating previous recipe
  const currentName = existingMeal ? existingMeal.name.toLowerCase() : '';
  const availableDishes = pool.filter((d) => !currentName.includes(d.name.toLowerCase().slice(0, 15)));
  const finalPool = availableDishes.length > 0 ? availableDishes : pool;
  const picked = finalPool[Math.floor(Math.random() * finalPool.length)];

  const varianceMultiplier = picked.calMult || (0.92 + Math.random() * 0.16); // ~0.92 to ~1.08 (+/- 8-10%)
  const actualCalories = Math.round(targetNutrients.calories * varianceMultiplier);
  const actualProtein = Math.round(targetNutrients.protein * varianceMultiplier);
  const actualCarbs = Math.round(targetNutrients.carbs * varianceMultiplier);
  const actualFats = Math.round(targetNutrients.fats * varianceMultiplier);

  return {
    mealType,
    name: picked.name,
    calories: actualCalories,
    protein: actualProtein,
    carbs: actualCarbs,
    fats: actualFats,
    prepTimeMinutes: picked.prepTimeMinutes,
    ingredients: picked.ingredients,
    instructions: picked.instructions,
  };
};

module.exports = {
  MEAL_ORDER,
  DIETARY_RECIPE_POOLS,
  generateMealPlanAI,
  generateSingleMealAI,
};
