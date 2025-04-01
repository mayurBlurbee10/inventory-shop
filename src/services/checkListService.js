import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { CheckLists } from "@/entities/CheckLists";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const getCheckListByPortalIdSorted = async (portalId) => {
  const checkListRepository = await getRepository(CheckLists);
  try {
    // Nested level sorting is not supported by typeORM in .find() method.
    const checklists = await checkListRepository
      .createQueryBuilder("checklist")
      .leftJoinAndSelect("checklist.tasks", "task")
      .leftJoinAndSelect("task.user", "user")
      .leftJoinAndSelect("task.createdBy", "createdBy")
      .where("checklist.portalId = :portalId", { portalId })
      .orderBy("task.createdAt", "DESC") 
      .getMany();

    return checklists;
  } catch (error) {
    console.error("Error getting checklists:", error.message);
    throw error;
  }
};

const getCheckListByPortalId = async (portalId) => {
  const checkListRepository = await getRepository(CheckLists);
  try {
    const checklists = await checkListRepository.find({
      where: {
        portalId: portalId,
      },
      relations: ["tasks", "tasks.user", "tasks.createdBy"],
    });
    
    return checklists;
  } catch (error) {
    console.error("Error getting checklists:", error.message);
    throw error;
  }
};

const getCheckListById = async (checkListId) => {
  const checkListRepository = await getRepository(CheckLists);
  try {
    const checklist = await checkListRepository.find({
      where: {
        id: checkListId,
      },
      relations: ["tasks", "tasks.user", "tasks.createdBy"],
    });
    return checklist ? checklist[0] : [];
  } catch (error) {
    console.error("Error getting checklist:", error.message);
    throw error;
  }
};

const createCheckList = async (checklist) => {
  const checkListRepository = await getRepository(CheckLists);
  try {
    const newCheckList = checkListRepository.create(checklist);
    await checkListRepository.save(newCheckList);
    return newCheckList;
  } catch (error) {
    throw new Error("Failed to create checklist.");
  }
};

const updateCheckList = async (checkListId, updatedData) => {
  const checkListRepository = await getRepository(CheckLists);
  try {
    const mainCheckList = await checkListRepository.findOneBy({
      id: checkListId,
    });
    Object.assign(mainCheckList, updatedData);
    await checkListRepository.save(mainCheckList);
    return mainCheckList;
  } catch (error) {
    console.error("Error updating checklist:", error.message);
    throw error;
  }
};

const deleteCheckList = async (checkListId) => {
  const checkListRepository = await getRepository(CheckLists);
  try {
    await checkListRepository.delete(checkListId);
    return;
  } catch (error) {
    throw new Error("Failed to delete checklist.");
  }
};

export default {
  getCheckListByPortalIdSorted,
  getCheckListByPortalId,
  getCheckListById,
  createCheckList,
  updateCheckList,
  deleteCheckList,
};
