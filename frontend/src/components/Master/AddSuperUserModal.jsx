import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
import { X } from "lucide-react";
import { useState } from "react";
import Button from "../Common/Elements/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AddSuperUserModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    companyName: "",
    logo: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleModalClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      companyName: "",
      logo: null,
    });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const user = getUserData();
    try {
      let logoUrl = "";
      if (formData.logo) {
        const uploadData = new FormData();
        uploadData.append("file", formData.logo);
        const uploadResponse = await fetchWrapper(
          "/api/upload",
          {
            method: "POST",
            body: uploadData,
          },
          "user-logo"
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }

      // Create Box user
      const boxResponse = await fetchWrapper(
        "/api/box/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: formData.email,
            externalId: `user_${Date.now()}`,
          }),
        },
        "create-user-box"
      );

      const boxData = await boxResponse.json();

      if (!boxResponse.ok) {
        throw new Error(boxData.error || "Failed to create Box user");
      }

      // Prepare user data for storage
      const userData = {
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: "admin123",
        companyName: formData.companyName,
        logo: logoUrl,
        role: UserRole.SUPER_ADMIN,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        isOnboardingRequired: false,
        createdBy: user.id,
        permissions: {
          portalId: null,
          role: UserRole.SUPER_ADMIN,
        },
      };

      // Save user data
      const saveResponse = await fetchWrapper(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
        "save-user"
      );

      const savedData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(savedData.error);
      }
      onAdd(savedData);
      handleModalClose();
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFormChange("logo", file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFormChange = (key, val) => {
    if (!key) return;

    setFormData({
      ...formData,
      [key]: val,
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md bg-background p-0 overflow-hidden"
        overlayClassName="bg-black/50"
        showCloseButton={false}
      >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <DialogTitle className="text-xl text-foreground font-semibold">Add New User</DialogTitle>
          <button
            onClick={handleModalClose}
            className="text-muted-foreground hover:bg-muted p-1 rounded-full transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                First Name
              </label>
              <input
                type="text"
                required
                className="mt-1 pl-2 block w-full rounded-md border-border bg-background text-foreground border py-2 outline-none focus:border-primary"
                value={formData.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Last Name
              </label>
              <input
                type="text"
                required
                className="mt-1 pl-2 block w-full rounded-md border-border bg-background text-foreground border py-2 outline-none focus:border-primary"
                value={formData.lastName}
                onChange={(e) => handleFormChange("lastName", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-1 pl-2 block w-full rounded-md border-border bg-background text-foreground border py-2 outline-none focus:border-primary"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Phone No
            </label>
            <input
              type="text"
              className="mt-1 pl-2 block w-full rounded-md border-border bg-background text-foreground border py-2 outline-none focus:border-primary"
              value={formData.phone}
              onChange={(e) => handleFormChange("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Company Name
            </label>
            <input
              type="text"
              className="mt-1 pl-2 block w-full rounded-md border-border bg-background text-foreground border py-2 outline-none focus:border-primary"
              value={formData.companyName}
              onChange={(e) => handleFormChange("companyName", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Company Logo
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80"
              />
            </div>
            {previewUrl && (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="h-20 w-20 object-contain rounded border border-border"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleModalClose}
              disabled={loading}
              type="Secondary"
              label="Cancel"
            />
            <Button
              buttonType="submit"
              disabled={loading}
              type="Primary"
              label={loading ? "Creating..." : "Add User"}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
