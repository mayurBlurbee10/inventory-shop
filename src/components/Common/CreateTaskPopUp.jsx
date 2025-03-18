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
import { TaskType } from "@/config/constants";

const CreateTaskPopUp = ({ onClose, user, onTaskCreated }) => {
    const isForImport = false;
    const params = useParams();
    const [submitLoading, setSubmitLoading] = useState(false) 
    const [selectedType, setSelectedType] = useState(TaskType.SIGN)
    const [discription, setDiscription] = useState("");
    const [title, setTitle] = useState("");
    const [filesUploaded, setFilesUploaded]=useState(false)
    const [resetUpload, setResetUpload] = useState(false);
    const [formData, setFormData] = useState({
        title : "",
        description : "",
        dueDate : "",
        type : TaskType.SIGN,

    })
    const { data : loggedInUser } = useSelector((state)=> state.user);
   
    const handleFileChange = (fileList) => {
        setFilesUploaded(fileList);
        
    };

    const handleRequestSignature = async (fileId) => {
      try {
        const signers = [
          {
            signerEmail: user?.email,
            signerId: user?.id,
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
              boxUserId: user?.boxUserId,
              portal: params.portalid,
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
         let destinationFolder = user?.folderId;

         const requestOptions = {
           method: "POST",
           body: JSON.stringify({
             items: duplicateFiles,
             destinationFolderId: destinationFolder,
             userId: user?.boxUserId,
           }),
         };

         const response = await fetchWrapper(
           "/api/box/files/duplicate",
           requestOptions,
           "uploadFile"
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

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setSubmitLoading(true);
        let fileIds;
       if(filesUploaded.length > 0){
        const uploadData = new FormData();
        filesUploaded.forEach((file)=>{
            uploadData.append("file", file);
        })

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
           "uploadFile"
         );
        
        let filedata = await fileResponse.json();
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
            title : formData.title,
            description : formData.description,
            dueDate : new Date(formData.dueDate),
            type : formData.type,
            user : user?.id,
            createdBy : loggedInUser?.id,
            uploads : fileIds || [],
            portalId : params.portalid,
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-[800px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl text-gray-800 font-semibold">Create Task</h2>
                    <button
                        className="text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                           Please select Task Type
                        </label>
                        <div className="flex gap-3 mt-1 pl-2 ">
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
                                <MyTaskFileUploadArea reset ={resetUpload} isForImport={isForImport} onFileChange={handleFileChange} from={"tasks"}/>
                            </div>
                        )
                    }

                    {
                        formData.type && (
                            <div className="z-10">
                                <label className="block text-sm font-medium text-gray-700 pb-1">
                                    Due Date
                                </label>
                                <input required type="date" min={new Date().toISOString().split("T")[0]} className="border p-2 font-medium text-gray-700 rounded-lg outline-none" onChange={(e) => setFormData((prev)=>({...prev, dueDate : e.target.value}))} />
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
                            buttonType="submit"
                            type="Primary"
                            label="Submit"
                            isLoading={submitLoading}
                            disabled={!formData.type || (formData?.type === TaskType.SIGN && !filesUploaded.length)}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskPopUp;