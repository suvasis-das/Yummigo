const mongoose = require("mongoose");
const multer = require("multer");
const Recipes = require("../models/recipe");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
    return cb(null, true);
  },
});

const uploadSingleImage = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image must be smaller than 2 MB" });
      }
      return res.status(400).json({ message: err.message || "Invalid file upload" });
    }
    return next();
  });
};

const fileToDataUri = (file) => {
  if (!file || !file.buffer) return "";
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

const normalizeIngredients = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => String(item).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const getRecipes = async (req, res) => {
  try {
    const search = typeof req.query?.search === "string" ? req.query.search.trim() : "";
    const filter = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ title: regex }, { ingredients: regex }];
    }

    const recipes = await Recipes.find(filter).sort({ createdAt: -1 });
    return res.json(recipes);
  } catch (err) {
    console.error("getRecipes error:", err);
    return res.status(500).json({ message: "Failed to load recipes" });
  }
};

const getRecipe = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }

    const recipe = await Recipes.findById(req.params.id).populate("createdBy", "email");
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const obj = recipe.toObject();
    const creatorEmail = obj.createdBy && typeof obj.createdBy === "object" ? obj.createdBy.email : "";
    const creatorId = obj.createdBy && typeof obj.createdBy === "object" ? obj.createdBy._id : obj.createdBy;

    return res.json({
      ...obj,
      createdBy: creatorId,
      email: creatorEmail || "Community Chef",
    });
  } catch (err) {
    console.error("getRecipe error:", err);
    return res.status(500).json({ message: "Failed to load recipe" });
  }
};

const addRecipe = async (req, res) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const instructions = typeof req.body?.instructions === "string" ? req.body.instructions.trim() : "";
    const time = typeof req.body?.time === "string" ? req.body.time.trim() : "";
    const ingredients = normalizeIngredients(req.body?.ingredients);

    if (!title || ingredients.length === 0 || !instructions) {
      return res.status(400).json({ message: "Title, ingredients, and instructions are required" });
    }

    const coverImage = req.file ? fileToDataUri(req.file) : "";

    const newRecipe = await Recipes.create({
      title,
      ingredients,
      instructions,
      time,
      coverImage,
      createdBy: req.user.id,
    });

    return res.status(201).json(newRecipe);
  } catch (err) {
    console.error("addRecipe error:", err);
    return res.status(500).json({ message: "Failed to create recipe" });
  }
};

const editRecipe = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }

    const recipe = await Recipes.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (!recipe.createdBy || recipe.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to edit this recipe" });
    }

    const title = typeof req.body?.title === "string" ? req.body.title.trim() : recipe.title;
    const instructions = typeof req.body?.instructions === "string" ? req.body.instructions.trim() : recipe.instructions;
    const time = typeof req.body?.time === "string" ? req.body.time.trim() : recipe.time;
    const ingredients = req.body?.ingredients !== undefined
      ? normalizeIngredients(req.body.ingredients)
      : recipe.ingredients;

    if (!title || ingredients.length === 0 || !instructions) {
      return res.status(400).json({ message: "Title, ingredients, and instructions are required" });
    }

    const coverImage = req.file ? fileToDataUri(req.file) : recipe.coverImage;

    const updated = await Recipes.findByIdAndUpdate(
      req.params.id,
      { title, ingredients, instructions, time, coverImage },
      { new: true, runValidators: true }
    );

    return res.json(updated);
  } catch (err) {
    console.error("editRecipe error:", err);
    return res.status(500).json({ message: "Failed to update recipe" });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }

    const recipe = await Recipes.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (!recipe.createdBy || recipe.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to delete this recipe" });
    }

    await Recipes.deleteOne({ _id: req.params.id });
    return res.json({ status: "ok", id: req.params.id });
  } catch (err) {
    console.error("deleteRecipe error:", err);
    return res.status(500).json({ message: "Failed to delete recipe" });
  }
};

module.exports = {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  upload,
  uploadSingleImage,
};
