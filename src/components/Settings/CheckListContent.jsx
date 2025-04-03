import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../Common/Elements/Button";
import { Dialog } from "@headlessui/react";
import { ChevronDown, ChevronUp, Edit, Loader2, PlusCircle, Trash2, X } from "lucide-react";
import { useSelector } from "react-redux";
import CreateTaskPopUp from "../Common/CreateTaskPopUp";
import { TaskStatus } from "@/config/constants";
import DeleteConfirmDialog from "../DeleteConfirmDialog";

const AddCheckListModal = ({ isOpen, onClose, onChecklistCreate, checklist=null }) => {
  const params = useParams();
  const [checkListName, setCheckListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useSelector((state) => state.user);

  useEffect(() => {
    if(checklist){
      setCheckListName(checklist?.name)
    }else {
      setCheckListName("")
    }
  },[checklist]);

  const handleCreateCheckList = async () => {
    try {
      setIsLoading(true);
      const isEditMode = !!checklist;
      const method = isEditMode ? "PUT" : "POST"
      const payload = {
        name: checkListName,
      }

      if(isEditMode){
        payload.checklistId = checklist?.id
      }else {
        payload.createdBy = user?.id;
        payload.portalId = params?.portalid;
      }
      const requestOptions = {
        method: method,
        body: JSON.stringify(payload),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        isEditMode ? "update-checklist" : "create-checklist"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create checklist");
      }
      toast.success(data?.message);
      onClose();
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
              {checklist ? "Edit" : "Add"} Check List
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
                onClick={() => {
                  onClose();
                  setCheckListName("");
                }}
                disabled={isLoading}
                type="Secondary"
                label="Cancel"
              />
              <Button
                disabled={isLoading || !checkListName?.trim()}
                onClick={handleCreateCheckList}
                label={checklist ? "Edit" : "Add"}
                type="Primary"
                isLoading={isLoading}
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
  const [checkLists, setCheckLists] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [isOpenAddCheckListModal, setIsOpenAddCheckListModal] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(null);
  const [expandedChecklist, setExpandedChecklist] = useState(null);
  const [isOpenAddTaskModal, setIsOpenAddTaskModal] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [selectedCheckList, setSelectedCheckList] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(null);
  const [isUpdateTaskModalOpen, setIsUpdateTaskModalOpen] = useState(false);
  const [isChecklistLastActive, setIsChecklistLastActive] = useState(false);

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

  const handleDeleteCheckList = async () => {
    try {
      setIsDeleteLoading(true);
      const requestOptions = {
        method: "DELETE",
        body: JSON.stringify({
          checklistId: selectedCheckList?.id,
        }),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        "delete-checklist"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete checklist");
      }
      toast.success(data?.message);
      setIsDeleteModalOpen(false);
      setSelectedCheckList(null);
      await fetchChecklists();
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleUpdateCheckList = async (checklist) => {
    try {
      const filteredCheckList = checkLists.filter((item) => item?.isActive);
      if(filteredCheckList.length === 1 && checklist?.isActive){
        setIsChecklistLastActive(true);
        return;
      }
      setIsChecklistLastActive(false);
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

   const handleDeleteTask = async () => {
      try {
        setIsChecklistLastActive(false);
        if(!selectedTask){
          return;
        }
        const requestOptions = {
          method : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body : JSON.stringify({taskId : selectedTask?.id})
        }
        setIsDeleteLoading(true);
        const response = await fetchWrapper(
          `/api/tasks`,
          requestOptions,
          "delete-tasks"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Something went wrong!");
        }
        await fetchChecklists();
        setSelectedTask(null);
        setIsDeleteTaskModalOpen(false);
        toast.success("Task deleted Successfully");
      } catch (error) {
        toast.error(error?.message);
      } finally {
        setIsDeleteLoading(false);
      }
    };

  useEffect(() => {
    fetchChecklists();
  }, []);

  return (
    <div className="bg-white shadow-none md:shadow rounded-lg overflow-y-auto">
      <div className="bg-white rounded-lg flex flex-col relative md:p-3 lg:p-5 w-full">
        <div className="flex justify-center sm:justify-between items-center flex-wrap gap-2 pb-5">
          <div className=" text-center sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">Check Lists</h3>
            <p className="text-gray-600 text-sm">
              Easily manage checklists and tasks.
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
              {!checkLists?.length ? (
                <p>No check list found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 p-1 md:p-2 lg:p-3">
                  {checkLists?.map((checklist) => {
                    const isExpanded = expandedChecklist === checklist?.id;

                    return (
                      <div
                        key={checklist?.id}
                        className="border rounded-lg p-4 shadow-md bg-white space-y-4 relative"
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
                            <div className=" flex items-center justify-end gap-2">
                              <div
                                className={`px-2 py-1 cursor-pointer`}
                                onClick={() => {
                                  setIsOpenAddCheckListModal((prev) => !prev);
                                  setSelectedCheckList(checklist);
                                  setIsChecklistLastActive(false);
                                }}
                              >
                                <Edit className="size-4 text-blue-700" />
                              </div>
                              <div
                                className={`px-2 py-1 cursor-pointer`}
                                onClick={() => {
                                  setIsDeleteModalOpen((prev) => !prev);
                                  setSelectedCheckList(checklist);
                                  setIsChecklistLastActive(false);
                                }}
                              >
                                <Trash2 className="size-4 text-red-700" />
                              </div>
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
                        </div>

                        {/* Tasks List (Expandable) */}
                        {/* {isExpanded && ( */}
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow-sm  min-h-[360px] max-h-[360px] overflow-y-auto">
                          {checklist?.tasks?.length > 0 ? (
                            <ul className="space-y-3">
                              {checklist?.tasks.map((task) => (
                                <li
                                  key={task?.id}
                                  className="bg-white p-3 rounded-lg shadow flex items-center justify-between border border-gray-200"
                                >
                                  {/* Task Title */}
                                  <span className="text-gray-800 text-sm font-medium flex-1 truncate">
                                    {task?.title}
                                  </span>
                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2">
                                    {/* Edit Button */}                                
                                    <button
                                      className="p-2 rounded-md hover:bg-blue-100 transition"
                                      onClick={() => {
                                        setIsUpdateTaskModalOpen((prev) => !prev);
                                        setSelectedTask(task);
                                        setSelectedCheckList(checklist);
                                      }}
                                    >
                                      <Edit className="size-4 text-blue-600" />
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      className="p-2 rounded-md hover:bg-red-100 transition"
                                      onClick={() => {
                                        setIsDeleteTaskModalOpen((prev) => !prev);
                                        setSelectedTask(task);
                                      }}
                                    >
                                      <Trash2 className="size-4 text-red-600" />
                                    </button>
                                  </div>
                                  {/* Task Status */}
                                  <span
                                    className={`text-xs font-semibold text-right min-w-[80px] px-2 py-1 ${
                                      task?.status === TaskStatus.COMPLETED
                                        ? " text-green-600"
                                        : " text-yellow-600"
                                    }`}
                                  >
                                    {task?.status?.charAt(0).toUpperCase() + task?.status?.slice(1)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm text-center">No tasks available.</p>
                          )}
                        </div>
                        {/* )} */}
                        <Button
                          onClick={() => {setIsOpenAddTaskModal((prev) => !prev); setSelectedCheckList(checklist)}}
                          label={"Add Task"}
                          icon={PlusCircle}
                          type="Secondary"
                          className="ml-auto"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {isChecklistLastActive && (
            <p className="text-red-600 text-sm p-1 md:p-2 lg:pt-4 lg:px-4"><span className="font-semibold">Note*:</span> Atleast one checklist should be enabled.</p>
          )}
        </div>
      </div>
      <AddCheckListModal
        isOpen={isOpenAddCheckListModal}
        onClose={() => {
          setIsOpenAddCheckListModal(false);
          setSelectedCheckList(null);
        }}
        onChecklistCreate={fetchChecklists}
        checklist={selectedCheckList}
      />
      {isOpenAddTaskModal && (
        <CreateTaskPopUp
          onClose={() => {setIsOpenAddTaskModal(false); setSelectedCheckList(null);}}
          onTaskCreated={fetchChecklists}
          allowedCheckLists={[selectedCheckList]}
        />
      )}
      {selectedCheckList && (
        <DeleteConfirmDialog
        title={`Delete ${selectedCheckList?.name} checklist`}
        content="Deleting this checklist will also remove all related tasks. Are you sure you want to continue?"
        isLoading={isDeleteLoading}
        setIsModalOpen={(isOpen) => {
          setIsDeleteModalOpen(isOpen);
          if (!isOpen) setSelectedCheckList(null); // Ensure reset when closing
        }}
        isModalOpen={isDeleteModalOpen}
        handleDelete={handleDeleteCheckList}
      />
      )}
      {isDeleteTaskModalOpen && (
        <DeleteConfirmDialog
          isModalOpen={isDeleteTaskModalOpen}
          setIsModalOpen={setIsDeleteTaskModalOpen}
          title="Delete Task"
          content="Deleting this task cannot be undone. Do you want to continue?"
          handleDelete={handleDeleteTask}
          isLoading={isDeleteLoading}
        />
      )}
      {isUpdateTaskModalOpen && selectedTask !== null && (
        <CreateTaskPopUp
          onClose={() => {setIsUpdateTaskModalOpen(false); setSelectedTask(null); setSelectedCheckList(null);}}
          user={selectedTask?.user}
          onTaskCreated={fetchChecklists}
          task={selectedTask}
          allowedCheckLists={[selectedCheckList]}
        />
      )}
    </div>
  );
};

export default CheckListContent;
