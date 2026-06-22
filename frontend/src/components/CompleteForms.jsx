import { Dialog, DialogBackdrop } from "@headlessui/react";
import { File, UploadCloud, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import MyTaskFileUploadArea from "./MyTaskFileUploadArea";
import { toast } from "react-toastify";
import Button from "./Common/Elements/Button";


const CompleteForms = ({ isOpen, onClose }) => {
    const [additionalInfo, setAdditionalInfo] = useState("");
    const isForImport = false;
    const [filesUploadedForW2, setFilesUploadedForW2] = useState(false);
    const [filesUploadedFor1099, setFilesUploadedFor1099] = useState(false);
    const [filesUploadedFor1040, setFilesUploadedFor1040] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleFileChangeForW2 = (fileList) => {
        // Check if any files are selected
        setFilesUploadedForW2(fileList.length > 0);
    };
    const handleFileChangeFor1099 = (fileList) => {
        // Check if any files are selected
        setFilesUploadedFor1099(fileList.length > 0);
    }; const handleFileChangeFor1040 = (fileList) => {
        // Check if any files are selected
        setFilesUploadedFor1040(fileList.length > 0);
    };

    const isFormValid =
        filesUploadedForW2 &&
        filesUploadedFor1099 &&
        filesUploadedFor1040 &&
        additionalInfo.trim();

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setTimeout(() => {
            setSubmitLoading(false);
            onClose();
            toast.success("Form Submitted Successfully");
        }, 2000)
        setAdditionalInfo("");
        console.log("form submitted successfully");
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50 ">
            <DialogBackdrop className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center p-4 font-lato">
                <Dialog.Panel className="mx-auto max-w-[760px] h-[550px] sm:h-auto overflow-auto bg-white p-6 shadow-xl rounded-lg">

                    <div className="flex justify-between items-center mb-4 relative">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-black font-semibold text-xl">
                                Upload tax forms
                            </h1>
                            <p className="text-gray-700 text-sm">
                                Your forms will be shared securely with your advisor only.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute top-0 right-0 text-gray-400 hover:text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form>
                        <div className="border border-gray-300 rounded-lg p-4 max-h-[350px] sm:max-h-[500px]      overflow-auto custom-scrollbar ">
                            <div className="space-y-5 mb-5">
                                <h1 className="text-black font-semibold text-xl">Upload W - 2</h1>
                                <MyTaskFileUploadArea isForImport={isForImport} onFileChange={handleFileChangeForW2} />
                            </div>
                            <div className="space-y-5 mb-5">
                                <h1 className="text-black font-semibold text-xl">Upload 1099</h1>
                                <MyTaskFileUploadArea isForImport={isForImport} onFileChange={handleFileChangeFor1099} />
                            </div>
                            <div className="space-y-5 mb-5">
                                <h1 className="text-black font-semibold text-xl">Upload 1040</h1>
                                <MyTaskFileUploadArea isForImport={isForImport} onFileChange={handleFileChangeFor1040} />
                            </div>
                            <div className="space-y-5">
                                <p className="font-semibold text-sm text-black">
                                    Is there anything else we should know about that might affect your tax situation? <span className="text-red-500"> * </span>
                                </p>
                                <textarea
                                    name="input"
                                    className="w-full sm:w-1/2 min-h-[70px] rounded-md focus:outline-none placeholder:text-sm placeholder:text-gray-600 border border-gray-400 py-1 px-3 resize-none text-sm overflow-auto custom-scrollbar text-gray-700"
                                    placeholder="Enter a response"
                                    onChange={(e) => setAdditionalInfo(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-2 w-full flex justify-end mt-2">
                            <Button
                                buttonType="submit"
                                type="Primary"
                                label="Submit"
                                onClick={handleSubmit}
                                disabled={!isFormValid}
                                isLoading={submitLoading}
                            />
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default CompleteForms;