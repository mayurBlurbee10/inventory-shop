import {
  X,
  Phone,
  FileSearch,
  Calculator,
  Upload,
  Image,
  Video,
  File,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function TechSupport({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    issueType: "",
    message: "",
    project: "universal_portal",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: user } = useSelector((state) => state.user);
  const { data: portal } = useSelector((state) => state.portal);

  const handleModalClose = () => {
    setFormData({
      issueType: "",
      message: "",
      project: "universal_portal",
    });
    setUploadedFiles([]);
    setError("");
    onClose();
  };

  const handleFormChange = (key, val) => {
    setFormData({
      ...formData,
      [key]: val,
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only PDF, images, and videos are allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    // Store files directly for FormData submission
    setUploadedFiles(prev => [...prev, ...validFiles]);
    setError("");
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const submitterEmail = user?.email || '';
      const submitterName = user?.firstName + ' ' + user?.lastName || '';

      // Create FormData for multipart/form-data submission
      const requestData = new FormData();
      requestData.append('subject', formData.issueType);
      requestData.append('message', `${formData.message}`);
      requestData.append('submitterEmail', submitterEmail);
      requestData.append('submitterName', submitterName);
      requestData.append('project', formData.project);

      // Append files to FormData
      uploadedFiles.forEach(file => {
        requestData.append('files', file);
      });

      // Call backend Zendesk API
      const response = await fetchWrapper('/api/zendesk', {
        method: 'POST',
        body: requestData // Browser sets Content-Type automatically for FormData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setError('');
        setLoading(false);
        handleModalClose();
        toast.success('Support ticket created successfully!');
      } else {
        throw new Error(result.error || 'Failed to create ticket');
      }

    } catch (error) {
      console.error('Error submitting to Zendesk:', error);
      setError('Failed to submit support request. Please try again.');
    } finally {
      setLoading(false);
      setUploadedFiles([]);
      setError('');
    }
  };

  const handleActionButton = (action) => {
    console.log(`${action} button clicked`);
    // Add your action handling logic here
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) handleModalClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 p-0 sm:w-full sm:max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Tech Support
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm">
              We're here to help! Our team typically responds within 24 hours.
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleModalClose}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="h-[60vh] max-h-[500px] overflow-auto p-4 sm:p-6">
          {error && (
            <Alert variant="destructive" className="mb-6 border-destructive/30">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                name="message"
                required
                rows="4"
                className="block w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.message}
                onChange={(e) => handleFormChange("message", e.target.value)}
                placeholder="Please describe your issue or request..."
              ></textarea>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type</Label>
              <Select
                value={formData.issueType}
                onValueChange={(value) => handleFormChange("issueType", value)}
              >
                <SelectTrigger id="issueType" className="h-12 w-full !bg-background">
                  <SelectValue placeholder="Select Issue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">Bug Report</SelectItem>
                  <SelectItem value="Feature">Feature Request</SelectItem>
                  <SelectItem value="Task">General Request</SelectItem>
                  <SelectItem value="User Story">Technical Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary-solid">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.wmv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer flex-col items-center"
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    PDF, Images, Videos (MAX. 50MB)
                  </span>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-success"></div>
                    <span className="text-sm font-semibold text-foreground">
                      Uploaded file{uploadedFiles.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    {uploadedFiles.map((file, index) => {
                      const fileIcon = file.type.startsWith("image/") ? (
                        <Image />
                      ) : file.type.startsWith("video/") ? (
                        <Video />
                      ) : (
                        <File />
                      );

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4 shadow-sm transition-all duration-200 hover:border-foreground/20 hover:shadow-md"
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <div className="text-2xl text-muted-foreground">
                              {fileIcon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {file.name}
                              </p>
                              <div className="mt-1 flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </span>
                                <span className="text-xs text-muted-foreground/60">
                                  •
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {file.type.split("/")[1]?.toUpperCase() ||
                                    "FILE"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <AppTooltip label="Remove file">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeFile(index)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Remove file"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AppTooltip>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={loading}
                className="px-3 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.issueType || !formData.message}
                className="px-3 py-3"
              >
                {loading && (
                  <LoaderSpinner size={16} className="text-current" />
                )}
                Submit Request
              </Button>
            </div>
          </form>

          <div className="border-t border-border pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Or choose one of these quick options:
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handleActionButton("quote")}
                className="px-3 py-3"
              >
                <Calculator className="h-4 w-4" />
                Get Quote
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleActionButton("call")}
                className="px-3 py-3"
              >
                <Phone className="h-4 w-4" />
                Call Us
              </Button>
              <Button
                variant="outline"
                onClick={() => handleActionButton("status")}
                className="px-3 py-3"
              >
                <FileSearch className="h-4 w-4" />
                Project Status
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TechSupport;
