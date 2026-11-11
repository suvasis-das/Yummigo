Yummigo — Full-Stack Food Recipe Application
Yummigo is a full-stack food recipe application where users can discover recipes shared on the platform, create an account, publish their own recipes, and save recipes to a personal favourites list. Each recipe can include a title, ingredients, preparation time, instructions, and an image.

The application uses React for the frontend, Node.js and Express for the backend API, and MongoDB with Mongoose for data storage. It also includes user authentication using password hashing and JSON Web Tokens (JWT).
Features
- Browse recipes: View recipes available on the platform, including their images, titles, and preparation times.
- User registration and login: Create an account and sign in using an email address and password.
- Password hashing: Hash passwords with bcrypt before storing them in MongoDB.
- JWT-based authentication: Issue a JSON Web Token when a user signs up or logs in. The create-recipe API checks the token.
- Publish recipes: Add a recipe with its title, ingredients, preparation time, instructions, and an optional image.
- My Recipes: View recipes associated with the signed-in user.
- Recipe details: Open a recipe to read its ingredients and cooking instructions, and view the creator's email address.
- Edit and delete: Update or remove recipes from the My Recipes view.
- Favourites: Add and remove recipes from a favourites list stored in the browser's localStorage.
- Image uploads: Upload recipe images through the backend using Multer.
Tech Stack
Area	Technology
Frontend	React 18, Vite 5, JavaScript, CSS
Routing	React Router DOM
HTTP requests	Axios
UI icons	React Icons
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
Authentication	JSON Web Token (JWT), bcrypt
File uploads	Multer
Middleware / configuration	CORS, dotenv


Application Workflow
1. A visitor opens Yummigo and browses the recipes returned by the backend.
2. To publish a recipe or access personal recipe sections, the visitor signs up or logs in.
3. The backend checks the submitted credentials. Passwords are hashed with bcrypt, and a JWT is returned after successful registration or login.
4. A signed-in user submits recipe details and an optional image through the React form.
5. The Express API validates the required recipe fields, verifies the JWT for recipe creation, and saves the recipe document in MongoDB.
6. The frontend retrieves recipe data through REST API requests and displays recipe cards and detail pages.
7. Favourites are maintained in the browser's localStorage.
Project Structure
The repository currently keeps the application inside the foodRecipeApp-main/foodRecipe/ directory.
Yummigo/
└── foodRecipeApp-main/
    └── foodRecipe/
        ├── backend/
        │   ├── config/
        │   │   └── connectionDb.js
        │   ├── controller/
        │   │   ├── recipe.js
        │   │   └── user.js
        │   ├── middleware/
        │   │   └── auth.js
        │   ├── models/
        │   │   ├── recipe.js
        │   │   └── user.js
        │   ├── routes/
        │   │   ├── recipe.js
        │   │   └── user.js
        │   ├── public/
        │   │   └── images/
        │   ├── server.js
        │   └── package.json
        └── frontend/
            └── food-blog-app/
                ├── src/
                │   ├── components/
                │   ├── pages/
                │   ├── assets/
                │   ├── App.jsx
                │   │   └── ...
                ├── package.json
                └── vite.config.js
Getting Started
Prerequisites
- Node.js and npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- Git
1. Clone the repository
git clone https://github.com/suvasis-das/Yummigo.git
cd Yummigo
2. Configure and start the backend
Open a terminal in the backend directory:
cd foodRecipeApp-main/foodRecipe/backend
npm install
Create a .env file in the backend directory:
CONNECTION_STRING=mongodb_connection_string
SECRET_KEY=replace_with_a_long_random_secret
PORT=5000
Replace the example values with your MongoDB connection string and a private JWT secret. Do not commit the .env file or expose these values publicly.

Important: The current frontend API requests use http://localhost:5000, while the backend defaults to port 3000 when PORT is not set. Set PORT=5000 as shown above for the checked-in frontend to connect without changing its API URLs. If you choose another port, update the frontend API request URLs to match.

Make sure the upload directory exists before adding recipe images:
backend/public/images/
Start the backend:
npm run dev
The backend should now listen on http://localhost:5000.
3. Install and start the frontend
Open a second terminal in the frontend directory:
cd foodRecipeApp-main/foodRecipe/frontend/food-blog-app
npm install
npm run dev
Open the local URL printed by Vite in your terminal (usually http://localhost:5173).
API Routes
The Express backend exposes the following routes:
User routes
Method	Endpoint	Purpose
POST	/signUp	Register a user and return a JWT
POST	/login	Authenticate a user and return a JWT
GET	/user/:id	Retrieve the email address for a user ID


Recipe routes
Method	Endpoint	Purpose
GET	/recipe	Retrieve all recipes
GET	/recipe/:id	Retrieve a recipe by its ID
POST	/recipe	Create a recipe (JWT required; accepts multipart form data)
PUT	/recipe/:id	Update a recipe
DELETE	/recipe/:id	Delete a recipe


For recipe creation, the multipart form fields are title, ingredients, instructions, time, and an optional file image.
Data Models
User
- email — required and unique
- password — required; stored as a bcrypt hash
- createdAt / updatedAt — Mongoose timestamps
Recipe
- title — required
- ingredients — required array
- instructions — required
- time — optional preparation-time text
- coverImage — uploaded image filename
- createdBy — reference to the user who created the recipe
- createdAt / updatedAt — Mongoose timestamps
Current Implementation Notes
- Favourites are stored in browser localStorage; they are local to that browser and are not synchronized to a user account or across devices.
- The frontend's My Recipes view filters the recipe list using the signed-in user's ID.
- The current API protects the create-recipe route with JWT middleware. The update and delete routes do not currently use that middleware or enforce ownership checks in the backend. Add server-side authorization and ownership validation before using the application with untrusted users or deploying it publicly.
- Recipe image uploads are stored on the backend filesystem in public/images. A production deployment would need persistent file storage and appropriate upload validation.
- The frontend API URLs are currently hard-coded to http://localhost:5000. A future improvement is to use the existing VITE_API_URL configuration consistently across all API requests.
- The current implementation does not include a recipe search or filtering feature.
Future Improvements
- Add search and category-based recipe filtering.
- Protect update and delete endpoints with JWT authentication and verify recipe ownership on the server.
- Use a configurable API base URL for local development and deployment.
- Add stronger input validation and error handling on both frontend and backend.
- Move uploaded images to persistent object storage for deployment.
- Store favourites in the database so they are available across devices.
- Add automated tests for API routes and frontend workflows.
- Deploy the frontend, backend, and database with environment-specific configuration.
Author
Suvasis Das
B.Tech, Computer Science and Engineering
GitHub: suvasis-das
Yummigo was developed as a full-stack project to practise React-based frontend development, REST API design, MongoDB data modelling, authentication, and file uploads
