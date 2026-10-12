"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { validateName, validatePasswordStrength } from "@/lib/auth-validate";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Store,
  User,
} from "lucide-react";
import Title from "@/components/Title";
import { WEB_APP_NAME } from "@/constant";
import type { ApiResponse } from "@/types/shop";
import type { InvitationLookup } from "@/types/staff";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [invite, setInvite] = useState<InvitationLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function lookup() {
      if (!token) {
        setInvite({ valid: false });
        setLookupLoading(false);
        return;
      }
      try {
        const res = await apiFetch<ApiResponse<InvitationLookup>>(
          `/api/staff/invitations/lookup?token=${encodeURIComponent(token)}`
        );
        setInvite(res.data);
        setName(res.data?.name || "");
      } catch {
        setInvite({ valid: false });
      } finally {
        setLookupLoading(false);
      }
    }
    lookup();
  }, [token]);

  const signedInEmail = session?.user?.email?.toLowerCase();
  const signedInAsInvitee = !!signedInEmail && signedInEmail === invite?.email;
  const signedInAsOther = !!signedInEmail && !signedInAsInvitee;
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(`/auth/accept-invite?token=${token}`)}`;

  const accept = async (body: Record<string, string>) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch("/api/staff/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token, ...body }),
      });
      // The shop store picks the joined shop as the only one available
      localStorage.removeItem("active_shop_id");
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Couldn't accept the invitation.");
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateName(name);
    if (nameError) return setErrorMsg(nameError);
    const passwordError = validatePasswordStrength(password);
    if (passwordError) return setErrorMsg(passwordError);
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");
    await accept({ name: name.trim(), password });
  };

  const isLoadingPage = lookupLoading || sessionLoading;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient background glows using CSS variables (Shadcn colors) */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_50%)] opacity-[0.03] dark:opacity-[0.07]" />
      <div className="absolute -left-1/4 -top-1/4 -z-10 h-[50vw] w-[50vw] rounded-full bg-[color-mix(in_oklch,var(--primary),transparent_95%)] blur-[120px]" />
      <div className="absolute -right-1/4 -bottom-1/4 -z-10 h-[50vw] w-[50vw] rounded-full bg-[color-mix(in_oklch,var(--primary),transparent_95%)] blur-[120px]" />

      <div className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ring-1 ring-border transition-all hover:scale-105 duration-300">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {WEB_APP_NAME}
          </h1>
          <p className="text-xs text-muted-foreground">Shop POS</p>
        </div>
      </div>

      <Card className="w-full max-w-100 border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
        {isLoadingPage ? (
          <CardContent className="flex justify-center py-10">
            <Spinner />
          </CardContent>
        ) : !invite?.valid ? (
          <>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm font-semibold">Invitation Not Valid</CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                This invitation link has expired, was revoked, or was already used. Ask the shop owner to send a new one.
              </CardDescription>
            </CardHeader>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm font-semibold">Join {invite.shopName}</CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                You&apos;ve been invited to join as a team member.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 font-medium">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  {invite.shopName}
                </span>
                <Badge variant="secondary" className="font-medium">{invite.roleLabel}</Badge>
              </div>

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                </Alert>
              )}

              {signedInAsOther ? (
                <p className="text-xs text-muted-foreground">
                  You&apos;re signed in as <strong>{session?.user?.email}</strong>, but this invitation is for{" "}
                  <strong>{invite.email}</strong>. Sign out and sign in with that email to accept it.
                </p>
              ) : signedInAsInvitee ? (
                <Button className="w-full" onClick={() => accept({})} disabled={loading}>
                  {loading ? <Spinner className="h-4 w-4" /> : "Accept Invitation"}
                </Button>
              ) : invite.accountExists ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    An account for <strong>{invite.email}</strong> already exists. Sign in to accept the invitation.
                  </p>
                  <Button
                    className="w-full"
                    nativeButton={false}
                    render={(props) => (
                      <Link href={signInHref} {...props}>
                        Sign In to Accept
                      </Link>
                    )}
                  />
                </div>
              ) : (
                <form onSubmit={handleCreateAccount} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="invite_email">Email</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Mail className="h-3.5 w-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput id="invite_email" type="email" value={invite.email} disabled />
                    </InputGroup>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="invite_name">Full Name</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <User className="h-3.5 w-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="invite_name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </InputGroup>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="invite_password">Password</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Lock className="h-3.5 w-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="invite_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          size="icon-xs"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="invite_confirm">Confirm Password</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Lock className="h-3.5 w-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="invite_confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </InputGroup>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Spinner className="h-4 w-4" /> : "Create Account & Join"}
                  </Button>
                </form>
              )}
            </CardContent>
          </>
        )}

        <CardFooter className="flex flex-col gap-2 border-t border-border/40 pt-4 pb-4">
          <div className="text-center text-xs text-muted-foreground flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" />{" "}
            <Link href={"/"} replace={true}>
              <span className="underline">Back to Homepage</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Spinner />
        </div>
      }
    >
      <Title>Accept Invitation</Title>
      <AcceptInviteForm />
    </Suspense>
  );
}
