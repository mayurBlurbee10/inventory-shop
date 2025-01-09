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
    const content = contentRepository.create({
      portalId: data.portalId,
      title: data.title,
      type: data.type,
      value: data.value,
    });

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

    content.value = data.value;

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

export default {
  createContentManagement,
  getContentManagement,
  updateContentManagement,
  removeOldEntry
};
