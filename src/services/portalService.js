import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Portals } from "@/entities/Portals";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPortal = async (data) => {
  const portalRepository = getRepository(Portals);
  try {
    const portal = portalRepository.create(data);
    await portalRepository.save(portal);
    return portal;
  } catch (error) {
    throw new Error("Failed to create portal.");
  }
};

const getPortalsByUser = async (user) => {
  console.log("getPortalsByUser: ", user);
  const portalRepository = await getRepository(Portals);
  try {
    const userId = String(user).toLowerCase();
    const portals = await portalRepository.find({
      where: {
        createdBy: {
          id: userId, // Querying for the userId in the createdBy relation
        },
      },
      relations: ["createdBy"],
    });
    console.log("portals", portals);
    return portals;
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortals = async () => {
  const portalRepository = await getRepository(Portals);
  try {
    const portals = await portalRepository.find();
    console.log("portals: ", JSON.stringify(portals));
    return portals;
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortalByLegalName = async (legalName) => {
  const portalRepository = await getRepository(Portals);
  try {
    return await portalRepository.findOneBy({ legalName });
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const updatePortalThemes = async (portalData) => {
  const portalRepository = await getRepository(Portals);
  try {
    console.log(portalData.id)
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

export default {
  createPortal,
  getPortalsByUser,
  getPortals,
  getPortalByLegalName,
  updatePortalThemes,
};
