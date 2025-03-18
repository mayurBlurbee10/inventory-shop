"use client";

import { fetchWrapper } from "@/app/lib/fetchWrapper";
import CreateTaskPopUp from "@/components/Common/CreateTaskPopUp";
import Button from "@/components/Common/Elements/Button";
import AddUserModal from "@/components/Settings/AddUserModal";
import { TaskStatus } from "@/config/constants";
import { PlusCircle, RotateCw } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function Tasks({ user }) {
    const params = useParams();
    const searchParams = useSearchParams();
    const [createTask, setCreateTask] = useState(false)
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const boxUserId = searchParams.get("userId");
    const modelClose = () => {
        setCreateTask(false);
    }

    const fetchTasks = async () => {
        try {
          setIsLoading(true);
          const url =`/api/tasks?portalId=${params.portalid}&&userId=${user?.id}`
          const response = await fetchWrapper(url, {}, "fetch-tasks");
          if (!response.ok) throw new Error("Something went wrong!!");
          const data = await response.json();
          console.log("User:", data);
          setTasks(data.data);
        } catch (error) {
          console.error("Download error:", error);
        } finally {
          setIsLoading(false);
        }
      };

    useEffect(()=>{
       fetchTasks();
    },[]);

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-GB");
    };

    if(isLoading){
        return <LoadingSpinner/>
    }

    return (
        <div className="bg-white rounded-lg flex relative w-full max-w-[1140px] mx-auto text-black">
            <div
                className="bg-white rounded-2xl w-full xl:mr-5 pt-3 pb-3 m-1 mx-4 space-y-3"
            >
                <div className="flex">
                    <Button
                        onClick={() => setCreateTask(true)}
                        label="Create Task"
                        type="Secondary"
                        icon={PlusCircle}
                    />
                </div>
                <div className="flex flex-col h-[500px] overflow-y-auto custom-scrollbar">   
                {!tasks?.length ? (
                    <p className="text-gray-500 text-center">
                        No tasks available !!
                   </p>
                ) : (
                    <table className="border border-[#dee2e6] text-sm font-lato">
                        <thead>
                            <tr>
                                <th className="p-5 w-1"></th>
                                <th>Type</th>
                                <th>Task</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks?.length && tasks.map((task)=>(
                                 <tr key={task?.id} className="border border-[#dee2e6] text-center">
                                    <td className="ps-3 py-4">
                                        <div className={`h-3 w-3 rounded-full  pulse-animation ${task?.status === TaskStatus.PENDING ? "bg-[#ffc107]" : "bg-[#1ec0cb]"}`}></div>
                                    </td>
                                    <td>{task?.type.charAt(0).toUpperCase() + task?.type.slice(1)}</td>
                                    <td>{task?.title}</td>
                                    <td>{formatDate(task?.dueDate)}</td>
                                    <td>{task?.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
            {
                createTask && (
                    <CreateTaskPopUp
                        onClose={modelClose}
                        user={user}
                        onTaskCreated={fetchTasks}
                    />
                )
            }
        </div>
    );
}

export default Tasks;