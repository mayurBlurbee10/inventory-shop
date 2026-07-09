"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { setAuthTokens, setUserData } from "@/app/lib/auth";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";

import {
  IdCard,
  LockKeyhole,
  UserRound,
  SquarePen,
  User,
  Building,
  Loader2,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getSession, signIn } from "next-auth/react";
import { getUserData } from "@/lib/auth";
import TNCModal from "./TNCModal";
import { PluginType, UserRole } from "@/config/constants";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { setCurrentUser } from "@/store/services/userService";

// ✅ shadcn imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { setPages } from "@/store/services/pageService";
import * as LucideIcons from "lucide-react";
import {
  coverPhotoRatio,
  fontSizes,
  logoSizeRatio,
} from "@/app/lib/data/font_size";
import { setContent } from "@/store/services/contentService";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import {
  getStoredMode,
  previewPresetTheme,
  reloadThemeAfterLogin,
} from "@/lib/theme-manager";

const NavBarItem = ({ title }) => (
  <button className="px-1 py-2 text-gray-500">{title}</button>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoaderSpinner size={40} className="text-secondary-foreground" />
  </div>
);

function Login() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingOkta, setIsLoadingOkta] = useState(false);
  const [session, setSession] = useState(null);
  const [isTNCOpen, setIsTNCOpen] = useState(false);
  const [tncPage, setTncPage] = useState(null);
  const [ndaPages, setNdaPages] = useState([]);

  const { data: config } = useSelector((state) => state.portal);
  const { data: content } = useSelector((state) => state.content);
  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const hasCompletedLoginRef = useRef(false);

  const applyGuestSlateTheme = () => {
    if (hasCompletedLoginRef.current) return;
    // Visual-only slate so saved user theme in localStorage is not overwritten.
    previewPresetTheme("slate", getStoredMode());
  };

  const loadUserThemeAfterLogin = async (userData) => {
    if (!userData?.id) return;

    hasCompletedLoginRef.current = true;
    const portalId = params?.portalid || userData.portalId || "root";

    try {
      await reloadThemeAfterLogin({ portalId });
    } catch (error) {
      console.error("Failed to load portal theme after login:", error);
    }
  };

  // Guest/login page uses slate until authentication completes.
  useEffect(() => {
    applyGuestSlateTheme();

    // ThemeLoader may apply a cached theme after mount; keep guests on slate.
    const keepGuestSlate = () => applyGuestSlateTheme();
    window.addEventListener("theme-applied", keepGuestSlate);
    return () => window.removeEventListener("theme-applied", keepGuestSlate);
  }, []);

  const fetchPlugins = async () => {
    try {
      const encodedType = encodeURIComponent(PluginType.PAGES);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedType}`,
        {},
        "fetch-pages"
      );
      if (!response.ok) throw new Error("Failed to fetch plugins");
      const data = await response.json();
      const pageData = data?.data[0]?.pages || [];
      dispatch(setPages(pageData));
      const filterPagePlugin = pageData.filter(
        (item) => !item.isCustomPage && item.isPageVisible
      );
      let pageToRedirect = filterPagePlugin?.find(
        (item) => item?.title === "dashboard"
      );
      if (!pageToRedirect) {
        pageToRedirect = filterPagePlugin?.find(
          (item) => item?.title === "shared-docs"
        );
        pageToRedirect.pageTitle = "shared documents";
      } else {
        pageToRedirect.pageTitle = "dashboard";
      }
      return pageToRedirect;
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  const fetchNdaPages = async () => {
    try {
      const response = await fetchWrapper(
        `/api/nda-agreements?portalId=${params?.portalid || "root"}`,
        {},
        "fetch-nda-agreements"
      );
      if (!response.ok) { setNdaPages([]); setTncPage(null); return; }
      const data = await response.json();
      const pages = data?.data || [];
      setNdaPages(pages);
      setTncPage(pages.find((page) => page?.isDefault) || null);
    } catch (error) {
      console.error("Error fetching NDA pages:", error);
      setNdaPages([]);
      setTncPage(null);
    }
  };

  const resolveNdaPageForUser = (userData, pages = []) => {
    if (!pages.length) return null;
    if (userData?.ndaPages) {
      const userAssignedPage = pages.find((page) => page?.id === userData.ndaPages);
      if (userAssignedPage) return userAssignedPage;
    }
    return pages.find((page) => page?.isDefault) || null;
  };

  const validateUserAccess = async (user, config, portalId) => {
    if (!user) {
      dispatch(setCurrentUser(null));
      setError("Invalid user email or password");
      return null;
    }
    const permission = user?.permissions?.find((perm) => perm.portalId === portalId);
    if (!permission) {
      const isSuperAdminPer = user?.permissions?.find(
        (perm) => perm.role === UserRole.SUPER_ADMIN
      );
      if (isSuperAdminPer && user?.id === config?.createdBy?.id) {
        dispatch(setCurrentUser(user));
        setError("");
        return user;
      }
      dispatch(setCurrentUser(null));
      setError("User does not have access to this portal.");
      return null;
    }
    const { role, portalId: userPortalId } = permission;
    if ([UserRole.USER, UserRole.ADMIN].includes(role) && userPortalId !== portalId) {
      dispatch(setCurrentUser(null));
      setError("User does not have access to this portal.");
      return null;
    }
    dispatch(setCurrentUser(user));
    return user;
  };

  const fetchUser = async () => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await fetchWrapper(
        `/api/users?email=${encodedEmail}`, {}, "fetch-user"
      );
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return await validateUserAccess(data, config, params.portalid);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const handleCheckForTNC = async (e) => {
    e.preventDefault();
    const buttonType = e.nativeEvent.submitter.innerText.toLowerCase();
    if (buttonType === "login with okta") setIsLoadingOkta(true);
    setIsLoadingLogin(true);
    setError("");
    try {
      handleLogin(e);
    } catch (error) {
      console.error("Error handling TNC check:", error);
    }
  };

  useEffect(() => {
    dispatch(setPortal(params.portalid || "root"));
    dispatch(setContent(params?.portalid || "root"));
    fetchNdaPages();
  }, []);

  const handleLogin = async (e) => {
    try {
      const response = await fetchWrapper(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email, password, portalid: params.portalid || "root",
          }),
        },
        "default-login"
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      const userData = data.user;
      userData.isTNCAccepted = false;
      const selectedNdaPage = resolveNdaPageForUser(userData, ndaPages);
      setTncPage(selectedNdaPage);
      dispatch(setCurrentUser({ ...userData, portalId: params?.portalid }));
      setUserData({ ...userData, portalId: params?.portalid });
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      localStorage.setItem("accessToken", data.accessToken);

      // Load shared portal theme after successful login.
      await loadUserThemeAfterLogin(userData);

      if (userData && selectedNdaPage && !userData?.isTNCAccepted) {
        setIsTNCOpen(true);
      }
      if (!selectedNdaPage || (selectedNdaPage && userData?.isTNCAccepted)) {
        const pageToRedirect = await fetchPlugins();
        if (pageToRedirect?.pageTitle === "dashboard") {
          router.push("dashboard");
          toast.success("Redirecting to dashboard");
        } else {
          router.push("shared-docs");
          toast.success("Redirecting to Shared documents");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      hasCompletedLoginRef.current = false;
      applyGuestSlateTheme();
    } finally {
      setIsLoadingLogin(false);
      setIsLoadingOkta(false);
    }
  };

  const filterValue = (title) => {
    if (!content) return null;
    const contentItem = content?.portalContent.find((item) => item.title === title);
    const value = contentItem ? contentItem.value : null;
    if (!value) {
      const defaultItem = content?.defaultContent.find((item) => item.title === title);
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  const login = async () => {
    try {
      setIsLoadingOkta(true);
      const userData = await fetchUser();
      if (userData && tncPage && !userData?.isTNCAccepted) {
        setIsTNCOpen(true);
        return;
      }
      await signIn("okta");
      setIsLoadingOkta(false);
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsLoadingOkta(true);
    }
  };

  const getUserDetailsByEmail = async (email) => {
    try {
      const response = await fetchWrapper(
        `/api/users/loginByProvider`,
        { method: "POST", body: JSON.stringify({ email, portalid: params?.portalid }) },
        "fetch-user-by-email"
      );
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      dispatch(setCurrentUser(data.user));
      setUserData({ ...data.user, portalId: params?.portalid });
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      localStorage.setItem("accessToken", data.accessToken);
      await loadUserThemeAfterLogin(data.user);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      hasCompletedLoginRef.current = false;
      applyGuestSlateTheme();
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData) {
        await getUserDetailsByEmail(sessionData.user.email);
        const pageToRedirect = await fetchPlugins();
        if (pageToRedirect?.pageTitle === "dashboard") {
          router.push("dashboard");
        } else {
          router.push("shared-docs");
        }
      }
    };
    fetchSession();
  }, [router]);

  if (!config || !content) return <LoadingSpinner />;

  const iconComponent = (title) => {
    const iconName = filterValue(title);
    const Icon = LucideIcons[iconName];
    if (!Icon) return null;
    return <Icon className="w-7 h-7 text-gray-700" />;
  };

  const filterTheme = (title) => {
    const contentItem = content?.portalContent?.find((item) => item.title === title);
    let fontSize = fontSizes.find((item) => item.key === title);
    return contentItem
      ? contentItem.theme
      : {
        fontSize: fontSize?.size,
        color: "#000000",
        fontWeight: title === "Paragraph" ? 300 : 400,
      };
  };

  const LogoImage = () => {
    const baseSize = 100;
    const logoSize =
      (filterTheme("Logo")?.fontSize && logoSizeRatio[filterTheme("Logo")?.fontSize]) ||
      logoSizeRatio.medium;
    return (
      <div className="block min-w-16">
        <img
          src={config?.logo || "/logo.png"}
          alt={params.portalid}
          className="object-contain mr-2"
          style={{ height: `${baseSize * logoSize}px`, width: "auto", maxWidth: "100%" }}
        />
      </div>
    );
  };

  const CoverPhoto = () => {
    const fontSizeKey =
      content?.portalContent?.find((item) => item.title === "CoverPhoto")?.fontSize ||
      "medium";
    const { width, height } = coverPhotoRatio[fontSizeKey];
    const imageUrl = filterValue("CoverPhoto") || null;
    return (
      <div
        className="w-full h-auto sm:mx-auto mb-2"
        style={{ "--cover-width": `${width / 16}rem`, "--cover-height": `${height / 16}rem` }}
      >
        <div className="w-full h-auto sm:w-[var(--cover-width)] sm:h-[var(--cover-height)]">
          <img src={imageUrl} alt={params.portalid || "Default"} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        {/* Navbar — unchanged */}
        <nav className="flex justify-between items-center bg-primary py-2 px-2 border-b border-border">
          <div className="max-w-[1140px] w-full mx-auto">
            <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              {user?.company?.logo || config?.logo ? (
                <LogoImage />
              ) : (
                <div className="h-[90px] w-[70px] mr-2 bg-muted animate-pulse rounded" />
              )}
              <span
                className="text-3xl text-foreground font-lato overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
                style={{
                  fontSize: filterTheme("Header Text").fontSize,
                  fontWeight: filterTheme("Header Text").fontWeight,
                  color: "hsl(var(--primary-foreground))",
                  lineHeight: "1.2",
                  paddingInline: "2px",
                }}
              >
                {content?.portalContent === undefined ? (
                  <span className="w-[200px] h-[50px] bg-muted animate-pulse rounded block" />
                ) : filterValue("Header Text") &&
                  filterValue("Header Text") !== "Premier Customer Portal" ? (
                  filterValue("Header Text")
                ) : (
                  params?.portalid
                )}
              </span>
            </a>
          </div>
        </nav>

        <div className="max-w-[1140px] w-full mx-auto mt-10">
          <div className="flex-1 flex flex-col xl:flex-row">

            {/* Left Panel — content, unchanged layout */}
            <div className="w-full xl:w-4/5 flex flex-col justify-between bg-card">
              <div className="px-4">
                <h2
                  className="text-[45px] font-light leading-tight font-lato mb-4 text-foreground"
                >
                  {filterValue("Title")}
                </h2>

                <div className="h-px w-full bg-primary" />

                <p
                  className="mt-6 mb-3 text-[20px] leading-[1.5] font-light font-lato text-foreground"
                >
                  {filterValue("Paragraph")}
                </p>

                {filterValue("CoverPhoto") && (
                  <div className="w-full flex justify-center">
                    <div className="px-3 py-3 mb-2 relative flex justify-center">
                      <CoverPhoto />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Right Panel — Login Form with shadcn components */}
            <div className="w-full xl:w-2/5 flex items-center justify-center px-[15px] mb-12 mt-5 md:mt-0">
              <Card className="w-full max-w-xl rounded-md custom-shadow-sm border border-border bg-card">
                <CardContent className="p-4">
                  <form onSubmit={handleCheckForTNC}>
                    {/* ✅ Email Input */}
                    <div className="rounded-sm flex items-center border border-border group mb-3 mx-5 overflow-hidden">
                      <div className="bg-muted h-[42px] w-[42px] flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email"
                        className="border-0 rounded-none shadow-none focus-visible:ring-0 bg-background text-foreground placeholder:text-muted-foreground h-[42px] text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    {/* ✅ Password Input */}
                    <div className="rounded-sm flex items-center border border-border group mb-5 mx-5 overflow-hidden">
                      <div className="bg-muted h-[42px] w-[42px] flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <LockKeyhole className="h-4 w-4" />
                      </div>
                      <Input
                        type="password"
                        placeholder="Password"
                        className="border-0 rounded-none shadow-none focus-visible:ring-0 bg-background text-foreground placeholder:text-muted-foreground h-[42px] text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* ✅ Login Button */}
                    <div className="mx-5">
                      <Button
                        type="submit"
                        variant="default"
                        disabled={isLoadingLogin || isLoadingOkta}
                        className="w-full px-3 py-3 text-md"
                      >
                        {isLoadingLogin ? (
                          <LoaderSpinner
                            size={18}
                            className="text-primary-foreground"
                          />
                        ) : null}
                        Log In
                      </Button>
                    </div>

                    {/* Forgot Password */}
                    <div className="w-full flex justify-center items-center text-sm mt-2 text-foreground hover:text-link cursor-pointer mb-2">
                      <p onClick={() => router.push(`forgot-password`)}>
                        Forgot Password?
                      </p>
                    </div>

                    {/* Sign up */}
                    <div className="w-full flex justify-center items-center text-sm mt-2 text-foreground cursor-pointer">
                      <p
                        onClick={() =>
                          router.push(
                            params?.portalid
                              ? `/${params.portalid}/register`
                              : "/register"
                          )
                        }
                      >
                        Don't have an client account?{" "}
                        <span className="text-link hover:underline">Sign up</span>
                      </p>
                    </div>
                  </form>

                  {/* Error message */}
                  {error && (
                    <div className="mt-4 text-red-500 text-sm text-center">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ✅ Feature Cards with shadcn Card */}
          <div className="grid grid-cols-2 md:grid-cols-3 py-5">
            {[1, 2, 3].map((num) => (
              <Card
                key={num}
                className="mr-3.5 mb-5 rounded-sm border border-border bg-card hover:bg-accent hover:scale-105 transition-all ease-in-out duration-150"
              >
                <CardContent className="px-5 py-4">
                  <h5 className="flex items-center justify-start gap-3 mb-3">
                    <div className="text-foreground">
                      {iconComponent(`Card ${num} Icon`) || (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="28"
                          height="28"
                          fill="currentColor"
                        >
                          <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z" />
                        </svg>
                      )}
                    </div>

                    <div className="text-[24px] font-normal text-foreground font-lato leading-tight">
                      {filterValue(`Card ${num} Title`)}
                    </div>
                  </h5>

                  <p className="text-[15px] font-normal leading-7 text-muted-foreground font-lato">
                    {filterValue(`Card ${num} Content`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Footer config={config} filterValue={filterValue} />

      {isTNCOpen && (
        <TNCModal
          onClose={() => { setIsTNCOpen(false); setIsLoadingLogin(false); }}
          user={user}
          email={email}
          password={password}
          page={tncPage}
        />
      )}
    </div>
  );
}

export default Login;