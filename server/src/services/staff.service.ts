import crypto from "node:crypto";
import prisma from "../lib/db.js";
import { auth } from "../lib/auth.js";
import { registerUserInRbac, removeUserFromRbac, resolveRolesByEmail } from "../lib/accesscontrol.js";
import { AppError, ConflictError, NotFoundError } from "../types/app-error.js";
import { emailService } from "./email.service.js";
import { findMembership, membershipAttributes } from "./membership.service.js";
import { INVITABLE_ROLES, INVITATION_TTL_DAYS, OWNER_ONLY_ROLES, OWNER_ROLE } from "../constants/access.js";
import type { AcceptInvitationInput, InviteStaffInput, UpdateAttributesInput } from "../validators/staff.validator.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    manager: "Manager",
    cashier: "Cashier",
    stock_keeper: "Stock Keeper",
    viewer: "Viewer",
};

type Actor = { id: string; name: string; email: string };
type ShopRef = { id: string; name: string; userId: string };

function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function newToken() {
    const token = crypto.randomBytes(32).toString("base64url");
    return { token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000) };
}

/** Only the shop owner may assign owner-only roles (e.g. manager). */
function assertCanAssign(shop: ShopRef, actor: Actor, role: string) {
    if (!(INVITABLE_ROLES as readonly string[]).includes(role)) {
        throw new AppError(400, "This role can't be assigned.");
    }
    if (OWNER_ONLY_ROLES.includes(role) && shop.userId !== actor.id) {
        throw new AppError(403, `Only the shop owner can assign the ${ROLE_LABELS[role]} role.`);
    }
}

/** A person can belong to one shop only: as its owner or as staff. */
async function assertFreeToJoin(userId: string) {
    const [ownedShops, membership] = await Promise.all([
        prisma.shop.count({ where: { userId } }),
        findMembership(userId),
    ]);
    if (ownedShops > 0 || membership) {
        throw new ConflictError("This person already belongs to a shop.");
    }
}

async function sendInvitationEmail(shop: ShopRef, actor: Actor, invite: { email: string; name: string; role: string }, token: string, locale = "en") {
    const url = `${clientUrl}/${locale}/auth/accept-invite?token=${encodeURIComponent(token)}`;
    return emailService.sendStaffInvitationEmail({
        email: invite.email,
        name: invite.name,
        shopName: shop.name,
        roleLabel: ROLE_LABELS[invite.role] || invite.role,
        inviterName: actor.name || actor.email,
        url,
        expiresInDays: INVITATION_TTL_DAYS,
    });
}

/** Team list: owner, members (roles refreshed from the PAP) and pending invitations. */
export async function listStaff(shop: ShopRef) {
    const [owner, members, invitations] = await Promise.all([
        prisma.user.findUnique({ where: { id: shop.userId }, select: { id: true, name: true, email: true, createdAt: true } }),
        prisma.shopMember.findMany({
            where: { shopId: shop.id },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
        }),
        prisma.shopInvitation.findMany({
            where: { shopId: shop.id, status: "pending" },
            include: { invitedBy: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    // The PAP is the source of truth for roles; keep the display copy in step with it
    const synced = await Promise.all(
        members.map(async (m) => {
            const papRoles = await resolveRolesByEmail(m.user.email);
            const papRole = papRoles[0];
            if (papRole && papRole !== m.role) {
                await prisma.shopMember.update({ where: { id: m.id }, data: { role: papRole } });
                return { ...m, role: papRole, inAccessControl: true };
            }
            return { ...m, inAccessControl: Boolean(papRole) };
        })
    );

    const now = Date.now();
    return {
        owner: owner && { userId: owner.id, name: owner.name, email: owner.email, role: OWNER_ROLE, joinedAt: owner.createdAt },
        members: synced.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            experienceYears: m.experienceYears,
            employmentType: m.employmentType,
            inAccessControl: m.inAccessControl,
            joinedAt: m.createdAt,
        })),
        invitations: invitations.map((i) => ({
            id: i.id,
            name: i.name,
            email: i.email,
            role: i.role,
            invitedBy: i.invitedBy.name || i.invitedBy.email,
            expiresAt: i.expiresAt,
            expired: i.expiresAt.getTime() < now,
            createdAt: i.createdAt,
        })),
    };
}

export async function inviteStaff(shop: ShopRef, actor: Actor, input: InviteStaffInput) {
    assertCanAssign(shop, actor, input.role);

    const existingUser = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existingUser) await assertFreeToJoin(existingUser.id);

    const alreadyInvited = await prisma.shopInvitation.findFirst({
        where: { shopId: shop.id, email: input.email, status: "pending", expiresAt: { gt: new Date() } },
    });
    if (alreadyInvited) {
        throw new ConflictError("This email already has a pending invitation. Resend it instead.");
    }

    const { token, tokenHash, expiresAt } = newToken();
    const invitation = await prisma.shopInvitation.create({
        data: { shopId: shop.id, email: input.email, name: input.name, role: input.role, tokenHash, expiresAt, invitedById: actor.id },
    });
    const emailSent = await sendInvitationEmail(shop, actor, invitation, token, input.locale);
    return { invitation, emailSent };
}

export async function resendInvitation(shop: ShopRef, actor: Actor, invitationId: string, locale?: string) {
    const invitation = await prisma.shopInvitation.findFirst({ where: { id: invitationId, shopId: shop.id, status: "pending" } });
    if (!invitation) throw new NotFoundError("Invitation not found");
    assertCanAssign(shop, actor, invitation.role);

    const { token, tokenHash, expiresAt } = newToken();
    const updated = await prisma.shopInvitation.update({ where: { id: invitation.id }, data: { tokenHash, expiresAt } });
    const emailSent = await sendInvitationEmail(shop, actor, updated, token, locale);
    return { invitation: updated, emailSent };
}

export async function revokeInvitation(shop: ShopRef, invitationId: string) {
    const result = await prisma.shopInvitation.updateMany({
        where: { id: invitationId, shopId: shop.id, status: "pending" },
        data: { status: "revoked" },
    });
    if (!result.count) throw new NotFoundError("Invitation not found");
}

async function findValidInvitation(token: string) {
    const invitation = await prisma.shopInvitation.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { shop: { select: { id: true, name: true, userId: true } } },
    });
    if (!invitation || invitation.status !== "pending" || invitation.expiresAt.getTime() < Date.now()) {
        return null;
    }
    return invitation;
}

/** Public: what the accept page shows before the invitee signs in or signs up. */
export async function lookupInvitation(token: string) {
    const invitation = await findValidInvitation(token);
    if (!invitation) return { valid: false as const };
    const accountExists = Boolean(await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } }));
    return {
        valid: true as const,
        shopName: invitation.shop.name,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        roleLabel: ROLE_LABELS[invitation.role] || invitation.role,
        accountExists,
    };
}

/**
 * Accept an invitation. A signed-in user must match the invited email; otherwise a new
 * account is created (already verified — the emailed token proves the address).
 * Returns the new user's id so the controller can sign them in.
 */
export async function acceptInvitation(input: AcceptInvitationInput, sessionUser?: { id: string; email: string; name: string }) {
    const invitation = await findValidInvitation(input.token);
    if (!invitation) throw new AppError(410, "This invitation is no longer valid.");

    let userId: string;
    let userName: string;
    let createdAccount = false;

    if (sessionUser) {
        if (sessionUser.email.toLowerCase() !== invitation.email) {
            throw new AppError(403, `This invitation is for ${invitation.email}. Sign in with that email to accept it.`);
        }
        userId = sessionUser.id;
        userName = sessionUser.name;
    } else {
        const existing = await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } });
        if (existing) {
            throw new AppError(409, "An account with this email already exists. Sign in to accept the invitation.", { code: "ACCOUNT_EXISTS" });
        }
        if (!input.password) throw new AppError(400, "Choose a password to create your account.");
        userName = input.name || invitation.name;

        const ctx = await auth.$context;
        const user = await ctx.internalAdapter.createUser({ name: userName, email: invitation.email, emailVerified: true });
        await ctx.internalAdapter.linkAccount({
            userId: user.id,
            providerId: "credential",
            accountId: user.id,
            password: await ctx.password.hash(input.password),
        });
        userId = user.id;
        createdAccount = true;
    }

    await assertFreeToJoin(userId);

    // Register the role in the PAP first so a failure leaves nothing half-done
    const registered = await registerUserInRbac({ name: userName, email: invitation.email, role: invitation.role, externalId: userId });
    if (!registered) {
        throw new AppError(502, "Couldn't set up your access right now. Please try again in a moment.");
    }

    await prisma.$transaction([
        prisma.shopMember.create({
            data: { shopId: invitation.shopId, userId, role: invitation.role, invitedById: invitation.invitedById },
        }),
        prisma.shopInvitation.update({
            where: { id: invitation.id },
            data: { status: "accepted", acceptedAt: new Date() },
        }),
    ]);

    return { shopId: invitation.shopId, userId, email: invitation.email, createdAccount };
}

async function findShopMember(shop: ShopRef, memberId: string) {
    const member = await prisma.shopMember.findFirst({
        where: { id: memberId, shopId: shop.id },
        include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!member) throw new NotFoundError("Staff member not found");
    return member;
}

export async function changeRole(shop: ShopRef, actor: Actor, memberId: string, role: string) {
    const member = await findShopMember(shop, memberId);
    if (member.userId === actor.id) throw new AppError(403, "You can't change your own role.");
    assertCanAssign(shop, actor, role);
    if (OWNER_ONLY_ROLES.includes(member.role) && shop.userId !== actor.id) {
        throw new AppError(403, `Only the shop owner can change a ${ROLE_LABELS[member.role]}'s role.`);
    }

    // PAP first: it decides permissions. Moves the user into the new role's group.
    const registered = await registerUserInRbac({
        name: member.user.name,
        email: member.user.email,
        role,
        externalId: member.userId,
        attributes: membershipAttributes(member) as Record<string, string | number>,
    });
    if (!registered) throw new AppError(502, "Couldn't update the role in access control. Please try again.");

    return prisma.shopMember.update({ where: { id: member.id }, data: { role } });
}

export async function updateAttributes(shop: ShopRef, actor: Actor, memberId: string, input: UpdateAttributesInput) {
    const member = await findShopMember(shop, memberId);
    if (member.userId === actor.id) throw new AppError(403, "You can't change your own details.");

    const updated = await prisma.shopMember.update({
        where: { id: member.id },
        data: {
            ...(input.experienceYears !== undefined && { experienceYears: input.experienceYears }),
            ...(input.employmentType !== undefined && { employmentType: input.employmentType }),
        },
    });

    // Best effort: mirror the values in the PAP so its Access Testing matches (the PDP gets them per request)
    await registerUserInRbac({
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        externalId: member.userId,
        attributes: membershipAttributes(updated) as Record<string, string | number>,
    });
    return updated;
}

export async function removeMember(shop: ShopRef, actor: Actor, memberId: string) {
    const member = await findShopMember(shop, memberId);
    if (member.userId === actor.id) throw new AppError(403, "You can't remove yourself.");
    if (OWNER_ONLY_ROLES.includes(member.role) && shop.userId !== actor.id) {
        throw new AppError(403, `Only the shop owner can remove a ${ROLE_LABELS[member.role]}.`);
    }

    await prisma.$transaction([
        prisma.shopMember.delete({ where: { id: member.id } }),
        // End their sessions so access stops immediately
        prisma.session.deleteMany({ where: { userId: member.userId } }),
    ]);
    await removeUserFromRbac({ externalId: member.userId, email: member.user.email });
}
