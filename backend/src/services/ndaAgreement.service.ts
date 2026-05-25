import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { NdaAgreements } from "../entities/NdaAgreements.ts";
import { NDAPage } from "../utils/data/existingPages.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  return getConnection().getRepository(entity);
};

const listByPortalId = async (portalId: string) => {
  const repo = await getRepository(NdaAgreements);
  return repo.find({
    where: { portalId },
    order: { createdAt: "DESC" },
  });
};

const listByPortalIdPaginated = async (
  portalId: string,
  page: number = 1,
  limit: number = 10
) => {
  const repo = await getRepository(NdaAgreements);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await repo.findAndCount({
    where: { portalId },
    order: { createdAt: "DESC" },
    skip,
    take: safeLimit,
  });

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
};

const getById = async (id: string) => {
  const repo = await getRepository(NdaAgreements);
  return repo.findOneBy({ id });
};

const createAgreement = async (data: any) => {
  const repo = await getRepository(NdaAgreements);
  const row = repo.create(data);
  await repo.save(row);
  return row;
};

const createDefaultAgreements = async (portalId: string) => {
  const repo = await getRepository(NdaAgreements);
  const existingCount = await repo.count({ where: { portalId } });

  if (existingCount > 0) {
    return repo.find({
      where: { portalId },
      order: { createdAt: "DESC" },
    });
  }

  const agreements = NDAPage.map((page, index) =>
    repo.create({
      portalId,
      title: page.title,
      ndaType: "editor",
      description: page.description,
      fileId: null,
      originalFileName: null,
      isDefault: index === 0,
    })
  );

  await repo.save(agreements);
  return agreements;
};

const updateAgreement = async (id: string, data: any) => {
  const repo = await getRepository(NdaAgreements);
  const row = await repo.findOneBy({ id });
  if (!row) {
    throw new Error("NDA agreement not found");
  }
  Object.assign(row, data);
  await repo.save(row);
  return row;
};

const deleteAgreement = async (id: string) => {
  const repo = await getRepository(NdaAgreements);
  const row = await repo.findOneBy({ id });
  if (!row) {
    throw new Error("NDA agreement not found");
  }
  await repo.remove(row);
};

const deleteByPortalId = async (portalId: string) => {
  const repo = await getRepository(NdaAgreements);
  await repo.delete({ portalId });
};

const copyAgreement = async (agreementId: string) => {
  const repo = await getRepository(NdaAgreements);
  const row = await repo.findOneBy({ id: agreementId });
  if (!row) {
    throw new Error("NDA agreement not found");
  }

  const copied = repo.create({
    portalId: row.portalId,
    title: `${row.title} (Copy)`,
    ndaType: row.ndaType,
    description: row.ndaType === "editor" ? row.description : null,
    fileId: row.ndaType === "esign" ? row.fileId : null,
    originalFileName: row.ndaType === "esign" ? row.originalFileName : null,
    isDefault: false,
  });
  await repo.save(copied);
  return copied;
};

const setDefaultAgreement = async (agreementId: string, portalId: string) => {
  const repo = await getRepository(NdaAgreements);
  const portalRows = await repo.find({ where: { portalId } });
  if (!portalRows.some((r: any) => r.id === agreementId)) {
    throw new Error("Agreement does not belong to this portal");
  }
  for (const r of portalRows as any[]) {
    r.isDefault = r.id === agreementId;
  }
  await repo.save(portalRows);
  return repo.findOneBy({ id: agreementId });
};

export default {
  listByPortalId,
  listByPortalIdPaginated,
  getById,
  createAgreement,
  createDefaultAgreements,
  updateAgreement,
  deleteAgreement,
  deleteByPortalId,
  copyAgreement,
  setDefaultAgreement,
};
