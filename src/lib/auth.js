// src/lib/auth.js

/**
 * Get user data from localStorage
 * @returns {Object|null} The user data or null if not found
 */
export const getUserData = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.log('No user data found in localStorage');
      return null;
    }

    const userData = JSON.parse(storedUser);
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
    const userData = getUserData();
    if (!userData) {
      console.log('No user data found for admin check');
      return false;
    }

    const isUserAdmin = userData.role === 'admin';
    console.log('Is user admin?', isUserAdmin);
    return isUserAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Store user data in localStorage
 * @param {Object} userData The user data to store
 */
export const setUserData = (userData) => {
  try {
    console.log('Storing user data:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Clear user data from localStorage
 */
export const clearUserData = () => {
  try {
    console.log('Clearing user data');
    localStorage.removeItem('user');
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
    const userData = getUserData();
    const isUserAuthenticated = !!userData;
    console.log('Is user authenticated?', isUserAuthenticated);
    return isUserAuthenticated;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};