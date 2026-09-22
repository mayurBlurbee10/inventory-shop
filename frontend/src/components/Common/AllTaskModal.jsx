"use client";

import React, { useEffect, useState } from "react";
import { Edit, Trash2, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import CreateTaskPopUp from "./CreateTaskPopUp";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import LoaderSpinner from "./Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const AllTaskModal = ({ isOpen, onClose }) => {
  const params = useParams();
  const [tasks, setTasks] = useState([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [selectTaskToUpdate, setSelectTaskToUpdate] = useState(null);
  const [selectTaskToDelete, setSelectTaskToDelete] = useState(null);
  const [isTaskDeleteModalOpen, setIsTaskDeleteModalOpen] = useState(false);
  const [isDeleteTaskLoading, setIsDeleteTaskLoading] = useState(false);

  const fetchAllTasks = async () => {
    try {
      setIsTasksLoading(true);
      const response = await fetchWrapper(
        `/api/tasks?portalId=${params?.portalid || "root"}`,
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

  const handleDeleteTask = async () => {
    try {
      if (!selectTaskToDelete) {
        return;
      }
      const requestOptions = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId: selectTaskToDelete?.id }),
      };
      setIsDeleteTaskLoading(true);
      const response = await fetchWrapper(
        `/api/tasks`,
        requestOptions,
        "delete-tasks"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Something went wrong!");
      }
      await fetchAllTasks();
      setSelectTaskToDelete(null);
      setIsTaskDeleteModalOpen(false);
      toast.success("Task deleted Successfully");
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsDeleteTaskLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllTasks();
    }
  }, [isOpen]);

  const formatDate = (timestamp) => {
    if (timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US");
    }
    return "No Due";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="flex h-[80vh] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-border bg-background p-0 text-foreground sm:w-[1200px] sm:max-w-[1200px]"
          overlayClassName="bg-black/30"
          showCloseButton={false}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Tasks
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="rounded-full px-3 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <div className="relative min-h-0 flex-1 px-5 py-5 font-lato text-sm sm:px-10">
            {isTasksLoading ? (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <LoaderSpinner size={28} className="text-secondary-foreground" />
              </div>
            ) : (
              <div className="h-full overflow-y-auto hidden-scrollbar">
                <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                  <Table className="w-full text-sm">
                    <TableHeader className="sticky top-0 z-[1] bg-muted">
                      <TableRow className="border-b border-border hover:bg-muted">
                        <TableHead className="px-4 py-3 text-left font-semibold text-foreground">
                          User
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left font-semibold text-foreground">
                          Type
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left font-semibold text-foreground">
                          Title
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left font-semibold text-foreground">
                          Status
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left font-semibold text-foreground">
                          Due Date
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left font-semibold text-foreground">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="border-t border-border">
                      {tasks?.length > 0 ? (
                        tasks.map((task, index) => (
                          <TableRow
                            key={task?.id}
                            className={`border-b border-border text-foreground transition hover:bg-muted/50 ${
                              index % 2 === 0 ? "bg-background" : "bg-muted/30"
                            }`}
                          >
                            <TableCell className="px-4 py-3">
                              {task?.user?.firstName}
                            </TableCell>
                            <TableCell className="px-4 py-3">{task?.type}</TableCell>
                            <TableCell className="px-4 py-3">{task?.title}</TableCell>
                            <TableCell className="px-4 py-3">{task?.status}</TableCell>
                            <TableCell className="px-4 py-3">
                              {formatDate(task?.dueDate)}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto px-3 py-3 text-foreground hover:bg-transparent hover:text-secondary-foreground"
                                  onClick={() => setSelectTaskToUpdate(task)}
                                >
                                  <Edit className="size-5" />
                                  <span className="sr-only">Edit task</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto px-3 py-3 text-destructive hover:bg-transparent hover:text-destructive"
                                  onClick={() => {
                                    setSelectTaskToDelete(task);
                                    setIsTaskDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="size-5" />
                                  <span className="sr-only">Delete task</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectTaskToUpdate !== null && (
        <CreateTaskPopUp
          onClose={() => setSelectTaskToUpdate(null)}
          user={selectTaskToUpdate?.user}
          onTaskCreated={fetchAllTasks}
          task={selectTaskToUpdate}
        />
      )}

      <DeleteConfirmDialog
        isModalOpen={isTaskDeleteModalOpen}
        setIsModalOpen={setIsTaskDeleteModalOpen}
        title="Delete Task"
        content="Deleting this task cannot be undone. Do you want to continue?"
        handleDelete={handleDeleteTask}
        isLoading={isDeleteTaskLoading}
      />
    </>
  );
};

export default AllTaskModal;
