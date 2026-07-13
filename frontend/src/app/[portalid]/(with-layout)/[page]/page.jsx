"use client";

import { getUserData, isAdmin, setAuthTokens } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../../../../components/Plugins/RTE/tiptap-style.css";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "@/store/services/userService";
import TasksSection from "@/components/Common/TasksSection";
import MessageSection from "@/components/Common/MessageSection";
import AdvisorSection from "@/components/Common/AdvisorSection";
import TickerTape from "@/components/Common/charts/TickerTape";
import TopStories from "@/components/Common/charts/TopStories";
import { StockMarketChart } from "@/components/Common/charts/Chart";
import CollaboratorSection from "@/components/Common/CollaboratorSection";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { cn } from "@/app/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <LoaderSpinner size={32} className="text-secondary-foreground" />
  </div>
);

function Page() {
  const params = useParams();
  const router = useRouter();
  const [page, setPage] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWrapper(
        `/api/pages?portalId=${params?.portalid || "root"}&page=${
          reverseSanitizeName(params?.page) || ""
        }`,
        {},
        "fetch-page",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      setPage(data.data);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function reverseSanitizeName(sanitizedName) {
    let reversedName = sanitizedName.endsWith("-")
      ? sanitizedName.slice(0, -1)
      : sanitizedName;

    reversedName = reversedName.replace(/-/g, " ");
    reversedName = reversedName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return reversedName;
  }

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const getUserDetailsByEmail = async (email) => {
    try {
      const url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetch-user-by-email");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      dispatch(setCurrentUser(userData));
      if (typeof window !== "undefined") {
        setAuthTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
      }
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  const filterVisibility = (label) => {
    if (isLoading) return false;
    if (!page) return true;

    const section = page?.visibility.find((item) => item.label === label);
    return section?.visible ?? false;
  };

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData) {
        await getUserDetailsByEmail(sessionData.user.email);
      }
    };
    fetchSession().then(() => {
      const userData = getUserData();
      if (!userData) {
        router.push("login");
        return;
      }

      fetchConfig();
    });
  }, [router]);

  useEffect(() => {
    fetchPlugins();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const userIsAdmin = isAdmin();
  const hasSidebarSections =
    filterVisibility("My Task Section") ||
    filterVisibility("Collaborator Section") ||
    filterVisibility("Messaging");

  return (
    <div className="mx-auto max-w-[1820px] bg-background px-4 pt-4 font-lato text-foreground">
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-5">
        <div
          className={cn(
            !hasSidebarSections ? "col-span-5" : "col-span-5 md:col-span-3",
          )}
        >
          <div>
            <div className="flex justify-center">
              {filterVisibility("Ticker Tape") && (
                <div className="w-[96%] md:w-[80%]">
                  <TickerTape />
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-1 justify-center">
              {page && page?.description ? (
                <Card className="page w-[96%] min-h-[250px] max-h-[500px] overflow-y-auto border-border bg-card md:w-[80%]">
                  <CardContent
                    className="p-3 text-secondary-foreground"
                    dangerouslySetInnerHTML={{
                      __html: page.description,
                    }}
                    suppressHydrationWarning={true}
                  />
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No Content Available
                </p>
              )}
            </div>

            <div className="mt-5 flex w-full justify-center">
              {filterVisibility("Chart Section") && (
                <div className="w-[96%] md:w-[80%]">
                  <StockMarketChart />
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-center">
              {filterVisibility("Top Stories") && (
                <div className="w-[96%] md:w-[80%]">
                  <TopStories />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-4 md:col-span-2">
          {filterVisibility("My Task Section") && <TasksSection />}
          {filterVisibility("Advisor Section") && <AdvisorSection />}
          {filterVisibility("Collaborator Section") && <CollaboratorSection />}
        </div>
      </div>
    </div>
  );
}

export default Page;
