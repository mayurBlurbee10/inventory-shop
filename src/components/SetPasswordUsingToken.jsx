"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import Button from "./Common/Elements/Button";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SetPasswordUsingToken() {
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
  const token = params?.token;

  const handleSetPassword = async (e, isFrom) => {
    e.preventDefault();
    setError("");
    if(isFrom === 'standardUser'){
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      } else if (!password) {
        setError("Please enter the password");
        return;
      }
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
        setTimeout(() => router.push(`/${params.portalid ?? 'admin'}/login`), 3000);
      } else {
        setError(data.error || "Failed to set password.");
        throw new Error(data.error || "Failed to set password.")
      }
      toast.success("Password set successfully")
    } catch (err) {
      toast.error(err.message)
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      const checkToken = async () => {
        try {
          setIsTokenExpired(false);
          const response = await fetchWrapper(
            `/api/setPassword?token=${token}`,
            { method: "GET" }
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to validate Link");
          }
        } catch (error) {
          setIsTokenExpired(true);
        } finally {
          setTokenLoading(false);
        }
      };

      checkToken();
    }
  }, [router]);

  if (tokenLoading) return <LoadingSpinner />;

  if (isTokenExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium text-red-600">
          Link is invalid or expired.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-bold text-center text-gray-800">
         Please create a password to sign into the "{params.portalid} Portal"
        </h2>
        <hr className="my-3 border-gray-200" />
        <div className=" text-center mb-4">
          {/* Welcome to the {params.portalid} Portal! Please create a password to sign in. Once completed, you will be redirected  to the {params.portalid} Portal home page. Use your email address and password to login! */}
          <p className="text-sm text-gray-600 font-semibold py-1">Welcome to the {params.portalid} Portal!</p>
          <p className="text-sm text-gray-600">Please create a password to sign in. Once completed, you'll be directed to the {params.portalid} Portal homepage. Use your email address and newly created password to log in.</p>

        </div>
        <form className="text-gray-700" onSubmit={(e)=>{handleSetPassword(e,'standardUser')}}>
          {success ? (
            <p className="text-green-500 text-center mb-4">
              Password set successfully! Redirecting to login...
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute top-[58%] right-4 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye /> : <EyeOff />}
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
              {/* <button
                type="submit"
                className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "Setting..." : "Set Password"}
              </button> */}
                <div className="w-full flex justify-center items-center">
                  <Button
                    buttonType="submit"
                    disabled={loading}
                    isLoading={loading}
                    type="Primary"
                    label="Set Password"
                  />
                </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}