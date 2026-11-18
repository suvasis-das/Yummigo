import "./App.css";
import { createBrowserRouter, Link, RouterProvider, useRouteError } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import MainNavigation from "./components/MainNavigation";
import AddFoodRecipe from "./pages/AddFoodRecipe";
import EditRecipe from "./pages/EditRecipe";
import RecipeDetails from "./pages/RecipeDetails";
import { API_URL, getStoredFavourites, getStoredUser } from "./constants";

const getAllRecipes = async () => {
  try {
    const res = await axios.get(`${API_URL}/recipe`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    return [];
  }
};

const getMyRecipes = async () => {
  const user = getStoredUser();
  if (!user?._id) {
    return [];
  }
  const allRecipes = await getAllRecipes();
  return allRecipes.filter((item) => item.createdBy === user._id);
};

const getFavRecipes = () => {
  return getStoredFavourites();
};

const getRecipe = async ({ params }) => {
  const res = await axios.get(`${API_URL}/recipe/${params.id}`);
  const recipe = res.data;

  if (!recipe) {
    throw new Response("Recipe not found", { status: 404 });
  }

  if (recipe.email) {
    return recipe;
  }

  if (recipe.createdBy) {
    try {
      const userRes = await axios.get(`${API_URL}/user/${recipe.createdBy}`);
      return { ...recipe, email: userRes.data?.email || "Community Chef" };
    } catch {
      return { ...recipe, email: "Community Chef" };
    }
  }

  return { ...recipe, email: "Community Chef" };
};

function RouteErrorFallback() {
  const error = useRouteError();
  const message =
    error?.response?.data?.message ||
    error?.statusText ||
    error?.message ||
    "We couldn't load this page.";

  return (
    <div className="empty-state page-fallback">
      <h2>Oops — something went wrong</h2>
      <p>{message}</p>
      <Link to="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainNavigation />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: "/", element: <Home />, loader: getAllRecipes },
      { path: "/myRecipe", element: <Home />, loader: getMyRecipes },
      { path: "/favRecipe", element: <Home />, loader: getFavRecipes },
      { path: "/addRecipe", element: <AddFoodRecipe /> },
      { path: "/editRecipe/:id", element: <EditRecipe /> },
      {
        path: "/recipe/:id",
        element: <RecipeDetails />,
        loader: getRecipe,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
