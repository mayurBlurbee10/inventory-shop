import { fetchWrapper } from '@/app/lib/fetchWrapper';
import { cn } from '@/app/lib/utils';
import CreateTaskPopUp from '@/components/Common/CreateTaskPopUp';
// OLD custom button: import Button from '@/components/Common/Elements/Button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CompleteForms from '@/components/CompleteForms';
import MyTaskPopupBox from '@/components/MyTaskPopupBox';
import SignRequestModal from '@/components/SignRequestModal';
import { TaskStatus, TaskType, UserRole } from '@/config/constants';
import { Calendar, Check, CheckCircle, Clock, Edit, FileText, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import LoaderSpinner from './Elements/LoaderSpinner';

export const TaskNoteModal = ({ isOpen, onClose, task, fetchTasks, updateTaskStatus, isTaskUpdateLoading }) => {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [isTaskDeleteModalOpen, setIsTaskDeleteModalOpen] = useState(false);
    const [isTaskUpdateModalOpen, setIsTaskUpdateModalOpen] = useState(false);
    const [isDeleteTaskLoading, setIsDeleteTaskLoading] = useState(false);
    const { data : user } = useSelector((state) => state.user);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US");
      };

    const handleClose = () => {
      setIsTaskDeleteModalOpen(false);
      setIsTaskUpdateModalOpen(false);
      setShowMenu(false);
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent
            showCloseButton={false}
            className="mx-auto w-[calc(100%-2rem)] max-w-2xl sm:max-w-2xl max-h-[90vh] gap-0 overflow-x-hidden bg-background overflow-y-auto rounded-lg p-0 pb-4"
          >
            {/* Header */}
            <DialogHeader className="sticky top-0 z-10 bg-background rounded-t-xl border-b border-border mb-4">
              <div className="flex justify-between items-center p-5">
                <DialogTitle className="text-2xl text-foreground font-semibold font-lato">
                  📝 Task Details
                </DialogTitle>
                <div className="relative">
                  {user && (user?.id === task?.createdBy?.id || (user?.id === task?.user?.id && task?.status !== TaskStatus?.COMPLETED)) && (
                    <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                      <DropdownMenuTrigger
                        className="text-muted-foreground hover:text-foreground transition outline-none"
                        render={<button type="button" aria-label="Task actions" />}
                      >
                        <MoreVertical className="size-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {user && user?.id === task?.createdBy?.id && (
                          <DropdownMenuItem
                            onClick={() => {
                              setShowMenu(false);
                              setIsTaskUpdateModalOpen(true);
                            }}
                          >
                            <Edit className="size-4 text-primary" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        )}
                        {task?.status !== TaskStatus?.COMPLETED && (
                          isTaskUpdateLoading ? (
                            <div className='px-4 py-2'>
                              <LoaderSpinner size={24} className='mx-auto text-primary' />
                            </div>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setShowMenu(false);
                                updateTaskStatus(task);
                              }}
                            >
                              <Check className="size-4 text-success" />
                              <span>Mark Complete</span>
                            </DropdownMenuItem>
                          )
                        )}
                        {user && user?.id === task?.createdBy?.id && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setShowMenu(false);
                              setIsTaskDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="size-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </DialogHeader>
            <div className='px-8 max-h-[80vh]'>
              <div>
                <h3 className='text-foreground text-sm font-semibold'>Receiver :</h3>
                <div className="flex items-center space-x-4 mb-6 bg-background  p-4 rounded-md border border-border">
                  {/* Avatar */}
                  <Avatar size="lg" className="size-12">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {task?.user?.firstName
                        ?.split(" ")
                        .map((word) => word.charAt(0).toUpperCase())
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div>
                    <p className="text-lg font-semibold text-foreground">{task?.user?.firstName || "Unknown User"}</p>
                    <p className="text-muted-foreground text-sm">{task?.user?.email || "No Email Provided"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className='text-foreground text-sm font-semibold'>Sender :</h3>
                <div className="flex items-center space-x-4 mb-6 bg-background p-4 rounded-md border border-border">
                  {/* Avatar */}
                  <Avatar size="lg" className="size-12">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {task?.createdBy?.firstName
                        ?.split(" ")
                        .map((word) => word.charAt(0).toUpperCase())
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div>
                    <p className="text-lg font-semibold text-foreground">{task?.createdBy?.firstName + " " + task?.createdBy?.lastName || "Unknown User"}</p>
                    <p className="text-muted-foreground text-sm">{task?.createdBy?.email || "No Email Provided"}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Task Content */}
            <div className="space-y-5 font-lato text-foreground px-8">
              {/* Title */}
              <h3 className="text-xl font-semibold">{task?.title || "Untitled Task"}</h3>

              {/* Description */}
              <div className="p-4 bg-muted border border-border rounded-md text-muted-foreground">
                <p className="text-md">{task?.description || "No description provided."}</p>
              </div>

              {/* Task Details */}
              <div className="grid grid-cols-2 gap-6">
                {/* Status */}
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <Badge
                    variant={task?.status === TaskStatus.PENDING ? "outline" : "default"}
                    className={
                      task?.status === TaskStatus.PENDING
                        ? "bg-warning/15 text-warning border-transparent"
                        : "bg-success/15 text-success border-transparent"
                    }
                  >
                    {task?.status?.charAt(0).toUpperCase() + task?.status?.slice(1) || "Pending"}
                  </Badge>
                </div>

                {/* Due Date */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium text-muted-foreground">Due Date:</span>
                  <span>{formatDate(task?.dueDate) || "N/A"}</span>
                </div>

                {/* File */}
                <div className="flex items-center space-x-2 col-span-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">File:</span>
                  <span className="truncate">{task?.file?.name || "No file attached"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DialogFooter className="mt-6 flex bg-transparent justify-end gap-4 px-8 pb-4 sm:justify-end">
              <Button onClick={handleClose} variant="outline" className="py-3 px-3">Close</Button>

              {task?.type === TaskType.SIGN && task?.status !== TaskStatus.COMPLETED && user?.role !== UserRole?.MODERATOR && task?.user?.id === user?.id && (
                <Button onClick={() => router.push("esignature")} className="py-3 px-3">
                  Sign Now
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
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
        </Dialog>
      </>
    );
  };

const TasksSection = ({ client = null }) => {
    const [page, setPage] = useState(null);
    const params = useParams();
    const pathname = usePathname();
    const actionDropdownRef = useRef();
    const { data: config } = useSelector((state) => state.portal);
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [myTaskPopupBoxContent, setMyTaskPopupBoxContent] = useState("");
    const [isMyTaskPopupOpen, setIsMyTaskPopupOpen] = useState(false);
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
    const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });

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
        const url = `/api/tasks?portalId=${encodeURIComponent(params.portalid)}&userId=${encodeURIComponent(client.id)}`;
    
        console.log("API URL:", url); // Debugging
    
        const response = await fetchWrapper(url, {}, "fetch-tasks");
        
        if (!response.ok) {
          // Handle 404 specifically
          if (response.status === 404) {
            throw new Error(`Resource not found: /api/tasks`);
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

    return (
      <Card className="max-h-[350px] overflow-hidden p-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between bg-secondary p-3 border-b border-border rounded-t-xl">
          <h3 className="text-lg font-semibold text-foreground font-lato">
            My Tasks
          </h3>
          <Button
            variant='default'
            type="button"
            size="lg"
            className="px-3 py-3"
            onClick={() => setIsOpenAddTaskModal((prev) => !prev)}
          >
            <Plus className="w-4 h-3" />
            Add
          </Button>
        </div>

        {/* Tasks Container */}
        <ScrollArea className="max-h-[280px] rounded-b-xl overflow-y-auto scrollbar-hide">
          {(isChecklistLoading || isTaskUpdateLoading) ? (
            <div className="min-h-[290px] flex items-center justify-center">
              <LoaderSpinner size={24} className="text-secondary-foreground" />
            </div>
          ) : (
            <>            
              {sortedTasks?.length > 0 ? (
                sortedTasks?.map((task) => (
                 <div key={task?.id} className='py-2 hover:bg-accent shadow-sm border-b border-border'>
                  {/* Main task row */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpenTaskModal(true);
                      setIsActionDropdownOpen(false);
                      setSelectedTask(task)
                      setTaskToUpdate(task)
                    }}
                    className="flex items-center gap-3 px-3 py-1 transition-colors cursor-pointer"
                  >

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={task?.status === TaskStatus.COMPLETED}
                        id={`complete-${task?.id}`}
                        disabled={task?.status === TaskStatus.COMPLETED}
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateTaskStatus(task);
                          }
                        }}
                      />

                    </div>


                    <div className={cn("flex-1 text-sm", task?.status === TaskStatus.COMPLETED ? 'text-muted-foreground' : 'text-foreground')}>
                      {task?.title}
                    </div>

                    <div className="flex-shrink-0">
                      {task?.status === TaskStatus.COMPLETED ? (
                        <Badge className="rounded-full bg-green-100 text-green-800 border-transparent">
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="rounded-full bg-yellow-100 text-yellow-800 border-transparent">
                          {task?.type}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Due date row with checkbox */}
                  <div className="px-5">
                    <div className="flex items-center justify-between">
                      <div className={cn("flex items-center gap-2 text-xs", task?.status === TaskStatus.COMPLETED ? 'text-muted-foreground' : 'text-muted-foreground')}>
                        <Clock className="h-4 w-4" />
                        <span>Due: {formatDate(task?.dueDate)}</span>
                      </div>

                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="text-muted-foreground mb-4">
                    <FileText className="h-12 w-12" />
                  </div>
                  <h4 className="text-foreground font-medium text-lg mb-1">
                    No Tasks Yet
                  </h4>
                  <p className="text-muted-foreground text-sm text-center">
                    You don't have any tasks assigned right now.
                  </p>
                </div>
              )}
            </>            
          )}
        </ScrollArea>
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
      </Card>
    );
}

export default TasksSection;