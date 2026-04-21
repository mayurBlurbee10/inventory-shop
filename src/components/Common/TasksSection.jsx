import { fetchWrapper } from '@/app/lib/fetchWrapper';
import CreateTaskPopUp from '@/components/Common/CreateTaskPopUp';
import Button from '@/components/Common/Elements/Button';
import CompleteForms from '@/components/CompleteForms';
import MyTaskPopupBox from '@/components/MyTaskPopupBox';
import SignRequestModal from '@/components/SignRequestModal';
import { TaskStatus, TaskType, UserRole } from '@/config/constants';
import { Dialog } from '@headlessui/react';
import { Calendar, Check, CheckCircle, ChevronDown, ChevronUp, Edit, Ellipsis, FileText, MoreVertical, Plus, RotateCw, Trash2, X } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import LoaderSpinner from './Elements/LoaderSpinner';

export const TaskNoteModal = ({ isOpen, onClose, task, fetchTasks, updateTaskStatus, isTaskUpdateLoading, setShowMenu, showMenu }) => {
    const router = useRouter();
    const menuRef = useRef(null);
    const [isTaskDeleteModalOpen, setIsTaskDeleteModalOpen] = useState(false);
    const [isTaskUpdateModalOpen, setIsTaskUpdateModalOpen] = useState(false);
    const [isDeleteTaskLoading, setIsDeleteTaskLoading] = useState(false);
    const { data : user } = useSelector((state) => state.user);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US");
      };
    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setShowMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClose = () => {
      setIsTaskDeleteModalOpen(false);
      setIsTaskUpdateModalOpen(false);
      setShowMenu(false)
      onClose();
    }

    const handleDeleteTask = async () => {
      try {
        if (!task) {
          return;
        }
        const requestOptions = {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ taskId: task?.id }),
        };
        setIsDeleteTaskLoading(true);
        const response = await fetchWrapper(
          `/api/tasks`,
          requestOptions,
          "delete-tasks"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Something went wrong!");
        }
        await fetchTasks();
        setIsTaskDeleteModalOpen(false);
        onClose();
        toast.success("Task deleted Successfully");
      } catch (error) {
        toast.error(error?.message);
      } finally {
        setIsDeleteTaskLoading(false);
      }
    };
  
    return (
      <>
        {isOpen && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-20">
              <div className="mx-auto max-w-2xl w-full rounded-lg bg-white shadow-lg border border-gray-300 max-h-[90vh] overflow-y-auto">
                {/* Header */}
              <div className="sticky top-0 z-10 bg-white rounded-t-lg border-b border-gray-200 mb-4">
                <div className="flex justify-between items-center p-5">
                  <h1 className="text-2xl text-gray-700 font-semibold font-lato ">
                    📝 Task Details
                  </h1>
                  <div className="relative" ref={menuRef}>
                    {user && (user?.id === task?.createdBy?.id || (user?.id === task?.user?.id && task?.status !== TaskStatus?.COMPLETED)) && (
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-gray-500 hover:text-gray-700 transition"
                      >
                        <MoreVertical className="size-5" />
                      </button>
                    )}
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-lg border border-gray-200 z-10">
                        {user && user?.id === task?.createdBy?.id && (
                          <button
                            onClick={() => setIsTaskUpdateModalOpen((prev) => !prev)}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Edit className="size-4 text-blue-500" />
                            <span>Edit</span>
                          </button>
                        )}
                        {task?.status !== TaskStatus?.COMPLETED && (
                          isTaskUpdateLoading ? (
                            <div className='px-4 py-2'>
                              <LoaderSpinner size={24} className='mx-auto text-blue-500' />
                            </div>
                          ) : (
                            <button
                              onClick={() => updateTaskStatus(task)}
                              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-green-100 flex items-center space-x-2"
                            >
                              <Check className="size-4 text-green-500" />
                              <span>Mark Complete</span>
                            </button>
                          )
                        )}
                        {user && user?.id === task?.createdBy?.id && (
                          <button
                            onClick={() => setIsTaskDeleteModalOpen((prev) => !prev)}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 flex items-center space-x-2"
                          >
                            <Trash2 className="size-4 text-red-500" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
                <div className='px-8 max-h-[80vh]'>
                  <div>
                    <h3 className='text-gray-800 text-sm font-semibold'>Receiver :</h3>
                    <div className="flex items-center space-x-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                      {/* Avatar */}
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white text-lg font-bold">
                        {task?.user?.firstName
                          ?.split(" ")
                          .map((word) => word.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join("")}
                      </div>

                      {/* User Info */}
                      <div>
                        <p className="text-lg font-semibold text-gray-800">{task?.user?.firstName || "Unknown User"}</p>
                        <p className="text-gray-500 text-sm">{task?.user?.email || "No Email Provided"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-gray-800 text-sm font-semibold'>Sender :</h3>
                    <div className="flex items-center space-x-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                      {/* Avatar */}
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white text-lg font-bold">
                        {task?.createdBy?.firstName
                          ?.split(" ")
                          .map((word) => word.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join("")}
                      </div>

                      {/* User Info */}
                      <div>
                        <p className="text-lg font-semibold text-gray-800">{task?.createdBy?.firstName + " " + task?.createdBy?.lastName || "Unknown User"}</p>
                        <p className="text-gray-500 text-sm">{task?.createdBy?.email || "No Email Provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Task Content */}
                <div className="space-y-5 font-lato text-gray-800 px-8">
                  {/* Title */}
                  <h3 className="text-xl font-semibold">{task?.title || "Untitled Task"}</h3>
      
                  {/* Description */}
                  <div className="p-4 bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                    <p className="text-md">{task?.description || "No description provided."}</p>
                  </div>
      
                  {/* Task Details */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-600">Status:</span>
                      <span  className={`px-2 py-1 text-sm font-semibold rounded-md ${
                            task?.status === TaskStatus.PENDING
                            ? "text-yellow-600 bg-yellow-100" // Better contrast for Pending
                            : "text-teal-700 bg-teal-100" // Improved greenish-teal for Completed
                        }`}>
                        {task?.status?.charAt(0).toUpperCase() + task?.status?.slice(1) || "Pending"}
                      </span>
                    </div>
      
                    {/* Due Date */}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-600">Due Date:</span>
                      <span>{formatDate(task?.dueDate) || "N/A"}</span>
                    </div>
      
                    {/* File */}
                    <div className="flex items-center space-x-2 col-span-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-600">File:</span>
                      <span className="truncate">{task?.file?.name || "No file attached"}</span>
                    </div>
                  </div>
                </div>
      
                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-4 px-8 pb-4">
                  <Button onClick={handleClose} type="Secondary" label="Close" />
      
                  {task?.type === TaskType.SIGN && task?.status !== TaskStatus.COMPLETED && user?.role !== UserRole?.MODERATOR && task?.user?.id === user?.id && (
                    <Button
                      onClick={() => router.push("esignature")}
                      type="Primary"
                      label="Sign Now"
                    />
                  )}
                </div>
              </div>
              {isTaskUpdateModalOpen && (
                <CreateTaskPopUp
                  onClose={() => setIsTaskUpdateModalOpen(false)}
                  user={task?.user}
                  onTaskCreated={fetchTasks}
                  task={task}
                  onTaskUpdated = {handleClose}
                />
              )}
              <DeleteConfirmDialog
                isModalOpen={isTaskDeleteModalOpen}
                setIsModalOpen={setIsTaskDeleteModalOpen}
                title="Delete Task"
                content="Deleting this task cannot be undone. Do you want to continue?"
                handleDelete={handleDeleteTask}
                isLoading={isDeleteTaskLoading}
              />
            </div>
        )}
      </>
    );
  };

const TasksSection = ({ client = null }) => {
    const [page, setPage] = useState(null);
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const actionDropdownRef = useRef();
    const { data: user } = useSelector((state) => state.user);
    const { data: config } = useSelector((state) => state.portal);
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [myTaskPopupBoxContent, setMyTaskPopupBoxContent] = useState("");
    const [isMyTaskPopupOpen, setIsMyTaskPopupOpen] = useState(false);
    const [isSignReqLoading, setIsSignReqLoading] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isTaskLoading, setIsTaskLoading] = useState(false);
    const [isCompleteFormPopupOpen, setIsCompleteFormPopupOpen] = useState(false);
    const [taskToUpdate, setTaskToUpdate] = useState(null);
    const [signRequest, setSignRequest] = useState(null);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedSignUrl, setSelectedSignUrl] = useState(null);
    const [createTask, setCreateTask] = useState(false)
    const [isOpenTaskModal, setIsOpenTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isOpenAddTaskModal, setIsOpenAddTaskModal] = useState(false);
    const [isTaskUpdateLoading, setIsTaskUpdateLoading] = useState(false);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [checklists, setCheckLists] = useState([]);
    const [isChecklistLoading, setIsChecklistLoading] = useState(false);
    const [error, setError] = useState(null)
    const [sortedTasksList, setSortedTasksList] = useState([])
    const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });
    const [showMenu, setShowMenu] = useState(false);
    const [completedTask, setCompletedTask] = useState({
        upload: false,
        completeForm: false,
        sign: false,
        autoLoan: false,
    });
    const { data: filesList, loading: isFilesLoading } = useSelector(
        (state) => state.files
    );
    const filterVisibility = (label) => {
        if (isPageLoading) return false;
        if (!page || !page.length) return true;

        const section = page.find((item) => item.label === label);
        return section?.visible ?? false;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
          if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target)) {
            setIsActionDropdownOpen(false);
          }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

    const fetchPage = async () => {
        try {
            setIsPageLoading(true);
            if (!params?.portalid) return;
            const response = await fetchWrapper(
                `/api/pages?portalId=${params.portalid || "root"}&page=${pathname
                    .split("/")
                    .pop()}`,
                {},
                "fetch-page"
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error("Failed to fetch page");
            }

            const pageData = data?.data?.visibility || []

            setPage(pageData);
        } catch (error) {
            console.log("error: ", error);
        } finally {
            setIsPageLoading(false);
        }
    };

    const fetchChecklists = async () => {
      try {
        setIsChecklistLoading(true);
        const url = `/api/checklists?portalId=${params.portalid || "root"}&sorted=${true}`;

        const response = await fetchWrapper(url, {}, "fetch-checklist");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed fetch checklists");
        setCheckLists(data?.data);
        const allCheckListsTasks = data?.data?.flatMap(item => item?.isActive ? item?.tasks : []);
        setTasks(allCheckListsTasks);
      } catch (error) {
        toast.error(error?.message);
      } finally {
        setIsChecklistLoading(false);
      }
    };

    const firstFileToSign = () => {
        return filesList?.find((file) => file.type === "file") || null;
    };

    const handleSelfSign = async (file, taskType) => {
        try {
            setIsSignReqLoading(taskType);
            const response = await fetchWrapper(
                "/api/box/e-sign",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fileId: file.id,
                        signers: [
                            {
                                signerEmail: user.email,
                                signerId: user.id,
                            },
                        ],
                        boxUserId: user.boxUserId,
                        portal: params.portalid,
                        onSameDoc: false,
                    }),
                },
                "self-esign-request"
            );
            const data = await response.json();
            console.log("data: ", data);
            if (!response.ok) {
                throw new Error(data.error || "Failed to generate e-sign request");
            }
            toast.success("E-sign request generated successfully.");
            const currentUserReq = data.data[0].signers.find(
                (item) => item.email === user.email
            );
            if (currentUserReq) {
                setTimeout(() => {
                    setSelectedSignUrl(currentUserReq.iframeable_embed_url);
                    setIsSignModalOpen(true);
                    setIsSignReqLoading(null);
                }, 2500);
            }
        } catch (error) {
            setIsSignReqLoading(null);
        } finally {
            setIsSignReqLoading(null);
        }
    };

    const handleOpenSignModal = async (task) => {
        try {
            setIsSignReqLoading(task?.title);
            const response = await fetchWrapper(
                `/api/box/e-sign?id=${task?.uploads[0]}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                },
                "get-esign-request"
            );
            const data = await response.json();
            console.log("data: ", data);
            if (!response.ok) {
                throw new Error(data.error || "Failed to get e-sign request");
            }
            setSignRequest(data?.data)
            toast.success("E-sign request generated successfully.");
            const currentUserReq = data?.data.signers.find(
                (item) => item.email === user.email
            );

            if (currentUserReq) {
                setTimeout(() => {
                    setSelectedSignUrl(currentUserReq.iframeable_embed_url);
                    setIsSignModalOpen(true);
                    setIsSignReqLoading(null);
                }, 2500);
            }
        } catch (error) {
            setIsSignReqLoading(null);
        } finally {
            setIsSignReqLoading(null);
        }
    }

    const updateTaskStatus = async (task) => {
        try {
            setIsTaskUpdateLoading(true);
            const response = await fetchWrapper(
                `/api/tasks`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        taskId: task?.id,
                        status: TaskStatus.COMPLETED
                    })
                },
                "update-task"
            );

            if (!response.ok) throw new Error("Something went wrong!!");
            setIsOpenTaskModal(false);
            setShowMenu(false)
            await fetchChecklists();
            
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setIsTaskUpdateLoading(false);
        }
    };

    const fetchTasks = async () => {
      try {
        setIsTaskLoading(true);
        
        // Validate required parameters first
        if (!params.portalid || !client?.id) {
          throw new Error("Missing required parameters");
        }
    
        // Construct URL with encoded parameters
        const url = new URL(`/api/tasks`, window.location.origin);
        url.searchParams.append('portalId', params.portalid);
        url.searchParams.append('userId', client.id);
    
        console.log("API URL:", url.toString()); // Debugging
    
        const response = await fetchWrapper(url, {}, "fetch-tasks");
        
        if (!response.ok) {
          // Handle 404 specifically
          if (response.status === 404) {
            throw new Error(`Resource not found: ${url.pathname}`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        setTasks(data.data);
    
      } catch (error) {
        console.error("Fetch error:", error);
        // Add error state handling here
        setError(error.message);
        
      } finally {
        setIsTaskLoading(false);
      }
    };

    useEffect(() => {
      fetchPage();
      if(client !== null){
        fetchTasks();
      }else {
        fetchChecklists();
      }
    }, [])

    useEffect(() => {
        const completed = ["signed", "completed", "finalizing"];
        if (signRequest && completed.includes(signRequest?.status)) {
            if (taskToUpdate.uploads[0] === signRequest?.id) {
                updateTaskStatus(taskToUpdate);
                setSignRequest(null);
            }
        }
    }, [signRequest]);

    const modelClose = () => {
        setCreateTask(false);
    }
  const formatDate = (timestamp) => {
    if(timestamp){
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US");
    }else {
      return "No Due"
    }
  };

const sortedTasks =
  tasks &&
  [...tasks].sort((a, b) => {
    if (sortConfig.key === "title") {
      const titleA = a.title || ""; // Default to empty string if undefined
      const titleB = b.title || "";
      return sortConfig.direction === "asc"
        ? titleA.localeCompare(titleB)
        : titleB.localeCompare(titleA);
    } else if (sortConfig.key === "dueDate") {
      const dateA = new Date(a.dueDate || 0); // Default to 0 if undefined
      const dateB = new Date(b.dueDate || 0);
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  
    return (
      <div className="relative">
        {/* {filterVisibility("My Task Section") && ( */}
          <>
            <div className={`grid grid-cols-3 mb-2 items-center`}>
              <div></div>
              <h3 className="text-xl font-light text-center text-[#212529] font-lato">
                My Tasks
              </h3>
              <div>
                <Button
                  iconClassName="w-5 h-5"
                  className='text-gray-600 w-24 h-10 ml-auto'
                  label={"Add"}
                  icon={Plus}
                  onClick={() => setIsOpenAddTaskModal((prev) => !prev)}
                />
              </div>
            </div>

            <div className={`mb-7 border border-[#dee2e6] max-h-[300px] overflow-y-auto`}>
              <table className="min-w-full divide-y divide-gray-200 overflow-y-auto ">
              <thead className="bg-gray-50 text-sm font-lato text-[#212529]">
                <tr>
                  <th></th>
                  <th className="text-start px-3 py-4">
                    <div className="flex items-center justify-start gap-2">
                      <span className="block">Tasks</span>
                      <button className="flex items-center justify-center" onClick={() => toggleSort("title")}>
                        <ChevronUp className={`h-4 w-4 ${sortConfig.key === "title" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                      </button>
                      <button className="flex items-center justify-center" onClick={() => toggleSort("title")}>
                        <ChevronDown className={`h-4 w-4 ${sortConfig.key === "title" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                      </button>
                    </div>
                  </th>
                  <th className="text-start px-3 py-4">Status</th>
                  <th className="text-start px-3 py-4">From</th>
                  <th className="text-start px-3 py-4">To</th>
                  <th className="text-start px-3 py-4">
                    <div className="flex items-center justify-start gap-2">
                      <span className="block">Due Date</span>
                      <button className="flex items-center justify-center" onClick={() => toggleSort("dueDate")}>
                        <ChevronUp className={`h-4 w-4 ${sortConfig.key === "dueDate" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                      </button>
                      <button className="flex items-center justify-center" onClick={() => toggleSort("dueDate")}>
                        <ChevronDown className={`h-4 w-4 ${sortConfig.key === "dueDate" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-200" ref={actionDropdownRef}>
                  {isChecklistLoading ? (
                    <tr>
                      <td colSpan={"6"}>
                        <div className="min-h-[100px] flex items-center justify-center">
                          <LoaderSpinner size={24} className="text-blue-500" />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {sortedTasks?.length > 0 ? (
                        sortedTasks?.map((task) => (
                          <tr key={task?.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpenTaskModal(true);
                              setIsActionDropdownOpen(false);
                              setSelectedTask(task)
                            }}
                            className='hover:bg-gray-100 cursor-pointer'
                          >
                            <td className="ps-3 py-4">
                              <div
                                className={`h-3 w-3 rounded-full  pulse-animation ${
                                  task?.status === TaskStatus.PENDING
                                    ? "bg-[#ffc107]"
                                    : "bg-[#1ec0cb]"
                                }`}
                              ></div>
                            </td>
                            <td className="px-3 py-4 max-w-[100px]">
                              <p className="font-lato text-[#212529] text-sm truncate">
                                {task?.title}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <p
                                className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-start cursor-pointer`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (task?.status === TaskStatus.COMPLETED) {
                                    return;
                                  }
                                  setTaskToUpdate(task);
                                  if (task?.type === TaskType.SIGN && user?.role !== UserRole?.MODERATOR) {
                                    // handleOpenSignModal(task);
                                    router.push("esignature");
                                  } else if (task?.type === TaskType.UPLOAD ) {
                                    setMyTaskPopupBoxContent({
                                      title: task?.title,
                                      actionText: task?.type,
                                    });
                                    setIsMyTaskPopupOpen((prev) => !prev);
                                    setCompletedTask((prev) => ({
                                      ...prev,
                                      upload: true,
                                    }));
                                  }
                                }}
                              >
                                {isSignReqLoading === task?.title ? (
                                  <LoaderSpinner size={24} className="text-blue-500" />
                                ) : task?.status === TaskStatus.COMPLETED ? (
                                  <span className="italic">Completed</span>
                                ) : (
                                  <span>
                                    {task?.type.charAt(0).toUpperCase() +
                                      task?.type.slice(1)}
                                  </span>
                                )}
                              </p>
                            </td>
                            <td className="px-3 py-4 max-w-[100px]">
                              <p className="font-lato text-[#212529] text-sm truncate">
                                {/* {task?.dueDate
                                  ? new Date(task?.dueDate).toLocaleDateString(
                                      "en-US"
                                    )
                                  : new Date().toLocaleDateString("en-US")} */}
                                  {task?.createdBy?.firstName + " " + task?.createdBy?.lastName}
                              </p>
                            </td>
                            <td className="px-3 py-4 max-w-[100px]">
                              <p className="font-lato text-[#212529] text-sm truncate">
                                  {task?.user?.firstName + " " + task?.user?.lastName}
                              </p>
                            </td>
                            <td className="relative px-3 py-4 cursor-pointer text-gray-800 text-sm">
                              {formatDate(task?.dueDate)}
                              {/* <div onClick={() => {
                                setIsActionDropdownOpen((prev) => (selectedTask?.id === task?.id ? !prev : true));
                                setSelectedTask(task);
                                }} className="p-2 rounded">
                                <Ellipsis className="w-5 h-5 text-gray-600" />
                              </div> */}

                              {/* Dropdown Menu */}
                              {/* {isActionDropdownOpen && selectedTask?.id === task?.id && (
                                <div className="absolute right-10 top-10 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50 text-sm">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation(); 
                                      setIsOpenTaskModal(true); 
                                      setIsActionDropdownOpen(false); 
                                    }}
                                    className="p-3 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300"
                                  >
                                    View Details
                                  </div>
                                    {task?.status !== TaskStatus.COMPLETED && (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateTaskStatus(task);
                                          setIsActionDropdownOpen(false);
                                        }}
                                        className="p-3 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300"
                                      >
                                        Mark Complete
                                      </div>
                                    )}
                                </div>
                              )} */}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center">
                          <td colSpan="6">
                            <p className="font-lato text-[#212529] text-sm py-4">
                              No Tasks to Show !!!
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </>
        {/* )} */}
        {isMyTaskPopupOpen && (
          <MyTaskPopupBox
            onClose={() => setIsMyTaskPopupOpen(false)}
            content={myTaskPopupBoxContent}
            config={config}
          />
        )}
        <TaskNoteModal 
            isOpen={isOpenTaskModal}
            onClose={() => {setIsOpenTaskModal(false); setSelectedTask(null);}}
            task={selectedTask}
            fetchTasks={fetchChecklists}
            updateTaskStatus={updateTaskStatus}
            isTaskUpdateLoading={isTaskUpdateLoading}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
        />
        <CompleteForms
          onClose={() => setIsCompleteFormPopupOpen(false)}
          isOpen={isCompleteFormPopupOpen}
        />
        <SignRequestModal
          isOpen={isSignModalOpen && signRequest !== null}
          onClose={() => setIsSignModalOpen(false)}
          signUrl={selectedSignUrl}
          signRequest={signRequest}
          setSignRequest={setSignRequest}
        />
        {isOpenAddTaskModal && (
            <CreateTaskPopUp
                onClose={() => setIsOpenAddTaskModal(false)}
                onTaskCreated={fetchChecklists}
            />
        )}
      </div>
    );
}

export default TasksSection;