import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import React, { useState } from "react";
import Button from "../Common/Elements/Button";

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur = () => {},
  placeholder = "",
  required = true,
  isLoading = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-gray-400 ml-1">*</span>}
    </label>
    <div className="w-full px-3 py-2 border border-gray-300 rounded-md flex justify-between items-center focus:ring-1 focus:ring-gray-400">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        onBlur={onBlur}
        className="w-full focus:outline-none"
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
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto min-w-[35%] rounded-lg bg-white shadow-md">
          <div className="flex justify-between items-center mb-4 pt-6 px-6">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              Duplicate Portal
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6  text-gray-700">
            <div className="border-b border-gray-200 px-6 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Company Information
              </h3>
              <p className="text-sm text-gray-500">
                Please enter company information
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6">
              <div className="col-span-2 text-gray-700">
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
                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>
            </div>

            <div className="space-y-4 px-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Setup <span className="text-gray-400">*</span>
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
                        className="flex-1 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300"
                        placeholder="subdomain"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                        .company.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between">
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PortalDuplicateModal;
