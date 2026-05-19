import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { ContentManagement } from "@/entities/ContentManagement";
import { Portals } from "@/entities/Portals";

function reverseSanitizeName(sanitizedName) {
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  reversedName = reversedName.replace(/-/g, " ");

  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return reversedName;
}

const createContentManagement = async (data) => {
  const sanitizedLegalName = reverseSanitizeName(data.portalId);
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  const portalRepository = connection.getRepository(Portals);

  try {
    // Check if portal exists
    const portal = await portalRepository.findOneBy({
      legalName: sanitizedLegalName,
    });
    if (!portal) {
      throw new Error("Portal does not exist.");
    }

    // Create ContentManagement entry
    const content = contentRepository.create(data);

    return await contentRepository.save(content);
  } catch (error) {
    throw new Error(`Failed to create content: ${error.message}`);
  }
};

const getContentManagement = async (portalId) => {
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  try {
    const contents = await contentRepository.find({
      where: { portalId },
    });
    return contents;
  } catch (error) {
    throw new Error("Failed to get content.");
  }
};

const getContentByTitle = async (title, portalId) => {
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  try {
    const content = await contentRepository.findOne({
      where: { portalId: portalId, title: title },
    });
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
      where: { portalId: data.portalId, title: data.title }
    });

    if (!content) {
      throw new Error("Content not found.");
    }
    Object.assign(content, data);
    return await contentRepository.save(content);
  } catch (error) {
    throw new Error(`Failed to update content: ${error.message}`);
  }
};

const removeOldEntry = async(entity) => {
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  try {
   return contentRepository.remove(entity)
  } catch (error) {
    throw new Error(`Failed to remove content: ${error.message}`);
  }
};

const deleteAllContent = async (portalId) => {
  await connectDatabase();
  const connection = getConnection();
  const contentRepository = connection.getRepository(ContentManagement);
  try {
    await contentRepository.delete({ portalId: portalId });
    return;
  } catch (error) {
    throw error;
  }
};

export default {
  createContentManagement,
  getContentManagement,
  getContentByTitle,
  updateContentManagement,
  removeOldEntry,
  deleteAllContent
};
