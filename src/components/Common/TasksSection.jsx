import { fetchWrapper } from '@/app/lib/fetchWrapper';
import CreateTaskPopUp from '@/components/Common/CreateTaskPopUp';
import Button from '@/components/Common/Elements/Button';
import CompleteForms from '@/components/CompleteForms';
import MyTaskPopupBox from '@/components/MyTaskPopupBox';
import SignRequestModal from '@/components/SignRequestModal';
import { TaskStatus, TaskType } from '@/config/constants';
import { Loader2, Plus, RotateCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const TasksSection = ({ fileType }) => {
    const [page, setPage] = useState(null);
    const params = useParams();
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
        if (fileType === 'my') {
            fetchPage();
        }
    }, [])
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
            const url = `/api/tasks?portalId=${params.portalid}&&userId=${user?.id}`
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
    console.log("user:", user?.role);
    console.log("tasks:", tasks);
   
    return (
        <div className='reletive mt-1'>
            {filterVisibility("My Task Section") && (
                <>
                    <div className="grid grid-cols-3">
                        <div></div>
                        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                            My Tasks
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
                            <RotateCw className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="mb-7 max-h-[300px] overflow-y-auto border border-[#dee2e6]">
                        <table className="min-w-full divide-y divide-gray-200 overflow-auto ">
                            <thead className="bg-gray-50 text-sm font-lato text-[#212529]">
                                <tr>
                                    <th></th>
                                    <th className='text-start px-3 py-4'>Task</th>
                                    <th className='text-start px-3 py-4'>Status</th>
                                    <th className='text-start px-3 py-4'>Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 ">
                                <tr>
                                    <td className="ps-3 py-4">
                                        <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                            Upload Investment Proposals
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p
                                            className="font-lato text-sky-500 text-sm hover:text-sky-700 text-start cursor-pointer"
                                            onClick={() => {
                                                setMyTaskPopupBoxContent({
                                                    title: "Upload identity information",
                                                    actionText: "Upload",
                                                });
                                                setIsMyTaskPopupOpen((prev) => !prev);
                                                setCompletedTask((prev) => ({
                                                    ...prev,
                                                    upload: true,
                                                }));
                                            }}
                                        >
                                            {completedTask.upload ? (
                                                <span className="italic">Completed</span>
                                            ) : (
                                                "Upload"
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                           20/03/2025
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="ps-3 py-4">
                                        <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                            Review and Approve Legal Agreements
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p
                                            className="font-lato text-sky-500 text-sm hover:text-sky-700 text-start cursor-pointer"
                                            onClick={() => {
                                                setIsCompleteFormPopupOpen((prev) => !prev);
                                                setCompletedTask((prev) => ({
                                                    ...prev,
                                                    completeForm: true,
                                                }));
                                            }}
                                        >
                                            {completedTask.completeForm ? (
                                                <span className="italic">Completed</span>
                                            ) : (
                                                "Complete Forms"
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                           25/04/2025
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="ps-3 py-4">
                                        <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                            Sign Financial Statements
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p
                                            className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-start cursor-pointer ${!firstFileToSign()
                                                ? "pointer-events-none opacity-50"
                                                : ""
                                                }`}
                                            onClick={() => {
                                                if (!firstFileToSign()) return;
                                                handleSelfSign(firstFileToSign(), "sign");
                                                setCompletedTask((prev) => ({
                                                    ...prev,
                                                    sign: true,
                                                }));
                                            }}
                                        >
                                            {isSignReqLoading === "sign" ? (
                                                <Loader2 className="size-5 animate-spin text-blue-500" />
                                            ) : completedTask.sign ? (
                                                <span className="italic">Completed</span>
                                            ) : (
                                                "Sign"
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                           28/03/2025
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="ps-3 py-4">
                                        <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                            Auto Business Registration Forms
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p
                                            className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-start cursor-pointer ${!firstFileToSign()
                                                ? "pointer-events-none opacity-50"
                                                : ""
                                                }`}
                                            onClick={() => {
                                                if (!firstFileToSign()) return;
                                                handleSelfSign(firstFileToSign(), "autoLoan");
                                                setCompletedTask((prev) => ({
                                                    ...prev,
                                                    autoLoan: true,
                                                }));
                                            }}
                                        >
                                            {isSignReqLoading === "autoLoan" ? (
                                                <Loader2 className="size-5 animate-spin text-blue-500" />
                                            ) : completedTask.autoLoan ? (
                                                <span className="italic">Completed</span>
                                            ) : (
                                                "Start Forms"
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-lato text-[#212529] text-sm">
                                            21/03/2025
                                        </p>
                                    </td>
                                </tr>
                                {tasks?.length > 0 &&
                                    tasks?.map((task) => (
                                        <tr key={task?.id}>
                                            <td className="ps-3 py-4">
                                                <div
                                                    className={`h-3 w-3 rounded-full  pulse-animation ${task?.status === TaskStatus.PENDING
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
                                                        if (
                                                            task?.status === TaskStatus.COMPLETED
                                                        ) {
                                                            return;
                                                        }
                                                        setTaskToUpdate(task);
                                                        if (task?.type === TaskType.SIGN) {
                                                            handleOpenSignModal(task);
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
                                                    ) : task?.status ===
                                                        TaskStatus.COMPLETED ? (
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
                                                        ? new Date(task?.dueDate).toLocaleDateString("en-GB")
                                                        : new Date().toLocaleDateString("en-GB")}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
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
           
        </div>
    )
}

export default TasksSection;