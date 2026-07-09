"use client";

import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import CreateTaskPopUp from "../Common/CreateTaskPopUp";
import { TaskStatus } from "@/config/constants";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AddCheckListModal = ({
  isOpen,
  onClose,
  onChecklistCreate,
  checklist = null,
}) => {
  const params = useParams();
  const [checkListName, setCheckListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useSelector((state) => state.user);

  useEffect(() => {
    if (checklist) {
      setCheckListName(checklist?.name);
    } else {
      setCheckListName("");
    }
  }, [checklist]);

  const handleCreateCheckList = async () => {
    try {
      setIsLoading(true);
      const isEditMode = !!checklist;
      const method = isEditMode ? "PUT" : "POST";
      const payload = {
        name: checkListName,
      };

      if (isEditMode) {
        payload.checklistId = checklist?.id;
      } else {
        payload.createdBy = user?.id;
        payload.portalId = params?.portalid;
      }
      const requestOptions = {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        isEditMode ? "update-checklist" : "create-checklist",
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

  const handleClose = () => {
    onClose();
    setCheckListName("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {checklist ? "Edit" : "Add"} Check List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="checklist-name" className="text-foreground mt-3 mb-1">
            Enter checklist name
          </Label>
          <Input
            id="checklist-name"
            type="text"
            value={checkListName}
            onChange={(e) => setCheckListName(e.target.value)}
            className="!bg-background h-10"
            placeholder="Checklist name"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-3 py-3 mx-3"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isLoading || !checkListName?.trim()}
            onClick={handleCreateCheckList}
            className="px-3 py-3"
          >
            {isLoading ? (
              <LoaderSpinner size={18} className="text-primary-foreground" />
            ) : null}
            {checklist ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CheckListContent = () => {
  const params = useParams();
  const [checkLists, setCheckLists] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [isOpenAddCheckListModal, setIsOpenAddCheckListModal] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(null);
  const [isOpenAddTaskModal, setIsOpenAddTaskModal] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [selectedCheckList, setSelectedCheckList] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(null);
  const [isUpdateTaskModalOpen, setIsUpdateTaskModalOpen] = useState(false);
  const [isChecklistLastActive, setIsChecklistLastActive] = useState(false);

  const fetchChecklists = async () => {
    try {
      setIsChecklistLoading(true);
      const url = `/api/checklists?portalId=${params.portalid || "root"}`;

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checklistId: selectedCheckList?.id,
        }),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        "delete-checklist",
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
      if (filteredCheckList.length === 1 && checklist?.isActive) {
        setIsChecklistLastActive(true);
        return;
      }
      setIsChecklistLastActive(false);
      setCheckLists((prevLists) =>
        prevLists.map((p) =>
          p.id === checklist?.id ? { ...p, isActive: !checklist?.isActive } : p,
        ),
      );
      setIsUpdateLoading(checklist);
      const requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checklistId: checklist?.id,
          isActive: !checklist?.isActive,
        }),
      };
      const response = await fetchWrapper(
        "/api/checklists",
        requestOptions,
        "update-checklist",
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
          p.id === checklist?.id ? { ...p, isActive: !checklist?.isActive } : p,
        ),
      );
    } finally {
      setIsUpdateLoading(null);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setIsChecklistLastActive(false);
      if (!selectedTask) {
        return;
      }
      const requestOptions = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId: selectedTask?.id }),
      };
      setIsDeleteLoading(true);
      const response = await fetchWrapper(
        `/api/tasks`,
        requestOptions,
        "delete-tasks",
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
    <Card className="overflow-y-auto shadow-none md:shadow-sm">
      <CardContent className="relative flex w-full flex-col md:p-3 lg:p-5">
        <div className="flex flex-wrap items-center justify-center gap-2 pb-5 sm:justify-between">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-medium text-foreground">Check Lists</h3>
            <p className="text-sm text-muted-foreground">
              Easily manage checklists and tasks.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={() => setIsOpenAddCheckListModal((prev) => !prev)}
            className="px-3 py-3"
          >
            <PlusCircle className="h-4 w-4" />
            Add Check List
          </Button>
        </div>

        <div className="py-2 text-foreground">
          {isChecklistLoading ? (
            <div className="flex justify-center py-8">
              <LoaderSpinner size={28} className="text-secondary-foreground" />
            </div>
          ) : (
            <>
              {!checkLists?.length ? (
                <p className="text-sm text-muted-foreground">
                  No check list found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2 md:p-2 lg:grid-cols-2 lg:gap-5 lg:p-3 xl:grid-cols-3">
                  {checkLists?.map((checklist) => (
                    <Card
                      key={checklist?.id}
                      className="relative space-y-4 shadow-sm"
                    >
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground">
                            {checklist?.name}
                          </h3>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="icons"
                              size="icon"
                              className="rounded-full"
                              title="Edit checklist"
                              onClick={() => {
                                setIsOpenAddCheckListModal((prev) => !prev);
                                setSelectedCheckList(checklist);
                                setIsChecklistLastActive(false);
                              }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="icons"
                              size="icon"
                              className="rounded-full text-destructive hover:text-destructive"
                              title="Delete checklist"
                              onClick={() => {
                                setIsDeleteModalOpen((prev) => !prev);
                                setSelectedCheckList(checklist);
                                setIsChecklistLastActive(false);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                            {isUpdateLoading?.id === checklist?.id && (
                              <LoaderSpinner
                                size={24}
                                className="text-secondary-foreground"
                              />
                            )}
                            <ThemeSwitch
                              checked={!!checklist?.isActive}
                              onCheckedChange={() =>
                                handleUpdateCheckList(checklist)
                              }
                            />
                          </div>
                        </div>

                        <div className="custom-scrollbar min-h-[360px] max-h-[360px] overflow-y-auto rounded-lg border border-border bg-muted/40 p-4">
                          {checklist?.tasks?.length > 0 ? (
                            <ul className="space-y-3">
                              {checklist?.tasks.map((task) => (
                                <li
                                  key={task?.id}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 shadow-sm"
                                >
                                  <span className="flex-1 truncate text-sm font-medium text-foreground">
                                    {task?.title}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="icons"
                                      size="icon"
                                      className="rounded-full"
                                      title="Edit task"
                                      onClick={() => {
                                        setIsUpdateTaskModalOpen(
                                          (prev) => !prev,
                                        );
                                        setSelectedTask(task);
                                        setSelectedCheckList(checklist);
                                      }}
                                    >
                                      <Edit className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="icons"
                                      size="icon"
                                      className="rounded-full text-destructive hover:text-destructive"
                                      title="Delete task"
                                      onClick={() => {
                                        setIsDeleteTaskModalOpen(
                                          (prev) => !prev,
                                        );
                                        setSelectedTask(task);
                                      }}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                  <Badge
                                    className={
                                      task?.status === TaskStatus.COMPLETED
                                        ? "min-w-[80px] justify-center bg-success/15 text-success rounded-full"
                                        : "min-w-[80px] justify-center bg-warning/15 text-warning rounded-full"
                                    }
                                  >
                                    {task?.status?.charAt(0).toUpperCase() +
                                      task?.status?.slice(1)}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-center text-sm text-muted-foreground">
                              No tasks available.
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsOpenAddTaskModal((prev) => !prev);
                            setSelectedCheckList(checklist);
                          }}
                          className="ml-auto px-3 py-3"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Task
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {isChecklistLastActive && (
            <Alert
              variant="destructive"
              className="mx-1 mt-2 border-destructive/30 md:mx-2 lg:mx-4 lg:mt-4"
            >
              <AlertDescription className="text-destructive">
                <span className="font-semibold">Note*:</span> At least one
                checklist should be enabled.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

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
          onClose={() => {
            setIsOpenAddTaskModal(false);
            setSelectedCheckList(null);
          }}
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
            if (!isOpen) setSelectedCheckList(null);
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
          onClose={() => {
            setIsUpdateTaskModalOpen(false);
            setSelectedTask(null);
            setSelectedCheckList(null);
          }}
          user={selectedTask?.user}
          onTaskCreated={fetchChecklists}
          task={selectedTask}
          allowedCheckLists={[selectedCheckList]}
        />
      )}
    </Card>
  );
};

export default CheckListContent;
