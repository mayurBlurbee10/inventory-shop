import { X, Phone, FileSearch, Calculator, Upload, Image, Video, File, XCircle } from "lucide-react";
import React, { useState } from "react";
import Button from "./Common/Elements/Button";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function TechSupport({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
    issueType: "bug",
    message: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {data:user}=useSelector((state) => state.user);

  const handleModalClose = () => {
    setFormData({
      issueType: "bug",
      message: "",
    });
    setUploadedFiles([]);
    setError("");
    onClose();
  };

  const handleFormChange = (key, val) => {
    if (!key || !val) return;
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
      requestData.append('message', formData.message);
      requestData.append('submitterEmail', submitterEmail);
      requestData.append('submitterName', submitterName);
      
      // Append files to FormData
      uploadedFiles.forEach(file => {
        requestData.append('files', file);
      });

      // Call backend Zendesk API
      const response = await fetch('/api/zendesk', {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl m-2">
        <div className="flex justify-between items-center relative border-b p-4">
          <div className="w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl text-gray-800 font-bold">Tech Support</h2>
              <button
                onClick={handleModalClose}
                className="text-gray-600 hover:bg-gray-100 transition-colors p-1 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div> 
            <p className="text-gray-600 mt-2 text-sm">
              We're here to help! Our team typically responds within 24 hours.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}
        <div className="p-4 sm:p-6 h-[60vh] max-h-[500px] overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                className="block w-full rounded-lg border border-solid border-gray-200 text-gray-600 focus:border-blue-500 focus:ring-blue-500 h-11 ps-2 outline-none"
                value={formData.issueType}
                onChange={(e) => handleFormChange("issueType", e.target.value)}
              >
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="request">General Request</option>
                <option value="support">Technical Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                required
                rows="4"
                className="block w-full rounded-lg border-gray-200 border border-solid outline-none focus:border-blue-500 focus:ring-blue-500 p-3 text-gray-700 resize-none"
                value={formData.message}
                onChange={(e) => handleFormChange("message", e.target.value)}
                placeholder="Please describe your issue or request..."
              ></textarea>
            </div>

              <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, Images, Videos (MAX. 50MB)
                </span>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="">
                  {uploadedFiles.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-gray-700">
                             Uploaded file{uploadedFiles.length > 1 ? 's' : ''}
                          </span>
                        </div>
                       
                      </div>

                      <div className="w-full flex flex-col gap-2">
                        {uploadedFiles.map((file, index) => {
                          const fileIcon = file.type.startsWith('image/') ? <Image/> :
                            file.type.startsWith('video/') ? <Video/> :
                              file.type === 'application/pdf' ? <File/> : <File/>;

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3 flex-1 ">
                                <div className="text-2xl text-gray-600">{fileIcon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">
                                    {file.name}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {formatFileSize(file.size)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      •
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Remove file"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

            <div className="flex justify-end space-x-4">
              <Button
                onClick={handleModalClose}
                disabled={loading}
                type="Secondary"
                label="Cancel"
              />
              {/* <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button> */}
              <Button
                buttonType="submit"
                disabled={loading}
                isLoading={loading}
                type="Primary"
                label="Submit Request"
              />
            </div>
          </form>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-600 mb-4 text-sm">
              Or choose one of these quick options:
            </p>
            <div className="grid grid-cols-3 gap-4">
              {/* <button
              onClick={() => handleActionButton('quote')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Calculator className="h-5 w-5" />
              <span>Get Quote</span>
            </button> */}
              <Button
                onClick={() => handleActionButton('quote')}
                icon={Calculator}
                type="Secondary"
                label="Get Quote"
              />
              <Button
                onClick={() => handleActionButton('call')}
                icon={Phone}
                type="Secondary"
                label="Call Us"
              />
              <Button
                onClick={() => handleActionButton('status')}
                icon={FileSearch}
                type="Secondary"
                label="Project Status"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechSupport;