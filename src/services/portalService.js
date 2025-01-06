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
  console.log('getPortals')
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    const portals = await portalRepository.find();
    console.log('portals: ', portals)
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const getPortalByLegalName = async (legalName) => {
  console.log('getPortalByLegalName')
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portals);
  try {
    const portal = await portalRepository.findOneBy({
      legalName: legalName,
    });
    console.log('portal: ', portal)
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

export default {
  createPortal,
  getPortals,
  getPortalByLegalName,
};


