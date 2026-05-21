// API utility functions for authentication

import { fetchWrapper } from "./fetchWrapper";

// Registration API
export async function registerUser(userData) {
  try {
    const response = await fetchWrapper(`/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    return data;
  } catch (error) {
    console.error("Registration API error:", error);
    throw error;
  }
}

// Set Password API
export async function setUserPassword(userId, password) {
  try {
    const response = await fetchWrapper(`/api/auth/set-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Password setting failed");
    }

    return data;
  } catch (error) {
    console.error("Set password API error:", error);
    throw error;
  }
}
