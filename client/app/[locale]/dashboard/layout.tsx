"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { AlertCircle, LogOut, Store, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useShop } from "@/store/shop-store";
import { WEB_APP_NAME } from "@/constant";
import AccessControlProvider, { useAccess } from "@/providers/AccessControlProvider";
import { ACTIONS, RESOURCES, roleLabel } from "@/lib/access";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Custom states to handle the manual fetch lifecycle
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState<any>(null);

  const {
    activeShop,
    shops,
    isLoading: isShopLoading,
    hasFetched,
    fetchShops,
    error: shopError,
  } = useShop();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Fetching session...");
        // Imperative method to get the session data
        const { data: session, error } = await authClient.getSession();

        if (error || !session) {
          console.log("No session found imperatively - redirecting to signin");
          router.push("/auth/signin");
        } else {
          console.log("Session verified imperatively:", session);
          setUserSession(session);

          // Call your shop fetching logic since auth is safe
          await fetchShops();
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
        router.push("/auth/signin");
      }
    }

    checkAuth();
  }, []);

  if (isLoading || isShopLoading || !hasFetched) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading workspace & shop...
          </p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return null;
  }

  // Loading shops failed for a reason other than permissions: offer a retry instead of onboarding
  if (shopError && !shopError.accessDenied) {
    return (
      <FullScreenMessage
        icon={<AlertCircle className="h-8 w-8 text-destructive" />}
        title="Couldn't load your shop"
        description={shopError.message}
        action={<Button onClick={() => fetchShops()}>Try Again</Button>}
      />
    );
  }

  // No shop: owners-to-be go to onboarding; everyone else is told to ask for an invite
  if (shops.length === 0) {
    return (
      <AccessControlProvider>
        <NoShopGate accessDenied={!!shopError?.accessDenied} pathname={pathname} />
      </AccessControlProvider>
    );
  }

  return (
    <AccessControlProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <DashboardSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold tracking-tight">
                {WEB_APP_NAME}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/30 bg-primary/10 text-primary font-semibold"
              >
                <Store className="h-3.5 w-3.5" />
                {activeShop ? activeShop.name : "No Shop Selected"}
              </Badge>
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-muted/40 text-xs font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{userSession.user.name || userSession.user.email}</span>
              </div>
              <CurrentRoleBadge />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
    </AccessControlProvider>
  );
}

function FullScreenMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground px-4">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}

function NoShopGate({ accessDenied, pathname }: { accessDenied: boolean; pathname: string }) {
  const router = useRouter();
  const { can, loading } = useAccess();
  const canCreateShop = !accessDenied && can(RESOURCES.SHOP, ACTIONS.CREATE);

  useEffect(() => {
    if (!loading && canCreateShop && !pathname.includes("/onboarding")) {
      router.push("/onboarding");
    }
  }, [loading, canCreateShop, pathname, router]);

  if (loading || canCreateShop) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/signin");
  };

  return (
    <FullScreenMessage
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="You're not a member of any shop"
      description="Ask a shop owner to invite you. If you already have an invitation, open the link in your email to join."
      action={
        <Button variant="outline" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      }
    />
  );
}

/** The user's role in MStrategy Access Control, shown next to their name. */
function CurrentRoleBadge() {
  const { roles, loading } = useAccess();
  if (loading || !roles.length) return null;
  return (
    <Badge variant="secondary" className="font-medium">
      {roleLabel(roles[0])}
    </Badge>
  );
}
