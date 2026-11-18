import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, extractApiError, getAuthToken } from "../constants";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function AddFoodRecipe() {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError("");
    if (!selected) {
      setFile(null);
      setPreviewUrl("");
      return;
    }
    if (!selected.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP, or GIF).");
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError("Image must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const parsedIngredients = ingredients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title.trim() || parsedIngredients.length === 0 || !instructions.trim()) {
      setError("Please fill in title, at least one ingredient, and instructions.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("time", time.trim());
    parsedIngredients.forEach((ing) => formData.append("ingredients", ing));
    formData.append("instructions", instructions.trim());
    if (file) {
      formData.append("file", file);
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/recipe`, formData, {
        headers: {
          authorization: `Bearer ${getAuthToken()}`,
        },
      });
      navigate("/myRecipe");
    } catch (err) {
      setError(extractApiError(err, "Failed to publish recipe."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="empty-state page-fallback">
        <h2>Sign in to share a recipe</h2>
        <p>Log in from the top navigation bar to publish your own dishes.</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-card-header">
          <h1>Share a Recipe</h1>
          <p>Add ingredients separated by commas and clear step-by-step instructions.</p>
        </div>

        <form className="recipe-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="recipe-title">Title *</label>
            <input
              id="recipe-title"
              type="text"
              className="input"
              placeholder="e.g., Creamy Garlic Mushroom Pasta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="recipe-time">Preparation Time</label>
            <input
              id="recipe-time"
              type="text"
              className="input"
              placeholder="e.g., 30 mins"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="recipe-ingredients">Ingredients (comma-separated) *</label>
            <textarea
              id="recipe-ingredients"
              className="input-textarea"
              rows="4"
              placeholder="e.g., 250g pasta, 4 cloves garlic, 2 tbsp butter, Parmesan, Fresh parsley"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="recipe-instructions">Instructions *</label>
            <textarea
              id="recipe-instructions"
              className="input-textarea"
              rows="6"
              placeholder="1. Boil pasta until al dente...&#10;2. Saute garlic in butter..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="recipe-image">Recipe Image (optional, max 2 MB)</label>
            <input
              id="recipe-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="input file-input"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <div className="image-preview">
                <img src={previewUrl} alt="Selected recipe preview" />
              </div>
            ) : null}
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="form-actions">
            <Link to="/" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Publishing..." : "Publish Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
