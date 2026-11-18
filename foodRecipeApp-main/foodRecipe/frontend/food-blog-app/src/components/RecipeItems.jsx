import { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BsStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import foodImg from "../assets/foodRecipe.png";
import {
  API_URL,
  extractApiError,
  getAuthToken,
  getImageUrl,
  getStoredFavourites,
} from "../constants";

export default function RecipeItems() {
  const recipes = useLoaderData();
  const location = useLocation();
  const navigate = useNavigate();

  const [allRecipes, setAllRecipes] = useState([]);
  const [favItems, setFavItems] = useState(() => getStoredFavourites());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusError, setStatusError] = useState("");

  const isMyRecipesPage = location.pathname === "/myRecipe";
  const isFavPage = location.pathname === "/favRecipe";

  useEffect(() => {
    setAllRecipes(Array.isArray(recipes) ? recipes : []);
    setFavItems(getStoredFavourites());
    setStatusError("");
  }, [recipes, location.pathname]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRecipes;
    return allRecipes.filter((item) => {
      const titleMatch = (item.title || "").toLowerCase().includes(q);
      const ingredientsMatch = Array.isArray(item.ingredients)
        ? item.ingredients.some((ing) => String(ing).toLowerCase().includes(q))
        : String(item.ingredients || "").toLowerCase().includes(q);
      return titleMatch || ingredientsMatch;
    });
  }, [allRecipes, searchQuery]);

  const onDelete = async (e, id) => {
    e.stopPropagation();
    const confirmed = window.confirm("Delete this recipe permanently?");
    if (!confirmed) return;

    setStatusError("");
    try {
      await axios.delete(`${API_URL}/recipe/${id}`, {
        headers: {
          authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setAllRecipes((prev) => prev.filter((recipe) => recipe._id !== id));
      const updatedFavs = favItems.filter((recipe) => recipe._id !== id);
      setFavItems(updatedFavs);
      localStorage.setItem("fav", JSON.stringify(updatedFavs));
    } catch (err) {
      setStatusError(extractApiError(err, "Could not delete recipe."));
    }
  };

  const toggleFavourite = (e, item) => {
    e.stopPropagation();
    const exists = favItems.some((recipe) => recipe._id === item._id);
    const updatedFavs = exists
      ? favItems.filter((recipe) => recipe._id !== item._id)
      : [...favItems, item];

    setFavItems(updatedFavs);
    localStorage.setItem("fav", JSON.stringify(updatedFavs));

    if (isFavPage) {
      setAllRecipes(updatedFavs);
    }
  };

  const heading = isMyRecipesPage
    ? "My Recipes"
    : isFavPage
      ? "Saved Favourites"
      : "Explore Recipes";

  return (
    <section className="recipes-section" aria-label={heading}>
      <div className="recipes-toolbar">
        <div>
          <h2 className="section-heading">{heading}</h2>
          <p className="section-count">
            {filteredRecipes.length}{" "}
            {filteredRecipes.length === 1 ? "recipe" : "recipes"}
          </p>
        </div>
        <div className="search-wrap">
          <input
            type="search"
            className="search-input"
            placeholder="Search by dish or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search recipes"
          />
        </div>
      </div>

      {statusError ? (
        <p className="form-error status-banner" role="alert">
          {statusError}
        </p>
      ) : null}

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <h3>
            {searchQuery.trim()
              ? `No recipes matching "${searchQuery.trim()}"`
              : isMyRecipesPage
                ? "You haven't published any recipes yet"
                : isFavPage
                  ? "No favourite recipes saved yet"
                  : "No recipes available yet"}
          </h3>
          <p>
            {searchQuery.trim()
              ? "Try a different dish name or ingredient."
              : isMyRecipesPage
                ? "Publish your first dish to see it here."
                : isFavPage
                  ? "Tap the heart icon on any recipe card to save it for quick access."
                  : "Be the first to share a recipe with the community."}
          </p>
          {searchQuery.trim() ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </button>
          ) : isMyRecipesPage ? (
            <Link to="/addRecipe" className="btn-primary">
              Add your first recipe
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="card-container">
          {filteredRecipes.map((item) => {
            const isFav = favItems.some((res) => res._id === item._id);
            const imgSrc = getImageUrl(item.coverImage, foodImg);

            return (
              <article
                key={item._id}
                className="card"
                onClick={() => navigate(`/recipe/${item._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/recipe/${item._id}`);
                  }
                }}
              >
                <div className="card-image-wrap">
                  <img
                    src={imgSrc}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = foodImg;
                    }}
                  />
                </div>
                <div className="card-body">
                  <h3 className="title">{item.title}</h3>
                  <div className="icons">
                    <div className="timer">
                      <BsStopwatchFill aria-hidden="true" />
                      <span>{item.time || "Quick prep"}</span>
                    </div>
                    {!isMyRecipesPage ? (
                      <button
                        type="button"
                        className={`icon-btn fav-btn ${isFav ? "is-fav" : ""}`}
                        onClick={(e) => toggleFavourite(e, item)}
                        aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                        title={isFav ? "Remove from favourites" : "Save to favourites"}
                      >
                        <FaHeart />
                      </button>
                    ) : (
                      <div className="action" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/editRecipe/${item._id}`}
                          className="icon-btn editIcon"
                          aria-label={`Edit ${item.title}`}
                          title="Edit recipe"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => onDelete(e, item._id)}
                          className="icon-btn deleteIcon"
                          aria-label={`Delete ${item.title}`}
                          title="Delete recipe"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
