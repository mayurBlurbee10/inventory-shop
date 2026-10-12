import { z } from "zod";
import { EMPLOYMENT_TYPES, INVITABLE_ROLES } from "../constants/access.js";
import { passwordSchema } from "./auth.validator.js";

const roleSchema = z.enum(INVITABLE_ROLES, { message: "Choose a valid role" });

export const inviteStaffSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email address").transform((e) => e.trim().toLowerCase()),
    role: roleSchema,
    locale: z.enum(["en", "ro"]).optional(),
});

export const changeRoleSchema = z.object({
    role: roleSchema,
});

export const updateAttributesSchema = z.object({
    experienceYears: z.number().int().min(0).max(60).nullable().optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).nullable().optional(),
});

export const invitationTokenSchema = z.string().min(20).max(200);

export const acceptInvitationSchema = z.object({
    token: invitationTokenSchema,
    // Required only when the invitee has no account yet
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    password: passwordSchema.optional(),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdateAttributesInput = z.infer<typeof updateAttributesSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
