import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import taskService from "@/services/taskService";
import { TaskType } from "@/config/constants";
import { deleteFile } from "../box/files/route";

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

// Create or update the config file
export async function POST(req) {
  await logApiCall(req);

  const data = await req.json();
  let { title } = data;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const task = await taskService.createTask(data);

    if (!task) {
      return NextResponse.json(
        { error: `Task didn't created. Please try again.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: `task assigned successfully.`,
      data: task,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create task.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await logApiCall(req);

    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalId");
    const userId = searchParams.get("userId");
    const taskId = searchParams.get("id");

    if (!!portalId && !!userId) {
      const tasks = await taskService.getTasksByPortalId(portalId);

      return NextResponse.json({
        message: `tasks retrieved successfully.`,
        data: tasks || [],
      });
    } 
    if (!!portalId) {
      const tasks = await taskService.getTasksByPortalId(portalId);

      return NextResponse.json({
        message: `tasks retrieved successfully.`,
        data: tasks || [],
      });
    } 
    if (!!taskId) {
      const task = await taskService.getTaskById(taskId);
      if (!task) {
        return NextResponse.json(
          { error: `task with taskId ${taskId} not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: `tasks retrieved successfully.`,
        data: task,
      });
    }
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve tasks.", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await logApiCall(req);
    const {taskId , ...rest} = await req.json();

    const taskExist = await taskService.getTaskById(taskId);

    if (!taskExist) {
      return NextResponse.json(
        { error: `task with taskId ${taskId} not found.` },
        { status: 404 }
      );
    }

    const taskObj = {
      ...rest
    };
    // if (rest.status) {
    //   taskObj.status = data.status;
    // }

    // if (taskExist.type === TaskType.SIGN) {
    //   taskObj.uploads = data.uploads;
    // }

    if(rest?.file && taskExist?.file){
      await deleteFile(taskExist?.file?.id);
    }

    const task = await taskService.updateTask(taskId, taskObj);

    return NextResponse.json({
      message: `task updated successfully.`,
      data: task,
    });
  } catch (error) {
    console.error("Error update task:", error.message);
    return NextResponse.json(
      { error: "Failed to update task.", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await logApiCall(req);
    const {taskId} = await req.json();

    const taskExist = await taskService.getTaskById(taskId);

    if (!taskExist) {
      return NextResponse.json(
        { error: `task with taskId ${taskId} not found.` },
        { status: 404 }
      );
    }
    if(taskExist?.file){
      await deleteFile(taskExist?.file?.id)
    }
    await taskService.deleteTask(taskId);

    return NextResponse.json({
      message: `task deleted successfully.`,
      data: taskExist,
    });
  } catch (error) {
    console.error("Error delete task:", error.message);
    return NextResponse.json(
      { error: "Failed to delete task.", details: error.message },
      { status: 500 }
    );
  }
}

