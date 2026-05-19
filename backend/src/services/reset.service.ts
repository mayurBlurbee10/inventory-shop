import messageService from "./message.service.ts";
import checkListService from "./checkList.service.ts";
import taskService from "./task.service.ts";
import portalService from "./portal.service.ts";
import userService from "./user.service.ts";
import { TaskType } from "../config/constants.ts";

const createSampleMessage = async (portalId: string) => {
  const portalCreatedAdmin: any = await portalService.getPortalCreatedAdmin(portalId);
  const endUserEmail = "mike.conti@user.com";
  const endUserData: any = await userService.getUserByEmail(endUserEmail);
  const endUser = endUserData ? endUserData : portalCreatedAdmin;

  if (!portalCreatedAdmin?.id || !endUser?.id) {
    return;
  }

  const messages = [
    {
      sender: portalCreatedAdmin.id,
      receiver: endUser.id,
      portalId: portalId,
      subject: "Meeting",
      text: "Can review Q3 Plans?",
    },
    {
      sender: endUser.id,
      receiver: portalCreatedAdmin.id,
      portalId: portalId,
      subject: "Lunch",
      text: "Available?",
    },
  ];

  for (const message of messages) {
    await messageService.createMessage(message);
  }
};

const createSampleTasks = async (portalId: string) => {
  const generalCheckList: any = await checkListService.createGeneralCheckList({
    name: "General",
    portalId: portalId,
    isActive: true,
  });

  const checklistId = generalCheckList?.id;
  const portalCreatedAdmin: any = await portalService.getPortalCreatedAdmin(portalId);
  const endUserEmail = "mike.conti@user.com";
  const endUserData: any = await userService.getUserByEmail(endUserEmail);
  const endUser = endUserData ? endUserData : portalCreatedAdmin;

  if (!portalCreatedAdmin?.id || !endUser?.id || !checklistId) {
    return;
  }

  const tasks = [
    {
      title: "Reports",
      description: "Please submit performance reports.",
      dueDate: new Date(Date.now()),
      type: TaskType.GENERAL,
      user: endUser.id,
      createdBy: portalCreatedAdmin.id,
      uploads: [],
      portalId: portalId,
      checklist: checklistId,
    },
    {
      title: "Agreement",
      description: "Please sign this agreement.",
      dueDate: new Date(Date.now()),
      type: TaskType.SIGN,
      user: endUser.id,
      createdBy: portalCreatedAdmin.id,
      uploads: [],
      portalId: portalId,
      checklist: checklistId,
    },
  ];

  for (const task of tasks) {
    await taskService.createTask(task);
  }
};

const resetPortal = async (portalId: string) => {
  await portalService.resetPortal(portalId);
};

export default {
  createSampleMessage,
  createSampleTasks,
  resetPortal,
};
