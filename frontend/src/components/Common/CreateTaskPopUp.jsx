"use client"
import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
// OLD custom button: import Button from "./Elements/Button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/app/lib/utils";
import LoaderSpinner from "./Elements/LoaderSpinner";
import { useSelector } from 'react-redux';
import MyTaskFileUploadArea from "../MyTaskFileUploadArea";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Select from "react-select";
import { TaskType } from "@/config/constants";

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
  loadingIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
};

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const DueDatePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-start !bg-background font-normal !text-secondary-foreground sm:w-[220px]"
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        {selected ? (
          selected.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        ) : (
          <span className="text-muted-foreground">Pick a due date</span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        initialFocus={false}
      >
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          disabled={{ before: today }}
          onSelect={(date) => {
            if (date) {
              onChange(toISODate(date));
              setOpen(false);
            }
          }}
          className="hidden-scrollbar text-secondary-foreground"
          classNames={{
            month_caption: "flex items-center justify-center h-9 w-full px-2",
            dropdowns: "flex items-center gap-1.5 !text-secondary-foreground",
            caption_label:
              "select-none font-medium !text-secondary-foreground flex items-center gap-1 pl-2 pr-1 h-8 rounded-md [&>svg]:text-muted-foreground [&>svg]:size-3.5",
            dropdown_root:
              "relative border border-input rounded-md bg-background has-focus:ring-ring/50 has-focus:ring-[3px]",
            dropdown:
              "hidden-scrollbar bg-popover absolute inset-0 opacity-0 cursor-pointer !text-secondary-foreground [&>option]:bg-popover [&>option]:!text-foreground",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

const CreateTaskPopUp = ({ onClose, user = null, onTaskCreated, task = null, onTaskUpdated = () => { }, allowedCheckLists = [] }) => {
  const isForImport = false;
  const params = useParams();
  const [submitLoading, setSubmitLoading] = useState(false)
  const [filesUploaded, setFilesUploaded] = useState([])
  const [resetUpload, setResetUpload] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userID: "",
    title: task?.title || "",
    description: task?.description || "",
    dueDate: task?.dueDate
      ? new Date(task?.dueDate).toISOString().split("T")[0]
      : "",
    type: task?.type || TaskType.GENERAL,
    checkList: null
  });
  const [checkLists, setCheckLists] = useState([]);
  const [checkListData, setCheckListData] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const { data: loggedInUser } = useSelector((state) => state.user);

  const handleFileChange = (fileList) => {
    setFilesUploaded(fileList);
  };

  const handleRequestSignature = async (fileId) => {
    try {
      const signers = [
        {
          signerEmail: user ? user?.email : formData?.userID?.email,
          signerId: user ? user?.id : formData?.userID?.id,
        },
      ];

      const response = await fetchWrapper(
        "/api/box/e-sign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: fileId,
            signers,
            boxUserId: user ? user?.boxUserId : formData?.userID?.boxUserId,
            portal: params.portalid || "root",
            onSameDoc: false,
          }),
        },
        "esign-request"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send e-sign request");
      }

      return data;
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateDuplicateFiles = async (duplicateFiles) => {
    try {
      let destinationFolder = user ? user?.folderId : formData?.userID?.folderId;

      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: duplicateFiles,
          destinationFolderId: destinationFolder,
          userId: user ? user?.boxUserId : formData?.userID?.boxUserId,
        }),
      };

      const response = await fetchWrapper(
        "/api/box/files/duplicate",
        requestOptions,
        "upload-file"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload files");
      }
      return data
    } catch (error) {
      toast.error(error.message);
      console.error("Error uploading files:", error);
    }
  };

  console.log("formData", formData)
  console.log("filesUploaded", filesUploaded)

  const handleEdit = async () => {
    try {
      setSubmitLoading(true);
      let fileIds;
      let filedata;
      const filterFiles = filesUploaded?.filter((file) => !file?.id);
      if (filterFiles.length > 0) {
        const uploadData = new FormData();
        filterFiles.forEach((file) => {
          uploadData.append("file", file);
        });

        uploadData.append("boxFolderId", user?.folderId);
        uploadData.append("email", user?.email);
        uploadData.append("userId", user?.boxUserId);

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const fileResponse = await fetchWrapper(
          "/api/box/files",
          requestOptions,
          "upload-file"
        );

        filedata = await fileResponse.json();
        if (filedata?.duplicateFiles?.length > 0) {
          filedata = await handleCreateDuplicateFiles(
            filedata?.duplicateFiles
          );
        }

        let esignData;

        if (filedata?.files?.length > 0) {
          esignData = await handleRequestSignature(filedata?.files[0]?.id);
        }

        fileIds = esignData?.data?.map((item) => item.id) || [];
      }

      const url = `/api/tasks`;
      const payload = {
        taskId: task?.id,
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate),
        type: formData.type,
        checklist: formData?.checkList?.id
      };
      if (fileIds?.length > 0) {
        payload.uploads = fileIds
      }
      if (filedata?.files?.length > 0) {
        payload.file = {
          id: filedata?.files[0]?.id,
          name: filedata?.files[0]?.name,
          description: filedata?.files[0]?.description,
          size: filedata?.files[0]?.size,
        };
      }
      console.log("payload", payload);
      const response = await fetchWrapper(
        url,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        "update-task"
      );
      if (!response.ok) throw new Error("Something went wrong!!");
      const data = await response.json();
      await onTaskCreated();
      toast.success("Task Updated Successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitLoading(false);
      onClose();
      onTaskUpdated();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      let fileIds;
      let filedata;
      const filterFiles = filesUploaded?.filter((file) => !file?.id)
      if (filterFiles.length > 0) {
        const uploadData = new FormData();
        filterFiles.forEach((file) => {
          uploadData.append("file", file);
        })

        uploadData.append("boxFolderId", formData?.userID?.folderId);
        uploadData.append("email", formData?.userID?.email);
        uploadData.append("userId", formData?.userID?.boxUserId);

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const fileResponse = await fetchWrapper(
          "/api/box/files",
          requestOptions,
          "upload-file"
        );

        filedata = await fileResponse.json();
        if (filedata?.duplicateFiles?.length > 0) {
          filedata = await handleCreateDuplicateFiles(filedata?.duplicateFiles)
        }

        let esignData;

        if (filedata?.files?.length > 0) {
          esignData = await handleRequestSignature(filedata?.files[0]?.id);
        }

        fileIds = esignData?.data?.map((item) => item.id) || [];
      }

      const url = `/api/tasks`
      const payload = {
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate),
        type: formData.type,
        user: user ? user?.id : formData.userID?.id,
        createdBy: loggedInUser?.id,
        uploads: fileIds || [],
        portalId: params.portalid || "root",
        checklist: formData?.checkList?.id
      };
      if (filedata?.files?.length > 0) {
        payload.file = {
          id: filedata?.files[0]?.id,
          name: filedata?.files[0]?.name,
          description: filedata?.files[0]?.description,
          size: filedata?.files[0]?.size,
        }
      }
      console.log("payload", payload)
      const response = await fetchWrapper(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        "create-task"
      );
      if (!response.ok) throw new Error("Something went wrong!!");
      const data = await response.json();
      await onTaskCreated();
      toast.success("Task Created Successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitLoading(false);
      onClose()
    }
  };

  const handleCreate = async () => {
    console.log("handleCreate triggered 🚀");
    if (task?.id) {
      await handleEdit();
    } else {
      await handleSubmit();
    }
  };
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const url = params.portalid
        ? `/api/users?portalid=${params.portalid || "root"}`
        : "/api/users";
      const response = await fetchWrapper(url, {}, "fetch-user-list");
      if (!response.ok) throw new Error("Download failed");
      const data = await response.json();
      console.log("UsersList:", data);
      setUsersList(data);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChecklists = async () => {
    try {
      setIsChecklistLoading(true);
      const url = `/api/checklists?portalId=${params.portalid || "root"}`;

      const response = await fetchWrapper(url, {}, "fetch-checklist");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed fetch checklists");
      setCheckListData(data?.data);
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsChecklistLoading(false);
    }
  };

  useEffect(() => {
    const users = usersList.map((user) => ({
      ...user,
      value: user.boxUserId,
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim()} (${user.email})`,
    }));
    setUsers(users);

  }, [usersList]);

  useEffect(() => {
    let checklists;
    if (allowedCheckLists.length > 0) {
      checklists = allowedCheckLists.map((checkList) => ({
        ...checkList,
        value: checkList.id,
        label: `${checkList.name}`,
      }));
    } else {
      const activeChecklists = checkListData.filter((checkList) => checkList.isActive);

      checklists = (activeChecklists.length > 0 ? activeChecklists : checkListData).map((checkList) => ({
        ...checkList,
        value: checkList.id,
        label: checkList.name,
      }));
    }

    setCheckLists(checklists);
    if (task) {
      setFormData((prev) => ({
        ...prev,
        checkList: {
          ...task?.checklist,
          value: task?.checklist?.id,
          label: task?.checklist?.name
        }
      }))
    }
  }, [checkListData]);

  useEffect(() => {
    fetchUser();
    fetchChecklists();
  }, [])
  console.log("users:", users);


  const taskTypeOptions = [
    { value: TaskType.GENERAL, label: "General" },
    { value: TaskType.SIGN, label: "Signature" },
    { value: TaskType.UPLOAD, label: "Upload" },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="mx-auto w-[calc(100%-2rem)] max-w-[800px] sm:max-w-[800px] max-h-[90vh] gap-0 overflow-hidden rounded-lg p-0"
      >
        <DialogHeader className="flex flex-row justify-between items-center mb-4 border-b border-border py-4 px-6">
          <DialogTitle className="text-xl text-foreground font-semibold">{task ? "Edit" : "Create"} Task</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <form className="space-y-4 px-6 pb-6 max-h-[80vh] overflow-y-scroll hidden-scrollbar">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground">
              Please select Task Type
            </Label>
            <div className="flex gap-3 mt-1 pl-2 ">
              {taskTypeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  className={cn(
                    "hover:border-primary px-3 py-3",
                    formData.type === option.value
                      ? "text-secondary-foreground border-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setFormData((prev) => ({ ...prev, type: option.value }))}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          {!user && (
            <div className="flex w-full flex-col space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Select User
              </Label>
              <Select
                className="w-full"
                classNamePrefix="task-select"
                styles={reactSelectStyles}
                isClearable={true}
                isSearchable={true}
                value={formData.userID || null}
                onChange={(selectedOption) =>
                  setFormData((prev) => ({
                    ...prev,
                    userID: selectedOption || null,
                  }))
                }
                options={users}
                placeholder="Create task for..."
                loadingMessage={() => "Fetching users..."}
                isLoading={isLoading}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                required
              />
            </div>
          )}
          {user && user?.id && (
            <div className="w-full space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Selected User
              </Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="text-sm text-foreground">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim()} (
                  {user?.email})
                </div>
              </div>
            </div>
          )}
          {!task && !task?.checklist && (
            <div className="flex w-full flex-col space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Select Check List
              </Label>
              <Select
                className="w-full"
                classNamePrefix="task-select"
                styles={reactSelectStyles}
                isClearable={true}
                isSearchable={true}
                value={formData?.checkList || null}
                onChange={(selectedOption) =>
                  setFormData((prev) => ({
                    ...prev,
                    checkList: selectedOption || null,
                  }))
                }
                options={checkLists}
                placeholder="Create task in checklist"
                loadingMessage={() => "Fetching checklists..."}
                isLoading={isChecklistLoading}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                required
              />
            </div>
          )}
          {task && task?.checklist && (
            <div className="w-full space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Selected Check List
              </Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="text-sm text-foreground">
                  {task?.checklist?.name}
                </div>
              </div>
            </div>
          )}
          {
            formData.type && (
              <div className="z-10">
                <Label className="block text-sm font-medium text-muted-foreground">
                  Task Title
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.title}
                  className="mt-1 h-auto py-2 text-secondary-foreground !bg-background"
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
            )
          }
          {
            formData.type && (
              <div className="z-10">
                <Label className="block text-sm font-medium text-muted-foreground">
                  Task Description
                </Label>
                <Textarea
                  required
                  value={formData.description}
                  className="mt-1 text-secondary-foreground max-h-40 overflow-y-auto !bg-background"
                  rows="4"
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                ></Textarea>
              </div>
            )
          }

          {
            formData.type === TaskType.SIGN && (
              <div className="z-10">
                <Label className="block text-sm font-medium text-muted-foreground pb-1">
                  Document
                </Label>
                <MyTaskFileUploadArea reset={resetUpload} isForImport={isForImport} onFileChange={handleFileChange} from={"tasks"} existingFilesToShow={task?.file ? [task?.file] : []} />
              </div>
            )
          }

          {
            formData.type && (
              <div className="z-10">
                <Label className="block text-sm font-medium text-muted-foreground pb-1">
                  Due Date
                </Label>
                <DueDatePicker
                  value={formData.dueDate}
                  onChange={(dueDate) =>
                    setFormData((prev) => ({ ...prev, dueDate }))
                  }
                />
              </div>
            )
          }

          <div className=" flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-3 py-3"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-3"
              onClick={handleCreate}
              disabled={submitLoading || !formData.type || !formData.title || !formData.description || !formData.checkList || (formData?.type === TaskType.SIGN && filesUploaded.length === 0)}
            >
              {submitLoading ? (
                <LoaderSpinner size={20} />
              ) : (
                task ? "Save" : "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskPopUp;