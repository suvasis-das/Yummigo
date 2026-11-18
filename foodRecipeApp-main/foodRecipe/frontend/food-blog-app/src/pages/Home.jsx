import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import foodRecipe from "../assets/foodRecipe.png";
import RecipeItems from "../components/RecipeItems";
import Modal from "../components/Modal";
import InputForm from "../components/InputForm";
import { getAuthToken } from "../constants";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isHomeRoute = location.pathname === "/";

  const handleShareClick = () => {
    if (getAuthToken()) {
      navigate("/addRecipe");
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      {isHomeRoute ? (
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="hero-tag">Community Kitchen</span>
              <h1>Cook, share, and save recipes worth repeating.</h1>
              <p>
                Browse home-cooked dishes with exact ingredients, prep times, and step-by-step
                instructions. Publish your own recipes or bookmark favourites to cook later.
              </p>
              <div className="hero-actions">
                <button type="button" className="btn-primary" onClick={handleShareClick}>
                  Share your recipe
                </button>
                <a href="#recipes-grid" className="btn-secondary">
                  Browse dishes
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <img src={foodRecipe} alt="Plated gourmet dish" className="hero-image" />
            </div>
          </div>
        </section>
      ) : null}

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <InputForm
            setIsOpen={() => {
              setIsOpen(false);
              navigate("/addRecipe");
            }}
          />
        </Modal>
      )}

      <div id="recipes-grid" className="recipe-wrapper">
        <RecipeItems />
      </div>
    </>
  );
}
