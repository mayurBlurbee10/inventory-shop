import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Tasks } from "../entities/Tasks.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
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
    const newTask = taskRepository.create(task);
    await taskRepository.save(newTask);
    return newTask;
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

