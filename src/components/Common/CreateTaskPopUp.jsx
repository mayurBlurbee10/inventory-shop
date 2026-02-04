"use client"
import React, { useEffect, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import Button from "../Common/Elements/Button";
import { useSelector, useDispatch } from 'react-redux';
import MyTaskFileUploadArea from "../MyTaskFileUploadArea";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Select from "react-select";
import { TaskType, UserRole } from "@/config/constants";

const CreateTaskPopUp = ({ onClose, user = null, onTaskCreated, task=null, onTaskUpdated = () => {}, allowedCheckLists=[] }) => {
    const isForImport = false;
    const params = useParams();
    const [submitLoading, setSubmitLoading] = useState(false) 
    const [selectedType, setSelectedType] = useState(TaskType.SIGN)
    const [discription, setDiscription] = useState("");
    const [title, setTitle] = useState("");
    const [filesUploaded, setFilesUploaded]=useState([])
    const [resetUpload, setResetUpload] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [users, setUsers] = useState([]);
    const [userID, setUserID] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
      userID: "",
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate
      ? new Date(task?.dueDate).toISOString().split("T")[0]
      : "",
      type: task?.type || TaskType.GENERAL,
      checkList : null
    });
    const [checkLists, setCheckLists] = useState([]);
    const [checkListData, setCheckListData] = useState([]);
    const [isChecklistLoading, setIsChecklistLoading] = useState(false);
    const { data : loggedInUser } = useSelector((state)=> state.user);
   
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
          checklist : formData?.checkList?.id
        };
        if(fileIds?.length > 0){
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
       if(filterFiles.length > 0){
        const uploadData = new FormData();
          filterFiles.forEach((file)=>{
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
        if(filedata?.duplicateFiles?.length > 0){
            filedata = await handleCreateDuplicateFiles(filedata?.duplicateFiles)
        }
 
        let esignData;

        if (filedata?.files?.length > 0) {
            esignData = await handleRequestSignature(filedata?.files[0]?.id);
        } 

            fileIds = esignData?.data?.map((item) => item.id) || [];
       }

        const url =`/api/tasks`
        const payload = {
          title: formData.title,
          description: formData.description,
          dueDate: new Date(formData.dueDate),
          type: formData.type,
          user: user ? user?.id : formData.userID?.id,
          createdBy: loggedInUser?.id,
          uploads: fileIds || [],
          portalId: params.portalid || "root",
          checklist : formData?.checkList?.id
        };
        if (filedata?.files?.length > 0) {
          payload.file =  {
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
    
    const handleTaskSelection =(type) => {
        setSelectedType(type);
    }

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
        label: `${user.name} (${user.email})`,
      }));
  
      // const loggedInUserId = loggedInUser?.boxUserId;
  
      // const filteredUsers = users.filter((user) => user.role !== UserRole.MODERATOR);
  
      setUsers(users);

    }, [usersList]);

  useEffect(() => {
    let checklists;
    if(allowedCheckLists.length > 0){
       checklists = allowedCheckLists.map((checkList) => ({
        ...checkList,
        value: checkList.id,
        label: `${checkList.name}`,
      }));
    }else {
      const activeChecklists = checkListData.filter((checkList) => checkList.isActive);

      checklists = (activeChecklists.length > 0 ? activeChecklists : checkListData).map((checkList) => ({
        ...checkList,
        value: checkList.id,
        label: checkList.name,
      }));
    }

    setCheckLists(checklists);
    if(task){
      setFormData((prev) => ({
        ...prev, 
        checkList : {
          ...task?.checklist,
          value : task?.checklist?.id,
          label : task?.checklist?.name
        }
      }))
    }
  }, [checkListData]);

  useEffect(() => {
   fetchUser();
   fetchChecklists();
  }, [])
  console.log("users:", users);
  
  
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg w-full max-w-[800px] ">
                <div className="flex justify-between items-center mb-4 border-b py-4 px-6">
                    <h2 className="text-xl text-gray-800 font-semibold">{task ? "Edit" : "Create"} Task</h2>
                    <button
                        className="p-1 hover:bg-gray-100 rounded-full text-black"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                  <form className="space-y-4 px-6 pb-6 max-h-[80vh] overflow-y-scroll hidden-scrollbar">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                           Please select Task Type
                        </label>
                        <div className="flex gap-3 mt-1 pl-2 ">
                            <div
                                className={`border py-2 px-3 flex items-center justify-center gap-3 rounded-lg cursor-pointer hover:border-[#0061D5] ${formData.type === TaskType.GENERAL ? "text-[#0061D5] border-[#0061D5]": "text-black"}`}
                                onClick={() => setFormData((prev)=>({...prev, type : TaskType.GENERAL}))}
                            >
                                General
                            </div>
                            <div
                                className={`border py-2 px-3 flex items-center justify-center gap-3 rounded-lg cursor-pointer hover:border-[#0061D5] ${formData.type === TaskType.SIGN ? "text-[#0061D5] border-[#0061D5]": "text-black"}`}
                                onClick={() => setFormData((prev)=>({...prev, type : TaskType.SIGN}))}
                            >
                                Signature
                            </div>
                            <div
                                className={`border py-2 px-3 flex items-center justify-center gap-3 rounded-lg cursor-pointer hover:border-[#0061D5] ${formData.type === TaskType.UPLOAD ? "text-[#0061D5] border-[#0061D5]": "text-black"}`}
                                onClick={() => setFormData((prev)=>({...prev, type : TaskType.UPLOAD}))}
                            >
                                Upload
                            </div>
                        </div>
                    </div>
                    {!user && (
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 pb-1">
                          Select User
                        </label>
                        <div>
                          <Select
                            className="flex-1 bg-white text-[#495057] text-sm focus:outline-none w-full"
                            isClearable={true}
                            isSearchable={true}
                            value={formData.userID}
                            onChange={(selectedOption) => setFormData((prev) => ({ ...prev, userID: selectedOption || null }))}
                            options={users}
                            placeholder="Create task for..."
                            loadingMessage={() => "Fetching users..."}
                            isLoading={isLoading}
                            required
                          />
                        </div>
                      </div>
                    )}
                    {user && user?.id && (
                      <div className="w-full">
                        <label className="block text-sm text-gray-600 mb-1">Selected User</label>
                        <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 bg-white">
                          <div className="text-sm text-[#495057]">
                            {user?.name} ({user?.email})
                          </div>
                        </div>
                    </div>
                    )}
                    {!task && !task?.checklist && (
                      <div className="flex flex-col">
                          <label className="block text-sm font-medium text-gray-700 pb-1">
                            Select Check List
                          </label>
                          <div>
                            <Select
                              className="flex-1 bg-white text-[#495057] text-sm focus:outline-none w-full"
                              isClearable={true}
                              isSearchable={true}
                              value={formData?.checkList}
                              onChange={(selectedOption) => setFormData((prev) => ({ ...prev, checkList: selectedOption || null }))}
                              options={checkLists}
                              placeholder="Create task in checklist"
                              loadingMessage={() => "Fetching checklists..."}
                              isLoading={isChecklistLoading}
                              required
                            />
                          </div>
                      </div>
                    )}
                    {task && task?.checklist && (
                      <div className="w-full">
                        <label className="block text-sm text-gray-600 mb-1">Selected Check List</label>
                        <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 bg-white">
                          <div className="text-sm text-[#495057]">
                            {task?.checklist?.name}
                          </div>
                        </div>
                    </div>
                    )}
                    {
                        formData.type &&  (
                            <div className="z-10">
                                <label className="block text-sm font-medium text-gray-700">
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                                    onChange={(e) => setFormData((prev)=>({...prev, title : e.target.value}))}
                                />
                            </div>
                        )
                    }
                    {
                        formData.type && (
                            <div className="z-10">
                                <label className="block text-sm font-medium text-gray-700">
                                    Task Description
                                </label>
                                <textarea
                                    required
                                    value={formData.description}
                                    className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500 max-h-40 overflow-y-auto"
                                    rows="4"
                                    onChange={(e) => setFormData((prev)=>({...prev, description : e.target.value}))}
                                ></textarea>
                            </div>
                        )
                    }

                    {
                        formData.type === TaskType.SIGN && (
                            <div className="z-10">
                                <label className="block text-sm font-medium text-gray-700 pb-1">
                                    Document
                                </label>
                                <MyTaskFileUploadArea reset ={resetUpload} isForImport={isForImport} onFileChange={handleFileChange} from={"tasks"} existingFilesToShow={task?.file ? [task?.file] : []}/>
                            </div>
                        )
                    }

                    {
                        formData.type && (
                            <div className="z-10">
                                <label className="block text-sm font-medium text-gray-700 pb-1">
                                    Due Date
                                </label>
                                <input 
                                  type="date" 
                                  min={new Date().toISOString().split("T")[0]} 
                                  className="border p-2 font-medium text-gray-700 rounded-lg outline-none" 
                                  value={formData.dueDate}
                                  onChange={(e) => setFormData((prev)=>({...prev, dueDate : e.target.value}))} 
                                />
                            </div>
                        )
                    }

                    <div className=" flex gap-3 justify-end">
                        <Button
                            type="Secondary"
                            label="Cancel"
                            onClick={onClose}
                        />
                        <Button
                            type="Primary"
                            label={task ? "Save" : "Submit"}
                            onClick={handleCreate}
                            isLoading={submitLoading}
                            disabled={!formData.type || !formData.title || !formData.description || !formData.checkList || (formData?.type === TaskType.SIGN && filesUploaded.length === 0)}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskPopUp;