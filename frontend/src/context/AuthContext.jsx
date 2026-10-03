import React, { createContext, useContext, useState, useEffect } from "react";
import api, { API_BASE_URL } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session from backend on startup or fallback to localStorage
  const checkAuth = async () => {
    try {
      // 1. Check if returning from Google OAuth redirect with tokens in URL
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token") || urlParams.get("access_token");
      if (tokenFromUrl) {
        localStorage.setItem("learnx_token", tokenFromUrl);
        const urlUserId = urlParams.get("user_id");
        const urlName = urlParams.get("name");
        const urlEmail = urlParams.get("email");
        const urlPicture = urlParams.get("picture");
        if (urlEmail) {
          const uData = {
            id: urlUserId || undefined,
            name: urlName || urlEmail.split("@")[0],
            email: urlEmail,
            picture: urlPicture || null,
            image_url: urlPicture || null,
          };
          setUser(uData);
          localStorage.setItem("learnx_user", JSON.stringify(uData));
        }
        // Clean URL query params so token isn't visible in browser address bar
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      // First try /auth/get/me (or /me)
      let res;
      try {
        res = await api.get("/auth/get/me");
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get("/me");
        } else {
          throw err;
        }
      }

      if (res.data && res.data.email) {
        const userData = {
          id: res.data.id,
          name: res.data.name || res.data.email.split("@")[0],
          email: res.data.email,
          picture: res.data.picture || res.data.image_url || res.data.imag_url || null,
          image_url: res.data.image_url || res.data.imag_url || res.data.picture || null,
        };
        setUser(userData);
        localStorage.setItem("learnx_user", JSON.stringify(userData));
        return userData;
      }
    } catch (_) {
      // Fallback check in localStorage
      const cached = localStorage.getItem("learnx_user");
      const savedToken = localStorage.getItem("learnx_token");
      if (cached && savedToken) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          return parsed;
        } catch (_) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 1. Manual Login (email + password)
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.access_token || res.data?.token) {
      localStorage.setItem("learnx_token", res.data.access_token || res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem("learnx_user", JSON.stringify(res.data.user));
    }
    await checkAuth();
    return res.data;
  };

  // 2. Manual Registration (name, email, password) -> logs in user directly
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data?.access_token || res.data?.token) {
      localStorage.setItem("learnx_token", res.data.access_token || res.data.token);
    }
    const userData = res.data?.user || {
      name: name || email.split("@")[0],
      email: email,
    };
    setUser(userData);
    localStorage.setItem("learnx_user", JSON.stringify(userData));
    try {
      await checkAuth();
    } catch (_) {}
    return res.data;
  };

  // 3. Verify OTP for email registration
  const verifyEmail = async (email, otp) => {
    let res;
    try {
      res = await api.post("/auth/verify-email", { email, otp });
    } catch (err) {
      if (err.response?.status === 404) {
        // Fallback in case deployed backend uses /auth/verify-otp or /auth/verify_otp
        try {
          res = await api.post("/auth/verify-otp", { email, otp });
        } catch (_) {
          res = await api.post("/auth/verify_otp", { email, otp, google_id: "" });
        }
      } else {
        throw err;
      }
    }

    if (res.data?.access_token || res.data?.token) {
      localStorage.setItem("learnx_token", res.data.access_token || res.data.token);
    }
    const userData = res.data?.user || {
      name: email.split("@")[0],
      email: email,
    };
    setUser(userData);
    localStorage.setItem("learnx_user", JSON.stringify(userData));

    try {
      await checkAuth();
    } catch (_) {}

    return res.data;
  };

  // 4. Verify OTP for Google account linking
  const verifyGoogleOtp = async (email, google_id, otp) => {
    let res;
    try {
      res = await api.post("/auth/verify_otp", { email, google_id, otp });
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          res = await api.post("/auth/google/verify-otp", { email, google_id, otp });
        } catch (_) {
          res = await api.post("/auth/verify-otp", { email, google_id, otp });
        }
      } else {
        throw err;
      }
    }

    if (res.data?.access_token || res.data?.token) {
      localStorage.setItem("learnx_token", res.data.access_token || res.data.token);
    }
    const userData = res.data?.user || {
      name: email.split("@")[0],
      email: email,
    };
    setUser(userData);
    localStorage.setItem("learnx_user", JSON.stringify(userData));

    try {
      await checkAuth();
    } catch (_) {}

    return res.data;
  };

  // 5. Google OAuth 2.0 Login Redirect
  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  // 6. Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    setUser(null);
    localStorage.removeItem("learnx_user");
    localStorage.removeItem("learnx_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyEmail,
        verifyGoogleOtp,
        loginWithGoogle,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
