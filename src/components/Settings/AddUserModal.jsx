import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { UserRole } from "@/config/constants";

const AddUserModal = ({ users, isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    companyName: "",
    role: UserRole.USER,
    logo: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [companyOptions, setCompanyOptions] = useState({
    visible: false,
    data: [],
    filteredData: [],
  });
  const [companySearched, setCompanySearched] = useState("");
  const params = useParams();

  const handleModalClose = () => {
    // reset state on modal close
    setFormData({
      name: "",
      email: "",
      title: "",
      companyName: "",
      role: "user",
      logo: null,
    });
    setCompanyOptions({
      visible: false,
      data: [],
      filteredData: [],
    });
    setError("");
    setPreviewUrl("");
    setCompanySearched("");
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFormChange("logo", file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFormChange = (key, val) => {
    if (!key) return;

    setFormData({
      ...formData,
      [key]: val,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let logoUrl = "";

      // Upload logo if selected
      if (formData.logo) {
        const uploadData = new FormData();
        uploadData.append("file", formData.logo);

        const uploadResponse = await fetchWrapper(
          "/api/upload",
          {
            method: "POST",
            body: uploadData,
          },
          "user-logo"
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }

      // Create Box user
      const boxResponse = await fetchWrapper(
        "/api/box/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: formData.email,
            externalId: `user_${Date.now()}`,
          }),
        },
        "create-user-box"
      );

      const boxData = await boxResponse.json();

      if (!boxResponse.ok) {
        throw new Error(boxData.error || "Failed to create Box user");
      }

      // Prepare user data for storage
      const userData = {
        email: formData.email,
        name: formData.name,
        title: formData.title,
        companyName: formData.companyName,
        password: "000",
        role: formData.role,
        logo: logoUrl,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: params.portalid || "",
        isOnboardingRequired: false,
      };

      // Save user data
      const saveResponse = await fetchWrapper(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
        "save-user"
      );
      const savedData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(savedData.error || "Failed to save user data");
      }

      onAdd(savedData);
      handleModalClose();
      toast.success("User created successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating user:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onCompanyNameSearch = (e) => {
    const searchedText = e.target.value;
    setCompanySearched(searchedText);
    setTimeout(() => {
      onApplySearchFilter(searchedText);
    }, 1000);
  };

  const onApplySearchFilter = (searchedText, visible) => {
    searchedText = String(searchedText).trim().toLowerCase();
    const data =
      companyOptions.data.length > 0
        ? companyOptions.data
        : users.map((x) => x.name);
    let companyData = JSON.parse(JSON.stringify(data));

    if (!!searchedText)
      companyData = companyData.filter((x) =>
        String(x).trim().toLowerCase().startsWith(searchedText)
      );
    else companyData = data;

    setCompanyOptions({
      visible: companyOptions.visible || visible,
      data,
      filteredData: companyData,
    });
  };

  const toggleCompanyDropdown = () => {
    if (!companyOptions.visible) onApplySearchFilter(companySearched, true);
    else onCompanyNameBlur();
  };

  const onCompanyNameBlur = () => {
    setCompanyOptions({ ...companyOptions, visible: false });
    setCompanySearched("");
  };

  const onCompanyNameSelect = (item) => {
    handleFormChange("companyName", item);
    onCompanyNameBlur();
  };

  const onAddCompany = () => {
    setCompanySearched("");
    const data = [...companyOptions.data, companySearched];
    setCompanyOptions({ ...companyOptions, data, filteredData: data });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-gray-800 font-semibold">Add New User</h2>
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
              Full Name
            </label>
            <input
              type="text"
              required
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.companyName}
              onChange={(e) => handleFormChange("companyName", e.target.value)}
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <div className="relative">
              <button
                type="button"
                className={`relative w-full ${!!formData.companyName ? 'py-2' : 'py-5'} rounded border border-solid py-2 outline-none-lg text-left px-2 text-gray-700`}
                onClick={toggleCompanyDropdown}
              >
                {formData.companyName}
                <div className='absolute top-3 right-0'>
                  <ChevronDown className="w-4 h-4 mr-2 text-[#000]" />
                </div>
              </button>
              {companyOptions.visible && users && users.length > 0 && (
                <div className="absolute w-full top-8">
                  <div className='bg-white rounded-lg border relative'>
                    <ul className='w-100 max-h-[120px] overflow-auto'>
                      <li>
                        <input
                          type="text"
                          placeholder='Please select or search to create a company'
                          className="mt-1 block w-full text-gray-900 border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500"
                          value={companySearched}
                          onChange={onCompanyNameSearch}
                        />
                      </li>
                      {companyOptions.filteredData.map((item, i) =>
                        <React.Fragment key={i}>
                          <li className='text-[#000] hover:text-white hover:bg-blue-600 p-1' onClick={(e) => onCompanyNameSelect(item)}>
                            {item}
                          </li>
                        </React.Fragment>
                      )}
                      {(!companyOptions.filteredData || companyOptions.filteredData.length == 0) && !!companySearched && (
                        <>
                          <li className='text-[#000] text-center p-1'>No data found</li>

                          <li className='sticky bottom-0 flex align-items-center border-t py-2 px-1'>
                            <button className='text-sm font-medium text-blue-600 mb-2 mr-6 ml-1 underline decoration-1 rounded-md hover:text-blue-700 disabled:opacity-55 disabled:cursor-not-allowed' onClick={onAddCompany}>+Add</button>
                            <p className='text-gray-700'>{companySearched}</p>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div> */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.role}
              onChange={(e) => handleFormChange("role", e.target.value)}
              style={{ height: "2.5rem" }}
            >
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Logo
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {previewUrl && (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="h-20 w-20 object-contain rounded border"
                />
              </div>
            )}
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
              {loading ? "Creating..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
