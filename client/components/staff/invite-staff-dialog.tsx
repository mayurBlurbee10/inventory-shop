"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelect } from "@/components/staff/role-select";
import { useInviteStaff } from "@/hooks/use-staff";
import { validateEmail, validateName } from "@/lib/auth-validate";

interface InviteStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isOwner: boolean;
}

export function InviteStaffDialog({ open, onOpenChange, isOwner }: InviteStaffDialogProps) {
    // Remount on open so the form starts empty each time
    return <InviteStaffDialogContent key={String(open)} open={open} onOpenChange={onOpenChange} isOwner={isOwner} />;
}

function InviteStaffDialogContent({ open, onOpenChange, isOwner }: InviteStaffDialogProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("cashier");
    const [errorMsg, setErrorMsg] = useState("");
    const [noticeMsg, setNoticeMsg] = useState("");

    const inviteMutation = useInviteStaff();
    const isLoading = inviteMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setNoticeMsg("");

        const nameError = validateName(name);
        if (nameError) return setErrorMsg(nameError);
        const emailError = validateEmail(email);
        if (emailError) return setErrorMsg(emailError);

        try {
            const res = (await inviteMutation.mutateAsync({ name: name.trim(), email: email.trim(), role })) as {
                message?: string;
                data?: { emailSent?: boolean };
            };
            if (res?.data?.emailSent === false) {
                // Invitation exists; keep the dialog open so the owner sees the email problem
                setNoticeMsg(res.message || "Invitation created, but the email couldn't be sent.");
                return;
            }
            onOpenChange(false);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to send invitation.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Staff Member</DialogTitle>
                    <DialogDescription>
                        They&apos;ll get an email with a link to join your shop. What they can do depends on the role.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {errorMsg && (
                        <div className="p-3 text-xs rounded-md bg-destructive/15 text-destructive font-medium">
                            {errorMsg}
                        </div>
                    )}
                    {noticeMsg && (
                        <div className="p-3 text-xs rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                            {noticeMsg}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="invite_name">Full Name</Label>
                        <Input
                            id="invite_name"
                            placeholder="e.g. Priya Shah"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="invite_email">Email</Label>
                        <Input
                            id="invite_email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <RoleSelect id="invite_role" value={role} onChange={setRole} isOwner={isOwner} disabled={isLoading} />

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            {noticeMsg ? "Close" : "Cancel"}
                        </Button>
                        {!noticeMsg && (
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Invitation"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
