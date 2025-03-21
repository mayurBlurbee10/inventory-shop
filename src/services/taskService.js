import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Tasks } from "@/entities/Tasks";
import { getSignRequest } from "@/app/api/box/e-sign/route";
import { TaskStatus } from "@/config/constants";

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
      relations: ["user"],
      order: {
        status: "ASC",
      },
    });
    const completedStatuses = ["signed", "completed", "finalizing"];

    // Fetch all sign requests in parallel
    await Promise.all(
      tasks.map(async (task) => {
        if (!task.uploads || task.uploads.length === 0) return;

        const signRequest = await getSignRequest(task.uploads[0]); // Fetch in parallel
        if (signRequest && completedStatuses.includes(signRequest?.status)) {
          await updateTask(task.id, { status: TaskStatus.COMPLETED });
        }
      })
    );
    return tasks;
  } catch (error) {
    console.error("Error geting task:", error.message);
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
      relations: ["user"],
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
    return await taskRepository.findOneBy({ id: taskId });
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

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  getTasksByPortalId,
};
