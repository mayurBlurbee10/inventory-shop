import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../Common/Elements/Button";
import { Dialog } from "@headlessui/react";
import { ChevronDown, ChevronUp, Loader2, PlusCircle, X } from "lucide-react";
import { useSelector } from "react-redux";
import CreateTaskPopUp from "../Common/CreateTaskPopUp";

const AddCheckListModal = ({ isOpen, onClose, onChecklistCreate }) => {
  const params = useParams();
  const [checkListName, setCheckListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useSelector((state) => state.user);

  const handleCreateCheckList = async () => {
    try {
      setIsLoading(true);
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({
          createdBy: user?.id,
          portalId: params?.portalid,
          name: checkListName,
        }),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        "create-checklist"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create checklist");
      }
      toast.success(data?.message);
      await onChecklistCreate();
    } catch (error) {
      toast.error(error?.message);
    } finally {
      onClose();
      setIsLoading(false);
      setCheckListName("");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-[400px] w-full rounded-lg bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg text-gray-600 font-medium">
              Add Check List
            </Dialog.Title>
            <button
              onClick={() => {
                onClose();
                setCheckListName("");
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-sm w-full mx-auto">
            <label className="text-sm text-black font-medium block mb-1">
              Enter checklist name
            </label>
            <input
              type="text"
              value={checkListName}
              onChange={(e) => setCheckListName(e.target.value)}
              className="py-2 px-2 w-full text-black border border-gray-300 rounded-md text-sm outline-none mb-2 focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end pt-4 gap-2">
              <Button
                disabled={isLoading || !checkListName?.trim()}
                onClick={handleCreateCheckList}
                label="Create"
                type="Primary"
                isLoading={isLoading}
              />
              <Button
                onClick={() => {
                  onClose();
                  setCheckListName("");
                }}
                disabled={isLoading}
                type="Secondary"
                label="Cancel"
              />
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const CheckListContent = () => {
  const params = useParams();
  const [checklists, setCheckLists] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [isOpenAddCheckListModal, setIsOpenAddCheckListModal] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(null);
  const [expandedChecklist, setExpandedChecklist] = useState(null);
  const [isOpenAddTaskModal, setIsOpenAddTaskModal] = useState(false);

  const fetchChecklists = async () => {
    try {
      setIsChecklistLoading(true);
      const url = `/api/checklists?portalId=${params.portalid}`;

      const response = await fetchWrapper(url, {}, "fetch-checklist");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed fetch checklists");
      setCheckLists(data?.data);
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsChecklistLoading(false);
    }
  };

  const handleUpdateCheckList = async (checklist) => {
    try {
      setCheckLists((prevLists) =>
        prevLists.map((p) =>
          p.id === checklist?.id ? { ...p, isActive: !checklist?.isActive } : p
        )
      );
      setIsUpdateLoading(checklist);
      const requestOptions = {
        method: "PUT",
        body: JSON.stringify({
          checklistId: checklist?.id,
          isActive: !checklist?.isActive,
        }),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        "update-checklist"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update checklist");
      }
      toast.success(data?.message);
      await fetchChecklists();
    } catch (error) {
      toast.error(error?.message);
      setCheckLists((prevLists) =>
        prevLists.map((p) =>
          p.id === checklist?.id ? { ...p, isActive: !checklist?.isActive } : p
        )
      );
    } finally {
      setIsUpdateLoading(null);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  return (
    <div className="bg-white shadow-none md:shadow rounded-lg overflow-y-auto">
      <div className="bg-white rounded-lg flex flex-col relative md:p-3 lg:p-5 w-full">
        <div className="flex justify-center sm:justify-between items-center flex-wrap gap-2 border-b pb-5">
          <div className=" text-center sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">Check Lists</h3>
            <p className="text-gray-600 text-sm">
              Easily manage and customize the sections displayed on your page.
            </p>
          </div>
          <Button
            label="Add Check List"
            type="Primary"
            onClick={() => setIsOpenAddCheckListModal((prev) => !prev)}
            buttonType="button"
          />
        </div>
        <div className="py-2 text-gray-900">
          {isChecklistLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {!checklists?.length ? (
                <p>No check list found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 p-1 md:p-2 lg:p-3">
                    {checklists?.map((checklist) => {
                      const isExpanded = expandedChecklist === checklist?.id;

                      return (
                        <div
                          key={checklist?.id}
                          className="border rounded-lg p-4 shadow-md bg-white space-y-4 pb-20 relative"
                        >
                          {/* Header Section */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {/* <button
                                onClick={() =>
                                  setExpandedChecklist(
                                    isExpanded ? null : checklist?.id
                                  )
                                }
                                className="p-2 hover:bg-gray-100 rounded-full"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                              </button> */}
                              <h3 className="font-semibold text-gray-800">
                                {checklist?.name}
                              </h3>
                            </div>

                            {/* Toggle Button */}
                            <div className="flex items-center gap-3">
                              {isUpdateLoading?.id === checklist?.id && (
                                <Loader2 className="animate-spin text-blue-500 w-5 h-5" />
                              )}
                              <button
                                type="button"
                                onClick={() => handleUpdateCheckList(checklist)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out 
                                    ${
                                      checklist?.isActive
                                        ? "bg-blue-600"
                                        : "bg-gray-200"
                                    }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out 
                                    ${
                                      checklist?.isActive
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Tasks List (Expandable) */}
                          {/* {isExpanded && ( */}
                            <div className="mt-4 bg-gray-50 p-3 rounded-md">
                              {checklist?.tasks?.length > 0 ? (
                                <ul className="space-y-2">
                                  {checklist?.tasks.map((task) => (
                                    <li
                                      key={task?.id}
                                      className="bg-white p-2 rounded-md shadow-sm flex justify-between items-center"
                                    >
                                      <span className="text-gray-700 text-sm">
                                        {task?.title}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-1 ${
                                          task?.status === "COMPLETED"
                                            ? " text-green-600"
                                            : " text-yellow-600"
                                        }`}
                                      >
                                        {task?.status}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  No tasks available.
                                </p>
                              )}
                            </div>
                          {/* )} */}
                          <Button
                            onClick={() =>
                              setIsOpenAddTaskModal((prev) => !prev)
                            }
                            label={"Add Task"}
                            icon={PlusCircle}
                            type="Secondary"
                            className="absolute bottom-5 right-4"
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AddCheckListModal
        isOpen={isOpenAddCheckListModal}
        onClose={() => setIsOpenAddCheckListModal(false)}
        onChecklistCreate={fetchChecklists}
      />
      {isOpenAddTaskModal && (
        <CreateTaskPopUp
          onClose={() => setIsOpenAddTaskModal(false)}
          onTaskCreated={fetchChecklists}
        />
      )}
    </div>
  );
};

export default CheckListContent;
