import { X, Phone, FileSearch, Calculator } from "lucide-react";
import React, { useState } from "react";
import Button from "./Common/Elements/Button";

function TechSupport({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    issueType: "bug",
    message: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleModalClose = () => {
    setFormData({
      issueType: "bug",
      message: "",
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(false);
    handleModalClose();
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