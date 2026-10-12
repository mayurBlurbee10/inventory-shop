"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/shop";
import type { EmploymentType, StaffList } from "@/types/staff";

const STAFF_KEY = ["staff"];

export function useStaff(enabled = true) {
    return useQuery({
        queryKey: STAFF_KEY,
        enabled,
        queryFn: async () => {
            const res = await apiFetch<ApiResponse<StaffList>>("/api/staff");
            return res.data;
        },
    });
}

function useStaffMutation<TVars>(request: (vars: TVars) => Promise<unknown>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: request,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: STAFF_KEY });
        },
    });
}

export function useInviteStaff() {
    const locale = useLocale();
    return useStaffMutation((data: { name: string; email: string; role: string }) =>
        apiFetch<ApiResponse<{ emailSent: boolean }>>("/api/staff/invitations", {
            method: "POST",
            body: JSON.stringify({ ...data, locale }),
        })
    );
}

export function useResendInvitation() {
    const locale = useLocale();
    return useStaffMutation((id: string) =>
        apiFetch<ApiResponse<{ emailSent: boolean }>>(`/api/staff/invitations/${id}/resend`, {
            method: "POST",
            body: JSON.stringify({ locale }),
        })
    );
}

export function useRevokeInvitation() {
    return useStaffMutation((id: string) =>
        apiFetch<ApiResponse<null>>(`/api/staff/invitations/${id}`, { method: "DELETE" })
    );
}

export function useChangeStaffRole() {
    return useStaffMutation(({ id, role }: { id: string; role: string }) =>
        apiFetch<ApiResponse<null>>(`/api/staff/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        })
    );
}

export function useUpdateStaffAttributes() {
    return useStaffMutation(
        ({ id, ...data }: { id: string; experienceYears: number | null; employmentType: EmploymentType | null }) =>
            apiFetch<ApiResponse<null>>(`/api/staff/${id}/attributes`, {
                method: "PATCH",
                body: JSON.stringify(data),
            })
    );
}

export function useRemoveStaff() {
    return useStaffMutation((id: string) => apiFetch<ApiResponse<null>>(`/api/staff/${id}`, { method: "DELETE" }));
}
