import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY ||
    "nwY48JpK7OGgKvSW7arGdmFDkizfvt0YLqqKCRSrk_8"
);

export const generateToken = async (
  payload: any,
  expiresIn: string = "1h"
): Promise<string> => {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);

    return token;
  } catch (error) {
    throw new Error("Failed to generate token: " + (error as Error).message);
  }
};

export const verifyToken = async (token: string): Promise<any> => {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error("Token verification failed: " + (error as Error).message);
  }
};

export const generateNanoToken = async (): Promise<string> => {
  return randomBytes(32).toString("hex");
};

export const generateRefreshToken = async (): Promise<string> => {
  // Generate a secure random token (64 bytes = 128 hex characters)
  return randomBytes(64).toString("hex");
};

