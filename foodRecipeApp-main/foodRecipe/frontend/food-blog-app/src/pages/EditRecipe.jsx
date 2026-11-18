import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import foodImg from "../assets/foodRecipe.png";
import { API_URL, extractApiError, getAuthToken, getImageUrl } from "../constants";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = getAuthToken();

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [existingCover, setExistingCover] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`${API_URL}/recipe/${id}`);
        if (!active) return;
        const data = res.data;
        setTitle(data.title || "");
        setTime(data.time || "");
        setIngredients(
          Array.isArray(data.ingredients)
            ? data.ingredients.join(", ")
            : data.ingredients || ""
        );
        setInstructions(data.instructions || "");
        setExistingCover(data.coverImage || "");
      } catch (err) {
        if (!active) return;
        setError(extractApiError(err, "Could not load this recipe."));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRecipe();
    return () => {
      active = false;
    };
  }, [id]);

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
      await axios.put(`${API_URL}/recipe/${id}`, formData, {
        headers: {
          authorization: `Bearer ${getAuthToken()}`,
        },
      });
      navigate("/myRecipe");
    } catch (err) {
      setError(extractApiError(err, "Failed to update recipe."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="empty-state page-fallback">
        <h2>Sign in required</h2>
        <p>Log in to edit your recipes.</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="empty-state page-fallback">
        <p>Loading recipe...</p>
      </div>
    );
  }

  const displayPreview = previewUrl || (existingCover ? getImageUrl(existingCover, foodImg) : "");

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-card-header">
          <h1>Edit Recipe</h1>
          <p>Update ingredients, timing, instructions, or replace the cover photo.</p>
        </div>

        <form className="recipe-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="edit-title">Title *</label>
            <input
              id="edit-title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-time">Preparation Time</label>
            <input
              id="edit-time"
              type="text"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-ingredients">Ingredients (comma-separated) *</label>
            <textarea
              id="edit-ingredients"
              className="input-textarea"
              rows="4"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-instructions">Instructions *</label>
            <textarea
              id="edit-instructions"
              className="input-textarea"
              rows="6"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-image">Replace Image (optional, max 2 MB)</label>
            <input
              id="edit-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="input file-input"
              onChange={handleFileChange}
            />
            {displayPreview ? (
              <div className="image-preview">
                <img
                  src={displayPreview}
                  alt="Recipe cover preview"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = foodImg;
                  }}
                />
              </div>
            ) : null}
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="form-actions">
            <Link to="/myRecipe" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
