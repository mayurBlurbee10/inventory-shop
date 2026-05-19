import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import checkListService from "../services/checkList.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const createCheckList = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const data = req.body;
  let { name } = data;

  if (!name) {
    return res.status(400).json({
      error: "Checklist name is required",
    });
  }

  try {
    const checklist = await checkListService.createCheckList(data);

    if (!checklist) {
      return res.status(404).json({
        error: `Checklist didn't created. Please try again.`,
      });
    }
    return res.status(200).json({
      message: `checklist created successfully.`,
      data: checklist,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to create checklist.",
      details: (error as Error).message,
    });
  }
});

const getCheckLists = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalId, sorted } = req.query;

    if (!portalId) {
      return res.status(400).json({
        error: "portalId is required.",
      });
    }
    const generalChecklist = await checkListService.createGeneralCheckList({
      name: "General",
      portalId: portalId as string,
      isActive: true,
    });
    const checklists = sorted
      ? await checkListService.getCheckListByPortalIdSorted(portalId as string)
      : await checkListService.getCheckListByPortalId(portalId as string);

    return res.status(200).json({
      message: "Checklists retrieved successfully.",
      data: checklists || [],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve checklists.",
      details: (error as Error).message,
    });
  }
});

const updateCheckList = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { checklistId, ...rest } = req.body;

  try {
    const checklist = await checkListService.updateCheckList(checklistId, rest);

    if (!checklist) {
      return res.status(404).json({
        error: `Checklist didn't updated. Please try again.`,
      });
    }
    return res.status(200).json({
      message: `checklist updated successfully.`,
      data: checklist,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to update checklist.",
      details: (error as Error).message,
    });
  }
});

const deleteCheckList = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { checklistId } = req.body;

  try {
    await checkListService.deleteCheckList(checklistId);

    return res.status(200).json({
      message: `checklist deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to delete checklist.",
      details: (error as Error).message,
    });
  }
});

export default {
  createCheckList,
  getCheckLists,
  updateCheckList,
  deleteCheckList,
};

