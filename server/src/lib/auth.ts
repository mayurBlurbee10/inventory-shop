import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailService } from "../services/email.service.js";
import prisma from "./db.js";
import { registerUserInRbac, removeUserFromRbac } from "./accesscontrol.js";
import { DEFAULT_SIGNUP_ROLE } from "../constants/access.js";
import { hasPendingInvitation } from "../services/membership.service.js";

const clientUrl = process.env.CLIENT_URL || `http://localhost:3000`;

// Map to track the last time a verification email was sent to an email address (rate limit: 2 minutes / 120,000 ms)
const resendRateLimiter = new Map<string, number>();
const forgotPasswordRateLimiter = new Map<string, number>();
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [clientUrl],
    database: prismaAdapter(prisma, {
        provider: "sqlserver",
    }),
    emailAndPassword: {
        enabled: true, // Enables Email & Password provider
        requireEmailVerification: true, // Requires email verification before login
        // Better Auth returns a fake success for an existing email (no email is sent), so log it to make it visible
        onExistingUserSignUp: async ({ user }) => {
            console.log(`[Auth Log] [SignUp] Email already registered: ${user.email} (verified: ${user.emailVerified}) - no verification email sent`);
        },
        sendResetPassword: async ({ user, url, token }, request) => {
            const normalizedEmail = user.email.toLowerCase().trim();
            const now = Date.now();
            const lastSent = forgotPasswordRateLimiter.get(normalizedEmail);

            if (lastSent && now - lastSent < RESEND_COOLDOWN_MS) {
                console.warn(`[Auth] Rate limit prevented spamming reset password email to: ${normalizedEmail}`);
                return;
            }

            forgotPasswordRateLimiter.set(normalizedEmail, now);

            console.log(`[Auth Log] Password reset email triggered for user: ${user.email}`);

            const sent = await emailService.sendResetPasswordEmail(user.email, user.name, url);
            if (!sent) forgotPasswordRateLimiter.delete(normalizedEmail);
        },
    },
    emailVerification: {
        expiresIn: 15 * 60, // 15 minutes (in seconds)
        sendOnSignUp: true, // Automatically triggers when a new user registers
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            console.log(`[Auth Log] [Verify] 1. sendVerificationEmail triggered for: ${user.email}`);
            const normalizedEmail = user.email.toLowerCase().trim();
            const now = Date.now();
            const lastSent = resendRateLimiter.get(normalizedEmail);

            if (lastSent && now - lastSent < RESEND_COOLDOWN_MS) {
                console.log(`[Auth Log] [Verify] 2. Skipped - cooldown active, ${Math.ceil((RESEND_COOLDOWN_MS - (now - lastSent)) / 1000)}s left`);
                // We use a silent return here (with a warning) instead of throwing an Error 
                // to prevent Better Auth from logging a messy stack trace to the console.
                // Normal users will be blocked by the frontend's 2-minute timer anyway.
                console.warn(`[Auth] Rate limit prevented spamming verification email to: ${normalizedEmail}`);
                return;
            }

            resendRateLimiter.set(normalizedEmail, now);

            // Ensure verification URL always includes a valid callbackURL fallback
            let verificationUrl = url;
            const fullCallbackUrl = `${clientUrl}/dashboard`;
            if (verificationUrl.endsWith("callbackURL=") || verificationUrl.endsWith("callbackURL")) {
                verificationUrl += encodeURIComponent(fullCallbackUrl);
            } else if (!verificationUrl.includes("callbackURL=")) {
                verificationUrl += (verificationUrl.includes("?") ? "&" : "?") + "callbackURL=" + encodeURIComponent(fullCallbackUrl);
            }

            console.log(`[Auth Log] [Verify] 2. Sending verification email, url: ${verificationUrl}`);
            const sent = await emailService.sendVerificationEmail(user.email, user.name, verificationUrl);
            console.log(`[Auth Log] [Verify] 3. Result for ${user.email}: ${sent ? "SENT" : "FAILED"}`);
            // Don't hold the cooldown for a failed send, so the user can retry right away
            if (!sent) resendRateLimiter.delete(normalizedEmail);
        },
    },
    // Keep MStrategy Access Control (PAP) users in sync; failures only log so sign-up is never blocked
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Invited staff get their role when they accept the invitation, not the owner role
                    if (await hasPendingInvitation(user.email)) return;
                    await registerUserInRbac({
                        name: user.name,
                        email: user.email,
                        role: DEFAULT_SIGNUP_ROLE,
                        externalId: user.id,
                    });
                },
            },
            delete: {
                // Staff links use NoAction (SQL Server cascade rules), so clear them before the user row goes
                before: async (user) => {
                    await prisma.$transaction([
                        prisma.shopMember.deleteMany({ where: { userId: user.id } }),
                        prisma.shopMember.updateMany({ where: { invitedById: user.id }, data: { invitedById: null } }),
                        prisma.shopInvitation.deleteMany({ where: { invitedById: user.id } }),
                    ]);
                },
                after: async (user) => {
                    await removeUserFromRbac({ externalId: user.id, email: user.email });
                },
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        },
    },
    // advanced: {
    //     cookies: {
    //       state: {
    //         attributes: {
    //           sameSite: "none",
    //           secure: true,
    //         }
    //       }
    //     }
    //   }
});