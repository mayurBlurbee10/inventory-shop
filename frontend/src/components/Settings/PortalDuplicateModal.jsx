import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { X } from "lucide-react";
import React, { useState } from "react";
import Button from "../Common/Elements/Button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur = () => { },
  placeholder = "",
  required = true,
  isLoading = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1">
      {label}
      {required && <span className="text-muted-foreground ml-1">*</span>}
    </label>
    <div className="w-full px-3 py-2 border border-border rounded-md flex justify-between items-center focus:ring-1 focus:ring-primary bg-background">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        onBlur={onBlur}
        className="w-full focus:outline-none bg-background text-foreground"
      />
      {isLoading && (
        <div className="flex items-center gap-2 ">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  </div>
);

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

const PortalDuplicateModal = ({
  isOpen,
  onClose,
  handleDuplicate,
  isLoading = false,
  setFormData,
  formData,
}) => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePortalBlur = async () => {
    if (!formData?.legalName) return;
    setIsPortalLoading(true);
    setError("");
    try {
      const legalName = sanitizeName(formData?.legalName);
      const encodedPortal = encodeURIComponent(legalName);
      const response = await fetchWrapper(
        `/api/portal?portalid=${encodedPortal}`,
        {},
        "fetch-portal"
      );
      const portal = await response.json();
      if (portal.error) {
        setError("");
      } else {
        setError("This name is already in use, please choose another one");
      }
    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg bg-background p-0 overflow-hidden"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <div className="flex justify-between items-center pt-6 px-6 mb-4">
          <DialogTitle className="text-xl text-foreground font-medium">
            Duplicate Portal
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-6 text-foreground">
          <div className="border-b border-border px-6 pb-6">
            <h3 className="text-lg font-medium text-foreground mb-1">
              Company Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Please enter company information
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 px-6">
            <div className="col-span-2 text-foreground">
              <InputField
                label="Company Name"
                type="legalName"
                value={formData.legalName}
                onChange={(e) =>
                  setFormData({ ...formData, legalName: e.target.value })
                }
                onBlur={handlePortalBlur}
                placeholder="e.g., Acme Corporation Ltd."
                isLoading={isPortalLoading}
              />
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            </div>
          </div>

          <div className="space-y-4 px-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Domain Setup <span className="text-muted-foreground">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      className="flex-1 block w-full px-3 py-2 rounded-l-md border border-r-0 border-border bg-background text-foreground"
                      placeholder="subdomain"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-border bg-muted text-muted-foreground">
                      .company.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-muted/40 border-t border-border rounded-b-lg flex justify-between">
            <Button
              onClick={onClose}
              disabled={isLoading}
              label="Cancel"
              type="Secondary"
            />
            <Button
              onClick={handleDuplicate}
              disabled={isLoading}
              isLoading={isLoading}
              label="Create Portal"
              type="Primary"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PortalDuplicateModal;
