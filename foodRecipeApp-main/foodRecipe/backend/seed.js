const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcrypt");
const connectDb = require("./config/connectionDb");
const User = require("./models/user");
const Recipes = require("./models/recipe");

const DEMO_CHEF_EMAIL = "chef@yummigo.app";

const SAMPLE_RECIPES = [
  {
    title: "Paneer Butter Masala",
    time: "35 mins",
    coverImage: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      "250g paneer cubes",
      "3 ripe tomatoes (pureed)",
      "2 tbsp butter",
      "1/4 cup fresh cream",
      "1 tbsp ginger-garlic paste",
      "1 tsp Kashmiri red chilli powder",
      "1 tsp garam masala",
      "1 tbsp kasuri methi",
      "Salt to taste",
    ],
    instructions:
      "1. Heat butter in a pan and saute ginger-garlic paste for 1 minute.\n2. Pour in the tomato puree, Kashmiri chilli powder, and salt. Simmer 10 minutes until rich and thick.\n3. Stir in garam masala, crushed kasuri methi, and fresh cream.\n4. Add paneer cubes and simmer gently for 5 minutes. Serve hot with garlic naan.",
  },
  {
    title: "Garlic Butter Herb Pasta",
    time: "20 mins",
    coverImage: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      "250g spaghetti or fettuccine",
      "4 cloves garlic (minced)",
      "3 tbsp unsalted butter",
      "2 tbsp extra-virgin olive oil",
      "1/2 cup grated Parmesan",
      "1/4 tsp red pepper flakes",
      "Fresh parsley (chopped)",
      "Salt and black pepper",
    ],
    instructions:
      "1. Boil pasta in salted water until al dente, reserving 1/2 cup of pasta water.\n2. In a wide skillet, melt butter with olive oil over medium-low heat and saute minced garlic and chilli flakes until fragrant.\n3. Toss in drained pasta with splashes of pasta water and grated Parmesan until silky.\n4. Finish with freshly cracked black pepper and chopped parsley.",
  },
  {
    title: "Crispy Masala Dosa",
    time: "30 mins",
    coverImage: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      "2 cups fermented dosa batter",
      "3 medium boiled potatoes (mashed)",
      "1 onion (thinly sliced)",
      "1 tsp mustard seeds",
      "8 curry leaves",
      "1/2 tsp turmeric powder",
      "2 green chillies (chopped)",
      "2 tbsp oil or ghee",
    ],
    instructions:
      "1. Temper mustard seeds, curry leaves, and green chillies in 1 tbsp oil. Saute onions until translucent, add turmeric and mashed potatoes, and season with salt.\n2. Heat a cast-iron tawa, pour a ladle of batter, and spread thinly in a spiral.\n3. Drizzle ghee around the edges and cook until golden and crisp.\n4. Spoon potato masala into the center, fold, and serve with coconut chutney and sambar.",
  },
  {
    title: "Margherita Flatbread Pizza",
    time: "25 mins",
    coverImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      "1 pizza dough ball or artisan flatbread",
      "1/2 cup San Marzano tomato sauce",
      "150g fresh mozzarella (sliced)",
      "Fresh basil leaves",
      "1 tbsp olive oil",
      "Pinch of sea salt",
    ],
    instructions:
      "1. Preheat oven to 230 C (450 F) with a baking sheet inside.\n2. Stretch dough thinly, spread tomato sauce evenly, and top with torn mozzarella slices.\n3. Bake for 10 to 12 minutes until the crust is blistered and cheese bubbles.\n4. Top with fresh basil leaves, a drizzle of olive oil, and flaky sea salt.",
  },
  {
    title: "Avocado Toast with Soft Egg",
    time: "12 mins",
    coverImage: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      "2 slices sourdough bread",
      "1 ripe avocado",
      "2 farm-fresh eggs",
      "1/2 lemon (juiced)",
      "Chilli flakes",
      "Flaky salt and black pepper",
    ],
    instructions:
      "1. Toast sourdough slices until deeply golden and crisp.\n2. Mash avocado with lemon juice, salt, and cracked pepper.\n3. Soft-boil or poach eggs for 6 minutes so the yolks remain jammy.\n4. Spread avocado generously on toast, top with halved eggs, and dust with chilli flakes.",
  },
  {
    title: "Thai Mango Sticky Rice",
    time: "40 mins",
    coverImage: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      "1 cup glutinous (sticky) rice",
      "1 cup full-fat coconut milk",
      "3 tbsp palm sugar or brown sugar",
      "1/4 tsp salt",
      "2 ripe sweet mangoes (sliced)",
      "1 tbsp toasted sesame seeds",
    ],
    instructions:
      "1. Rinse sticky rice and steam for 20 minutes until tender and glossy.\n2. Warm coconut milk with sugar and salt until dissolved (do not boil).\n3. Fold three-quarters of the sweet coconut sauce into the hot rice and let rest 15 minutes to absorb.\n4. Serve alongside chilled mango slices, drizzle remaining coconut sauce, and garnish with toasted sesame seeds.",
  },
];

let seedChecked = false;
let inFlightSeed = null;

const ensureDemoSeed = async () => {
  if (seedChecked) {
    return { seeded: false };
  }
  if (inFlightSeed) {
    await inFlightSeed;
    return { seeded: false };
  }

  inFlightSeed = (async () => {
    const count = await Recipes.countDocuments();
    if (count > 0) {
      seedChecked = true;
      return { seeded: false, count };
    }

    let chef = await User.findOne({ email: DEMO_CHEF_EMAIL });
    if (!chef) {
      const hashPwd = await bcrypt.hash("YummigoDemo123!", 10);
      chef = await User.create({
        email: DEMO_CHEF_EMAIL,
        password: hashPwd,
      });
    }

    const docs = SAMPLE_RECIPES.map((r) => ({
      ...r,
      createdBy: chef._id,
    }));

    await Recipes.insertMany(docs);
    seedChecked = true;
    console.log(`Seeded ${docs.length} sample recipes`);
    return { seeded: true, count: docs.length };
  })().finally(() => {
    inFlightSeed = null;
  });

  return inFlightSeed;
};

if (require.main === module) {
  (async () => {
    try {
      await connectDb();
      const result = await ensureDemoSeed();
      console.log("Seed finished:", result);
      process.exit(0);
    } catch (err) {
      console.error("Seed failed:", err);
      process.exit(1);
    }
  })();
}

module.exports = { ensureDemoSeed, SAMPLE_RECIPES };
