import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Tasks } from "../entities/Tasks.ts";
import { Users } from "../entities/Users.ts";
import { NotificationConfigure, NotificationType } from "../config/constants.ts";
import inAppNotificationService from "./inAppNotification.service.ts";
import notificationService from "./notification.service.ts";
import portalService from "./portal.service.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const getFullName = (user: any) =>
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  user?.email ||
  "Someone";

const normalizeRelationId = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "object") return value.id ? String(value.id) : undefined;
  return String(value);
};

const getTasks = async (portalId: string, userId: string) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const tasks = await taskRepository.find({
      where: {
        portalId: portalId,
        user: { id: userId },
      },
      relations: ["user", "createdBy"],
      order: { status: "ASC" },
    });
    return tasks;
  } catch (error) {
    console.error("Error getting tasks:", (error as Error).message);
    throw error;
  }
};

const getTasksByPortalId = async (portalId: string) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const tasks = await taskRepository.find({
      where: {
        portalId: portalId,
      },
      relations: ["user", "createdBy"],
      order: {
        status: "ASC",
      },
    });
    return tasks;
  } catch (error) {
    console.error("Error getting task:", (error as Error).message);
    throw error;
  }
};

const getTaskById = async (taskId: string) => {
  const taskRepository = await getRepository(Tasks);
  try {
    return await taskRepository.findOne({
      where: { id: taskId },
      relations: ["user"],
    });
  } catch (error) {
    console.error("Error getting task:", (error as Error).message);
    throw error;
  }
};

const createTask = async (task: any) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const assigneeId = normalizeRelationId(task.user);
    const creatorId = normalizeRelationId(task.createdBy);

    const newTask = taskRepository.create({
      ...task,
      user: assigneeId ? { id: assigneeId } : task.user,
      createdBy: creatorId ? { id: creatorId } : task.createdBy,
    });
    const savedTask = await taskRepository.save(newTask);

    const savedAssigneeId =
      normalizeRelationId((savedTask as any).user) ?? assigneeId;

    if (
      savedAssigneeId &&
      (!creatorId || String(savedAssigneeId) !== String(creatorId))
    ) {
      try {
        const isEnabled = await notificationService.isNotificationEnabled(
          savedAssigneeId,
          NotificationConfigure.TASK_IN_APP,
        );
        if (isEnabled) {
          const userRepository = await getRepository(Users);
          const creator = creatorId
            ? await userRepository.findOne({
                where: { id: creatorId },
              })
            : null;
          const creatorName = getFullName(creator);
          const taskTitle =
            (savedTask as any).title || task.title || "New task assigned";

          await inAppNotificationService.createNotification({
            userId: savedAssigneeId,
            portalId: await portalService.resolvePortalIdToUuid(task.portalId),
            title: `${creatorName} assigned you a task.`,
            body: taskTitle,
            type: NotificationType.TASK,
            referenceId: (savedTask as any).id,
          });
        }
      } catch (notifErr) {
        console.error("Failed to create task notification:", notifErr);
      }
    }

    return savedTask;
  } catch (error) {
    throw new Error("Failed to create task.");
  }
};

const updateTask = async (taskId: string, updatedData: any) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const mainTask = await taskRepository.findOneBy({ id: taskId });
    if (!mainTask) {
      throw new Error("Task not found");
    }
    Object.assign(mainTask, updatedData);
    await taskRepository.save(mainTask);
    console.log("Task updated successfully!");
    return mainTask;
  } catch (error) {
    console.error("Error updating task:", (error as Error).message);
    throw error;
  }
};

const deleteTask = async (taskId: string) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const taskExist = await taskRepository.findOneBy({ id: taskId });
    if (!taskExist) {
      throw new Error("task not exist");
    }
    await taskRepository.delete({ id: taskId });
    return "Task deleted successfully.";
  } catch (error) {
    throw new Error(`Failed to delete task. ${(error as Error).message}`);
  }
};

const deleteUserTasks = async (userId: string, portalId: string) => {
  const taskRepository = await getRepository(Tasks);
  try {
    await taskRepository.delete({
      user: { id: userId } as any,
      portalId: portalId,
    });
    return;
  } catch (error) {
    throw new Error(`Failed to delete user tasks. ${(error as Error).message}`);
  }
};

export default {
  getTasks,
  getTasksByPortalId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  deleteUserTasks,
};

