import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Portals } from "@/entities/Portals";

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

const getPortals = async () => {
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    return await portalRepository.find();
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const getPortalByLegalName = async (legalName) => {
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    return await portalRepository.findOneBy({
      legalName: legalName,
    });
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

export default {
  createPortal,
  getPortals,
  getPortalByLegalName,
};


