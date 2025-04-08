import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { CheckLists } from "@/entities/CheckLists";
import { Messages } from "@/entities/Messages";
import { Pages } from "@/entities/Pages";
import { In } from "typeorm";
import { Users } from "@/entities/Users";
import { Plugins } from "@/entities/Plugins";
import { PluginType, TaskType } from "@/config/constants";
import portalService from "./portalService";
import { deleteFolderContents } from "@/app/api/box/folders/route";
import { uploadSampleFiles } from "@/app/api/box/files/route";
import userService from "./userService";
import checkListService from "./checkListService";
import messageService from "./messageService";
import taskService from "./taskService";
import { ContentManagement } from "@/entities/ContentManagement";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const resetPortal = async (portalId) => {
  const checkListRepository = await getRepository(CheckLists);
  const userRepository = await getRepository(Users);
  const pageRepository = await getRepository(Pages);
  const pluginRepository = await getRepository(Plugins);
  const messageRepository = await getRepository(Messages);
  const contentManagementRepository = await getRepository(ContentManagement);

  try {
    const plugin = await getPluginByPortalId(pluginRepository, portalId);

    await Promise.all([
      deleteCustomPages(pageRepository, plugin?.id),
      deleteChecklists(checkListRepository, portalId),
      deleteMessages(messageRepository, portalId),
      deleteContent(contentManagementRepository, portalId),
      updateUsersTNCStatus(userRepository, portalId),
      deleteFilesAndFolder(portalId),
      createSampleMessage(portalId)
    ]);

    return;
  } catch (error) {
    console.error("Error resetting portal:", error.message);
    throw error;
  }
};

const getPluginByPortalId = async (pluginRepository, portalId) => {
  return await pluginRepository.findOne({
    where: {
      portalId: portalId,
      type: PluginType.PAGES,
    },
  });
};

const deleteCustomPages = async (pageRepository, pluginId) => {
  if (pluginId) {
    await pageRepository.delete({
      plugin: pluginId,
      isCustomPage: true,
    });
  }
};

const deleteChecklists = async (checkListRepository, portalId) => {
  const checklists = await checkListRepository.find({
    where: { portalId },
  });
  await checkListRepository.remove(checklists);

  const generalCheckList = await checkListService.createGeneralCheckList({ name : "General", portalId : portalId, isActive : true });

  await createSampleTasks(generalCheckList?.id, portalId)
};

const createSampleTasks = async (checklistId, portalId) => {
  const portalCreatedAdmin = await portalService.getPortalCreatedAdmin(portalId);
  const endUser = await userService.getUserByEmail(`user_${portalCreatedAdmin?.email}`);

  const tasks = [
    {
      title : "Review Documents",
      description: "Please review documents",
      dueDate: new Date(Date.now()),
      type: TaskType.GENERAL,
      user: endUser ? endUser?.id : portalCreatedAdmin?.id,
      createdBy: portalCreatedAdmin?.id,
      uploads: [],
      portalId: portalId,
      checklist : checklistId
    },
    {
      title : "Upload Docs",
      description: "documents",
      dueDate: new Date(Date.now()),
      type: TaskType.GENERAL,
      user: endUser ? endUser?.id : portalCreatedAdmin?.id,
      createdBy: portalCreatedAdmin?.id,
      uploads: [],
      portalId: portalId,
      checklist : checklistId
    }
  ]

  for(let task of tasks){
    await taskService.createTask(task);
  }
};

const deleteMessages = async (messageRepository, portalId) => {
  await messageRepository.delete({ portalId: portalId });
};

const deleteContent = async (contentManagementRepository, portalId) => {
  await contentManagementRepository.delete({ portalId: portalId });
};

const updateUsersTNCStatus = async (userRepository, portalId) => {
  const users = await userRepository.find({
    where: { portalId: portalId, isTNCAccepted: true },
  });

  const userUpdates = users.map((user) =>
    userRepository.update(user.id, { isTNCAccepted: false })
  );

  await Promise.all(userUpdates);
};

const deleteFilesAndFolder = async (portalId) => {
  const portalCreatedAdmin = await portalService.getPortalCreatedAdmin(portalId);
  const folderId = portalCreatedAdmin?.folderId;
  if(folderId){
    await deleteFolderContents(folderId);
  }
  await uploadSampleFiles(portalCreatedAdmin?.email, portalCreatedAdmin?.boxUserId, folderId);
}

const createSampleMessage = async (portalId) => {
  const portalCreatedAdmin = await portalService.getPortalCreatedAdmin(portalId);
  const endUser = await userService.getUserByEmail(`user_${portalCreatedAdmin?.email}`);
  
  const messages = [
    {
      sender: portalCreatedAdmin?.id,
      receiver: endUser ? endUser?.id : portalCreatedAdmin?.id,
      portalId: portalId,
      subject: "Availablity for Quick Call",
      text: "Are you available for the quick call?",
    },
    {
      sender: portalCreatedAdmin?.id,
      receiver: endUser ? endUser?.id : portalCreatedAdmin?.id,
      portalId: portalId,
      subject: "Document Upload Required",
      text: "Hello, We noticed that some required documents are still pending. Please upload the necessary files at your earliest convenience.",
    }
  ];

  for(let message of messages){
    await messageService.createMessage(message);
  }
};

export default {
  resetPortal,
};
