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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleSelect } from "@/components/staff/role-select";
import { useChangeStaffRole, useUpdateStaffAttributes } from "@/hooks/use-staff";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/access";
import type { EmploymentType, StaffMember } from "@/types/staff";

interface EditStaffDialogProps {
    member: StaffMember | null;
    onOpenChange: (open: boolean) => void;
    isOwner: boolean;
    canChangeRole: boolean;
}

const NOT_SET = "not_set";

export function EditStaffDialog(props: EditStaffDialogProps) {
    return <EditStaffDialogContent key={props.member?.id ?? "none"} {...props} />;
}

function EditStaffDialogContent({ member, onOpenChange, isOwner, canChangeRole }: EditStaffDialogProps) {
    const [role, setRole] = useState(member?.role ?? "cashier");
    const [experience, setExperience] = useState(member?.experienceYears != null ? String(member.experienceYears) : "");
    const [employmentType, setEmploymentType] = useState<string>(member?.employmentType ?? NOT_SET);
    const [errorMsg, setErrorMsg] = useState("");

    const changeRole = useChangeStaffRole();
    const updateAttributes = useUpdateStaffAttributes();
    const isLoading = changeRole.isPending || updateAttributes.isPending;

    const employmentItems = [
        { value: NOT_SET, label: "Not set" },
        ...Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member) return;
        setErrorMsg("");

        const years = experience.trim() === "" ? null : Number(experience);
        if (years !== null && (!Number.isInteger(years) || years < 0 || years > 60)) {
            return setErrorMsg("Experience must be a whole number of years between 0 and 60.");
        }
        const type = employmentType === NOT_SET ? null : (employmentType as EmploymentType);

        try {
            if (canChangeRole && role !== member.role) {
                await changeRole.mutateAsync({ id: member.id, role });
            }
            if (years !== member.experienceYears || type !== member.employmentType) {
                await updateAttributes.mutateAsync({ id: member.id, experienceYears: years, employmentType: type });
            }
            onOpenChange(false);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to update staff member.");
        }
    };

    return (
        <Dialog open={!!member} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Staff Member</DialogTitle>
                    <DialogDescription>
                        {member?.name} · {member?.email}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {errorMsg && (
                        <div className="p-3 text-xs rounded-md bg-destructive/15 text-destructive font-medium">
                            {errorMsg}
                        </div>
                    )}

                    {canChangeRole && (
                        <RoleSelect id="edit_role" value={role} onChange={setRole} isOwner={isOwner} disabled={isLoading} />
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_experience">Experience (years)</Label>
                        <Input
                            id="edit_experience"
                            type="number"
                            min="0"
                            max="60"
                            placeholder="e.g. 2"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">Used by access rules, for example senior cashiers.</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_employment">Employment Type</Label>
                        <Select
                            items={employmentItems}
                            value={employmentType}
                            onValueChange={(v) => v && setEmploymentType(String(v))}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="edit_employment" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {employmentItems.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
