import { Request, Response, NextFunction } from "express";
import {
  decryptApiRequest,
  decryptSessionKey,
  getDefaultSessionKey,
  encryptAESPayload,
} from "../utils/asymmetricCrypto.util.ts";

type EncryptedFormFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: string;
};

const isEncryptedFormDataPayload = (
  data: any
): data is {
  __encryptedFormData: true;
  fields?: Record<string, any>;
  files?: EncryptedFormFile[];
} =>
  Boolean(
    data && typeof data === "object" && data.__encryptedFormData === true
  );

/**
 * Rebuild multer-compatible req.body / req.file / req.files from an encrypted FormData payload.
 */
const applyDecryptedFormData = (req: Request, decryptedData: any): void => {
  if (!isEncryptedFormDataPayload(decryptedData)) {
    req.body = decryptedData;
    return;
  }

  req.body = { ...(decryptedData.fields || {}) };

  const reconstructedFiles = (decryptedData.files || []).map((file) => {
    const buffer = Buffer.from(file.buffer || "", "base64");
    return {
      fieldname: file.fieldname,
      originalname: file.originalname || "blob",
      encoding: "7bit",
      mimetype: file.mimetype || "application/octet-stream",
      size: file.size ?? buffer.length,
      buffer,
      destination: "",
      filename: file.originalname || "blob",
      path: "",
      stream: undefined as any,
    } as Express.Multer.File;
  });

  if (reconstructedFiles.length === 1) {
    (req as any).file = reconstructedFiles[0];
  }

  if (reconstructedFiles.length > 0) {
    (req as any).files = reconstructedFiles;
  }
};

/**
 * Middleware to intercept incoming requests and outgoing responses for API encryption.
 * Decrypts incoming request payloads and encrypts outgoing res.json responses using the session key.
 */
export const encryptionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isEncryptionEnabled = process.env.NODE_ENV === "production";

  const isEncryptedHeader = req.headers["x-api-encrypted"] === "true";
  const xSessionKeyHeader = req.headers["x-session-key"] as string | undefined;
  const bodyIsEncryptedFormat =
    req.body &&
    typeof req.body === "object" &&
    req.body.iv &&
    req.body.data &&
    req.body.tag;

  // If encryption is disabled (local/development) and request is unencrypted, skip encryption flow
  if (
    !isEncryptionEnabled &&
    !bodyIsEncryptedFormat &&
    !isEncryptedHeader &&
    !xSessionKeyHeader
  ) {
    return next();
  }

  // Override res.json to handle response encryption transparently
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if (res.locals.sessionKey && body !== undefined && body !== null) {
      try {
        const encryptedPayload = encryptAESPayload(body, res.locals.sessionKey);
        res.setHeader("x-api-encrypted", "true");
        return originalJson(encryptedPayload);
      } catch (err) {
        console.error(
          "[Encryption Middleware] Failed to encrypt response payload:",
          err
        );
        return originalJson(body);
      }
    }
    return originalJson(body);
  };
  try {
    if (bodyIsEncryptedFormat) {
      const { sessionKeyBuffer, decryptedData } = decryptApiRequest(req.body);
      res.locals.sessionKey = sessionKeyBuffer;
      applyDecryptedFormData(req, decryptedData);
    } else if (xSessionKeyHeader) {
      try {
        res.locals.sessionKey = decryptSessionKey(xSessionKeyHeader);
      } catch (err) {
        console.warn(
          "[Encryption Middleware] Failed to decrypt x-session-key header, using default key fallback:",
          err
        );
        res.locals.sessionKey = getDefaultSessionKey();
      }
    } else if (isEncryptedHeader) {
      res.locals.sessionKey = getDefaultSessionKey();
    }
  } catch (err) {
    console.error(
      "[Encryption Middleware] Failed to process incoming request decryption:",
      err
    );
    res
      .status(400)
      .json({ error: "Invalid encrypted payload or session key." });
    return;
  }

  next();
};
