import { X, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import AddUserModal from "./Settings/AddUserModal";

function AccountInfo({ isOpen, onClose, config, user, userIsAdmin }) {
  const params = useParams();
  const router = useRouter();
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [editProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    } else if (!password) {
      setError("Please enter the password");
      return;
    }

    try {
      setLoading(true);
      const response = await fetchWrapper(
        "/api/users/updatePassword",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalid: params.portalid || "root",
            email: user?.email,
            newPassword: password,
            oldPassword: oldPassword,
          }),
        },
        "update-password"
      );

      const data = await response.json();
      if (response.ok) {
        await fetchWrapper('/api/auth/logout', { method: 'POST' }, "logout");
        setSuccess(true);
        setTimeout(() => router.push(`/${params.portalid}/login`), 2000);
      } else {
        setError(data.error || "Failed to set password.");
        throw new Error(data.error || "Failed to set password.");
      }
      toast.success("Password set successfully");
    } catch (err) {
      toast.error(err.message);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          showCloseButton={true}
          className="w-[90%] max-w-2xl sm:max-w-2xl gap-0 p-0 bg-background"
        >
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between p-4 relative space-y-0">
            <DialogTitle className="text-lg sm:text-2xl text-secondary-foreground font-bold">
              Account Info
            </DialogTitle>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-secondary-foreground hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button> */}
          </DialogHeader>
          <Separator />

          {/* User Details Section */}
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
              {/* User Info Card */}
              <Card className="p-3 sm:p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-secondary-foreground mb-1 sm:mb-2">
                    User Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* User Image */}
                    <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] flex-shrink-0 flex items-center justify-center">
                      <Avatar
                        className="size-[70px] w-[70px] h-[70px] text-[25px] shadow-sm transition-transform hover:scale-105"
                      >
                        <AvatarFallback
                          className="text-[25px] text-white"
                          style={{
                            backgroundColor: "var(--bg-secondary-foreground)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* User Details */}
                    <div className="flex-1 space-y-2">
                      {/* First Name */}
                      <div className="flex items-center">
                        <p className="text-sm text-secondary-foreground w-20">First Name:</p>
                        <h2 className="text-md sm:text-lg font-semibold text-secondary-foreground">
                          {user?.firstName}
                        </h2>
                      </div>
                      {/* Last Name */}
                      <div className="flex items-center">
                        <p className="text-sm text-secondary-foreground w-20">Last Name:</p>
                        <h2 className="text-md sm:text-lg font-semibold text-secondary-foreground">
                          {user?.lastName}
                        </h2>
                      </div>
                      {/* Email */}
                      <div className="flex items-center">
                        <p className="text-sm text-secondary-foreground w-20">Email:</p>
                        <p className="text-xs sm:text-sm text-secondary-foreground">
                          {user?.email}
                        </p>
                      </div>
                      {/* Role */}
                      <div className="flex items-center">
                        <p className="text-sm text-secondary-foreground w-20">Role:</p>
                        <p className="text-xs sm:text-sm text-secondary-foreground">
                          {user?.role}
                        </p>
                      </div>
                      {/* PhoneNo */}
                      <div className="flex items-center">
                        <p className="text-sm text-secondary-foreground w-20">Phone No:</p>
                        <p className="text-xs sm:text-sm text-secondary-foreground">
                          {user?.phoneNo}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-secondary-foreground mb-1 sm:mb-2">
                    Company Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* User Image */}
                    <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] border flex-shrink-0">
                      {user?.company?.logo || config?.logo ? (
                        <img
                          src={
                            typeof user?.logo === "string" && user.logo
                              ? user.logo
                              : typeof user?.company?.logo === "string" && user.company.logo
                                ? user.company.logo.replace("/api/upload", "/uploads")
                                : config?.logo
                          }

                          alt={params.portalid}
                          className="h-full object-contain"
                        />
                      ) : (
                        // Skeleton for logo
                        <Skeleton className="h-full w-full mr-2 rounded" />
                      )}
                    </div>
                    {/* User Details */}
                    <div className="flex-1">
                      <p className="text-sm sm:text-md text-secondary-foreground">
                        Company Name:
                      </p>
                      <h2 className="text-md sm:text-lg font-semibold text-secondary-foreground">
                        {user?.company?.name}
                      </h2>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChangePassModalOpen((prev) => !prev)}
                  className="text-secondary-foreground hover:bg-secondary-foreground/20 px-3 py-3"
                >
                  Change Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditProfileModalOpen((prev) => !prev)}
                  className="text-secondary-foreground hover:bg-secondary-foreground/20 px-3 py-3"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isChangePassModalOpen}
        onOpenChange={setIsChangePassModalOpen}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[350px] max-w-2xl sm:max-w-2xl gap-0 p-0"
        >
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b text-secondary-foreground space-y-0">
            <DialogTitle className="text-lg font-semibold">Change Password</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsChangePassModalOpen(false)}
              className="text-secondary-foreground hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <form className="text-gray-700 p-3 sm:p-6" onSubmit={handleSetPassword}>
            {success ? (
              <Alert className="border-green-200 bg-green-50 mb-4">
                <AlertDescription className="text-green-500 text-center">
                  Password set successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-secondary-foreground">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      className="w-full px-3 py-2 mt-2 h-10 rounded-lg focus:ring-2 focus:ring-blue-400 !bg-background text-secondary-foreground"
                      placeholder="Enter password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-secondary-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-2 mt-2 h-auto rounded-lg focus:ring-2 focus:ring-blue-400 pr-10 !bg-background text-secondary-foreground"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-[58%] right-1 transform -translate-y-1/2 h-8 w-8 "
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-secondary-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    className="w-full px-3 py-2 mt-2 h-10 rounded-lg focus:ring-2 focus:ring-blue-400 !bg-background text-secondary-foreground"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="text-center">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="w-full flex justify-center mt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={loading ? "cursor-not-allowed opacity-50 px-3 py-3" : "px-3 py-3"}
                  >
                    {loading ? (
                      <LoaderSpinner size={20} />
                    ) : (
                      "Set Password"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {
        editProfileModalOpen && (
          <AddUserModal
            user={user}
            isOpen={editProfileModalOpen}
            onClose={() => setIsEditProfileModalOpen(false)}
            from='editProfile'
          />
        )
      }
    </>
  );
}

export default AccountInfo;
