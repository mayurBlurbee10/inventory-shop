// import status from "http-status";
import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.ts";
import userService from "../services/user.service.ts";

const verifyUserAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token =
      req.cookies?.token ||
      req.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({
        status: 401,
        code: "INVALID_TOKEN",
        message: "Unauthorized",
        error: "Token is required",
      });
      return;
    }
    const decoded = await verifyToken(token);
    const payload = decoded as any;
    const user = await userService.getUserById(payload.id);
    req.user = user;
    next();
  } catch (error) {
    // Return proper 401 response for token verification errors
    const errorMessage = (error as Error).message || "";
    if (errorMessage.includes("expired") || errorMessage.includes("ExpirationTime") || errorMessage.includes("exp")) {
      res.status(401).json({
        status: 401,
        code: "ACCESS_TOKEN_EXPIRED",
        message: "Unauthorized",
        error: "Token has expired",
      });
      return;
    }
    res.status(401).json({
      status: 401,
      code: "INVALID_TOKEN",
      message: "Unauthorized",
      error: errorMessage || "Token verification failed",
    });
  }
};

export default {
  verifyUserAccess,
};