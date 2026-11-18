import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import axios from "axios";
import { BsStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";
import profileImg from "../assets/profile.png";
import foodImg from "../assets/foodRecipe.png";
import {
  API_URL,
  extractApiError,
  getAuthToken,
  getImageUrl,
  getStoredFavourites,
  getStoredUser,
} from "../constants";

export default function RecipeDetails() {
  const recipe = useLoaderData();
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const [favItems, setFavItems] = useState(() => getStoredFavourites());
  const [error, setError] = useState("");

  if (!recipe) {
    return (
      <div className="empty-state page-fallback">
        <h2>Recipe not found</h2>
        <Link to="/" className="btn-primary">
          Back to recipes
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(currentUser?._id && recipe.createdBy === currentUser._id);
  const isFav = favItems.some((item) => item._id === recipe._id);
  const ingredientsList = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : String(recipe.ingredients || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const toggleFav = () => {
    const updated = isFav
      ? favItems.filter((item) => item._id !== recipe._id)
      : [...favItems, recipe];
    setFavItems(updated);
    localStorage.setItem("fav", JSON.stringify(updated));
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this recipe permanently?")) return;
    setError("");
    try {
      await axios.delete(`${API_URL}/recipe/${recipe._id}`, {
        headers: { authorization: `Bearer ${getAuthToken()}` },
      });
      const updatedFavs = favItems.filter((item) => item._id !== recipe._id);
      localStorage.setItem("fav", JSON.stringify(updatedFavs));
      navigate("/myRecipe");
    } catch (err) {
      setError(extractApiError(err, "Failed to delete recipe."));
    }
  };

  return (
    <article className="detail-page">
      <div className="detail-topbar">
        <Link to="/" className="back-link">
          ← All Recipes
        </Link>
        <div className="detail-actions">
          <button
            type="button"
            className={`btn-secondary detail-fav-btn ${isFav ? "is-fav" : ""}`}
            onClick={toggleFav}
          >
            <FaHeart aria-hidden="true" />
            <span>{isFav ? "Saved" : "Save"}</span>
          </button>
          {isOwner ? (
            <>
              <Link to={`/editRecipe/${recipe._id}`} className="btn-secondary">
                Edit
              </Link>
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="detail-hero">
        <div className="detail-image-wrap">
          <img
            src={getImageUrl(recipe.coverImage, foodImg)}
            alt={recipe.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = foodImg;
            }}
          />
        </div>
        <div className="detail-meta">
          <div className="profile">
            <img src={profileImg} alt="Chef avatar" width="40" height="40" />
            <div>
              <span className="profile-label">Recipe by</span>
              <p className="profile-email">{recipe.email || "Community Chef"}</p>
            </div>
          </div>
          <h1 className="detail-title">{recipe.title}</h1>
          {recipe.time ? (
            <div className="detail-time-pill">
              <BsStopwatchFill aria-hidden="true" />
              <span>{recipe.time}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="recipe-details-grid">
        <section className="detail-card">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {ingredientsList.map((item, idx) => (
              <li key={`${item}-${idx}`}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="detail-card">
          <h2>Instructions</h2>
          <div className="instructions-text">{recipe.instructions}</div>
        </section>
      </div>
    </article>
  );
}
