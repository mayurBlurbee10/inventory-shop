"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "@/store/services/userService";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted/30">
    <LoaderSpinner size={24} className="text-secondary-foreground" />
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
  const [userID, setUserID] = useState(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const token = params?.token;
  const{data:user} = useSelector((state) => state.user);
  const searchParams = useSearchParams();
  const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/MStrategy_Group.png`;
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
        const updatedUserData = {
          ...user,
          credential: {
            userID: userID,
            password: password,
          },
        };
        console.log("updatedUserData:", updatedUserData);
        dispatch(setCurrentUser(updatedUserData));
        const isNew = searchParams.get('isNew');
        if (isNew === 'true') {
          router.push(`/${params.portalid ?? 'admin'}/credential?isNew=true`);
        }else{
          router.push(`/${params.portalid ?? 'admin'}/credential`);
        }
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
          console.log("data:", data);
          setUserID(data?.data?.email)
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
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader className="space-y-4">
          <div className="w-full flex justify-center">
            <div
              style={{
                width: "100px",
                height: "80px",
                backgroundImage: `url(${logoURL})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          </div>
          <h2 className="text-center text-xl font-bold text-destructive">
            Link is invalid or expired
          </h2>
          <Separator />
          </CardHeader>
          <CardContent className="w-full p-6 pt-0">
            <div className="flex flex-col items-center justify-center">
              <h2 className="mb-2 text-center font-semibold text-foreground">
                This link may have expired or already been used.
              </h2>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Please contact us at{" "}
                <a href="mailto:info@mstrategygroup.com" className="text-primary hover:underline">
                  info@mstrategygroup.com
                </a>{" "}
                to request a new link.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border bg-muted/30 py-4">
            <p className="text-sm text-muted-foreground">M Strategy Group 2026. All rights reserved.</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  console.log("userID:",userID);


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md border-border bg-card shadow-sm">
        <CardHeader className="space-y-4">
        <div className="w-full flex justify-center">
          <div
            style={{
              width: "100px",
              height: "80px",
              backgroundImage: `url(${logoURL})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        </div>
          <h2 className="px-6 text-center text-xl font-bold text-foreground">
            Please create a password to log into Universal Portal Wealth Demo
          </h2>
        <Separator />
        </CardHeader>
        <CardContent className="w-full p-6 pt-0">
        <form className="text-foreground" onSubmit={(e)=>{handleSetPassword(e,'standardUser')}}>
            <>
                <div className="mb-4 text-center">
                  <p className="text-sm text-muted-foreground">Please create a password to sign in. Once completed, you'll be directed to the Universal Portal Wealth Demo homepage.</p>
                </div>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-medium text-secondary-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pr-12 !bg-background text-secondary-foreground"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  className="!bg-background text-secondary-foreground"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription className="text-center text-sm">{error}</AlertDescription>
                </Alert>
              )}
                <div className="w-full flex justify-center items-center">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-3"
                  >
                    {loading ? (
                      <>
                        <LoaderSpinner size={18} className="text-primary-foreground" />
                        Set Password
                      </>
                    ) : (
                      "Set Password"
                    )}
                  </Button>
                </div>
            </>
        </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border bg-muted/30 py-4">
          <p className="text-sm text-muted-foreground">M Strategy Group 2026. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}