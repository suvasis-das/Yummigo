import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Modal from "./Modal";
import InputForm from "./InputForm";
import {
  AUTH_CHANGE_EVENT,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
} from "../constants";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getStoredUser());
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(token);

  useEffect(() => {
    const syncAuth = () => {
      setToken(getAuthToken());
      setUser(getStoredUser());
    };
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      clearAuthSession();
      if (
        location.pathname === "/myRecipe" ||
        location.pathname === "/addRecipe" ||
        location.pathname.startsWith("/editRecipe")
      ) {
        navigate("/");
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleProtectedNav = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-dot" aria-hidden="true" />
            <span>Yumm!go</span>
          </NavLink>
          <nav aria-label="Main navigation">
            <ul className="nav-links">
              <li>
                <NavLink to="/" end>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/myRecipe" onClick={handleProtectedNav}>
                  My Recipes
                </NavLink>
              </li>
              <li>
                <NavLink to="/favRecipe">Favourites</NavLink>
              </li>
              <li>
                <button type="button" className="nav-auth-btn" onClick={handleAuthAction}>
                  {isLoggedIn ? "Logout" : "Login"}
                  {isLoggedIn && user?.email ? (
                    <span className="nav-user-email">({user.email})</span>
                  ) : null}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <InputForm setIsOpen={() => setIsOpen(false)} />
        </Modal>
      )}
    </>
  );
}
