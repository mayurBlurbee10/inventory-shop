"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { setUserData } from "@/app/lib/auth";
import PortalFooter from "@/components/PortalFooter";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { signIn, signOut } from "next-auth/react";

const NavBarItem = ({ title }) => (
  <button className="px-6 py-2 text-text hover:text-text/80">{title}</button>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SubsidiariesLoginPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState(null);
  const [content, setContent] = useState(null);

  // const handleCreate = async () => {
  //   setIsLoading(true);

  //   try {
  //     // const boxResponse = await fetchWrapper(
  //     //   "/api/box/create-user",
  //     //   {
  //     //     method: "POST",
  //     //     headers: {
  //     //       "Content-Type": "application/json",
  //     //     },
  //     //     body: JSON.stringify({
  //     //       userName: "admin@demo.com",
  //     //       externalId: `user_${Date.now()}`,
  //     //     }),
  //     //   },
  //     //   "create-user-box"
  //     // );

  //     // const boxData = await boxResponse.json();

  //     // if (!boxResponse.ok) {
  //     //   throw new Error(boxData.error || "Failed to create Box user");
  //     // }

  //     // Save user data
  //     const saveResponse = await fetchWrapper(
  //       "/api/users",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         // body: json.stringify({
  //         //   boxUserId: boxData.user.userId,
  //         //   folderId: boxData.user.folderId,
  //         // }),
  //       },
  //       "save-user"
  //     );

  //     if (!saveResponse.ok) {
  //       throw new Error("Failed to save user data");
  //     }

  //     const savedData = await saveResponse.json();
  //     console.log(savedData);
  //   } catch (error) {
  //     console.error("Error creating user:", error);
  //     setError(error.message || "An unexpected error occurred");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetchWrapper(
          `/api/portal?portalid=${params.portalid || "default"}`,
          {},
          "portal-login"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch portal config");
        }
        setConfig(data.data);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const response = await fetchWrapper(
      `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
      { method: "GET" },
      "fetchContentManagement"
    );
    if (!response.ok) throw new Error("Failed to fetch Content Management");
    const data = await response.json();
    setContent(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchWrapper(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            portalid: params.portalid || "default",
          }),
        },
        "default-login"
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      // Store user data using auth utility
      const userData = data.user;
      setUserData(userData);
      localStorage.setItem("portal", params.portalid);
      localStorage.setItem("accessToken", data.accessToken);

      console.log("Redirecting to home");
      if (userData.isOnboardingRequired) {
        router.push(`onboarding`);
      } else {
        router.push(`home`);
      }
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterValue = (title) => {
    const contentItem = content.portalContent.find(
      (item) => item.title === title
    );
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content.defaultContent.find(
        (item) => item.title === title
      );
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  const login = async () => {
    try {
      await signIn("okta");
    } catch (error) {
      console.log('error: ', error)
    }
  };

  if (!config || !content) return <LoadingSpinner />;

  return (
    <div className="h-screen w-screen flex items-start xl:items-center justify-center relative overflow-x-hidden">
      <div className="bg-white relative z-10 w-full h-full flex flex-col">
        <nav className="px-3 md:px-6 lg:px-12 py-4 flex justify-between items-center">
          <div className="h-12 md:h-16 lg:h-20">
            <img
              src={config?.logo || "/logo.png"}
              alt="Premierportal"
              className="h-full hidden md:block"
            />
            <img
              src={config?.logo || "/logo.png"}
              alt="Premierportal"
              className="h-full w-full block md:hidden"
            />
          </div>
          <div className="hidden md:flex space-x-4">
            <h3 className="md:text-lg lg:text-3xl font-normal leading-tight text-[#545454] italic xl:mr-20">
              Premier Customer Portal
            </h3>
          </div>
          <button className="md:hidden text-text">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </nav>

        {/* GREEN LINE */}
        <div
          style={{ backgroundColor: config?.primaryColor }}
          className="p-3 w-full"
        ></div>

        <div className="flex-1 flex flex-col lg:flex-row w-full h-full">
          <div className="w-full xl:w-3/5 p-6 lg:p-10 xl:p-16 flex flex-col justify-between bg-secondary h-full">
            <div>
              <h2 className="text-3xl font-normal leading-tight text-[#545454]">
                {config?.tradingName} {filterValue("Title")}
              </h2>
              <p className="text-lg text-text/70 mt-4 leading-tight md:leading-relaxed">
                {filterValue("Paragraph")}
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
                {/* Adjusted to stretch and take full height */}
                <div className="bg-background-gray p-6 rounded-lg shadow-sm min-h-72 max-h-80 flex flex-col">
                  <h3 className="text-lg font-bold text-text">
                    {filterValue("Card 1 Title")}
                  </h3>
                  <p className="text-text/60 mt-2 flex-grow">
                    {filterValue("Card 1 Content")}
                  </p>
                </div>
                <div className="bg-background-gray p-6 rounded-lg shadow-sm min-h-72 max-h-80 flex flex-col">
                  <h3 className="text-lg font-bold text-text">
                    {filterValue("Card 2 Title")}
                  </h3>
                  <p className="text-text/60 mt-2 flex-grow">
                    {filterValue("Card 2 Content")}
                  </p>
                </div>
                <div className="bg-background-gray p-6 rounded-lg shadow-sm min-h-72 max-h-80 flex flex-col">
                  <h3 className="text-lg font-bold text-text">
                    {filterValue("Card 3 Title")}
                  </h3>
                  <p className="text-text/60 mt-2 flex-grow">
                    {filterValue("Card 3 Content")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full xl:w-2/5 bg-background-gray p-4 md:p-10 xl:p-12 flex items-center justify-center h-full">
            <div className="w-full max-w-md bg-secondary rounded-lg shadow-lg p-3 md:p-8">
              <div className="text-center mb-8">
                <p className="text-text/60 mt-2">
                  Log in here to access your account
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-secondary py-3 rounded hover:bg-[#1A4C8A]/80 transition-colors"
                    disabled={isLoading}
                    style={{ backgroundColor: config?.secondaryColor }}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      "Log In"
                    )}
                  </button>
                  <div className="text-center mt-4">
                    <button type="button" className="text-white uppercase font-semibold bg-[#3475ba] py-3 px-4 w-full rounded flex items-center justify-center gap-4" onClick={login}>
                      <div className="h-6 w-6 border-[5px] border-solid border-white rounded-full"></div>
                      Login with Okta
                    </button>
                  </div>
                </div>
              </form>

              {error && (
                <div className="mt-4 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        <PortalFooter config={config} filterValue={filterValue} />
      </div>
      <div className="absolute bottom-1 xl:bottom-5 left-3 2xl:left-10 max-w-20 xl:max-w-36 w-full opacity-20 z-0">
        <img src="/logo_new.png" alt="Wealthportal" className="h-full w-full" />
      </div>
    </div>
  );
}
