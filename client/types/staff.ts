export type EmploymentType = "full_time" | "part_time";

export interface StaffOwner {
    userId: string;
    name: string;
    email: string;
    role: "owner";
    joinedAt: string;
}

export interface StaffMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    experienceYears: number | null;
    employmentType: EmploymentType | null;
    // false when the PAP doesn't know this person (no permissions until fixed)
    inAccessControl: boolean;
    joinedAt: string;
}

export interface StaffInvitation {
    id: string;
    name: string;
    email: string;
    role: string;
    invitedBy: string;
    expiresAt: string;
    expired: boolean;
    createdAt: string;
}

export interface StaffList {
    owner: StaffOwner | null;
    members: StaffMember[];
    invitations: StaffInvitation[];
}

export interface InvitationLookup {
    valid: boolean;
    shopName?: string;
    email?: string;
    name?: string;
    role?: string;
    roleLabel?: string;
    accountExists?: boolean;
}
