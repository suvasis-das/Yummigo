# Yummigo — Full-Stack Food Recipe Application

**Live Demo:** https://yummigo-ten.vercel.app

Yummigo is a full-stack food recipe web application where users can discover community recipes, search by dish or ingredient, create an account, publish recipes with cover images, edit or delete their own dishes, and save personal favourites.

Built with **React 18 + Vite** on the frontend, **Node.js + Express** on the backend, and **MongoDB + Mongoose** for data persistence, with **bcrypt** password hashing and **JWT** authentication.

---

## Features

- **Discover & Search Recipes**: Browse all community recipes with images, titles, and prep times, and filter live by dish name or ingredient.
- **User Authentication (JWT + bcrypt)**: Register and log in with normalized email addresses, salted bcrypt password hashes, and signed JWTs (`7d` expiry). Password hashes are never returned in API responses.
- **Publish, Edit & Delete Recipes**: Authenticated users can publish recipes with title, ingredients, preparation time, instructions, and an optional image upload (JPEG, PNG, WebP, or GIF up to 2 MB).
- **Server-Side Authorization & Ownership Checks**: Create, update, and delete endpoints require a valid Bearer JWT, and update/delete routes verify that the requesting user owns the recipe (`403 Forbidden` otherwise).
- **Serverless-Safe Image Storage**: Uploaded images are validated via Multer memory storage and stored directly as Data URIs in MongoDB, eliminating ephemeral filesystem failures on serverless hosts like Vercel.
- **Recipe Details**: View full ingredients, step-by-step instructions, preparation time, creator email, and owner edit/delete controls.
- **Favourites**: Bookmark and remove favourite recipes with instant UI updates persisted in browser `localStorage`.
- **Demo Seed Support**: Includes a starter seed script (`npm run seed`) with 6 sample recipes so fresh deployments have ready-to-browse content immediately.

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, React Router DOM 6, Axios, React Icons |
| Backend | Node.js, Express 4, Multer |
| Database | MongoDB, Mongoose 8 |
| Authentication | JSON Web Token (JWT), bcrypt |
| Testing | Node.js built-in test runner (`node:test`), ESLint |
| Deployment | Vercel Services (unified frontend + Express backend), MongoDB Atlas |

---

## Project Structure

```text
Yummigo/
├── vercel.json                       # Unified Vercel Services deployment config (frontend + backend)
├── README.md
└── foodRecipeApp-main/
    └── foodRecipe/
        ├── backend/
        │   ├── config/
        │   │   └── connectionDb.js   # Cached Mongoose connection (MONGODB_URI or CONNECTION_STRING)
        │   ├── controller/
        │   │   ├── recipe.js         # Recipe CRUD, search, ownership checks, image validation
        │   │   └── user.js           # Auth signup/login, user lookup (sanitized responses)
        │   ├── middleware/
        │   │   └── auth.js           # Bearer JWT verification middleware
        │   ├── models/
        │   │   ├── recipe.js
        │   │   └── user.js
        │   ├── routes/
        │   │   ├── recipe.js
        │   │   └── user.js
        │   ├── tests/
        │   │   └── api.test.js       # Automated REST API & authorization integration tests
        │   ├── seed.js               # Sample recipe seeder
        │   ├── server.js             # Express app (serves both / and /api routes)
        │   ├── .env.example
        │   └── package.json
        └── frontend/
            └── food-blog-app/
                ├── src/
                │   ├── assets/
                │   ├── components/
                │   ├── pages/
                │   ├── App.jsx
                │   ├── App.css
                │   ├── index.css
                │   └── constants.js  # Environment-aware API_URL & auth/image helpers
                ├── .env.example
                ├── index.html
                ├── package.json
                └── vite.config.js
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local MongoDB Server or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/suvasis-das/Yummigo.git
cd Yummigo
```

### 2. Configure and start the backend

```bash
cd foodRecipeApp-main/foodRecipe/backend
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/yummigo
SECRET_KEY=replace_with_a_long_random_secret
PORT=5000
SEED_DEMO_DATA=true
```

Start the backend server:

```bash
npm run dev
```

The API listens on `http://localhost:5000` (health check at `GET http://localhost:5000/health`).

### 3. Install and start the frontend

Open a second terminal:

```bash
cd foodRecipeApp-main/foodRecipe/frontend/food-blog-app
npm install
npm run dev
```

Open the local Vite URL printed in the terminal (default `http://localhost:5173`).

---

## Testing & Verification

### Backend API integration tests

```bash
cd foodRecipeApp-main/foodRecipe/backend
MONGODB_URI=mongodb://127.0.0.1:27017/yummigo_test npm test
```

### Frontend lint & production build

```bash
cd foodRecipeApp-main/foodRecipe/frontend/food-blog-app
npm run lint
npm run build
```

---

## API Routes

All routes are available at both root (`/`) and `/api/` prefixes.

### System

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check API and MongoDB connection status |

### Users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/signUp` | Register a new user and return a JWT + sanitized user object |
| `POST` | `/login` | Authenticate credentials and return a JWT + sanitized user object |
| `GET` | `/user/:id` | Retrieve the email address for a user ID |

### Recipes

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/recipe` | Public | Retrieve all recipes (supports `?search=<term>`) |
| `GET` | `/recipe/:id` | Public | Retrieve a single recipe with creator email |
| `POST` | `/recipe` | JWT required | Create a recipe (`multipart/form-data`: `title`, `ingredients`, `instructions`, `time`, optional `file`) |
| `PUT` | `/recipe/:id` | JWT + Owner | Update an existing recipe |
| `DELETE` | `/recipe/:id` | JWT + Owner | Delete a recipe |

---

## Deploying to Vercel

This repository includes a root `vercel.json` configured with **Vercel Services** to deploy both the Vite frontend and Express backend under a single domain:

1. Import the GitHub repository into Vercel (or run `vercel --prod` from the repo root).
2. Add **MongoDB Atlas** from the Vercel Marketplace (automatically injects `MONGODB_URI`), or set `MONGODB_URI` manually in Vercel Environment Variables.
3. Add environment variables in Vercel Project Settings:
   - `SECRET_KEY` — a strong random string for signing JWTs
   - `SEED_DEMO_DATA=true` — optional, auto-populates 6 starter recipes on first visit when the database is empty
4. Deploy — the frontend automatically calls `/api/*` on the same origin with zero CORS configuration required.

---

## Author

**Suvasis Das**  
B.Tech, Computer Science and Engineering  
GitHub: [suvasis-das](https://github.com/suvasis-das)
