"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { setUserData } from "@/app/lib/auth";
import Footer from "@/components/Footer";
import { fetchWrapper } from "../lib/fetchWrapper";
import { IdCard, LockKeyhole } from "lucide-react";
import Login from "@/components/Login";

const NavBarItem = ({ title }) => (
  <button className="px-6 py-2 text-text hover:text-text/80">{title}</button>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function LoginPage() {
  return <Login/>
  // const router = useRouter();
  // const params = useParams();
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState("");
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [content, setContent] = useState(null);

  // useEffect(() => {
  //   fetchContent();
  // }, []);

  // const fetchContent = async () => {
  //   const response = await fetchWrapper(
  //     `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
  //     { method: "GET" },
  //     "fetchContentManagement"
  //   );
  //   const data = await response.json();
  //   if (!response.ok) {
  //     throw new Error(data.error || "Failed to fetch Content Management");
  //   }
  //   setContent(data);
  // };

  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   setError("");

  //   console.log("Login attempt for:", email);

  //   try {
  //     const response = await fetchWrapper(
  //       "/api/auth/login",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ email, password, portalid: "default" }),
  //       },
  //       "default-login"
  //     );

  //     if (!response.ok) {
  //       const data = await response.json();
  //       throw new Error(data.error || "Login failed");
  //     }

  //     const data = await response.json();
  //     // Store user data using auth utility
  //     const userData = data.user;
  //     console.log("Storing user data:", userData);
  //     setUserData(userData);
  //     localStorage.setItem("portal", params.portalid);
  //     localStorage.setItem("accessToken", data.accessToken);
  //     console.log("Redirecting to home");
  //     router.push("home");
  //   } catch (err) {
  //     console.error("Login error:", err);
  //     setError(err.message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const filterValue = (title) => {
  //   const contentItem = content.portalContent.find(
  //     (item) => item.title === title
  //   );
  //   const value = contentItem ? contentItem.value : null;

  //   if (!value) {
  //     const defaultItem = content.defaultContent.find(
  //       (item) => item.title === title
  //     );
  //     return defaultItem ? defaultItem.value : null;
  //   }
  //   return value;
  // };

  // if (!content) return <LoadingSpinner />;

  // return (
  //   <div className="min-h-screen bg-background">
  //     <div className="max-w-[1140px] w-full py-[70px] mx-auto">
  //       <nav className="flex justify-between items-center bg-secondary py-2 px-[14px]">
  //         <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
  //           <img
  //             src="/default_logo_purple.png"
  //             alt="Wealthportal"
  //             className="h-[52px] mr-2"
  //           />
  //           <span className="text-3xl text-[#000000e6] mb-1 font-lato">
  //             Wealthportal
  //           </span>
  //         </a>
  //         <div className="hidden md:flex space-x-4">
  //           <NavBarItem title="Individual" />
  //           <NavBarItem title="Business" />
  //           <NavBarItem title="About Us" />
  //           <NavBarItem title="Contact" />
  //         </div>
  //         <button className="md:hidden text-text">
  //           <svg
  //             className="w-6 h-6"
  //             fill="none"
  //             stroke="currentColor"
  //             viewBox="0 0 24 24"
  //           >
  //             <path
  //               strokeLinecap="round"
  //               strokeLinejoin="round"
  //               strokeWidth={2}
  //               d="M4 6h16M4 12h16M4 18h16"
  //             />
  //           </svg>
  //         </button>
  //       </nav>

  //       <div className="flex-1 flex flex-col md:flex-row pt-12">
  //         <div className="w-full md:w-3/5 lg:w-4/5 flex flex-col justify-between bg-secondary">
  //           <div>
  //             <div className="px-[15px]">
  //               <h2 className="text-[56px] font-light leading-tight text-text font-lato">
  //                 {/* Ethree - Deep energy expertise */}
  //                 {/* {filterValue("Title")} */}
  //                 Wealth Management
  //               </h2>
  //               <p className="text-2xl text-[#808080] leading-tight mb-2 font-lato">
  //                 {/* E3’s greatest strengths lie in its team of consultants—the analysts, engineers, policy experts, economists, scientists, and others who have a deep understanding of contemporary analytical techniques, electricity industry economics, energy markets, and regulatory institutions. E3 partners are fully engaged and have a hand in every project, so clients benefit from their expertise in every engagement. */}
  //                 {/* {filterValue("Paragraph")} */}
  //                 Made simple.
  //               </p>
  //               <hr className="my-4" />

  //               <p className="font-light text-xl text-black leading-7 font-lato mb-3">
  //                 Financial decisions are complicated. But they don't have to
  //                 be. Whether you're planning for retirement or growing your
  //                 business, let us help you reach your financial goals.
  //               </p>
  //             </div>

  //             {/* Feature Cards */}
  //             {/* <div className="grid md:grid-cols-3 gap-6 mt-20">
  //               <div className="bg-background-gray p-6 rounded-lg shadow-sm">
  //                 <svg
  //                   className="w-8 h-8 text-text"
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"
  //                   />
  //                 </svg> */}
  //             {/* <h3 className="text-lg font-bold mt-4 text-text"> */}
  //             {/* Enterprise Data Center */}
  //             {/* {filterValue("Card1 Title")} */}
  //             {/* </h3> */}
  //             {/* <p className="text-text/60 mt-2"> */}
  //             {/* Your data warehouse for portfolio analytics and risk
  //                 management. */}
  //             {/* {filterValue("Card1 Content")} */}
  //             {/* </p>
  //               </div>
  //               <div className="bg-background-gray p-6 rounded-lg shadow-sm">
  //                 <svg
  //                   className="w-8 h-8 text-text"
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
  //                   />
  //                 </svg>
  //                 <h3 className="text-lg font-bold mt-4 text-text"> */}
  //             {/* Experience Enhancement */}
  //             {/* {filterValue("Card2 Title")} */}
  //             {/* </h3>
  //                 <p className="text-text/60 mt-2"> */}
  //             {/* Elevate your business experience with our innovative
  //                 solutions. */}
  //             {/* {filterValue("Card2 Content")} */}
  //             {/* </p>
  //               </div>
  //               <div className="bg-background-gray p-6 rounded-lg shadow-sm">
  //                 <svg
  //                   className="w-8 h-8 text-text"
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
  //                   />
  //                 </svg>
  //                 <h3 className="text-lg font-bold mt-4 text-text"> */}
  //             {/* Enterprise Execution */}
  //             {/* {filterValue("Card3 Title")}
  //                 </h3> */}
  //             {/* <p className="text-text/60 mt-2"> */}
  //             {/* Execute your strategies with precision and scale. */}
  //             {/* {filterValue("Card3 Content")} */}
  //             {/* </p>
  //               </div> */}
  //             {/* </div> */}
  //           </div>
  //         </div>

  //         {/* Right Panel - Login Form */}
  //         <div className="w-full md:w-2/5 lg:w-2/5 flex items-center justify-center px-[15px] mb-12">
  //           <div className="w-full bg-secondary rounded-md p-4 custom-shadow-sm border border-solid border-[0,0,0,.125]">
  //             {/* <div className="text-center mb-8">
  //               <img
  //                 src="/logo2.png"
  //                 alt="Wealthportal"
  //                 className="h-12 w-auto mx-auto"
  //               />
  //               <p className="text-text/60 mt-2">
  //                 Log in here to access your account
  //               </p>
  //             </div> */}

  //             <form onSubmit={handleLogin}>
  //               <div className="">
  //                 <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-3 mx-5">
  //                   <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
  //                     <IdCard className="h-4 w-4" />
  //                   </div>
  //                   <input
  //                     type="email"
  //                     placeholder="Email"
  //                     className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
  //                     value={email}
  //                     onChange={(e) => setEmail(e.target.value)}
  //                     required
  //                   />
  //                 </div>
  //                 <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-5 mx-5">
  //                   <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
  //                     <LockKeyhole className="h-4 w-4" />
  //                   </div>
  //                   <input
  //                     type="password"
  //                     placeholder="Password"
  //                     className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
  //                     value={password}
  //                     onChange={(e) => setPassword(e.target.value)}
  //                     required
  //                   />
  //                 </div>
  //                 <button
  //                   type="submit"
  //                   className="w-full text-black py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group"
  //                   disabled={isLoading}
  //                 >
  //                   {isLoading ? (
  //                     <div className="w-6 h-6 border-2 border-[#808080] border-t-transparent rounded-full animate-spin mx-auto " />
  //                   ) : (
  //                     <span className="group-hover:scale-105 transition-all ease-in-out duration-200">
  //                       Log In
  //                     </span>
  //                   )}
  //                 </button>
  //               </div>
  //             </form>

  //             {error && (
  //               <div className="mt-4 text-red-500 text-sm text-center">
  //                 {error}
  //               </div>
  //             )}

  //             {/* <div className="text-center mt-4">
  //             <button className="text-text/40 hover:text-text/60">
  //               Forgot password?
  //             </button>
  //           </div> */}
  //           </div>
  //         </div>
  //       </div>

  //       {/* cards */}
  //       <div>
  //         <div className="grid grid-cols-1 md:grid-cols-3 py-12">
  //           <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
  //             <div className="px-5 py-4">
  //               <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
  //                 <div>
  //                   <svg
  //                     xmlns="http://www.w3.org/2000/svg"
  //                     viewBox="0 0 24 24"
  //                     width="28"
  //                     height="28"
  //                     fill="currentColor"
  //                   >
  //                     <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
  //                   </svg>
  //                 </div>
  //                 Advisory on demand
  //               </h5>
  //               <p className="text-[#6c757d] text-sm font-normal leading-6">
  //                 Our experts are always there to break it down.
  //               </p>
  //             </div>
  //           </div>
  //           <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
  //             <div className="px-5 py-4">
  //               <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
  //                 <div>
  //                   <svg
  //                     xmlns="http://www.w3.org/2000/svg"
  //                     viewBox="0 0 24 24"
  //                     width="28"
  //                     height="28"
  //                     fill="currentColor"
  //                   >
  //                     <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
  //                   </svg>
  //                 </div>
  //                 Sales and Trading
  //               </h5>
  //               <p className="text-[#6c757d] text-sm font-normal leading-6">
  //                 Invest and trade with research-backed advice.
  //               </p>
  //             </div>
  //           </div>
  //           <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
  //             <div className="px-5 py-4">
  //               <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
  //                 <div>
  //                   <svg
  //                     xmlns="http://www.w3.org/2000/svg"
  //                     viewBox="0 0 24 24"
  //                     width="28"
  //                     height="28"
  //                     fill="currentColor"
  //                   >
  //                     <path d="M10.9999 12L3.92886 19.0711L2.51465 17.6569L8.1715 12L2.51465 6.34317L3.92886 4.92896L10.9999 12ZM10.9999 19H20.9999V21H10.9999V19Z"></path>
  //                   </svg>
  //                 </div>
  //                 Built with an Edge
  //               </h5>
  //               <p className="text-[#6c757d] text-sm font-normal leading-6 font-lato">
  //                 Optimize your investments with cutting-edge software
  //               </p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //     <Footer filterValue={filterValue} />
  //   </div>
  // );

}
