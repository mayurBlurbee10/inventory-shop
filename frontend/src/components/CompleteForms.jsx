import { File, UploadCloud, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import MyTaskFileUploadArea from "./MyTaskFileUploadArea";
import { toast } from "react-toastify";
import Button from "./Common/Elements/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const CompleteForms = ({ isOpen, onClose }) => {
    const [additionalInfo, setAdditionalInfo] = useState("");
    const isForImport = false;
    const [filesUploadedForW2, setFilesUploadedForW2] = useState(false);
    const [filesUploadedFor1099, setFilesUploadedFor1099] = useState(false);
    const [filesUploadedFor1040, setFilesUploadedFor1040] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleFileChangeForW2 = (fileList) => {
        setFilesUploadedForW2(fileList.length > 0);
    };
    const handleFileChangeFor1099 = (fileList) => {
        setFilesUploadedFor1099(fileList.length > 0);
    };
    const handleFileChangeFor1040 = (fileList) => {
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-[760px] max-h-[90vh] overflow-y-auto bg-background p-6 font-lato"
                overlayClassName="bg-black/30"
                showCloseButton={false}
            >
                <div className="flex justify-between items-center mb-4 relative">
                    <div className="flex flex-col gap-2">
                        <DialogTitle className="text-foreground font-semibold text-xl">
                            Upload tax forms
                        </DialogTitle>
                        <p className="text-muted-foreground text-sm">
                            Your forms will be shared securely with your advisor only.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 text-muted-foreground hover:text-foreground transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form>
                    <div className="border border-border rounded-lg p-4 max-h-[350px] sm:max-h-[500px] overflow-auto custom-scrollbar bg-card">
                        <div className="space-y-5 mb-5">
                            <h1 className="text-foreground font-semibold text-xl">Upload W - 2</h1>
                            <MyTaskFileUploadArea isForImport={isForImport} onFileChange={handleFileChangeForW2} />
                        </div>
                        <div className="space-y-5 mb-5">
                            <h1 className="text-foreground font-semibold text-xl">Upload 1099</h1>
                            <MyTaskFileUploadArea isForImport={isForImport} onFileChange={handleFileChangeFor1099} />
                        </div>
                        <div className="space-y-5 mb-5">
                            <h1 className="text-foreground font-semibold text-xl">Upload 1040</h1>
                            <MyTaskFileUploadArea isForImport={isForImport} onFileChange={handleFileChangeFor1040} />
                        </div>
                        <div className="space-y-5">
                            <p className="font-semibold text-sm text-foreground">
                                Is there anything else we should know about that might affect your tax situation? <span className="text-destructive"> * </span>
                            </p>
                            <textarea
                                name="input"
                                className="w-full sm:w-1/2 min-h-[70px] rounded-md focus:outline-none placeholder:text-sm placeholder:text-muted-foreground border border-border bg-background py-1 px-3 resize-none text-sm overflow-auto custom-scrollbar text-foreground"
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
            </DialogContent>
        </Dialog>
    );
};

export default CompleteForms;