const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const connectDb = require("./config/connectionDb");
const userRoutes = require("./routes/user");
const recipeRoutes = require("./routes/recipe");
const { ensureDemoSeed } = require("./seed");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
  : null;

app.use(
  cors(
    allowedOrigins
      ? {
          origin: allowedOrigins,
          credentials: true,
        }
      : {}
  )
);
app.use(express.json({ limit: "4mb" }));
app.use(express.static("public"));

const healthHandler = async (req, res) => {
  try {
    await connectDb();
    return res.json({ status: "ok", db: "connected" });
  } catch (err) {
    return res.status(503).json({ status: "error", db: "disconnected", message: err.message });
  }
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Ensure database connection before handling API requests (critical for serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDb();
    if (process.env.SEED_DEMO_DATA === "true") {
      await ensureDemoSeed();
    }
    return next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    return res.status(503).json({ message: "Database unavailable. Please check configuration." });
  }
});

// Mount routes at both root (local dev / standalone) and /api (Vercel Services)
app.use("/", userRoutes);
app.use("/recipe", recipeRoutes);
app.use("/api", userRoutes);
app.use("/api/recipe", recipeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

if (require.main === module) {
  connectDb()
    .then(async () => {
      if (process.env.SEED_DEMO_DATA === "true") {
        await ensureDemoSeed();
      }
      app.listen(PORT, () => {
        console.log(`Yummigo backend listening on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err.message);
      process.exit(1);
    });
}

module.exports = app;
