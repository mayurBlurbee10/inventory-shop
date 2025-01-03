"use client";

const isBrowser = () => typeof window !== 'undefined';

const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 // 7 days
};

/**
 * Get user data from storage (localStorage and cookies)
 * @returns {Object|null} The user data or null if not found
 */
export const getUserData = () => {
  try {
    if (!isBrowser()) {
      console.log('Not in browser environment');
      return null;
    }

    // Try to get data from localStorage first
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.log('No user data found in localStorage');
      // Try to get from cookie as fallback
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(c => c.trim().startsWith('user='));
      if (!userCookie) {
        console.log('No user data found in cookies');
        return null;
      }
      const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
      // Sync back to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Restored user data from cookie:', userData);
      return userData;
    }

    const userData = JSON.parse(storedUser);
    // Ensure cookie is in sync
    const cookieStr = `user=${encodeURIComponent(storedUser)}; path=${COOKIE_OPTIONS.path}; samesite=${COOKIE_OPTIONS.sameSite}; max-age=${COOKIE_OPTIONS.maxAge}${COOKIE_OPTIONS.secure ? '; secure' : ''}`;
    document.cookie = cookieStr;
    console.log('Retrieved user data:', userData);
    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if the current user is an admin
 * @returns {boolean} True if the user is an admin
 */
export const isAdmin = () => {
  try {
    if (!isBrowser()) {
      console.log('Not in browser environment');
      return false;
    }

    const userData = getUserData();
    if (!userData) {
      console.log('No user data found for admin check');
      return false;
    }

    const isUserAdmin = userData.role === 'admin';
    console.log('Is user admin?', isUserAdmin, 'Role:', userData.role);
    return isUserAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Store user data in storage (localStorage and cookies)
 * @param {Object} userData The user data to store
 */
export const setUserData = (userData) => {
  try {
    if (!isBrowser()) {
      console.log('Not in browser environment');
      return;
    }

    console.log('Storing user data:', userData);
    const userDataStr = JSON.stringify(userData);

    // Store in localStorage
    localStorage.setItem('user', userDataStr);

    // Store in cookie with options
    const cookieStr = `user=${encodeURIComponent(userDataStr)}; path=${COOKIE_OPTIONS.path}; samesite=${COOKIE_OPTIONS.sameSite}; max-age=${COOKIE_OPTIONS.maxAge}${COOKIE_OPTIONS.secure ? '; secure' : ''}`;
    document.cookie = cookieStr;

    // Verify the data was stored correctly
    const storedData = localStorage.getItem('user');
    const parsedData = JSON.parse(storedData);
    console.log('Verified stored user data:', parsedData);
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Clear user data from storage (localStorage and cookies)
 */
export const clearUserData = () => {
  try {
    if (!isBrowser()) {
      console.log('Not in browser environment');
      return;
    }

    console.log('Clearing user data');
    // Clear from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    // Clear from cookies
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if the user is authenticated
 */
export const isAuthenticated = () => {
  try {
    if (!isBrowser()) {
      console.log('Not in browser environment');
      return false;
    }

    const userData = getUserData();
    const isUserAuthenticated = !!userData;
    console.log('Is user authenticated?', isUserAuthenticated);
    return isUserAuthenticated;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};