import { fetchWrapper } from '@/app/lib/fetchWrapper';
import CreateTaskPopUp from '@/components/Common/CreateTaskPopUp';
import Button from '@/components/Common/Elements/Button';
import CompleteForms from '@/components/CompleteForms';
import MyTaskPopupBox from '@/components/MyTaskPopupBox';
import SignRequestModal from '@/components/SignRequestModal';
import { TaskStatus, TaskType, UserRole } from '@/config/constants';
import { Dialog } from '@headlessui/react';
import { Calendar, CheckCircle, FileText, Loader2, Plus, RotateCw, X } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export const TaskNoteModal = ({ isOpen, onClose, task }) => {
    const router = useRouter();
    const { data : user } = useSelector((state) => state.user);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-GB");
      };
  
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-8 shadow-lg border border-gray-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b pb-3 border-gray-200">
              <Dialog.Title className="text-2xl text-gray-700 font-semibold font-lato">
                📝 Task Details
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
             {user && user?.role === UserRole?.MODERATOR && ( 
                <div className="flex items-center space-x-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                    {/* Avatar */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white text-lg font-bold">
                    {task?.user?.name
                    ?.split(" ")
                    .map((word) => word.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join("")}
                    </div>

                    {/* User Info */}
                    <div>
                    <p className="text-lg font-semibold text-gray-800">{task?.user?.name || "Unknown User"}</p>
                    <p className="text-gray-500 text-sm">{task?.user?.email || "No Email Provided"}</p>
                    </div>
                </div>
             )}
            {/* Task Content */}
            <div className="space-y-5 font-lato text-gray-800">
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
            <div className="mt-6 flex justify-end space-x-4">
              <Button onClick={onClose} type="Secondary" label="Close" />
  
              {task?.type === TaskType.SIGN && task?.status !== TaskStatus.COMPLETED && user?.role !== UserRole?.MODERATOR && (
                <Button
                  onClick={() => router.push("esignature")}
                  type="Primary"
                  label="Sign Now"
                />
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };

const TasksSection = () => {
    const [page, setPage] = useState(null);
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
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

    const fetchPage = async () => {
        try {
            setIsPageLoading(true);
            if (!params?.portalid) return;
            const response = await fetchWrapper(
                `/api/pages?portalId=${params.portalid || "default"}&page=${pathname
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
    useEffect(() => {
      fetchPage();
    }, []);
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

    const updateTaskStatus = async () => {
        try {
            setIsTaskLoading(true);
            const response = await fetchWrapper(
                `/api/tasks`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        taskId: taskToUpdate?.id,
                        status: TaskStatus.COMPLETED
                    })
                },
                "update-task"
            );

            if (!response.ok) throw new Error("Something went wrong!!");
            await fetchTasks();
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setIsTaskLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            setIsTaskLoading(true);
            const url = user?.role === UserRole.MODERATOR ? `/api/tasks?portalId=${params.portalid}` : `/api/tasks?portalId=${params.portalid}&userId=${user?.id}`
            const response = await fetchWrapper(url, {}, "fetch-tasks");
            if (!response.ok) throw new Error("Something went wrong!!");
            const data = await response.json();
            console.log("User:", data);
            setTasks(data.data);
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setIsTaskLoading(false);
        }
    };
    useEffect(() => {
        fetchTasks()
    }, [])

    useEffect(() => {
        const completed = ["signed", "completed", "finalizing"];
        if (signRequest && completed.includes(signRequest?.status)) {
            if (taskToUpdate.uploads[0] === signRequest?.id) {
                updateTaskStatus();
                setSignRequest(null);
            }
        }
    }, [signRequest]);

    const modelClose = () => {
        setCreateTask(false);
    }
   
    return (
      <div className="reletive mt-1">
        {filterVisibility("My Task Section") && (
          <>
            <div className={`flex justify-between items-start ${user && user?.role === UserRole.MODERATOR ? "" : "mb-4"}`}>
              <div></div>
              <h3 className="text-xl font-light text-center text-[#212529] font-lato">
                {user && user?.role === UserRole.MODERATOR ? "Your Tasks" : "My Tasks"}
              </h3>
              <div
                className="flex items-center justify-end text-[#dc3545] cursor-pointer"
                onClick={() =>
                  setCompletedTask({
                    upload: false,
                    completeForm: false,
                    sign: false,
                    autoLoan: false,
                  })
                }
              >
                  {
                    user && user.role === UserRole?.MODERATOR ? (
                      <Button
                        iconClassName="w-5 h-5"
                        className='text-gray-600 w-24 h-10 ml-auto mb-2'
                        label={"Add"}
                        icon={Plus}
                        onClick={() => setIsOpenAddTaskModal((prev) => !prev)}
                      />
                    ) : (
                      <div className='mt-4'><RotateCw className="h-4 w-4" /></div>
                    )
                  }
              </div>
            </div>

            <div className="mb-7 max-h-[300px] overflow-y-auto border border-[#dee2e6]">
              <table className="min-w-full divide-y divide-gray-200 overflow-auto ">
                <thead className="bg-gray-50 text-sm font-lato text-[#212529]">
                  <tr>
                    <th></th>
                    <th className="text-start px-3 py-4">Task</th>
                    <th className="text-start px-3 py-4">Status</th>
                    <th className="text-start px-3 py-4">Due Date</th>
                    <th className="text-start px-3 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 ">
                  {isTaskLoading ? (
                    <tr>
                      <td colSpan={"5"}>
                        <div className="min-h-[100px] flex items-center justify-center">
                          <Loader2 className="text-blue-500 animate-spin" />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {tasks?.length > 0 ? (
                        tasks?.map((task) => (
                          <tr key={task?.id}>
                            <td className="ps-3 py-4">
                              <div
                                className={`h-3 w-3 rounded-full  pulse-animation ${
                                  task?.status === TaskStatus.PENDING
                                    ? "bg-[#ffc107]"
                                    : "bg-[#1ec0cb]"
                                }`}
                              ></div>
                            </td>
                            <td className="px-3 py-4">
                              <p className="font-lato text-[#212529] text-sm">
                                {task?.title}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <p
                                className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-start cursor-pointer`}
                                onClick={() => {
                                  if (task?.status === TaskStatus.COMPLETED || user?.role === UserRole?.MODERATOR) {
                                    return;
                                  }
                                  setTaskToUpdate(task);
                                  if (task?.type === TaskType.SIGN) {
                                    // handleOpenSignModal(task);
                                    router.push("esignature");
                                  } else {
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
                                  <Loader2 className="size-5 animate-spin text-blue-500" />
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
                            <td className="px-3 py-4">
                              <p className="font-lato text-[#212529] text-sm">
                                {task?.dueDate
                                  ? new Date(task?.dueDate).toLocaleDateString(
                                      "en-GB"
                                    )
                                  : new Date().toLocaleDateString("en-GB")}
                              </p>
                            </td>
                            <td className="px-3 py-4 cursor-pointer" onClick={() => {setIsOpenTaskModal((prev) => !prev); setSelectedTask(task)}}>
                              <p className="font-lato text-[#212529] text-sm hover:text-blue-500">
                                View Details
                              </p>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center">
                          <td colSpan="5">
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
        )}
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
                onTaskCreated={fetchTasks}
            />
        )}
      </div>
    );
}

export default TasksSection;