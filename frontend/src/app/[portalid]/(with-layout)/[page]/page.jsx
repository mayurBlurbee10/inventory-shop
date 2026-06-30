"use client";
import { getUserData, isAdmin, setAuthTokens } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
        `/api/pages?portalId=${params?.portalid || "root"}&page=${reverseSanitizeName(params?.page) || ""
        }`,
        {},
        "fetch-page"
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
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetch-user-by-email");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      // setUserData(userData);
      dispatch(setCurrentUser(userData));
      if (typeof window !== "undefined") {
        // localStorage.setItem("portal", params.portalid);
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

      // setUser(userData);
      fetchConfig();
    });
  }, [router]);

  useEffect(() => {
    fetchPlugins();
  }, []);
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }
  const userIsAdmin = isAdmin();
  return (
    <div className="max-w-[1820px] mx-auto px-4 pt-4 bg-white text-gray-800 font-lato">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        <div className={`${!filterVisibility("My Task Section") && !filterVisibility("Collaborator Section") && !filterVisibility("Messaging") ? "col-span-5" : " col-span-5 md:col-span-3"}`}>
          <div>
            <div className="flex justify-center">
              {filterVisibility("Ticker Tape") && (
                <div className="w-[96%] md:w-[80%]">
                  <TickerTape />
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-center mt-5 ">
              {page && page?.description ? (
                <div
                  className="bg-white p-3 page w-[96%] md:w-[80%] max-h-[500px] overflow-y-auto border min-h-[250px]"
                  dangerouslySetInnerHTML={{
                    __html: page.description,
                  }}
                  suppressHydrationWarning={true}
                />
              ) : (
                <div>No Content Available</div>
              )}
            </div>
            <div className="flex justify-center w-full mt-5">
              {filterVisibility("Chart Section") && (
                <div className="w-[96%] md:w-[80%]">
                  <StockMarketChart />
                  {/* <MarketOverviewChart /> */}
                </div>
              )}
            </div>
            <div className="flex justify-center mt-5">
              {filterVisibility("Top Stories") && (
                <div className="w-[96%] md:w-[80%]">
                  <TopStories />
                </div>
              )}
            </div>
          </div>

        </div>
        <div className="col-span-5 md:col-span-2 flex flex-col gap-4">
          {filterVisibility("My Task Section") && (
            <TasksSection />
          )}
          {filterVisibility("Advisor Section") && (
            <AdvisorSection />
          )}
          {filterVisibility("Collaborator Section") && (
            <CollaboratorSection />
          )}
          {filterVisibility("Messaging") && (
            <MessageSection />
          )}
        </div>
      </div>
    </div>
  );
}
export default Page;
