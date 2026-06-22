import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Send, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import Button from "./Common/Elements/Button";

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
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim()} (${user.email})`,
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
        "esign-request"
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
      onClose={() => setIsModalOpen(false)}
      className="relative z-50 text-gray-600"
    >
      <div className="fixed inset-0 bg-black/10" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Send For Signature</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content */}
          <div className="p-4 space-y-4">
            <div>
              <p className="text-gray-500 text-l font-semibold">
                Send “{item?.name}” for signature to
              </p>
              <div>
                <Select
                  isMulti={true}
                  className="flex-1 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  classNamePrefix="Select the user"
                  isClearable={true}
                  isSearchable={true}
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(e)}
                  options={userList}
                />
              </div>
              {selectedUsers.length > 1 && (
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="onSameDoc"
                    checked={isOnSameDoc}
                    onChange={(e) => setIsOnSameDoc(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="onSameDoc" className="text-gray-600">
                    Send all signers in one request (Same Document)
                  </label>
                </div>
              )}
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-end border-t px-4 py-3 space-x-2">
            <Button
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              type="Secondary"
              label="Cancel"
            />
            <Button
              onClick={() => handelSendforSignature(selectedUsers)}
              disabled={isLoading || selectedUsers.length === 0}
              isLoading={isLoading}
              icon={Send}
              type="Primary"
              label="Send"
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default SendforSignatureDialog;