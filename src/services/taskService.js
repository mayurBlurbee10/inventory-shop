import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Tasks } from "@/entities/Tasks";
import { getSignRequest } from "@/app/api/box/e-sign/route";
import { TaskStatus, TaskType } from "@/config/constants";
import userService from "./userService";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const getTasks = async (portalId, userId) => {
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

    const completedStatuses = ["signed", "completed", "finalizing"];

    // Process sign requests in parallel
    await Promise.all(
      tasks.map(async (task) => {
        if (!task.uploads || task.uploads.length === 0) return;

        const signRequest = await getSignRequest(task.uploads[0]);

        if (signRequest === null) {
          console.warn(`Sign request missing for task ${task.id}, marking as FILE_DELETED`);
          await updateTask(task.id, { status: TaskStatus.FILE_DELETED });
          return;
        }

        if (completedStatuses.includes(signRequest?.status)) {
          await updateTask(task.id, { status: TaskStatus.COMPLETED });
        }
      })
    );

    return tasks;
  } catch (error) {
    console.error("Error getting tasks:", error.message);
    throw error;
  }
};

const getTasksByPortalId = async (portalId) => {
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
    console.error("Error geting task:", error.message);
    throw error;
  }
};

const getTaskById = async (taskId) => {
  const taskRepository = await getRepository(Tasks);
  try {
    return await taskRepository.findOne({
      where: { id: taskId },
      relations: ["user"],
    });
  } catch (error) {
    console.error("Error geting task:", error.message);
    throw error;
  }
};

const createTask = async (task) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const newTask = taskRepository.create(task);
    await taskRepository.save(newTask);
    return newTask;
  } catch (error) {
    throw new Error("Failed to create task.");
  }
};

const updateTask = async (taskId, updatedData) => {
  const taskRepository = await getRepository(Tasks);
  try {
    const mainTask = await taskRepository.findOneBy({ id: taskId });
    Object.assign(mainTask, updatedData);
    await taskRepository.save(mainTask);
    return mainTask;
  } catch (error) {
    console.error("Error updating task:", error.message);
    throw error;
  }
};

const deleteTask = async (taskId) => {
  const taskRepository = await getRepository(Tasks);

  try {
    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ['user'],
    });

    if (!task) {
      throw new Error("Task not found.");
    }

    const uploadId = Array.isArray(task.uploads) && task.uploads.length > 0
      ? task.uploads
      : [];

    if (task.type === TaskType.SIGN && task.user) {
      await userService.removeSignRequest(task.user, uploadId);
    }

    await taskRepository.remove(task);
  } catch (error) {
    throw new Error("Failed to delete task.");
  }
};

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  getTasksByPortalId,
  deleteTask
};
