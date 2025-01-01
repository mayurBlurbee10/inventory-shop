import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { ContentManagement } from "@/entities/ContentManagement";

const createContentManagement = async (data) => {
  console.log(data);
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  try {
    const content = contentRepository.create({
      portalId: data.portalId,
      title: data.title,
      type: data.type,
    });
    return await contentRepository.save(content);
  } catch (error) {
    throw new Error("Failed to create content type.");
  }
};

const getContentManagement = async (portalId) => {
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  try {
    const content = contentRepository.find({ where: { portalId } });
    return content;
  } catch (error) {
    throw new Error("Failed to get content.");
  }
};
const updateContentManagement = async (data) => {
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);

  try {
    const content = await contentRepository.findOne({
      where: { portalId: data.portalId, title: data.title },
    });

    if (!content) {
      throw new Error("Content not found.");
    }

    content.value = data.value;

    return await contentRepository.save(content);
  } catch (error) {
    throw new Error(`Failed to update content: ${error.message}`);
  }
};

export default {
  createContentManagement,
  getContentManagement,
  updateContentManagement,
};
