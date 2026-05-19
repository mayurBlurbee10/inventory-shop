/**
 * List of sensitive fields that should NEVER be returned in API responses
 */
const SENSITIVE_FIELDS = [
  "password",           // Password hash (even hashed, never expose)
  "accessToken",        // JWT access token
  "resetPasswordToken",  // Password reset token
  "authStrategy",       // Internal authentication strategy
  "message",            // Internal messages/notes
  "emailNotification",  // Internal preference (can be exposed if needed, but typically internal)
] as const;

/**
 * List of sensitive portal fields that should NEVER be returned in API responses
 */
const PORTAL_SENSITIVE_FIELDS = [
  "accessToken",        // Portal access token
  "refreshToken",       // Portal refresh token
  "clientId",           // OAuth client ID (sensitive)
  "clientSecret",       // OAuth client secret (highly sensitive)
] as const;

/**
 * List of internal state fields that should typically not be exposed
 * These can be included if explicitly needed (e.g., status for admin views)
 */
const INTERNAL_STATE_FIELDS = [
  "status",             // User status (pending, accepted, etc.) - may be needed in some contexts
] as const;

/**
 * Sanitizes a user object by removing sensitive fields and internal state
 * @param user - The user object to sanitize
 * @param includeTokens - Whether to include tokens (default: false, never include)
 * @param includeInternalState - Whether to include internal state fields like status (default: false)
 * @returns Sanitized user object
 */
export const sanitizeUser = (
  user: any,
  includeTokens: boolean = false,
  includeInternalState: boolean = false
): any => {
  if (!user) {
    return user;
  }

  // Create a copy to avoid mutating the original
  const sanitized = { ...user };

  // Always remove password (never return it, even if requested)
  delete sanitized.password;

  // Remove tokens unless explicitly needed (e.g., password reset flow)
  // Note: Even if includeTokens is true, we should be very careful
  if (!includeTokens) {
    delete sanitized.accessToken;
    delete sanitized.resetPasswordToken;
  }

  // Remove all sensitive fields
  SENSITIVE_FIELDS.forEach((field) => {
    if (field !== "password" && field !== "accessToken" && field !== "resetPasswordToken") {
      delete sanitized[field];
    }
  });

  // Remove internal state fields unless explicitly requested
  if (!includeInternalState) {
    INTERNAL_STATE_FIELDS.forEach((field) => {
      delete sanitized[field];
    });
  }

  return sanitized;
};

export const sanitizeUsers = (
  users: any[],
  includeTokens: boolean = false,
  includeInternalState: boolean = false
): any[] => {
  if (!Array.isArray(users)) {
    return users;
  }

  return users.map((user) => sanitizeUser(user, includeTokens, includeInternalState));
};

/**
 * Common field names that contain user relations
 */
const USER_RELATION_FIELDS = [
  "user",
  "users",
  "createdBy",
  "updatedBy",
  "invitedByUser",
  "portalCreatedAdmin",
  "createdByUser",
  "updatedByUser",
] as const;

/**
 * Common field names that contain portal relations
 */
const PORTAL_RELATION_FIELDS = [
  "portal",
  "portals",
] as const;

/**
 * Checks if an object looks like a user entity
 */
const isUserObject = (obj: any): boolean => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || obj instanceof Date) {
    return false;
  }
  // Check for common user fields
  return !!(obj.email && obj.firstName);
};

/**
 * Checks if an object looks like a portal entity
 */
const isPortalObject = (obj: any): boolean => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || obj instanceof Date) {
    return false;
  }
  // Check for common portal fields
  return !!(obj.slug && (obj.legalName || obj.tradingName));
};

/**
 * Sanitizes a portal object by removing sensitive fields and sanitizing nested user relations
 * @param portal - The portal object to sanitize
 * @param includeTokens - Whether to include tokens for nested users (default: false)
 * @param includeInternalState - Whether to include internal state for nested users (default: false)
 * @returns Sanitized portal object
 */
export const sanitizePortal = (
  portal: any,
  includeTokens: boolean = false,
  includeInternalState: boolean = false
): any => {
  if (!portal) {
    return portal;
  }

  // Create a copy to avoid mutating the original
  const sanitized = { ...portal };

  // Remove all sensitive portal fields
  PORTAL_SENSITIVE_FIELDS.forEach((field) => {
    delete sanitized[field];
  });

  // Sanitize nested user relations (createdBy, portalCreatedAdmin, updatedBy)
  if (sanitized.createdBy && isUserObject(sanitized.createdBy)) {
    sanitized.createdBy = sanitizeUser(sanitized.createdBy, includeTokens, includeInternalState);
  }
  if (sanitized.portalCreatedAdmin && isUserObject(sanitized.portalCreatedAdmin)) {
    sanitized.portalCreatedAdmin = sanitizeUser(sanitized.portalCreatedAdmin, includeTokens, includeInternalState);
  }
  if (sanitized.updatedBy && isUserObject(sanitized.updatedBy)) {
    sanitized.updatedBy = sanitizeUser(sanitized.updatedBy, includeTokens, includeInternalState);
  }

  return sanitized;
};

/**
 * Recursively sanitizes user objects in nested structures
 */
const sanitizeNestedUsers = (
  obj: any,
  includeTokens: boolean = false,
  includeInternalState: boolean = false,
  visited: WeakSet<any> = new WeakSet()
): any => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  // Prevent circular reference infinite loops
  if (visited.has(obj)) {
    return obj;
  }
  visited.add(obj);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (isUserObject(item)) {
        return sanitizeUser(item, includeTokens, includeInternalState);
      }
      if (isPortalObject(item)) {
        return sanitizePortal(item, includeTokens, includeInternalState);
      }
      return sanitizeNestedUsers(item, includeTokens, includeInternalState, visited);
    });
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Create a copy to avoid mutating the original
  const sanitized: any = { ...obj };

  // Check all keys for user relations
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];

    // Skip if null or undefined
    if (value == null) {
      return;
    }

    // Handle direct user relation fields
    if (USER_RELATION_FIELDS.includes(key as any)) {
      if (isUserObject(value)) {
        sanitized[key] = sanitizeUser(value, includeTokens, includeInternalState);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          isUserObject(item)
            ? sanitizeUser(item, includeTokens, includeInternalState)
            : sanitizeNestedUsers(item, includeTokens, includeInternalState, visited)
        );
      }
      return;
    }

    // Handle direct portal relation fields
    if (PORTAL_RELATION_FIELDS.includes(key as any)) {
      if (isPortalObject(value)) {
        sanitized[key] = sanitizePortal(value, includeTokens, includeInternalState);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          isPortalObject(item)
            ? sanitizePortal(item, includeTokens, includeInternalState)
            : sanitizeNestedUsers(item, includeTokens, includeInternalState, visited)
        );
      }
      return;
    }

    // Recursively sanitize nested objects
    if (typeof value === "object") {
      if (isUserObject(value)) {
        // This object looks like a user, sanitize it
        sanitized[key] = sanitizeUser(value, includeTokens, includeInternalState);
      } else if (isPortalObject(value)) {
        // This object looks like a portal, sanitize it (which also sanitizes nested users)
        sanitized[key] = sanitizePortal(value, includeTokens, includeInternalState);
      } else if (Array.isArray(value)) {
        // Recursively sanitize array items
        sanitized[key] = sanitizeNestedUsers(value, includeTokens, includeInternalState, visited);
      } else {
        // Recursively sanitize nested object
        sanitized[key] = sanitizeNestedUsers(value, includeTokens, includeInternalState, visited);
      }
    }
  });

  return sanitized;
};

export const sanitizeUserInResponse = (
  data: any,
  includeTokens: boolean = false,
  includeInternalState: boolean = false
): any => {
  if (!data) {
    return data;
  }

  // If it's an array, sanitize each item
  if (Array.isArray(data)) {
    return sanitizeUsers(data, includeTokens, includeInternalState).map((item) =>
      sanitizeNestedUsers(item, includeTokens, includeInternalState)
    );
  }

  // If it's an object, recursively sanitize all nested user and portal objects
  if (typeof data === "object") {
    // First check if the root object itself is a user
    if (isUserObject(data)) {
      return sanitizeUser(data, includeTokens, includeInternalState);
    }

    // Check if the root object itself is a portal
    if (isPortalObject(data)) {
      return sanitizePortal(data, includeTokens, includeInternalState);
    }

    // Otherwise, recursively sanitize all nested structures
    return sanitizeNestedUsers(data, includeTokens, includeInternalState);
  }

  return data;
};

