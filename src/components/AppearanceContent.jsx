import React, { useEffect, useState } from "react";
import { Sun, Moon, Palette } from "lucide-react";
import { useParams } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Common/Elements/Button";

const AppearanceContent = () => {
  const params = useParams();
  const [selectedTheme, setSelectedTheme] = useState({
    theme: "",
    logo: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#6B7280",
    accentColor: "#8B5CF6",
  });
  // const [config, setConfig] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const { data: config } = useSelector((state) => state.portal);
  const dispatch = useDispatch()

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) {
        return;
      }

      // const response = await fetchWrapper(
      //   `/api/portal?portalid=${params.portalid}`,
      //   {},
      //   "portal-config"
      // );

      // if (!response.ok) {
      //   throw new Error("Failed to fetch portal");
      // }

      // const data = await response.json();
      // const updatedData = { ...data.data };

      // setConfig(updatedData);
      setSelectedTheme((prev) => ({
        ...prev,
        theme: config?.theme,
        logo: config?.logo,
        primaryColor: config?.primaryColor || prev.primaryColor,
        secondaryColor: config?.secondaryColor || prev.secondaryColor,
        accentColor: config?.accentColor || prev.accentColor,
      }));
      setPreviewUrl(
        config?.logo.includes("/api")
          ? config?.logo.replace("/api/upload", "/uploads")
          : config?.logo
      );
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [params?.portalid, config]);

  const handleResetTheme = () => {
    fetchConfig();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedTheme((prev) => ({
        ...prev,
        logo: file,
      }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setSelectedTheme({
      ...selectedTheme,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateTheme = () => {
    try {
      setIsLoading(true);
      const portalData = {
        ...config,
        logo: selectedTheme?.logo,
        theme: selectedTheme.theme,
        primaryColor: selectedTheme.primaryColor,
        secondaryColor: selectedTheme.secondaryColor,
        accentColor: selectedTheme.accentColor,
      };
      const updatePortalTheme = async () => {
        if (typeof selectedTheme?.logo === "object") {
          const uploadData = new FormData();
          uploadData.append("file", selectedTheme?.logo);

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
          setSelectedTheme((prev) => ({ ...prev, logo: uploadResult.url }));
          portalData.logo = uploadResult.url;
          console.log("portalData", portalData);
          console.log("uploadResult.url", uploadResult.url);
        }

        const response = await fetchWrapper(
          "/api/portal",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(portalData),
          },
          "update-portal"
        );

        if (!response.ok) throw new Error("Failed to update portal theme");
      };
      updatePortalTheme().then(() => {
        dispatch(setPortal(params.portalid));
        toast.success("Portal Theme updated successfully");
      });
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const themes = [
    {
      name: "Modern",
      icon: Palette,
      description: "Clean and contemporary",
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-blue-400 rounded" />
          <div className="h-2 w-1/2 bg-purple-400 rounded" />
          <div className="h-2 w-2/3 bg-pink-400 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-blue-400" />
            <div className="h-3 w-3 rounded-sm bg-purple-400" />
            <div className="h-3 w-3 rounded-sm bg-pink-400" />
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-r from-blue-50 to-purple-50",
    },
    {
      name: "Professional",
      icon: Sun,
      description: "Refined and corporate",
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-gray-400 rounded" />
          <div className="h-2 w-1/2 bg-gray-300 rounded" />
          <div className="h-2 w-2/3 bg-gray-400 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-gray-400" />
            <div className="h-3 w-3 rounded-sm bg-gray-300" />
            <div className="h-3 w-3 rounded-sm bg-gray-400" />
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-r from-gray-50 to-slate-100",
    },
    {
      name: "Minimal",
      icon: Moon,
      description: "Simple and focused",
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-gray-200 rounded" />
          <div className="h-2 w-1/2 bg-gray-200 rounded" />
          <div className="h-2 w-2/3 bg-gray-200 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
          </div>
        </div>
      ),
      bgClass: "bg-white",
    },
  ];

  if (!config) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Theme Selection</h3>
        <p className="text-gray-600 text-sm">
          Choose and customize the look and feel of your application
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          return (
            <div
              key={theme.name.toLowerCase()}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedTheme.theme === theme.name.toLowerCase()
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setSelectedTheme({
                  ...selectedTheme,
                  theme: theme.name.toLowerCase(),
                })
              }
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id={theme.name.toLowerCase()}
                    checked={selectedTheme.theme === theme.name.toLowerCase()}
                    onChange={() =>
                      setSelectedTheme({
                        ...selectedTheme,
                        theme: theme.name.toLowerCase(),
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <label
                        htmlFor={theme.name.toLowerCase()}
                        className="font-medium text-gray-900 block cursor-pointer"
                      >
                        {theme.name}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {theme.description}
                    </p>
                  </div>
                </div>
                <div className={`h-24 rounded border p-4 ${theme.bgClass}`}>
                  {theme.preview}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customization Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Customization
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Logo
            </label>
            {previewUrl && (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="h-24 w-24 object-contain rounded border"
                />
              </div>
            )}
           <div className="mt-1 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <input
                type="color"
                name="primaryColor"
                value={selectedTheme.primaryColor}
                onChange={handleChange}
                className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Secondary Color
              </label>
              <input
                type="color"
                name="secondaryColor"
                value={selectedTheme.secondaryColor}
                onChange={handleChange}
                className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Accent Color
              </label>
              <input
                type="color"
                name="accentColor"
                value={selectedTheme.accentColor}
                onChange={handleChange}
                className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col sm:flex-row items-center sm:justify-center md:justify-end gap-1 sm:gap-1 md:gap-5">
        {/* <button
          type="button"
          className="px-8 py-2 text-sm font-medium text-black border rounded-md"
          onClick={handleResetTheme}
        >
          Cancel
        </button> */}
        <Button
          onClick={handleResetTheme}
          disabled={isLoading}
          type="Secondary"
          label="Cancel"
        />
        {/* <button
          type="button"
          className="px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          onClick={handleUpdateTheme}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button> */}
        <Button
          onClick={handleUpdateTheme}
          disabled={isLoading}
          isLoading={isLoading}
          type="Primary"
          label="Save"
        />
      </div>
    </div>
  );
};

export default AppearanceContent;
