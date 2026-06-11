"""Schema creation and recipe seeding, run on backend startup."""

import json

from db import db

SCHEMA = """
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    value_mg_dl REAL NOT NULL,
    taken_at TIMESTAMP NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    eaten_at TIMESTAMP NOT NULL,
    source TEXT NOT NULL DEFAULT 'text',
    calories REAL, carbs_g REAL, sugar_g REAL, fiber_g REAL,
    protein_g REAL, fat_g REAL,
    glycemic_impact TEXT,
    tip TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    servings INT NOT NULL,
    prep_minutes INT NOT NULL,
    calories REAL, carbs_g REAL, sugar_g REAL, fiber_g REAL,
    protein_g REAL, fat_g REAL,
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    quantity TEXT,
    category TEXT NOT NULL DEFAULT 'Pantry',
    checked BOOLEAN NOT NULL DEFAULT false,
    recipe_title TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
"""

# Macros are per serving. Ingredient categories drive shopping-list grouping.
RECIPES = [
    {
        "title": "Sheet-Pan Lemon Salmon & Broccoli",
        "description": "Crispy-edged salmon with charred broccoli and lemon. One pan, 25 minutes, almost no carbs.",
        "tags": ["low-carb", "dinner", "high-protein", "quick"],
        "servings": 2, "prep_minutes": 25,
        "calories": 420, "carbs_g": 9, "sugar_g": 2, "fiber_g": 4, "protein_g": 38, "fat_g": 25,
        "ingredients": [
            {"name": "salmon fillets", "qty": "2 (6 oz each)", "category": "Protein"},
            {"name": "broccoli crowns", "qty": "1 lb", "category": "Produce"},
            {"name": "lemon", "qty": "1", "category": "Produce"},
            {"name": "olive oil", "qty": "3 tbsp", "category": "Pantry"},
            {"name": "garlic", "qty": "3 cloves", "category": "Produce"},
            {"name": "smoked paprika", "qty": "1 tsp", "category": "Pantry"},
        ],
        "instructions": [
            "Heat oven to 425°F with a sheet pan inside.",
            "Toss broccoli with oil, garlic, salt; roast 10 minutes.",
            "Push broccoli aside, add salmon, dust with paprika, top with lemon slices.",
            "Roast 12 more minutes until salmon flakes.",
        ],
    },
    {
        "title": "Cauliflower Fried 'Rice' with Chicken",
        "description": "Takeout flavor at a fraction of the carbs — riced cauliflower, egg, scallion, sesame.",
        "tags": ["low-carb", "dinner", "quick", "high-protein"],
        "servings": 3, "prep_minutes": 20,
        "calories": 350, "carbs_g": 12, "sugar_g": 5, "fiber_g": 4, "protein_g": 32, "fat_g": 18,
        "ingredients": [
            {"name": "riced cauliflower", "qty": "16 oz bag", "category": "Frozen"},
            {"name": "chicken thighs, boneless", "qty": "1 lb", "category": "Protein"},
            {"name": "eggs", "qty": "2", "category": "Dairy"},
            {"name": "scallions", "qty": "1 bunch", "category": "Produce"},
            {"name": "low-sodium soy sauce", "qty": "3 tbsp", "category": "Pantry"},
            {"name": "sesame oil", "qty": "1 tbsp", "category": "Pantry"},
            {"name": "frozen peas & carrots", "qty": "1 cup", "category": "Frozen"},
        ],
        "instructions": [
            "Brown diced chicken in a hot wok; set aside.",
            "Scramble eggs, then add cauliflower rice and veg; stir-fry 5 minutes.",
            "Return chicken, add soy and sesame oil, toss with scallions.",
        ],
    },
    {
        "title": "Greek Chicken Bowls",
        "description": "Marinated chicken, cucumber, tomato, olives and feta over a small bed of bulgur.",
        "tags": ["mediterranean", "lunch", "meal-prep", "high-protein"],
        "servings": 4, "prep_minutes": 35,
        "calories": 430, "carbs_g": 24, "sugar_g": 5, "fiber_g": 6, "protein_g": 36, "fat_g": 21,
        "ingredients": [
            {"name": "chicken breast", "qty": "1.5 lb", "category": "Protein"},
            {"name": "bulgur wheat", "qty": "1 cup dry", "category": "Pantry"},
            {"name": "cucumber", "qty": "1 large", "category": "Produce"},
            {"name": "cherry tomatoes", "qty": "1 pint", "category": "Produce"},
            {"name": "kalamata olives", "qty": "1/2 cup", "category": "Pantry"},
            {"name": "feta cheese", "qty": "4 oz", "category": "Dairy"},
            {"name": "greek yogurt, plain", "qty": "1 cup", "category": "Dairy"},
            {"name": "lemon", "qty": "2", "category": "Produce"},
            {"name": "dried oregano", "qty": "1 tbsp", "category": "Pantry"},
        ],
        "instructions": [
            "Marinate chicken in lemon, oregano, oil 15 minutes; grill or pan-sear.",
            "Cook bulgur per package; portion 1/2 cup per bowl.",
            "Assemble with chopped vegetables, olives, feta and a yogurt-lemon drizzle.",
        ],
    },
    {
        "title": "Turkey & Black Bean Chili",
        "description": "Slow-simmered, fiber-loaded chili. Beans bring carbs but plenty of fiber to blunt the spike.",
        "tags": ["dinner", "meal-prep", "high-fiber", "freezer-friendly"],
        "servings": 6, "prep_minutes": 50,
        "calories": 340, "carbs_g": 28, "sugar_g": 6, "fiber_g": 10, "protein_g": 30, "fat_g": 11,
        "ingredients": [
            {"name": "ground turkey, 93% lean", "qty": "1.5 lb", "category": "Protein"},
            {"name": "black beans, canned", "qty": "2 cans", "category": "Pantry"},
            {"name": "crushed tomatoes", "qty": "28 oz can", "category": "Pantry"},
            {"name": "yellow onion", "qty": "1", "category": "Produce"},
            {"name": "bell peppers", "qty": "2", "category": "Produce"},
            {"name": "chili powder", "qty": "2 tbsp", "category": "Pantry"},
            {"name": "cumin", "qty": "1 tbsp", "category": "Pantry"},
        ],
        "instructions": [
            "Brown turkey with onion and peppers.",
            "Add spices, beans, tomatoes and a cup of water.",
            "Simmer 35 minutes. Better the next day.",
        ],
    },
    {
        "title": "Zucchini Noodle Bolognese",
        "description": "Rich beef ragu over spiralized zucchini — pasta night without the pasta crash.",
        "tags": ["low-carb", "dinner", "italian"],
        "servings": 4, "prep_minutes": 40,
        "calories": 380, "carbs_g": 13, "sugar_g": 8, "fiber_g": 4, "protein_g": 28, "fat_g": 24,
        "ingredients": [
            {"name": "ground beef, 90% lean", "qty": "1 lb", "category": "Protein"},
            {"name": "zucchini", "qty": "4 medium", "category": "Produce"},
            {"name": "crushed tomatoes", "qty": "28 oz can", "category": "Pantry"},
            {"name": "yellow onion", "qty": "1", "category": "Produce"},
            {"name": "garlic", "qty": "4 cloves", "category": "Produce"},
            {"name": "parmesan", "qty": "2 oz", "category": "Dairy"},
            {"name": "red wine vinegar", "qty": "1 tbsp", "category": "Pantry"},
        ],
        "instructions": [
            "Brown beef with onion and garlic; add tomatoes and simmer 25 minutes.",
            "Spiralize zucchini; sauté 2 minutes only — keep some bite.",
            "Plate noodles, ladle ragu, finish with parmesan.",
        ],
    },
    {
        "title": "Overnight Chia-Berry Jars",
        "description": "Breakfast that holds your morning numbers steady: chia, Greek yogurt, and a modest berry layer.",
        "tags": ["breakfast", "meal-prep", "high-fiber", "vegetarian"],
        "servings": 4, "prep_minutes": 10,
        "calories": 240, "carbs_g": 19, "sugar_g": 9, "fiber_g": 9, "protein_g": 14, "fat_g": 12,
        "ingredients": [
            {"name": "chia seeds", "qty": "1/2 cup", "category": "Pantry"},
            {"name": "greek yogurt, plain", "qty": "2 cups", "category": "Dairy"},
            {"name": "unsweetened almond milk", "qty": "1.5 cups", "category": "Dairy"},
            {"name": "mixed berries", "qty": "2 cups", "category": "Frozen"},
            {"name": "vanilla extract", "qty": "1 tsp", "category": "Pantry"},
            {"name": "cinnamon", "qty": "1 tsp", "category": "Pantry"},
        ],
        "instructions": [
            "Whisk chia, milk, vanilla, cinnamon; rest 5 minutes and whisk again.",
            "Layer into jars with yogurt and berries.",
            "Refrigerate overnight. Keeps 4 days.",
        ],
    },
    {
        "title": "Egg Roll in a Bowl",
        "description": "All the filling, none of the fried wrapper. Ginger-garlic pork over crunchy cabbage.",
        "tags": ["low-carb", "dinner", "quick"],
        "servings": 4, "prep_minutes": 20,
        "calories": 320, "carbs_g": 10, "sugar_g": 5, "fiber_g": 4, "protein_g": 24, "fat_g": 20,
        "ingredients": [
            {"name": "ground pork", "qty": "1 lb", "category": "Protein"},
            {"name": "coleslaw mix", "qty": "14 oz bag", "category": "Produce"},
            {"name": "fresh ginger", "qty": "1 inch", "category": "Produce"},
            {"name": "garlic", "qty": "3 cloves", "category": "Produce"},
            {"name": "low-sodium soy sauce", "qty": "3 tbsp", "category": "Pantry"},
            {"name": "rice vinegar", "qty": "1 tbsp", "category": "Pantry"},
            {"name": "scallions", "qty": "1 bunch", "category": "Produce"},
        ],
        "instructions": [
            "Brown pork with ginger and garlic.",
            "Add slaw mix; stir-fry 4 minutes until just wilted.",
            "Season with soy and vinegar, shower with scallions.",
        ],
    },
    {
        "title": "Lentil & Spinach Soup",
        "description": "Slow-release carbs with serious fiber. Lemony, garlicky, freezes beautifully.",
        "tags": ["vegetarian", "high-fiber", "lunch", "freezer-friendly"],
        "servings": 6, "prep_minutes": 45,
        "calories": 260, "carbs_g": 34, "sugar_g": 4, "fiber_g": 12, "protein_g": 15, "fat_g": 7,
        "ingredients": [
            {"name": "brown lentils, dry", "qty": "1.5 cups", "category": "Pantry"},
            {"name": "baby spinach", "qty": "5 oz", "category": "Produce"},
            {"name": "carrots", "qty": "3", "category": "Produce"},
            {"name": "celery", "qty": "3 stalks", "category": "Produce"},
            {"name": "yellow onion", "qty": "1", "category": "Produce"},
            {"name": "vegetable broth, low-sodium", "qty": "6 cups", "category": "Pantry"},
            {"name": "lemon", "qty": "1", "category": "Produce"},
            {"name": "cumin", "qty": "2 tsp", "category": "Pantry"},
        ],
        "instructions": [
            "Sweat onion, carrot, celery in olive oil.",
            "Add lentils, cumin, broth; simmer 30 minutes.",
            "Stir in spinach and lemon juice off heat.",
        ],
    },
    {
        "title": "Almond-Crusted Cod with Green Beans",
        "description": "Crunchy almond crust instead of breadcrumbs — bakes in 15 minutes.",
        "tags": ["low-carb", "dinner", "quick", "high-protein"],
        "servings": 2, "prep_minutes": 25,
        "calories": 390, "carbs_g": 11, "sugar_g": 4, "fiber_g": 6, "protein_g": 36, "fat_g": 23,
        "ingredients": [
            {"name": "cod fillets", "qty": "2 (6 oz each)", "category": "Protein"},
            {"name": "almond flour", "qty": "1/2 cup", "category": "Pantry"},
            {"name": "green beans", "qty": "12 oz", "category": "Produce"},
            {"name": "dijon mustard", "qty": "2 tbsp", "category": "Pantry"},
            {"name": "lemon", "qty": "1", "category": "Produce"},
            {"name": "olive oil", "qty": "2 tbsp", "category": "Pantry"},
        ],
        "instructions": [
            "Brush cod with dijon, press on almond flour seasoned with lemon zest.",
            "Bake at 400°F with oiled green beans, 14–16 minutes.",
        ],
    },
    {
        "title": "Steak Fajita Lettuce Wraps",
        "description": "Sizzling peppers and seared flank steak in crisp romaine instead of tortillas.",
        "tags": ["low-carb", "dinner", "high-protein"],
        "servings": 4, "prep_minutes": 30,
        "calories": 330, "carbs_g": 9, "sugar_g": 5, "fiber_g": 3, "protein_g": 27, "fat_g": 21,
        "ingredients": [
            {"name": "flank steak", "qty": "1.25 lb", "category": "Protein"},
            {"name": "bell peppers", "qty": "3", "category": "Produce"},
            {"name": "red onion", "qty": "1", "category": "Produce"},
            {"name": "romaine hearts", "qty": "2", "category": "Produce"},
            {"name": "lime", "qty": "2", "category": "Produce"},
            {"name": "avocado", "qty": "1", "category": "Produce"},
            {"name": "chili powder", "qty": "1 tbsp", "category": "Pantry"},
            {"name": "cumin", "qty": "2 tsp", "category": "Pantry"},
        ],
        "instructions": [
            "Sear spice-rubbed steak 4 minutes per side; rest, then slice thin.",
            "Char peppers and onion in the same pan.",
            "Serve in romaine leaves with avocado and lime.",
        ],
    },
    {
        "title": "Ricotta & Veggie Frittata",
        "description": "Cut into wedges for three days of grab-and-go breakfasts that won't spike you.",
        "tags": ["breakfast", "vegetarian", "low-carb", "meal-prep"],
        "servings": 6, "prep_minutes": 35,
        "calories": 230, "carbs_g": 6, "sugar_g": 3, "fiber_g": 1, "protein_g": 16, "fat_g": 16,
        "ingredients": [
            {"name": "eggs", "qty": "10", "category": "Dairy"},
            {"name": "ricotta", "qty": "3/4 cup", "category": "Dairy"},
            {"name": "zucchini", "qty": "1", "category": "Produce"},
            {"name": "cherry tomatoes", "qty": "1 cup", "category": "Produce"},
            {"name": "baby spinach", "qty": "3 oz", "category": "Produce"},
            {"name": "parmesan", "qty": "1 oz", "category": "Dairy"},
        ],
        "instructions": [
            "Sauté zucchini and spinach in an oven-safe skillet.",
            "Pour in whisked eggs, dot with ricotta and tomatoes.",
            "Bake at 375°F for 20 minutes until just set.",
        ],
    },
    {
        "title": "Peanut-Lime Chicken Salad",
        "description": "Crunchy cabbage salad with a peanut-lime dressing that tastes far more indulgent than it is.",
        "tags": ["lunch", "quick", "high-protein", "low-carb"],
        "servings": 3, "prep_minutes": 20,
        "calories": 360, "carbs_g": 14, "sugar_g": 6, "fiber_g": 5, "protein_g": 33, "fat_g": 20,
        "ingredients": [
            {"name": "rotisserie chicken", "qty": "3 cups shredded", "category": "Protein"},
            {"name": "coleslaw mix", "qty": "14 oz bag", "category": "Produce"},
            {"name": "natural peanut butter", "qty": "3 tbsp", "category": "Pantry"},
            {"name": "lime", "qty": "2", "category": "Produce"},
            {"name": "low-sodium soy sauce", "qty": "2 tbsp", "category": "Pantry"},
            {"name": "cilantro", "qty": "1 bunch", "category": "Produce"},
            {"name": "roasted peanuts", "qty": "1/4 cup", "category": "Pantry"},
        ],
        "instructions": [
            "Whisk peanut butter, lime juice, soy and a splash of warm water.",
            "Toss with slaw, chicken and cilantro; top with peanuts.",
        ],
    },
]


async def init_db():
    await db.execute(SCHEMA)
    row = await db.fetchone("SELECT count(*) AS n FROM recipes")
    if row["n"] == 0:
        for r in RECIPES:
            await db.execute(
                """INSERT INTO recipes
                   (title, description, tags, servings, prep_minutes,
                    calories, carbs_g, sugar_g, fiber_g, protein_g, fat_g,
                    ingredients, instructions)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    r["title"], r["description"], r["tags"], r["servings"],
                    r["prep_minutes"], r["calories"], r["carbs_g"], r["sugar_g"],
                    r["fiber_g"], r["protein_g"], r["fat_g"],
                    json.dumps(r["ingredients"]), json.dumps(r["instructions"]),
                ),
            )
