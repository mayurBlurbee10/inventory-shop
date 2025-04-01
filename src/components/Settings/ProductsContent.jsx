import React, { useEffect, useRef, useState } from "react";
import {
  PlusCircle,
  Workflow,
  Fingerprint,
  Code,
  UserCircle,
  Trash2,
  Edit,
  File,
  Loader2,
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
import { useDispatch, useSelector } from "react-redux";
import { setPages } from "@/store/services/pageService";
import AllTaskModal from "../Common/AllTaskModal";

const options = [
  // {
  //   key:"pages",
  //   label: "Pages",
  //   value : PluginType.PAGES
  // },
  {
    key:"t&c",
    label: "Terms and Conditions",
    value : PluginType.TNC
  },
]

const ProductsContent = ({ isQueryFetched = false, setIsQueryFetched=()=>{} }) => {
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
  const [pagesData, setPagesData] = useState([]);
  const [isUpdateLoading, setIsUpdateLoading] = useState(null)
  const [isAllTaskModalOpen, setIsAllTaskModalOpen] = useState(false);
  const hasFetched = useRef(false);

  const { data : user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const fetchExistingPages = async () => {
    if (hasFetched.current) return;
      hasFetched.current = true;
    try {
      setLoading(true);
      const pluginPayload = {
        type: PluginType.PAGES,
        portalId: params.portalid || "default",
        createdBy: user?.id,
      };
      const pluginResponse = await fetchWrapper(
        "/api/plugins",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pluginPayload),
        },
        "save-plugin"
      );

      if (!pluginResponse.ok) {
        return;
      }

      const savedPluginData = await pluginResponse.json();

      const response = await fetchWrapper(
        "/api/pages/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portalId: params.portalid,
            pluginId: savedPluginData?.data?.id,
          }),
        },
        "fetch-page"
      );

      const data = await response.json();
      await fetchPlugins();
    } catch (error) {
      toast.error(error.message);
    }
  };

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
      const filterTncPlugin = data.data.filter((item)=>item.type !== PluginType.PAGES);

      setPlugins(filterTncPlugin);

      const filterPagePlugin = data.data.find((item) => item.type === PluginType.PAGES).pages.filter((item) => !item.isCustomPage);

      dispatch(
        setPages(data.data.find((item) => item.type === PluginType.PAGES).pages)
      );

      setPagesData(filterPagePlugin)
      setPluginOptions((prevOptions) =>
        prevOptions.filter(
          (option) => !data.data.some((plugin) => plugin?.type === option.key)
        )
      );
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePageStatus = async (pageId, pageStatus) => {
    try {
      setIsUpdateLoading(pageId);
      setPagesData((prevPages) => prevPages.map((p) => p.id === pageId ? { ...p, isPageVisible: pageStatus} : p ));
      const response = await fetchWrapper(
        `/api/pages/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: pageId, isPageVisible: pageStatus }),
        },
        "update-page"
      );
      if (!response.ok) {
        throw new Error("Failed to update page");
      }
      const data = await response.json();
      dispatch(setPages(pagesData.map((p) => p.id === pageId ? { ...p, isPageVisible: pageStatus} : p )))
    } catch (error) {
      console.error("Error fetching plugins:", error);
      setPagesData((prevPages) => prevPages.map((p) => p.id === pageId ? { ...p, isPageVisible: !pageStatus} : p ));
    } finally {
      setIsUpdateLoading(null);
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
    if(isQueryFetched){
      fetchPlugins();
      setIsQueryFetched(false);
    }
  }, [isQueryFetched]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2 sm:justify-between items-center">
      <div className=" text-center sm:text-left">
        <h3 className="text-lg font-medium text-gray-900">
          Workflow Widgets
        </h3>
        <p className="text-gray-600 text-sm">
          Easily manage and customize the workflow widgets on your
          application.
        </p>
         </div>
        {pluginOptions && pluginOptions.length > 0 && (
          <Button
            onClick={() => setIsOpenCreatePlugin((prev) => !prev)}
            icon={PlusCircle}
            type="Primary"
            label="Add Widget"
          />
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1 md:p-2 lg:p-3">
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
                className="border rounded-lg p-4 bg-gray-50 shadow-sm opacity-70 pointer-events-none"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {widget.icon}
                    <div>
                      <h4 className="text-lg font-medium text-gray-600">{widget.name}</h4>
                      <p className="text-sm text-gray-600">{widget.description}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      widget.status === "Beta"
                        ? "bg-yellow-100 text-yellow-400"
                        : "bg-green-100 text-green-400"
                    }`}
                  >
                    {widget.status}
                  </span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="text-gray-600 text-sm font-medium cursor-not-allowed">
                    Configure
                  </button>
                  <button className="text-gray-600 text-sm font-medium cursor-not-allowed">
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
                          {plugin?.type === PluginType.TNC ? plugin?.type.toUpperCase() : plugin?.type.charAt(0).toUpperCase() +
                            plugin?.type.slice(1)}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Create and manage custom pages
                        </p>
                      </div>
                    </div>

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
             <div
                  className="border rounded-lg p-4 bg-white shadow-sm text-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <File className="w-6 h-6 text-blue-600" />
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          Tasks
                        </h4>
                        <p className="text-sm text-gray-500">
                          Edit and manage user tasks
                        </p>
                      </div>
                    </div>

                    <div className=" flex items-center justify-end gap-2">
                      <div
                        className={`px-2 py-1 cursor-pointer`}
                        onClick={() => {
                          setIsAllTaskModalOpen((prev) => !prev);
                        }}
                      >
                        <Edit className="size-4 text-blue-700" />
                      </div>
                      {/* <div
                        className={`px-2 py-1 cursor-pointer`}
                        onClick={() => {
                          setIsDeleteModalOpen((prev) => !prev);
                          setPluginSelected(plugin);
                        }}
                      >
                        <Trash2 className="size-4 text-red-700" />
                      </div> */}
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
                </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1 md:p-2 lg:p-3">
            {pagesData &&
              pagesData.length > 0 &&
              pagesData.map((page, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {page?.title === "esignature" ? (
                        <Fingerprint className="w-6 h-6 text-blue-600" />
                      ) : (
                        <File className="w-6 h-6 text-blue-600" />
                      )}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {page?.title.charAt(0).toUpperCase() +
                            page?.title.slice(1)}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {page.description}
                        </p>
                      </div>
                    </div>
                    {page.title !== "dashboard" && (
                      <div className="flex items-center">
                        {isUpdateLoading === page?.id && (
                          <div className="mr-3">
                            <Loader2 className="ml-auto size-5 animate-spin text-blue-500" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePageStatus(page?.id, !page.isPageVisible)
                          }
                          className={`
                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          ${page?.isPageVisible ? "bg-blue-600" : "bg-gray-200"}
                        `}
                        >
                          <span
                            className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${
                              page?.isPageVisible
                                ? "translate-x-5"
                                : "translate-x-0"
                            }
                          `}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
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
      {
        isAllTaskModalOpen && (
          <AllTaskModal
          isOpen={isAllTaskModalOpen}
          onClose={() => setIsAllTaskModalOpen(false)}
        />
        )
      }
    </div>
  );
};

export default ProductsContent;
