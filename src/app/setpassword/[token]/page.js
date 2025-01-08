"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const params = useParams();
  console.log('params', params)
  const token = params.token
  // let params = new URLSearchParams(window.location.search);
  // const searchParams = useSearchParams();
  // const token ='d746c62863eeb42347cd16b2cf83ed5f369e12b8d979468688dd6c6d041500c3' //searchParams.get('token');

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetchWrapper("/api/setPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      }, 'setPassword');

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Failed to set password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(token) {
      const checkToken = async() => {
        try { 
          setIsTokenExpired(false);
          const response = await fetchWrapper(`/api/setPassword?token=${token}`, {method: 'GET'}, 'validateLink')
          if (!response.ok) throw new Error('Failed to validate the link.');
        } catch (error) {
          setIsTokenExpired(true);
          console.error('Error refreshing token:', error);
        } finally {
          setTokenLoading(false);
        }
      };
      checkToken();
    }
  }, [router]);

  if (tokenLoading) return <LoadingSpinner />;

  if(isTokenExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium text-red-600">
         Link is invalid or expired.
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Set Password
        </h2>
        <form className="mt-6 text-gray-700" onSubmit={handleSetPassword}>
          {success ? (
            <p className="text-green-500 text-center mb-4">
              Password Set successfully! Redirecting to login...
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute top-[58%] right-4 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye />
                    ) : (
                      <EyeOff />
                    )}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-center text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "Setting..." : "Set Password"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

