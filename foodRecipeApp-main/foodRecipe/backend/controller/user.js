const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  _id: user._id,
  email: user.email,
});

const userSignUp = async (req, res) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!rawEmail || !password) {
      return res.status(400).json({ error: "Email and password are required", message: "Email and password are required" });
    }

    if (!EMAIL_REGEX.test(rawEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address", message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters", message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: rawEmail });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists", message: "Email already exists" });
    }

    const hashPwd = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: rawEmail,
      password: hashPwd,
    });

    const token = jwt.sign({ email: newUser.email, id: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    return res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err) {
    console.error("userSignUp error:", err);
    return res.status(500).json({ error: "Failed to create account", message: "Failed to create account" });
  }
};

const userLogin = async (req, res) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!rawEmail || !password) {
      return res.status(400).json({ error: "Email and password are required", message: "Email and password are required" });
    }

    const user = await User.findOne({ email: rawEmail });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password", message: "Invalid email or password" });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("userLogin error:", err);
    return res.status(500).json({ error: "Failed to log in", message: "Failed to log in" });
  }
};

const getUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id).select("email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ email: user.email });
  } catch (err) {
    console.error("getUser error:", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = { userLogin, userSignUp, getUser };
