/**
 * Webhook Security Middleware
 * Provides basic security for webhook endpoints
 */

import { Request, Response, NextFunction } from "express";

/**
 * Validate webhook using shared secret header
 * This is a basic security measure - for production, consider using HMAC signature validation
 */
export const validateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const webhookSecret = req.headers["x-webhook-secret"] as string;
  const expectedSecret = process.env.WEBHOOK_SECRET;

  // Skip validation if no secret is configured (for development)
  if (!expectedSecret) {
    console.warn("WEBHOOK_SECRET not configured - webhook validation disabled");
    return next();
  }

  if (!webhookSecret) {
    console.warn("Webhook request missing x-webhook-secret header");
    return res.status(401).json({
      success: false,
      error: "Missing webhook secret",
    });
  }

  if (webhookSecret !== expectedSecret) {
    console.warn("Invalid webhook secret provided");
    return res.status(403).json({
      success: false,
      error: "Invalid webhook secret",
    });
  }

  next();
};

/**
 * Log webhook requests for debugging and audit purposes
 */
export const logWebhook = (source: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${source}] Webhook received:`, {
      method: req.method,
      path: req.path,
      headers: {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
    next();
  };
};
