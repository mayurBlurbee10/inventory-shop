"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVITABLE_ROLES, OWNER_ONLY_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/access";

interface RoleSelectProps {
    id: string;
    value: string;
    onChange: (role: string) => void;
    // Only the shop owner may assign owner-only roles such as Manager
    isOwner: boolean;
    disabled?: boolean;
}

export function RoleSelect({ id, value, onChange, isOwner, disabled }: RoleSelectProps) {
    const roles = INVITABLE_ROLES.filter((r) => isOwner || !OWNER_ONLY_ROLES.includes(r));
    const items = roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>Role</Label>
            <Select items={items} value={value} onValueChange={(v) => v && onChange(String(v))} disabled={disabled}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[value]}</p>
        </div>
    );
}
