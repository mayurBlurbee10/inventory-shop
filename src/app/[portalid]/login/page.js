"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { setUserData } from "@/app/lib/auth";
import PortalFooter from "@/components/PortalFooter";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { defaultPortal } from "@/app/lib/data/default-portal";

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
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
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
          body: JSON.stringify({ email, password }),
        },
        "default-login"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store user data using auth utility
      const userData = data.user;
      setUserData(userData);
      localStorage.setItem("portal", params);

      console.log("Redirecting to home");
      router.push(`home`);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterValue = (title) => {
    const contentItem = content.find((item) => item.title === title);
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = defaultPortal.find((item) => item.title === title);
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  if (!config || !content) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex flex-col items-start xl:items-center justify-center relative">
      <div className="bg-white relative z-10">
        <nav className="px-3 md:px-6 lg:px-12 py-4 flex justify-between items-center h-full">
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
            {/* <NavBarItem title="Individual" />
          <NavBarItem title="Business" />
          <NavBarItem title="About Us" />
          <NavBarItem title="Contact" /> */}

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
          className="p-3"
        ></div>

        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="w-full xl:w-3/5 p-6 lg:p-10 xl:p-16 flex flex-col justify-between bg-secondary">
            <div>
              <h2 className="text-3xl font-normal leading-tight text-[#545454]">
                {filterValue("Hero Title")} {config?.tradingName}
                {/* Welcome M Strategy */}
              </h2>
              <p className="text-lg text-text/70 mt-4 leading-tight md:leading-relaxed">
                {/* As premier customer, we have created a customer portal solution
                for you. Please log into access your work orders, project files,
                invoices and other supporting documentation. You can also use
                the portal to request new quotes for services and more. */}
                {filterValue("Hero Content")}
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-6 mt-10">
                <div className="bg-background-gray p-6 rounded-lg shadow-sm min-h-44 max-h-64 h-full overflow-y-auto scrollbar-visibility-hidden">
                  {/* <svg
                    className="w-8 h-8 text-text"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"
                    />
                  </svg> */}
                  <h3 className="text-lg font-bold text-text">
                    {/* Digitization Services */}
                    {filterValue("Service1 Title")}
                  </h3>
                  <p className="text-text/60 mt-2">
                    {/* Commercial, archival scanning, digitization and micrographic
                    services for those needing to digitally preserve important
                    documents, newspapers, maps, books, microfilm, slides and
                    more. Learn More */}
                    {filterValue("Service1 Content")}
                  </p>
                </div>
                <div className="bg-background-gray p-6 rounded-lg shadow-sm min-h-44 max-h-64 h-full overflow-y-auto scrollbar-visibility-hidden">
                  {/* <svg
                    className="w-8 h-8 text-text"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg> */}
                  <h3 className="text-lg font-bold text-text">
                    {/* Software Solutions */}
                    {filterValue("Service2 Title")}
                  </h3>
                  <p className="text-text/60 mt-2">
                    {/* At Crowley, software systems are considered a critical
                    component for maximum image quality, production efficiency,
                    and content management. Learn More */}
                    {filterValue("Service2 Content")}
                  </p>
                </div>
                <div className="bg-background-gray p-6 rounded-lg shadow-sm min-h-44 max-h-64 h-full overflow-y-auto scrollbar-visibility-hidden">
                  {/* <svg
                    className="w-8 h-8 text-text"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg> */}
                  <h3 className="text-lg font-bold text-text">
                    {/* Support Services */}
                    {filterValue("Service3 Title")}
                  </h3>
                  <p className="text-text/60 mt-2">
                    {/* From beginning to end, your digitization projects are
                    covered with the full breadth of Crowley support services.
                    Learn More */}
                    {filterValue("Service3 Content")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full xl:w-2/5 bg-background-gray p-4 md:p-10 xl:p-12 flex items-start xl:items-center justify-center">
            <div className="w-full max-w-md bg-secondary rounded-lg shadow-lg p-3 md:p-8">
              <div className="text-center mb-8">
                {/* <img
                  src="/logo2.png"
                  alt="Wealthportal"
                  className="h-12 w-auto mx-auto"
                /> */}
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
                </div>
              </form>

              {error && (
                <div className="mt-4 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="text-center mt-4">
                <button className="text-text/40 hover:text-text/60">
                  Forgot password?
                </button>
              </div>
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
