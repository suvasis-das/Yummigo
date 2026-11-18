import { useState } from "react";
import axios from "axios";
import { API_URL, extractApiError, setAuthSession } from "../constants";

export default function InputForm({ setIsOpen }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const endpoint = isSignUp ? "signUp" : "login";
    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, {
        email: email.trim(),
        password,
      });
      setAuthSession(res.data.token, res.data.user);
      setIsOpen();
    } catch (err) {
      setError(extractApiError(err, "Authentication failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setError("");
  };

  return (
    <form className="auth-form" onSubmit={handleOnSubmit}>
      <h2 className="auth-title">{isSignUp ? "Create your account" : "Welcome back"}</h2>
      <p className="auth-subtitle">
        {isSignUp
          ? "Publish your recipes and manage your personal kitchen collection."
          : "Sign in to publish, edit, and manage your recipes."}
      </p>

      <div className="field">
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="field">
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          className="input"
          placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={isSignUp ? 6 : 1}
          required
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button type="submit" className="btn-primary btn-full" disabled={submitting}>
        {submitting
          ? isSignUp
            ? "Creating account..."
            : "Signing in..."
          : isSignUp
            ? "Sign Up"
            : "Login"}
      </button>

      <button type="button" className="auth-switch" onClick={toggleMode}>
        {isSignUp ? "Already have an account? Login" : "New here? Create an account"}
      </button>
    </form>
  );
}
