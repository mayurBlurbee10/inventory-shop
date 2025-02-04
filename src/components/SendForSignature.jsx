import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Loader2, Send, Signature, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
function SendforSignatureDialog({
  item,
  usersList,
  isModalOpen,
  setIsModalOpen,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const params = useParams();
  useEffect(() => {
    const users = usersList.map((user) => ({
      value: user.boxUserId,
      email: user.email,
      userId: user.id,
      label: `${user.name} (${user.email})`,
    }));
    setUserList(users);
  }, [usersList]);
  const handelSendforSignature = async (selectedUser) => {
    try {
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
            signerEmail: selectedUser.email,
            userId: userData.id,
            boxUserId: userData.boxUserId,
            portal: params.portalid,
            signerId: selectedUser.userId,
          }),
        },
        "esign-request"
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send e-sign request");
      }
      toast.success("E-sign request sended successfully.");
      setIsLoading(false);
      setSelectedUser(null);
      setIsModalOpen(false);
    } catch (error) {
      setIsLoading(false);
      toast.error(err.message);
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
                  className="flex-1 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  classNamePrefix="Select the user"
                  isClearable={true}
                  isSearchable={true}
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e)}
                  options={userList}
                />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-end border-t px-4 py-3 space-x-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsLoading(true);
                handelSendforSignature(selectedUser);
              }}
              disabled={isLoading}
              className="px-4 py-2 flex items-center bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
export default SendforSignatureDialog;