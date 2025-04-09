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
import { uploadFile, uploadSampleFiles } from "@/app/api/box/files/route";
import userService from "./userService";
import checkListService from "./checkListService";
import messageService from "./messageService";
import taskService from "./taskService";
import { ContentManagement } from "@/entities/ContentManagement";
import { createESign } from "@/app/api/box/e-sign/route";
import { bulkPages } from "@/app/api/pages/bulk/route";
import { existingPages } from "@/app/lib/data/existingPages";

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
    await Promise.all([
      deleteCustomPages(pageRepository, pluginRepository, portalId),
      deleteFilesAndFolder(portalId),
      deleteChecklists(checkListRepository, portalId),
      deleteMessages(messageRepository, portalId),
      deleteContent(contentManagementRepository, portalId),
      updateUsersTNCStatus(userRepository, portalId),
      resetPortalTheme(portalId),
    ]);

    return;
  } catch (error) {
    console.error("Error resetting portal:", error.message);
    throw error;
  }
};

const getPluginByPortalId = async (pluginRepository, portalId) => {
  console.log("reset plugin");
  return await pluginRepository.findOne({
    where: {
      portalId: portalId,
      type: PluginType.PAGES,
    },
  });
};

const deleteCustomPages = async (pageRepository, pluginRepository, portalId) => {
  const plugin = await getPluginByPortalId(pluginRepository, portalId);
  // if (plugin && plugin.pages) {
  //   const pages = await pageRepository.find({
  //     where: {
  //       plugin: plugin?.id,
  //       isCustomPage: true,
  //     },
  //   });
  //   console.log("reset pages", pages);
  //   const filteredPages = pages ? pages.filter((page) => page.title.toLowercase() !== "trading") : [];

  //   for (const page of filteredPages) {
  //     await pageRepository.remove(page);
  //   }
  // }
  if (plugin) {
    await pageRepository.delete({
      plugin: plugin?.id,
      isCustomPage: true,
    });
  }
  await bulkPages(existingPages, [], [], portalId, plugin?.id)
};

const deleteChecklists = async (checkListRepository, portalId) => {
  const checklists = await checkListRepository.find({
    where: { portalId },
  });
  await checkListRepository.remove(checklists);
  await createSampleTasks(portalId);
};

const createSampleTasks = async (portalId) => {

  const generalCheckList = await checkListService.createGeneralCheckList({
    name: "General",
    portalId: portalId,
    isActive: true,
  });

  const checklistId = generalCheckList?.id;
  const portalCreatedAdmin = await portalService.getPortalCreatedAdmin(
    portalId
  );
  const endUserEmail = "mike.conti@user.com";
  const endUserData = await userService.getUserByEmail(endUserEmail);
  const endUser = endUserData ? endUserData : portalCreatedAdmin;
  const endUserId = endUserData ? endUserData?.folderId : null;
  if (endUserId) {
    await deleteFolderContents(endUserId);
  }
  const file = await uploadFile(endUser?.folderId, endUser?.boxUserId);
  const signRequest = await createESign(
    file?.id,
    {
      email: endUser?.email,
      id: endUser?.id,
    },
    endUser?.boxUserId,
    portalId
  );

  const tasks = [
    {
      title: "Reports",
      description: "Please submit performance reports.",
      dueDate: new Date(Date.now()),
      type: TaskType.GENERAL,
      user: endUser?.id,
      createdBy: portalCreatedAdmin?.id,
      uploads: [],
      portalId: portalId,
      checklist: checklistId,
    },
    {
      title: "Agreement",
      description: "Please sign this agreement.",
      dueDate: new Date(Date.now()),
      type: TaskType.SIGN,
      user: endUser?.id,
      createdBy: portalCreatedAdmin?.id,
      uploads: [signRequest],
      portalId: portalId,
      checklist: checklistId,
      file : {
        id: file?.id,
        name: file?.name,
        description: file?.description,
        size: file?.size,
      }
    },
  ];

  for (let task of tasks) {
    await taskService.createTask(task);
  }
};

const deleteMessages = async (messageRepository, portalId) => {
  await messageRepository.delete({ portalId: portalId });
  await createSampleMessage(portalId);
  return;
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
  const portalCreatedAdmin = await portalService.getPortalCreatedAdmin(
    portalId
  );
  const folderId = portalCreatedAdmin?.folderId;
  if (folderId) {
    await deleteFolderContents(folderId);
  }
  await uploadSampleFiles(
    portalCreatedAdmin?.email,
    portalCreatedAdmin?.boxUserId,
    folderId
  );
};

const createSampleMessage = async (portalId) => {
  const portalCreatedAdmin = await portalService.getPortalCreatedAdmin(
    portalId
  );
  const endUserEmail = "mike.conti@user.com";
  const endUserData = await userService.getUserByEmail(endUserEmail);
  const endUser = endUserData ? endUserData : portalCreatedAdmin;

  const messages = [
    {
      sender: portalCreatedAdmin?.id,
      receiver: endUser?.id,
      portalId: portalId,
      subject: "Meeting",
      text: "Can review Q3 Plans?",
    },
    {
      sender: endUser?.id,
      receiver: portalCreatedAdmin?.id,
      portalId: portalId,
      subject: "Lunch",
      text: "Available?",
    },
  ];

  for (let message of messages) {
    const msg = await messageService.createMessage(message);
    console.log("reset msg", msg)
  }
};

const resetPortalTheme = async (portalId) => {
  await portalService.updatePortal(portalId, {
    primaryColor: "#000000",
    secondaryColor: "#2563eb",
    accentColor: "#ffffff",
  });
};

export default {
  resetPortal,
  createSampleMessage, 
  createSampleTasks
};
