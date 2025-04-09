import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Portals } from "@/entities/Portals";
import userService from "./userService";

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

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPortal = async (data) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = portalRepository.create(data);
    await portalRepository.save(portal);
    return portal;
  } catch (error) {
    throw new Error("Failed to create portal.");
  }
};

const getPortalsByUser = async (user) => {
  const portalRepository = await getRepository(Portals);
  try {
    const userId = String(user).toLowerCase();
    const portals = await portalRepository.find({
      where: {
        createdBy: {
          id: userId,
        },
      },
      relations: ["createdBy"],
      order: {
        createdAt: "DESC",
      },
    });

    const allUsers = new Set();

    const portalWithUserCounts = await Promise.all(
      portals.map(async (portal) => {
        const users = await userService.getUsersByPortal(
          sanitizeName(portal.legalName)
        );

        // Add individual users to the Set for uniqueness
        users.forEach((user) => allUsers.add(user.id)); // Assuming `user.id` is the unique identifier

        return { ...portal, userCount: users.length };
      })
    );

    return { portals: portalWithUserCounts, activeUsers: allUsers.size };
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortals = async () => {
  const portalRepository = await getRepository(Portals);
  try {
    const portals = await portalRepository.find();
    return portals;
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortalByLegalName = async (legalName) => {
  const portalRepository = await getRepository(Portals);
  try {
    return await portalRepository.findOne({
      where: { legalName },
      relations: ["createdBy"],
    });
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const updatePortalThemes = async (portalData) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalExist = await portalRepository.findOneBy({ id: portalData.id });
    if (!portalExist) {
      throw new Error("portal doesn't exist");
    }
    portalExist.theme = portalData.theme;
    portalExist.logo = portalData.logo;
    portalExist.primaryColor = portalData.primaryColor;
    portalExist.secondaryColor = portalData.secondaryColor;
    portalExist.accentColor = portalData.accentColor;

    await portalRepository.save(portalExist);
    return portalExist;
  } catch (error) {
    throw new Error("Failed to update portal.");
  }
};

const updatePortalStatus = async (portal, status) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalLegalName = reverseSanitizeName(portal);
    const portalExist = await portalRepository.findOneBy({
      legalName: portalLegalName,
    });
    if (!portalExist) {
      throw new Error("portal doesn't exist");
    }

    portalExist.status = status;

    await portalRepository.save(portalExist);
    return portalExist;
  } catch (error) {
    throw new Error("Failed to update portal.");
  }
};

const getPortalById = async (portalId) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = await portalRepository.findOne({
      where: { id: portalId },
      relations: ["createdBy"],
    });
    if (!portal) {
      throw new Error("portal doesn't exist");
    }
    return portal;
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const deletePortal = async (portalId) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalExist = await portalRepository.findOneBy({ id: portalId });
    if (!portalExist) {
      throw new Error("portal not exist");
    }
    await portalRepository.delete({ id: portalId });
    return "Portal deleted successfully.";
  } catch (error) {
    throw new Error(`Failed to delete portal. ${error.message}`);
  }
};

const getPortalCreatedAdmin = async (portalId) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = await portalRepository.findOne({
      where: { legalName: reverseSanitizeName(portalId) },
    });
    if (!portal) {
      throw new Error("Portal doesn't exist");
    }
    return await userService.getUserById(portal?.portalCreatedAdmin);
  } catch (error) {
    throw new Error(error?.message);
  }
}

const updatePortal = async (portalId, updatedData) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalLegalName = reverseSanitizeName(portalId);
    const portalExist = await portalRepository.findOneBy({
      legalName: portalLegalName,
    });
    if (!portalExist) {
      throw new Error("portal doesn't exist");
    }

    Object.assign(portalExist, updatedData);

    await portalRepository.save(portalExist);
    return portalExist;
  } catch (error) {
    throw new Error("Failed to update portal.");
  }
};

export default {
  createPortal,
  getPortalsByUser,
  getPortals,
  getPortalByLegalName,
  updatePortalThemes,
  getPortalById,
  deletePortal,
  updatePortalStatus,
  getPortalCreatedAdmin,
  updatePortal
};
