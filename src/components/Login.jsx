"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { setUserData } from "@/app/lib/auth";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";

import { IdCard, LockKeyhole, UserRound, SquarePen, User, Building } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getSession, signIn } from "next-auth/react";
import { getUserData } from "@/lib/auth";
import TNCModal from "./TNCModal";
import { PluginType, UserRole } from "@/config/constants";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { setCurrentUser } from "@/store/services/userService";
import Button from "./Common/Elements/Button";
import { setPages } from "@/store/services/pageService";
import * as LucideIcons from "lucide-react";
import { coverPhotoRatio, fontSizes, logoSizeRatio } from "@/app/lib/data/font_size";
import { setContent } from "@/store/services/contentService";

const NavBarItem = ({ title }) => (
  <button className="px-1 py-2 text-gray-500 ">
    {title}
  </button>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function Login() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [content, setContent] = useState(null);
  // const [config, setConfig] = useState(null);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingOkta, setIsLoadingOkta] = useState(false);
  const [session, setSession] = useState(null);
  // const [user, setUser] = useState(null);
  const [isTNCOpen, setIsTNCOpen] = useState(false);
  const [tncPage, setTncPage] = useState(null);

  const { data: config } = useSelector((state) => state.portal);
  const { data: content } = useSelector((state) => state.content);
  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch()

  const fetchPage = async () => {
    try {
      setIsLoading(true);
      const encodedPage = encodeURIComponent(`t&c`);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid}&type=${encodedPage}`,
        {},
        "fetch-page"
      );
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (!data || (data && data?.length === 0)) {
        setTncPage(null);
        return;
      }
      if (data?.data.length > 0 && data?.data[0].pages.length > 0) {
        setTncPage(data?.data[0].pages[0]);
      } else {
        setTncPage(null);
      }
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUserAccess = async (user, config, portalId) => {
    if (!user) {
      // setUser(null);
      dispatch(setCurrentUser(null))
      setError("Invalid user email or password");
      return null;
    }

    const permission = user?.permissions?.find(
      (perm) => perm.portalId === portalId
    );

    if (!permission) {
      // setUser(null);
      const isSuperAdminPer = user?.permissions?.find(
        (perm) => perm.role === UserRole.SUPER_ADMIN
      );

      if (isSuperAdminPer) {
        if (user?.id === config?.createdBy?.id) {
          dispatch(setCurrentUser(user));
          setError("");
          return user;
        }
      }
      dispatch(setCurrentUser(null))
      setError("User does not have access to this portal.");
      return null;
    }

    const { role, portalId: userPortalId } = permission;

    if (
      [UserRole.USER, UserRole.ADMIN].includes(role) &&
      userPortalId !== portalId
    ) {
      // setUser(null);
      dispatch(setCurrentUser(null))
      setError("User does not have access to this portal.");
      return null;
    }

    // setUser(user);
    dispatch(setCurrentUser(user))
    return user;
  };

  const fetchUser = async () => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await fetchWrapper(
        `/api/users?email=${encodedEmail}`,
        {},
        "fetch-user"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      const validatedUser = await validateUserAccess(
        data,
        config,
        params.portalid
      );
      return validatedUser;
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const handleCheckForTNC = async (e) => {
    e.preventDefault();
    const buttonType = e.nativeEvent.submitter.innerText.toLowerCase();

    if (buttonType === "login with okta") {
      setIsLoadingOkta(true);
    }
    setIsLoadingLogin(true);
    setError("");
    try {
        handleLogin(e);
    } catch (error) {
      console.error("Error handling TNC check:", error);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      dispatch(setPortal(params.portalid || "default"));
    };
    const fetchContent = async () => {
      dispatch(setContent(params?.portalid ?? "default"));
    };
    fetchConfig();
    fetchContent();
    fetchPage();
  }, []);

  const fetchContent = async () => {
    // const response = await fetchWrapper(
    //   `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
    //   { method: "GET" },
    //   "fetchContentManagement"
    // );
    // const data = await response.json();
    // if (!response.ok) {
    //   throw new Error(data.error || "Failed to fetch Content Management");
    // }
    dispatch(setContent(params?.portalid ?? "default"));
  };

  const handleLogin = async (e) => {
    console.log("Login attempt for:", email);

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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store user data using auth utility
      const userData = data.user;
      if (userData && tncPage && !userData?.isTNCAccepted) {
        setIsTNCOpen(true);
      }
      console.log("Storing user data:", userData);
      // setUserData(userData);
      dispatch(setCurrentUser(userData))
      // localStorage.setItem("portal", params?.portalid);
      localStorage.setItem("accessToken", data.accessToken);

      if (!tncPage || (tncPage && userData?.isTNCAccepted)) {
        const targetRoute =
          userData?.role === UserRole.MODERATOR
            ? "advisor/dashboard"
            : "dashboard";
        router.push(targetRoute);
        toast.success("Redirecting to dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoadingLogin(false);
      setIsLoadingOkta(false);
    }
  };

  const filterValue = (title) => {
    if (!content) return null;
    const contentItem = content && content?.portalContent.find(
      (item) => item.title === title
    );
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content && content?.defaultContent.find(
        (item) => item.title === title
      );
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
      setIsLoadingOkta(false)
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsLoadingOkta(true);
    }
  };
  const getUserDetailsByEmail = async (email) => {
    try {
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params?.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetchUserByEmail");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      // setUserData(userData);
      dispatch(setCurrentUser(userData))
      // localStorage.setItem("portal", params?.portalid || "default");
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
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
      // const userData = getUserData();
      // if (!userData) {
      //   router.push("login");
      //   return;
      // }

      // setUser(userData);
    });
  }, [router]);

  if (!config || !content) return <LoadingSpinner />;

  const iconComponent = (title) => {
      const iconName = filterValue(title);
      const Icon = LucideIcons[iconName];
  
      if (!Icon) return null;
  
      return <Icon className="w-7 h-7 text-gray-700" />;
    }
  
  const LogoImage = () => {
    const baseSize = 100; // Set a reasonable base size (in pixels)

    const logoSize =
      (filterTheme("Logo")?.fontSize &&
        logoSizeRatio[
          filterTheme("Logo")?.fontSize
        ]) ||
      logoSizeRatio.medium;
    return (
      <div className="block min-w-16">
        <img
          src={config?.logo || "/logo.png"}
          alt={params.portalid}
          className="object-contain mr-2"
            style={{
              height: `${baseSize * logoSize}px`, 
              width: "auto",                      
              maxWidth: "100%",                  
          }}
        />
      </div>
    );
  };

  const CoverPhoto = () => {
    const fontSizeKey =
      content?.portalContent?.find((item) => item.title === "CoverPhoto")
        ?.fontSize || "medium";

    const sizeInfo = coverPhotoRatio[fontSizeKey];
    const { width, height } = sizeInfo;

    const imageUrl = filterValue("CoverPhoto") || null;

    return (
      <div
        className="w-full h-auto sm:mx-auto mb-2"
        style={{
          '--cover-width': `${width / 16}rem`,
          '--cover-height': `${height / 16}rem`,
        }}
      >
        <div
          className="w-full h-auto sm:w-[var(--cover-width)] sm:h-[var(--cover-height)]"
        >
          <img
            src={imageUrl}
            alt={params.portalid || "Default"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  };

   const filterTheme = (title) => {
      const contentItem = content && content?.portalContent?.find((item) => item.title === title);
      let fontSize = fontSizes.find((item) => item.key === title)
      let theme = contentItem ? contentItem.theme : {
        fontSize: fontSize?.size,
        color: "#000000e6",
        fontWeight: title === 'Paragraph' ? 300 : 400,
      };
      return theme;
    };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
      <nav className="flex justify-between items-center bg-secondary py-2 px-2 border-b" style={{ backgroundColor: config?.accentColor}}>
          {/* <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
            <img
              // src="/default_logo_purple.png"
              src={config?.logo || "/logo.png"}
              alt="Wealthportal"
              className="h-[52px] mr-2"
            />
            <span className="text-3xl text-[#000000e6] mb-1 font-lato">
              {filterValue("Header Text")}
            </span>
          </a> */}
          <div className="max-w-[1140px] w-full mx-auto">
            <a className=" flex items-center py-1 gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              {user?.company?.logo || config?.logo ? (
                // <img
                //   src={config?.logo || "/logo.png"}
                //   alt={params.portalid}
                //   className="h-[52px] mr-2"
                // />
                <LogoImage />
              ) : (
                // Skeleton for logo
                <div className="h-[52px] w-[52px] mr-2 bg-gray-300 animate-pulse rounded" />
              )}

            <span
              className="text-3xl text-[#000000e6] font-lato overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
              style={{
                fontSize: filterTheme("Header Text").fontSize,
                fontWeight: filterTheme("Header Text").fontWeight,
                lineHeight: "1.2",
                paddingBottom: "2px",
                paddingInline: "2px"
              }}
            >
              {content?.portalContent === undefined ? (
                <span className="w-[200px] h-[50px] bg-gray-200 animate-pulse rounded block"></span>
              ) : filterValue("Header Text") &&
                filterValue("Header Text") !== "Premier Customer Portal" ? (
                filterValue("Header Text")
              ) : (
                params?.portalid
              )}
            </span>
            </a>
          </div>

          {/* <div className="hidden md:flex items-center gap-x-6">
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <User className="w-5 h-5 text-gray-500 pb-[2px]" />
              <NavBarItem title="Individual" />
            </div>
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <Building className="w-5 h-5 text-gray-500 pb-[2px]" />
              <NavBarItem title="Business" />
            </div>
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <NavBarItem title="About Us" />
            </div>
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <NavBarItem title="Contact" />
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
          </div> */}
        </nav>
      <div className="max-w-[1140px] w-full mx-auto mt-10">
        <div className="flex-1 flex flex-col xl:flex-row">
          <div className="w-full md:w-full lg:w-full xl:w-4/5 flex flex-col justify-between bg-secondary">
            <div>
              <div className="px-[15px]">
                <h2 
                  className="font-light leading-tight text-text font-lato mb-2" style={{
                    fontSize: filterTheme("Title").fontSize,
                    fontWeight: filterTheme("Title").fontWeight
                  }}>
                  {/* Ethree - Deep energy expertise */}
                  {filterValue("Title")}
                  {/* Wealth Management */}
                </h2>
                {/* <p className="text-2xl text-[#808080] leading-tight mb-2 font-lato">
                  {filterValue("Paragraph")}
                </p> */}
                {/* GREEN LINE */}
                <div
                  style={{ backgroundColor: config?.primaryColor }}
                  className="p-[1px] w-full"
                ></div>

                <p 
                  className="font-light text-black leading-7 font-lato mb-3 mt-5"
                  style={{
                    fontSize: filterTheme("Paragraph").fontSize,
                    fontWeight: filterTheme("Paragraph").fontWeight
                  }}>
                  {/* Financial decisions are complicated. But they don't have to
                  be. Whether you're planning for retirement or growing your
                  business, let us help you reach your financial goals. */}
                  {filterValue("Paragraph")}
                </p>
                  <div className='w-full flex justify-center'>
                    {filterValue("CoverPhoto") && (
                      <div className="pl-3 pr-3 py-3 mb-2 relative flex justify-center">
                        <CoverPhoto />
                      </div>
                    )}
                  </div>
              </div>

              {/* Feature Cards */}
              {/* <div className="grid md:grid-cols-3 gap-6 mt-20">
                <div className="bg-background-gray p-6 rounded-lg shadow-sm">
                  <svg
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
              {/* <h3 className="text-lg font-bold mt-4 text-text"> */}
              {/* Enterprise Data Center */}
              {/* {filterValue("Card1 Title")} */}
              {/* </h3> */}
              {/* <p className="text-text/60 mt-2"> */}
              {/* Your data warehouse for portfolio analytics and risk
                  management. */}
              {/* {filterValue("Card1 Content")} */}
              {/* </p>
                </div>
                <div className="bg-background-gray p-6 rounded-lg shadow-sm">
                  <svg
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
                  </svg>
                  <h3 className="text-lg font-bold mt-4 text-text"> */}
              {/* Experience Enhancement */}
              {/* {filterValue("Card2 Title")} */}
              {/* </h3>
                  <p className="text-text/60 mt-2"> */}
              {/* Elevate your business experience with our innovative
                  solutions. */}
              {/* {filterValue("Card2 Content")} */}
              {/* </p>
                </div>
                <div className="bg-background-gray p-6 rounded-lg shadow-sm">
                  <svg
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
                  </svg>
                  <h3 className="text-lg font-bold mt-4 text-text"> */}
              {/* Enterprise Execution */}
              {/* {filterValue("Card3 Title")}
                  </h3> */}
              {/* <p className="text-text/60 mt-2"> */}
              {/* Execute your strategies with precision and scale. */}
              {/* {filterValue("Card3 Content")} */}
              {/* </p>
                </div> */}
              {/* </div> */}
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full md:w-full lg:w-full xl:w-2/5 flex items-center justify-center px-[15px] mb-12 mt-5 md:mt-0">
            <div className="w-full max-w-xl bg-secondary rounded-md p-4 custom-shadow-sm border border-solid border-[0,0,0,.125]">
              {/* <div className="text-center mb-8">
                <img
                  src="/logo2.png"
                  alt="Wealthportal"
                  className="h-12 w-auto mx-auto"
                />
                <p className="text-text/60 mt-2">
                  Log in here to access your account
                </p>
              </div> */}

              <form onSubmit={handleCheckForTNC}>
                <div className="">
                  <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-3 mx-5">
                    <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-5 mx-5">
                    <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
                      <LockKeyhole className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {/* <button
                    type="submit"
                    className="w-full text-black py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group "
                    disabled={isLoadingLogin || isLoadingOkta}
                    style={{ backgroundColor: config?.secondaryColor }}
                  >
                    {isLoadingLogin ? (
                      <div className="w-6 h-6 border-2 border-[#808080] border-t-transparent rounded-full animate-spin mx-auto " />
                    ) : (
                      <span className="group-hover:scale-105 transition-all ease-in-out duration-200 text-white">
                        Log In
                      </span>
                    )}
                  </button> */}
                  <Button
                    buttonType="submit"
                    disabled={isLoadingLogin || isLoadingOkta}
                    isLoading={isLoadingLogin}
                    type="Login"
                    label="Log In"
                  />
                  <div className="w-full flex justify-center items-center text-sm mt-2 text-black hover:text-blue-700  cursor-pointer">
                    <p onClick={() => router.push(`forgot-password`)}>
                      Forgot Password?
                    </p>
                  </div>
                  {/* <button
                    type="button"
                    className="w-full text-black py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group mt-1 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {}}
                    // onClick={login}
                    disabled={isLoadingLogin || isLoadingOkta}
                  // style={{ backgroundColor: config?.secondaryColor }}
                  >
                    {isLoadingOkta ? (
                      <div className="flex justify-center items-center gap-2 ">
                        <span>Login with Okta</span>
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <span className="group-hover:scale-105 transition-all ease-in-out duration-200">
                        Login with Okta
                      </span>
                    )}
                  </button> */}
                </div>
              </form>

              {error && (
                <div className="mt-4 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {/* <div className="text-center mt-4">
              <button className="text-text/40 hover:text-text/60">
                Forgot password?
              </button>
            </div> */}
            </div>
          </div>
        </div>

        {/* cards */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-5">
            <div className="mx-3.5 mb-5 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                  <div>
                    {iconComponent("Card 1 Icon") || (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="28"
                        height="28"
                        fill="currentColor"
                      >
                        <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                      </svg>
                    )}
                  </div>
                  <div 
                    style={{
                      fontSize: filterTheme("Card 1 Title").fontSize,
                      fontWeight: filterTheme("Card 1 Title").fontWeight
                    }}>{filterValue("Card 1 Title")}</div>
                </h5>
                <p className="text-[#6c757d] font-normal leading-6" style={{
                      fontSize: filterTheme("Card 1 Content").fontSize,
                      fontWeight: filterTheme("Card 1 Content").fontWeight
                    }}>
                  {filterValue("Card 1 Content")}
                </p>
              </div>
            </div>
            <div className="mx-3.5 mb-5 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                  <div>
                    {iconComponent("Card 2 Icon") || (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="28"
                        height="28"
                        fill="currentColor"
                      >
                        <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                      </svg>
                    )}
                  </div>
                  <div 
                    style={{
                      fontSize: filterTheme("Card 2 Title").fontSize,
                      fontWeight: filterTheme("Card 2 Title").fontWeight
                    }}>{filterValue("Card 2 Title")}</div>
                </h5>
                <p className="text-[#6c757d] font-normal leading-6" style={{
                      fontSize: filterTheme("Card 2 Content").fontSize,
                      fontWeight: filterTheme("Card 2 Content").fontWeight
                    }}>
                  {filterValue("Card 2 Content")}
                </p>
              </div>
            </div>
            <div className="mx-3.5 mb-5 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                  <div>
                    {iconComponent("Card 3 Icon") || (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="28"
                        height="28"
                        fill="currentColor"
                      >
                        <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                      </svg>
                    )}
                  </div>
                  <div 
                    style={{
                      fontSize: filterTheme("Card 3 Title").fontSize,
                      fontWeight: filterTheme("Card 3 Title").fontWeight
                    }}>{filterValue("Card 3 Title")}</div>
                </h5>
                <p className="text-[#6c757d] font-normal leading-6 font-lato"   style={{
                      fontSize: filterTheme("Card 3 Content").fontSize,
                      fontWeight: filterTheme("Card 3 Content").fontWeight
                    }}>
                  {filterValue("Card 3 Content")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div>
        <Footer config={config} filterValue={filterValue} />
      </div>
      {isTNCOpen && (
        <TNCModal
          onClose={() => {
            setIsTNCOpen(false);
            setIsLoadingLogin(false)
          }}
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
