"use client";

import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Send, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const reactSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "2.75rem",
    backgroundColor: "hsl(var(--background))",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    boxShadow: state.isFocused ? "0 0 0 3px hsl(var(--ring) / 0.5)" : "none",
    borderRadius: "0.5rem",
    "&:hover": {
      borderColor: "hsl(var(--border))",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0.25rem 0.75rem",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--accent))",
    borderRadius: "0.375rem",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "hsl(var(--accent-foreground))",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "hsl(var(--accent-foreground))",
    "&:hover": {
      backgroundColor: "hsl(var(--destructive) / 0.15)",
      color: "hsl(var(--destructive))",
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  input: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    overflow: "hidden",
    zIndex: 50,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    padding: "0.25rem",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "0.375rem",
    backgroundColor: state.isSelected
      ? "hsl(var(--accent))"
      : state.isFocused
        ? "hsl(var(--accent) / 0.7)"
        : "transparent",
    color:
      state.isSelected || state.isFocused
        ? "hsl(var(--accent-foreground))"
        : "hsl(var(--foreground))",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "hsl(var(--accent))",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
};

function SendforSignatureDialog({
  item,
  usersList,
  isModalOpen,
  setIsModalOpen,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOnSameDoc, setIsOnSameDoc] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const params = useParams();

  useEffect(() => {
    const users = usersList.map((user) => ({
      value: user.boxUserId,
      email: user.email,
      userId: user.id,
      label: `${`${user.firstName || ""} ${user.lastName || ""}`.trim()} (${user.email})`,
    }));
    setUserList(users);
  }, [usersList]);

  const handelSendforSignature = async (selectedUsers) => {
    try {
      setIsLoading(true);
      const signers = selectedUsers.map((user) => ({
        signerEmail: user.email,
        signerId: user.userId,
      }));
      const userData = getUserData();
      const response = await fetchWrapper(
        "/api/box/e-sign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: item.id,
            signers,
            boxUserId: userData.boxUserId,
            portal: params.portalid || "root",
            onSameDoc: isOnSameDoc,
          }),
        },
        "esign-request",
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send e-sign request");
      }
      toast.success("E-sign request sent successfully.");
      setIsLoading(false);
      setSelectedUsers([]);
      setIsModalOpen(false);
    } catch (error) {
      setIsLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          setIsModalOpen(false);
        }
      }}
    >
      <DialogContent
        className="w-full max-w-md overflow-hidden bg-background sm:max-w-md"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-2 border-b border-border pb-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Send For Signature
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <DialogDescription className="min-w-0 text-sm font-medium text-muted-foreground">
            Send{" "}
            <span className="break-all font-semibold text-foreground" title={item?.name}>
              “{item?.name}”
            </span>{" "}
            for signature to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Select users
            </Label>
            <Select
              isMulti={true}
              className="w-full text-sm"
              classNamePrefix="select-user"
              styles={reactSelectStyles}
              isClearable={true}
              isSearchable={true}
              placeholder="Select the user"
              value={selectedUsers}
              onChange={(e) => setSelectedUsers(e || [])}
              options={userList}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
            />
          </div>

          {selectedUsers.length > 1 && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="onSameDoc"
                checked={isOnSameDoc}
                onCheckedChange={(checked) => setIsOnSameDoc(Boolean(checked))}
                className="mt-0.5"
              />
              <Label
                htmlFor="onSameDoc"
                className="cursor-pointer text-sm font-normal leading-5 text-muted-foreground"
              >
                Send all signers in one request (Same Document)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border bg-transparent pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(false)}
            disabled={isLoading}
            className="px-3 py-3"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handelSendforSignature(selectedUsers)}
            disabled={isLoading || selectedUsers.length === 0}
            className="px-3 py-3"
          >
            {isLoading ? (
              <LoaderSpinner size={18} className="text-primary-foreground" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SendforSignatureDialog;
