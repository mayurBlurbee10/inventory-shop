import { Request, Response } from "express";
import { asyncHandler } from "../../src/utils/helper.js";
import { logApiCall } from "../../src/utils/api-log-middleware.js";
import boxHubService from "./box-ai.service.js";

const askAIHub = asyncHandler(async (req: Request, res: Response) => {
  const { hubId, prompt, items } = req.body;
  console.log('hubId', hubId)
  console.log('prompt', prompt)
  console.log('items', items)

  const currentUser = req.user as any;

  // If items array is provided, use askAIHubGlobal for multiple hubs
  if (items && Array.isArray(items) && items.length > 0) {
    const aiResponse = await boxHubService.askAIHubGlobal(items, prompt, "multiple_item_qa", currentUser?.boxUserId);
    return res.status(200).json(aiResponse);
  }

  // Fallback to single hub if only hubId is provided
  if (hubId && prompt) {
    const aiResponse = await boxHubService.askAIHub(hubId, prompt, "single_item_qa", currentUser?.boxUserId);
    return res.status(200).json(aiResponse);
  }

  return res.status(400).json({ error: "Either hubId or items array must be provided" });
});

import portalService from "../../src/services/portal.service.ts";

const getHubs = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { searchParams } = new URL(
      req.url,
      `${req.protocol}://${req.headers.host}`
    );
    const portalId = searchParams.get("portalId")!;
    const hubId = searchParams.get("hubId")!;

    if (!!portalId) {
      let hubs = await boxHubService.getAllHubs(portalId);
      // If no hubs exist for the portal, create one using portal admin's Box user ID
      if (!hubs || hubs.length === 0) {
        const adminUser = await portalService.getPortalCreatedAdmin(portalId);
        if (!adminUser) {
          return res.status(404).json({ error: "Portal admin not found" });
        }
        const hub = await boxHubService.createHubForAdmin(adminUser);
        hubs = [hub];
      }
      return res.status(200).json({ data: hubs });
    } else if (!!hubId) {
      const hub = await boxHubService.getHubById(hubId);
      return res.status(200).json({ data: hub });
    } else {
      return res.status(200).json({ data: [] });
    }
  } catch (error) {
    console.error("Error fetching hubs:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

const createHub = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { title, description, boxUserId } = req.body;
    const hub = await boxHubService.createHub(title, description, boxUserId);
    return res.status(200).json(hub);
  } catch (error) {
    console.error("Error creating hub:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

const addItemsToHub = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { hubId, addItems, removeItems } = req.body;
    const hub = await boxHubService.addItemsToHub(hubId, addItems, removeItems);
    return res.status(200).json(hub);
  } catch (error) {
    console.error("Error creating hub:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

const listAiAgents = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const agents = await boxHubService.listAiAgents();
    return res.status(200).json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

const deleteHub = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { hubId } = req.body;
    await boxHubService.deleteHub(hubId);
    return res.status(200).json({ message: "Hub deleted successfully" });
  } catch (error) {
    console.error("Error deleting hub:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default {
  askAIHub,
  getHubs,
  createHub,
  addItemsToHub,
  listAiAgents,
  deleteHub,
};