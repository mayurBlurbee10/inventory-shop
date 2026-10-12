"use client";

import React, { useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useShop } from "@/store/shop-store";
import { Can, useAccess } from "@/providers/AccessControlProvider";
import { ACTIONS, EMPLOYMENT_TYPE_LABELS, OWNER_ONLY_ROLES, RESOURCES, roleLabel } from "@/lib/access";
import { useRemoveStaff, useResendInvitation, useRevokeInvitation, useStaff } from "@/hooks/use-staff";
import { InviteStaffDialog } from "@/components/staff/invite-staff-dialog";
import { EditStaffDialog } from "@/components/staff/edit-staff-dialog";
import type { StaffInvitation, StaffMember } from "@/types/staff";
import Title from "@/components/Title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  AlertTriangle,
  Edit2,
  Mail,
  RotateCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardStaffPage() {
  const { activeShop } = useShop();
  const { can, loading: accessLoading } = useAccess();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const isOwner = !!activeShop && activeShop.userId === currentUserId;

  const canView = can(RESOURCES.STAFF, ACTIONS.VIEW);
  const canChangeRole = can(RESOURCES.STAFF, ACTIONS.UPDATE_ROLE);
  const canRemove = can(RESOURCES.STAFF, ACTIONS.REMOVE);
  const { data: staff, isLoading, isError, error } = useStaff(canView);

  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<StaffMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<StaffMember | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<StaffInvitation | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const removeMutation = useRemoveStaff();
  const resendMutation = useResendInvitation();
  const revokeMutation = useRevokeInvitation();

  // Owner first, then staff; filtered by the search box
  const rows = useMemo(() => {
    if (!staff) return [];
    const all = [
      ...(staff.owner
        ? [{ ...staff.owner, id: `owner-${staff.owner.userId}`, isOwnerRow: true as const }]
        : []),
      ...staff.members.map((m) => ({ ...m, isOwnerRow: false as const })),
    ];
    const q = searchQuery.trim().toLowerCase();
    return q
      ? all.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            roleLabel(r.role).toLowerCase().includes(q)
        )
      : all;
  }, [staff, searchQuery]);

  // Managers can only be changed or removed by the shop owner
  const canManage = (member: StaffMember) =>
    member.userId !== currentUserId &&
    (isOwner || !OWNER_ONLY_ROLES.includes(member.role));

  const handleRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMutation.mutateAsync(memberToRemove.id);
      setNotice({ type: "success", text: `${memberToRemove.name} was removed from the shop.` });
    } catch (err: unknown) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to remove staff member." });
    }
    setMemberToRemove(null);
  };

  const handleResend = async (invite: StaffInvitation) => {
    try {
      const res = (await resendMutation.mutateAsync(invite.id)) as { message?: string };
      setNotice({ type: "success", text: res?.message || `Invitation resent to ${invite.email}.` });
    } catch (err: unknown) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to resend invitation." });
    }
  };

  const handleRevoke = async () => {
    if (!inviteToRevoke) return;
    try {
      await revokeMutation.mutateAsync(inviteToRevoke.id);
      setNotice({ type: "success", text: `Invitation for ${inviteToRevoke.email} was revoked.` });
    } catch (err: unknown) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to revoke invitation." });
    }
    setInviteToRevoke(null);
  };

  if (!accessLoading && !canView) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Title>Staff & Roles</Title>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view staff. Ask the shop owner for access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Title>Staff & Roles</Title>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Staff & Roles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Invite people to {activeShop?.name || "your shop"} and choose what
            each of them can do.
          </p>
        </div>

        <Can resource={RESOURCES.STAFF} action={ACTIONS.INVITE}>
          <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </Button>
        </Can>
      </div>

      {notice && (
        <div
          className={`p-3 text-xs rounded-md font-medium flex items-center justify-between gap-2 ${
            notice.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Team Members */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({staff ? staff.members.length + (staff.owner ? 1 : 0) : 0})
              </CardTitle>
              <CardDescription>
                Permissions for each role are managed in MStrategy Access Control.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading || accessLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading team...
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error instanceof Error ? error.message : "Failed to load staff."}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">No Staff Found</p>
              <p className="text-xs">
                {searchQuery
                  ? `No one matches "${searchQuery}"`
                  : 'Click "Invite Staff" above to add your first team member.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        <span className="flex items-center gap-2">
                          {row.name}
                          {row.userId === currentUserId && (
                            <Badge variant="outline" className="font-medium">You</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={row.isOwnerRow ? "default" : "secondary"}
                            className="font-medium"
                          >
                            {roleLabel(row.role)}
                          </Badge>
                          {!row.isOwnerRow && !row.inAccessControl && (
                            <Badge variant="destructive" className="font-medium gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Not synced to access control
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.isOwnerRow ? (
                          "—"
                        ) : (
                          <>
                            {row.experienceYears != null ? `${row.experienceYears} yrs` : "—"}
                            {row.employmentType && (
                              <span className="block text-xs">
                                {EMPLOYMENT_TYPE_LABELS[row.employmentType]}
                              </span>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(row.joinedAt)}</TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        {!row.isOwnerRow && canManage(row) && (
                          <>
                            {canChangeRole && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMemberToEdit(row)}
                                className="h-8 gap-1"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            )}
                            {canRemove && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setMemberToRemove(row)}
                                className="h-8 gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {!!staff?.invitations.length && (
        <Card className="shadow-xs">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({staff.invitations.length})
            </CardTitle>
            <CardDescription>
              People who haven&apos;t accepted their invitation yet. Links expire after 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.invitations.map((invite) => (
                    <TableRow key={invite.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">{invite.name}</TableCell>
                      <TableCell className="text-muted-foreground">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {roleLabel(invite.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{invite.invitedBy}</TableCell>
                      <TableCell>
                        {invite.expired ? (
                          <Badge variant="destructive" className="font-medium">Expired</Badge>
                        ) : (
                          <span className="text-muted-foreground">{formatDate(invite.expiresAt)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        <Can resource={RESOURCES.STAFF} action={ACTIONS.INVITE}>
                          {(isOwner || !OWNER_ONLY_ROLES.includes(invite.role)) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResend(invite)}
                              disabled={resendMutation.isPending}
                              className="h-8 gap-1"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              Resend
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setInviteToRevoke(invite)}
                            className="h-8 gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Revoke
                          </Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <InviteStaffDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} isOwner={isOwner} />

      <EditStaffDialog
        member={memberToEdit}
        onOpenChange={(open) => !open && setMemberToEdit(null)}
        isOwner={isOwner}
        canChangeRole={canChangeRole}
      />

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name} from the shop?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be signed out right away and lose access to{" "}
              <strong>{activeShop?.name || "this shop"}</strong>. Their past sales stay in your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? "Removing..." : "Remove Staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!inviteToRevoke}
        onOpenChange={(open) => !open && setInviteToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The link sent to <strong>{inviteToRevoke?.email}</strong> will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
