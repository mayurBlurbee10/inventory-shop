import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Portal } from "@headlessui/react";

const createPortal = async (data) => {
  await connectDatabase();
  const connection = getConnection();
  const portalRepository = connection.getRepository(Portal);
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
  const portalRepository = connection.getRepository(Portal);
  try {
    const portal = portalRepository.find();
    return portal;
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

export default {
  createPortal,
  getPortals,
};
