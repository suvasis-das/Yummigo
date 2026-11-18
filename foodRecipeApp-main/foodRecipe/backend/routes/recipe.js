const express = require("express");
const {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  uploadSingleImage,
} = require("../controller/recipe");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.get("/", getRecipes);
router.get("/:id", getRecipe);
router.post("/", verifyToken, uploadSingleImage, addRecipe);
router.put("/:id", verifyToken, uploadSingleImage, editRecipe);
router.delete("/:id", verifyToken, deleteRecipe);

module.exports = router;
