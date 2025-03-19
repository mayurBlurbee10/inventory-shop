import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import MessagingModal from "./MessagingModal";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "@/store/services/messageService";

const Messaging = () => {
  const params = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(null);

  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const fetchUser = async () => {
    try {
      setLoading(true);
      const url = params?.portalid
        ? `/api/users?portalid=${params?.portalid || "default"}`
        : "/api/users";
      const response = await fetchWrapper(url, {}, "fetchUserList");
      if (!response.ok) throw new Error("Download failed");
      const data = await response.json();

      //   Filter logged In user
      const filterUsers = data?.filter((d) => d?.id !== user?.id);
      setUsers(filterUsers);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomDate = () => {
    const start = new Date(2023, 0, 1); // Start from Jan 1, 2023
    const end = new Date(); // Current date
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  };

  const generateMessages = () => {
    if (!users.length) {
      return;
    }
    const generatedMessages = users?.map((item) => ({
      text: `Hello from ${item?.name}!`, // Sample message
      sender: item,
      receiver: user,
      isGroup: false,
      createdAt: generateRandomDate(),
    }));
    dispatch(setMessages(generatedMessages));
  };

  useEffect(() => {
    fetchUser();
    generateMessages();
  }, []);

  useEffect(() => {
    generateMessages();
  }, [users]);

  return (
    <div>
      <div>
        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
          Messaging
        </h3>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-y-auto overflow-x-hidden hidden-scrollbar mt-5 max-h-[300px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr
                  key={user.id || index}
                  onClick={() => setIsMessageModalOpen(user)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user?.company?.logo ? (
                        <img
                          src={user.company.logo}
                          alt={`${user.name} logo`}
                          className="h-8 w-8 object-contain rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <MessagingModal
        isOpen={isMessageModalOpen !== null}
        onClose={() => setIsMessageModalOpen(null)}
        receiver={isMessageModalOpen}
      />
    </div>
  );
};

export default Messaging;
