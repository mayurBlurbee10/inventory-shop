import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Theme } from "../entities/Theme.ts";
import portalService from "./portal.service.ts";
import { sanitizeName, reverseSanitizeName } from "../utils/commonUtils.ts";

const getRepository = async () => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(Theme);
};

const resolvePortalKeys = async (portalId: string): Promise<string[]> => {
  const keys = new Set<string>();
  if (!portalId) return [];

  keys.add(portalId);
  keys.add(sanitizeName(portalId));

  const legalNameCandidate = reverseSanitizeName(portalId);
  if (legalNameCandidate) {
    keys.add(legalNameCandidate);
    keys.add(sanitizeName(legalNameCandidate));
  }

  try {
    const portalByLegal = await portalService.getPortalByLegalName(
      legalNameCandidate || portalId,
    );
    if (portalByLegal) {
      keys.add(portalByLegal.id);
      keys.add(portalByLegal.legalName);
      keys.add(sanitizeName(portalByLegal.legalName));
    }
  } catch {
    // Portal lookup is best-effort for theme key resolution.
  }

  try {
    const portalById = await portalService.getPortalById(portalId);
    if (portalById) {
      keys.add(portalById.id);
      keys.add(portalById.legalName);
      keys.add(sanitizeName(portalById.legalName));
    }
  } catch {
    // Portal lookup is best-effort for theme key resolution.
  }

  return Array.from(keys).filter(Boolean);
};

const resolveCanonicalPortalId = async (portalId: string): Promise<string> => {
  const keys = await resolvePortalKeys(portalId);

  for (const key of keys) {
    try {
      const portal = await portalService.getPortalByLegalName(
        reverseSanitizeName(key) || key,
      );
      if (portal?.legalName) {
        return sanitizeName(portal.legalName);
      }
    } catch {
      // try next key
    }
  }

  return sanitizeName(portalId) || portalId;
};

const getThemeForPortal = async (portalId: string) => {
  const keys = await resolvePortalKeys(portalId);
  if (!keys.length) return null;

  const themeRepository = await getRepository();

  try {
    return await themeRepository
      .createQueryBuilder("theme")
      .where("theme.portalId IN (:...keys)", { keys })
      .orderBy("theme.updatedAt", "DESC")
      .getOne();
  } catch (error) {
    console.error("Error getting portal theme:", (error as Error).message);
    throw error;
  }
};

const savePortalTheme = async ({
  theme,
  themeType,
  portalId,
}: {
  theme: any;
  themeType: string;
  portalId: string;
}) => {
  const themeRepository = await getRepository();

  try {
    const canonicalPortalId = await resolveCanonicalPortalId(portalId);
    const existingTheme = await getThemeForPortal(portalId);

    if (existingTheme) {
      existingTheme.theme = theme;
      existingTheme.themeType = themeType as any;
      existingTheme.portalId = canonicalPortalId;
      return await themeRepository.save(existingTheme);
    }

    const newTheme = themeRepository.create({
      theme,
      themeType,
      portalId: canonicalPortalId,
    } as any);

    return await themeRepository.save(newTheme);
  } catch (error) {
    console.error("Error saving portal theme:", (error as Error).message);
    throw new Error("Failed to save theme.");
  }
};

export default {
  getThemeForPortal,
  savePortalTheme,
};
