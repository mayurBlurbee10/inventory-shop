import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import taskService from "../services/task.service.ts";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/box.ts";
import BoxSDK from "box-node-sdk";

const client = getBoxClient();

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});

const deleteFile = async (fileId: string) => {
  if (!fileId) return;
  const accessToken = await client._session.getAccessToken();
  const newClient = sdk.getBasicClient(accessToken);
  await newClient.files.delete(fileId);
};

const createTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const data = req.body;
    let { title } = data;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const task = await taskService.createTask(data);

    if (!task) {
      return res.status(404).json({
        error: `Task didn't created. Please try again.`,
      });
    }
    return res.status(200).json({
      message: `task assigned successfully.`,
      data: task,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to create task.",
      details: (error as Error).message,
    });
  }
});

const getTasks = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalId, userId, id } = req.query;

    if (!!portalId && !!userId) {
      const tasks = await taskService.getTasks(portalId as string, userId as string);
      return res.status(200).json({
        message: `tasks retrieved successfully.`,
        data: tasks || [],
      });
    }
    if (!!portalId) {
      const tasks = await taskService.getTasksByPortalId(portalId as string);
      return res.status(200).json({
        message: `tasks retrieved successfully.`,
        data: tasks || [],
      });
    }
    if (!!id) {
      const task = await taskService.getTaskById(id as string);
      if (!task) {
        return res.status(404).json({
          error: `task with taskId ${id} not found.`,
        });
      }
      return res.status(200).json({
        message: `tasks retrieved successfully.`,
        data: task,
      });
    }
    return res.status(200).json({
      message: `tasks retrieved successfully.`,
      data: [],
    });
  } catch (error) {
    console.error("Error fetching tasks:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to retrieve tasks.",
      details: (error as Error).message,
    });
  }
});

const updateTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { taskId, ...rest } = req.body;

    const taskExist = await taskService.getTaskById(taskId);

    if (!taskExist) {
      return res.status(404).json({
        error: `task with taskId ${taskId} not found.`,
      });
    }

    const taskObj = {
      ...rest,
    };

    if (rest?.file && (taskExist as any)?.file) {
      await deleteFile((taskExist as any)?.file?.id);
    }

    const task = await taskService.updateTask(taskId, taskObj);

    return res.status(200).json({
      message: `task updated successfully.`,
      data: task,
    });
  } catch (error) {
    console.error("Error update task:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to update task.",
      details: (error as Error).message,
    });
  }
});

const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { taskId } = req.body;

    const taskExist = await taskService.getTaskById(taskId);

    if (!taskExist) {
      return res.status(404).json({
        error: `task with taskId ${taskId} not found.`,
      });
    }
    if ((taskExist as any)?.file && (taskExist as any)?.title !== "Agreement") {
      await deleteFile((taskExist as any)?.file?.id);
    }
    await taskService.deleteTask(taskId);

    return res.status(200).json({
      message: `task deleted successfully.`,
      data: taskExist,
    });
  } catch (error) {
    console.error("Error delete task:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to delete task.",
      details: (error as Error).message,
    });
  }
});

export default {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};

