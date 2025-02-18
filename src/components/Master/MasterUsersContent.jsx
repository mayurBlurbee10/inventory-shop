"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddSuperUserModal from "./AddSuperUserModal";
import { getUserData } from "@/app/lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { setSuperUsers } from "@/store/services/portalService";

export default function MasterUsersContent() {
  // const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminSuperUsers: users } = useSelector((state) => state.portal);

  const dispatch = useDispatch();

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const user = getUserData();
      const url =
        user.role === UserRole.MASTER
          ? `/api/users?role=${UserRole.SUPER_ADMIN}`
          : `/api/users?role=${UserRole.SUPER_ADMIN}&userId=${user.id}`;
      const response = await fetchWrapper(url, {}, "fetch-super-user");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      // setUsers(data);
      // setCurrentPageCount(data.length);
      dispatch(setSuperUsers(data));
    } catch (error) {
      //   setError("Failed to load users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (newUser) => {
    dispatch(setSuperUsers([...users, newUser]))
  };

  useEffect(() => {
    if (!users || users?.length === 0) {
      fetchUsers();
    }
  }, []);

  return (
    <div className="space-b-6">
      <div className="flex justify-end items-center mb-4 w-full">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-white bg-[#0061D5] rounded-md hover:bg-[#0061D5] inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.company?.logo ? (
                        <img
                          src={user.company.logo}
                          alt={`${user.name} logo`}
                          className="h-8 w-8 object-contain rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddSuperUserModal
          onClose={() => {setShowAddModal(false); fetchUsers()}}
          onAdd={handleAddUser}
        />
      )}
    </div>
  );
}
