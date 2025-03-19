import { Dialog } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import Button from "./Elements/Button";
import { Edit, Loader2, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import CreateTaskPopUp from "./CreateTaskPopUp";

const AllTaskModal = ({ isOpen, onClose }) => {
  const params = useParams();
  const [tasks, setTasks] = useState([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [selectTaskToUpdate, setSelectTaskToUpdate] = useState(null);

  const fetchAllTasks = async () => {
    try {
      setIsTasksLoading(true);
      const response = await fetchWrapper(
        `/api/tasks?portalId=${params?.portalid}`,
        {},
        "fetch-tasks"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Something went wrong!");
      }
      setTasks(data?.data);
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-20">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4 text-[#000000e8]">
        <Dialog.Panel className="mx-auto max-w-[90vw] w-[1200px] h-[80vh] bg-white rounded-lg shadow-xl relative">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Tasks
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(80vh-73px)] relative mt-5 font-lato text-sm px-5 sm:px-10 ">
            {isTasksLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <div className="h-[97%] rounded-lg overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm font-lato shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 text-left sticky top-0 border border-gray-200">
                  <tr>
                    <th className="p-4 border-b">User</th>
                    <th className="p-4 border-b">Type</th>
                    <th className="p-4 border-b">Title</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b">Due Date</th>
                    <th className="p-4 border-b">Action</th>
                  </tr>
                </thead>
                <tbody className="border border-gray-200">
                  {tasks?.length > 0 ? (
                    tasks.map((task, index) => (
                      <tr
                        key={task?.id}
                        className={`border-b text-gray-800 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition`}
                      >
                        <td className="py-3 px-4">{task?.user?.name}</td>
                        <td className="py-3 px-4">{task?.type}</td>
                        <td className="py-3 px-4">{task?.title}</td>
                        <td className="py-3 px-4">{task?.status}</td>
                        <td className="py-3 px-4">{formatDate(task?.dueDate)}</td>
                        <td className="py-3 px-4 cursor-pointer">
                          <Edit
                            className="size-5 text-gray-800 ml-3"
                            onClick={() => setSelectTaskToUpdate(task)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-5 text-gray-500"
                      >
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Dialog.Panel>
        {selectTaskToUpdate !== null && (
          <CreateTaskPopUp
            onClose={() => setSelectTaskToUpdate(null)}
            user={selectTaskToUpdate?.user}
            onTaskCreated={fetchAllTasks}
            task={selectTaskToUpdate}
          />
        )}
      </div>
    </Dialog>
  );
};

export default AllTaskModal;
