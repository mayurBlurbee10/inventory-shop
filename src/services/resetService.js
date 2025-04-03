import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { CheckLists } from "@/entities/CheckLists";
import { Messages } from "@/entities/Messages";
import { Pages } from "@/entities/Pages";
import { In } from "typeorm";
import { Users } from "@/entities/Users";
import { Plugins } from "@/entities/Plugins";
import { PluginType } from "@/config/constants";

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

  try {
    const plugin = await getPluginByPortalId(pluginRepository, portalId);

    await Promise.all([
      deleteCustomPages(pageRepository, plugin?.id),
      deleteChecklists(checkListRepository, portalId),
      deleteMessages(messageRepository, portalId),
      updateUsersTNCStatus(userRepository, portalId),
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

  const filteredChecklists = checklists.filter(c => c.title !== "general");

  await checkListRepository.remove(filteredChecklists);
};

const deleteMessages = async (messageRepository, portalId) => {
  await messageRepository.delete({ portalId: portalId });
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

export default {
  resetPortal,
};
