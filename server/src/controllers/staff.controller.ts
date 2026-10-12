import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import * as staffService from "../services/staff.service.js";
import {
    acceptInvitationSchema,
    changeRoleSchema,
    invitationTokenSchema,
    inviteStaffSchema,
    updateAttributesSchema,
} from "../validators/staff.validator.js";

function actorOf(req: Request) {
    const { id, name, email } = req.session.user;
    return { id, name, email };
}

export async function getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = await staffService.listStaff(req.shop);
        res.status(200).json({ status: true, data });
    } catch (error) {
        next(error);
    }
}

export async function inviteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = inviteStaffSchema.parse(req.body);
        const { invitation, emailSent } = await staffService.inviteStaff(req.shop, actorOf(req), input);
        res.status(201).json({
            status: true,
            message: emailSent ? "Invitation sent" : "Invitation created, but the email couldn't be sent. Use Resend to try again.",
            data: { id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt, emailSent },
        });
    } catch (error) {
        next(error);
    }
}

export async function resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const locale = req.body?.locale === "ro" ? "ro" : "en";
        const { invitation, emailSent } = await staffService.resendInvitation(req.shop, actorOf(req), String(req.params.id), locale);
        res.status(200).json({
            status: true,
            message: emailSent ? "Invitation resent" : "Invitation renewed, but the email couldn't be sent.",
            data: { id: invitation.id, expiresAt: invitation.expiresAt, emailSent },
        });
    } catch (error) {
        next(error);
    }
}

export async function revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await staffService.revokeInvitation(req.shop, String(req.params.id));
        res.status(200).json({ status: true, message: "Invitation revoked" });
    } catch (error) {
        next(error);
    }
}

export async function lookupInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const token = invitationTokenSchema.parse(req.query.token);
        const data = await staffService.lookupInvitation(token);
        res.status(200).json({ status: true, data });
    } catch (error) {
        next(error);
    }
}

export async function acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = acceptInvitationSchema.parse(req.body);
        const headers = fromNodeHeaders(req.headers);
        const session = await auth.api.getSession({ headers });
        const result = await staffService.acceptInvitation(input, session?.user);

        // New account: sign them in so they land straight on the dashboard
        if (result.createdAccount && input.password) {
            const signIn = await auth.api.signInEmail({
                body: { email: result.email, password: input.password },
                headers,
                returnHeaders: true,
            });
            for (const cookie of signIn.headers.getSetCookie()) res.append("Set-Cookie", cookie);
        }

        res.status(200).json({ status: true, message: "Invitation accepted", data: { shopId: result.shopId } });
    } catch (error) {
        next(error);
    }
}

export async function changeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { role } = changeRoleSchema.parse(req.body);
        const member = await staffService.changeRole(req.shop, actorOf(req), String(req.params.id), role);
        res.status(200).json({ status: true, message: "Role updated", data: { id: member.id, role: member.role } });
    } catch (error) {
        next(error);
    }
}

export async function updateAttributes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = updateAttributesSchema.parse(req.body);
        const member = await staffService.updateAttributes(req.shop, actorOf(req), String(req.params.id), input);
        res.status(200).json({
            status: true,
            message: "Staff details updated",
            data: { id: member.id, experienceYears: member.experienceYears, employmentType: member.employmentType },
        });
    } catch (error) {
        next(error);
    }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await staffService.removeMember(req.shop, actorOf(req), String(req.params.id));
        res.status(200).json({ status: true, message: "Staff member removed" });
    } catch (error) {
        next(error);
    }
}
