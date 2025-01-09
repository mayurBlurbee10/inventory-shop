import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Portals } from "@/entities/Portals";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPortal = async (data) => {
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    const portal = portalRepository.create(data);
    await portalRepository.save(portal);
    return portal;
  } catch (error) {
    throw new Error("Failed to create portal.");
  }
};

const getPortalsByUser = async (user) => {
  console.log('getPortalsByUser: ', user)
  const portalRepository = await getRepository(Portals);
  try {
    const userId = String(user).toLowerCase();
    const portals = await portalRepository.find({
      where: {
        createdBy: {
          id: userId, // Querying for the userId in the createdBy relation
        },
      },
      relations: ['createdBy'],
    });
    console.log('portals', portals)
    return portals
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
}

const getPortals = async () => {
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    const portals = await portalRepository.find();
    console.log('portals: ', JSON.stringify(portals));
    return portals;
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortalByLegalName = async (legalName) => {
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    const portal = await portalRepository.findOneBy({
      legalName: legalName,
    });
    console.log('portal legalName: ', JSON.stringify(portal));
    return portal;
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

export default {
  createPortal,
  getPortalsByUser,
  getPortals,
  getPortalByLegalName,
};


