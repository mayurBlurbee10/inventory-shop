"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { setUserData } from "@/app/lib/auth";
import Footer from "@/components/Footer";
import { fetchWrapper } from "../lib/fetchWrapper";
import { toast } from "react-toastify";

const NavBarItem = ({ title }) => (
  <button className="px-6 py-2 text-text hover:text-text/80">{title}</button>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const response = await fetchWrapper(
      `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
      { method: "GET" },
      "fetchContentManagement"
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch Content Management");
    }
    setContent(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Login attempt for:", email);

    try {
      const response = await fetchWrapper(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, portalid: "default" }),
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
      console.log("Storing user data:", userData);
      setUserData(userData);
      localStorage.setItem('portal', 'defaultPortal');
      localStorage.setItem('accessToken', data.accessToken);
      console.log('Redirecting to home');
      router.push('home');
      toast.success("Redirecting o home")
    } catch (err) {
      toast.error(err.message)
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterValue = (title) => {
    const contentItem = content.portalContent.find((item) => item.title === title);
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content.defaultContent.find((item) => item.title === title);
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  if (!content) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="px-12 py-4 flex justify-between items-center border-b bg-secondary h-24">
        <img src="/logo.png" alt="Wealthportal" className="h-24 pt-2" />
        <div className="hidden md:flex space-x-4">
          <NavBarItem title="Individual" />
          <NavBarItem title="Business" />
          <NavBarItem title="About Us" />
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
      </nav>

      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-3/5 p-16 flex flex-col justify-between bg-secondary">
          <div>
            <h2 className="text-5xl font-bold leading-tight mt-12 text-text">
              {/* Ethree - Deep energy expertise */}
              {filterValue("Title")}
            </h2>
            <p className="text-lg text-text/70 mt-4 leading-relaxed">
              {/* E3’s greatest strengths lie in its team of consultants—the analysts, engineers, policy experts, economists, scientists, and others who have a deep understanding of contemporary analytical techniques, electricity industry economics, energy markets, and regulatory institutions. E3 partners are fully engaged and have a hand in every project, so clients benefit from their expertise in every engagement. */}
              {filterValue("Paragraph")}
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-20">
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
                </svg>
                <h3 className="text-lg font-bold mt-4 text-text">
                  {/* Enterprise Data Center */}
                  {filterValue("Card1 Title")}
                </h3>
                <p className="text-text/60 mt-2">
                  {/* Your data warehouse for portfolio analytics and risk
                  management. */}
                  {filterValue("Card1 Content")}
                </p>
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
                <h3 className="text-lg font-bold mt-4 text-text">
                  {/* Experience Enhancement */}
                  {filterValue("Card2 Title")}
                </h3>
                <p className="text-text/60 mt-2">
                  {/* Elevate your business experience with our innovative
                  solutions. */}
                  {filterValue("Card2 Content")}
                </p>
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
                <h3 className="text-lg font-bold mt-4 text-text">
                  {/* Enterprise Execution */}
                  {filterValue("Card3 Title")}
                </h3>
                <p className="text-text/60 mt-2">
                  {/* Execute your strategies with precision and scale. */}
                  {filterValue("Card3 Content")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full md:w-2/5 bg-background-gray p-12 flex items-center justify-center">
          <div className="w-full max-w-md bg-secondary rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <img
                src="/logo2.png"
                alt="Wealthportal"
                className="h-12 w-auto mx-auto"
              />
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
                  className="w-full bg-[#005071] text-secondary py-3 rounded hover:bg-[#1A4C8A]/80 transition-colors"
                  disabled={isLoading}
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

            {/* <div className="text-center mt-4">
              <button className="text-text/40 hover:text-text/60">
                Forgot password?
              </button>
            </div> */}
          </div>
        </div>
      </div>
      <Footer filterValue={filterValue} />
    </div>
  );
}
