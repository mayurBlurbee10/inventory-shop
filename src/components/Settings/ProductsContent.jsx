import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Workflow,
  Fingerprint,
  Code,
  UserCircle,
  Trash2,
  Edit,
  File,
} from "lucide-react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import {
  CreatePluginModal,
  UpdatePluginModal,
} from "../Plugins/CreatePluginModal";
import { useParams } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import Button from "../Common/Elements/Button";
import { PluginType } from "@/config/constants";

const options = [
  {
    key:"pages",
    label: "Pages",
    value : PluginType.PAGES
  },
  {
    key:"t&c",
    label: "Terms and Conditions",
    value : PluginType.TNC
  },
]

const ProductsContent = () => {
  const params = useParams();
  const [isOpenCreatePlugin, setIsOpenCreatePlugin] = useState(false);
  const [isOpenUpdatePlugin, setIsOpenUpdatePlugin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plugins, setPlugins] = useState(null);
  const [pluginEdit, setPluginEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pluginSelected, setPluginSelected] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pluginOptions, setPluginOptions] = useState(options);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || ""}`,
        {},
        "fetch-plugins"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      setPlugins(data.data);
      setPluginOptions((prevOptions) =>
        prevOptions.filter(
          (option) => !data.data.some((plugin) => plugin?.type === option.key)
        )
      );
      console.log(pluginOptions)
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlugin = async (plugin) => {
    try {
      setDeleteLoading(true);

      const response = await fetchWrapper(
        "/api/plugins",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: plugin.id }),
        },
        "delete-page"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }
      setPluginOptions((prev)=>([...prev, ...options.filter((opt)=>opt.key === plugin?.type)]))
      setIsDeleteModalOpen(false);
      setPluginSelected(null);
      fetchPlugins();
      toast.success("Plugin deleted successfully");
    } catch (error) {
      toast.error(error.message);
      // setError("Failed to delete Page. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Workflow Widgets</h3>
        {pluginOptions && pluginOptions.length > 0 && (
          <Button
            onClick={() => setIsOpenCreatePlugin((prev) => !prev)}
            icon={PlusCircle}
            type="Primary"
            label="Add Widget"
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            name: "Workflow Builder",
            description: "Create and manage custom workflows",
            icon: <Workflow className="w-6 h-6 text-blue-600" />,
            status: "Ready",
          },
          {
            name: "Signature Integration",
            description: "Add digital signature capabilities",
            icon: <Fingerprint className="w-6 h-6 text-blue-600" />,
            status: "Beta",
          },
          {
            name: "Custom API",
            description: "Configure custom API endpoints",
            icon: <Code className="w-6 h-6 text-blue-600" />,
            status: "Ready",
          },
          // {
          //   name: "Account Details",
          //   description: "Manage user profiles and settings",
          //   icon: <UserCircle className="w-6 h-6 text-blue-600" />,
          //   status: "Ready",
          // },
        ].map((widget, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {widget.icon}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {widget.name}
                  </h4>
                  <p className="text-sm text-gray-500">{widget.description}</p>
                </div>
              </div>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  widget.status === "Beta"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {widget.status}
              </span>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                Configure
              </button>
              <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Documentation
              </button>
            </div>
          </div>
        ))}
        {plugins &&
          plugins.map((plugin, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-white shadow-sm text-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <File className="w-6 h-6 text-blue-600" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {plugin?.type.charAt(0).toUpperCase() +
                        plugin?.type.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Create and manage custom pages
                    </p>
                  </div>
                </div>
                {/* <span
               className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                 widget.status === "Beta"
                   ? "bg-yellow-100 text-yellow-800"
                   : "bg-green-100 text-green-800"
               }`}
             >
               {widget.status}
             </span> */}

                <div className=" flex items-center justify-end gap-2">
                  <div
                    className={`px-2 py-1 cursor-pointer`}
                    onClick={() => {
                      setIsOpenUpdatePlugin((prev) => !prev);
                      setPluginEdit(plugin);
                    }}
                  >
                    <Edit className="size-4 text-blue-700" />
                  </div>
                  <div
                    className={`px-2 py-1 cursor-pointer`}
                    onClick={() => {
                      setIsDeleteModalOpen((prev) => !prev);
                      setPluginSelected(plugin);
                    }}
                  >
                    <Trash2 className="size-4 text-red-700" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                  Configure
                </button>
                <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Documentation
                </button>
              </div>
              {pluginSelected?.id === plugin?.id && (
                <DeleteConfirmDialog
                  isModalOpen={isDeleteModalOpen}
                  setIsModalOpen={setIsDeleteModalOpen}
                  handleDelete={() => handleDeletePlugin(plugin)}
                  title="Delete Plugin"
                  isLoading={deleteLoading}
                />
              )}
            </div>
          ))}
      </div>
      <CreatePluginModal
        isOpen={isOpenCreatePlugin}
        onClose={() => setIsOpenCreatePlugin(false)}
        onPluginCreated={fetchPlugins}
        pluginOptions={pluginOptions}
      />
      <UpdatePluginModal
        isOpen={isOpenUpdatePlugin}
        onClose={() => setIsOpenUpdatePlugin(false)}
        plugin={pluginEdit}
      />
    </div>
  );
};

export default ProductsContent;
