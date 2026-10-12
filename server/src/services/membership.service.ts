import prisma from "../lib/db.js";
import { USER_ATTRIBUTES } from "../constants/access.js";

/** A user can open a shop they own (Shop.userId) or one they are staff in (shop_members). */
function accessibleBy(userId: string) {
    return { OR: [{ userId }, { members: { some: { userId } } }] };
}

export function findAccessibleShops(userId: string) {
    return prisma.shop.findMany({
        where: accessibleBy(userId),
        orderBy: { createdAt: "desc" },
    });
}

export function findAccessibleShop(userId: string, shopId: string) {
    return prisma.shop.findFirst({ where: { id: shopId, ...accessibleBy(userId) } });
}

/** The user's staff membership (at most one), or null for owners and users without a shop. */
export function findMembership(userId: string) {
    return prisma.shopMember.findUnique({ where: { userId } });
}

/** ABAC user attributes for the PDP, taken from the staff membership. */
export function membershipAttributes(
    member: { experienceYears: number | null; employmentType: string | null } | null | undefined
): Record<string, unknown> {
    if (!member) return {};
    return {
        ...(member.experienceYears != null ? { [USER_ATTRIBUTES.EXPERIENCE_YEARS]: member.experienceYears } : {}),
        ...(member.employmentType ? { [USER_ATTRIBUTES.EMPLOYMENT_TYPE]: member.employmentType } : {}),
    };
}

/** True when the email has a live invitation (sign-up then skips the default owner role). */
export async function hasPendingInvitation(email: string) {
    const count = await prisma.shopInvitation.count({
        where: { email: email.trim().toLowerCase(), status: "pending", expiresAt: { gt: new Date() } },
    });
    return count > 0;
}
