const mongoose = require("mongoose");

let cachedPromise = global._yummigoMongoosePromise || null;

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.CONNECTION_STRING;
  if (!uri) {
    throw new Error(
      "MongoDB connection string is not configured. Set MONGODB_URI or CONNECTION_STRING in your environment."
    );
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((conn) => {
        console.log("MongoDB connected");
        return conn;
      })
      .catch((err) => {
        cachedPromise = null;
        global._yummigoMongoosePromise = null;
        throw err;
      });
    global._yummigoMongoosePromise = cachedPromise;
  }

  return cachedPromise;
};

module.exports = connectDb;
