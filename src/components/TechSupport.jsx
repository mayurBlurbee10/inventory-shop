import { X } from "lucide-react";
import React, { useState } from "react";

function TechSupport({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    issueType: "bug",
    message: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleModalClose = () => {
    // reset state on modal close
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-gray-800 font-semibold">Tech Support</h2>
          <button
            onClick={handleModalClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Issue Type
            </label>
            <select
              className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.issueType}
              onChange={(e) => handleFormChange("issueType", e.target.value)}
              style={{ height: "2.5rem" }}
            >
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="request">Request</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              name="message"
              required
              className="mt-1 block w-full p-2 rounded-md border-gray-300 text-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.message}
              onChange={(e) => handleFormChange("message", e.target.value)}
            ></textarea>
            {/* <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 text-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.message}
              onChange={(e) => handleFormChange("message", e.target.value)}
            /> */}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TechSupport;
