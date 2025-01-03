import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';

const secretKey = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET_KEY);

// Generate JWT Token
export const generateToken = async(payload, expiresIn = '1h') => {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);

    return token;
  } catch (error) {
    throw new Error('Failed to generate token: ' + error.message);
  }
}

// Verify JWT Token
export const verifyToken = async(token) => {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Token verification failed: ' + error.message);
  }
}


export const generateNanoToken = async() => {
  return randomBytes(32).toString('hex');
};
