import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { addCollaborator } from "../services/box.service.ts";
import userService from "../services/user.service.ts";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/boxClient.ts";

const client = getBoxClient();

const getSignRequestsByExternalId = async (externalId: string) => {
  try {
    const signRequests = await client.signRequests.getSignRequests();
    return (signRequests.entries || []).filter(
      (request: any) => request.externalId === externalId
    );
  } catch (error) {
    console.error("Error fetching sign requests:", error);
    return [];
  }
};

export const createESign = async (
  fileId: string,
  signer: { email: string; id: string },
  userBoxUserId: string,
  portal: string
) => {
  const collaborations = await client.listCollaborations.getCollaborations(fileId as any);

  const collabExistForUser = collaborations.entries?.some(
    (collab: any) => collab.accessibleBy?.id === userBoxUserId
  );

  if (!collabExistForUser) {
    await addCollaborator(fileId, userBoxUserId, "editor", "file");
  }

  const signRequest = await client.signRequests.createSignRequest({
    sourceFiles: [{ id: fileId, type: "file" }],
    signers: [
      {
        email: signer.email,
        role: "signer",
        embedUrlExternalUserId: signer.id,
        suppressNotifications: true,
      },
    ],
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portal}/sign-finished`,
    isDocumentPreparationNeeded: false,
    externalId: userBoxUserId,
  } as any);

  await userService.saveSignRequest(signer.id, signRequest);
  return signRequest;
};

// POST /api/box/e-sign
const createSignRequest = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileId, signers, boxUserId, portal, onSameDoc } = req.body;

    console.log("fileId, signers, boxUserId, portal, onSameDoc", fileId, signers, boxUserId, portal, onSameDoc);


    if (!fileId || !signers || !boxUserId || !portal) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const newClient = client;
    const collaborations = await client.listCollaborations.getCollaborations(fileId);

    const collabExistForUser = collaborations?.entries?.some(
      (collab: any) => collab.accessibleBy?.id === boxUserId
    );

    if (!collabExistForUser) {
      await addCollaborator(fileId, boxUserId, "editor", "file");
    }

    let signRequests: any[] = [];

    if (onSameDoc) {
      const signRequest = await newClient.signRequests.createSignRequest({
        sourceFiles: [{ id: fileId, type: "file" }],
        signers: signers.map(({ signerEmail, signerId }: any) => ({
          email: signerEmail,
          role: "signer",
          embedUrlExternalUserId: signerId,
          suppressNotifications: true,
        })),
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portal}/sign-finished`,
        isDocumentPreparationNeeded: false as any,
      } as any);
      signRequests.push(signRequest);
      await Promise.all(
        signers.map(({ signerId }: any) =>
          userService.saveSignRequest(signerId, signRequest),
        ),
      );
    } else {
      for (const { signerEmail, signerId } of signers) {
        const signRequest = await newClient.signRequests.createSignRequest({
          sourceFiles: [{ id: fileId, type: "file" }],
          signers: [
            {
              email: signerEmail,
              role: "signer",
              embedUrlExternalUserId: signerId,
              suppressNotifications: true,
            },
          ],
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portal}/sign-finished`,
          isDocumentPreparationNeeded: false as any,
        } as any);

        signRequests.push(signRequest);
        await userService.saveSignRequest(signerId, signRequest);
      }
    }

    return res.status(200).json({
      message: "Sign Requests Created",
      data: signRequests,
    });
  } catch (error) {
    console.error("Error creating sign request:", error);
    return res.status(500).json({
      error: "Failed to create sign request.",
      details: (error as Error).message,
    });
  }
});

// DELETE /api/box/e-sign
const cancelSignRequest = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const { signRequestId } = req.query;

      if (!signRequestId) {
        return res.status(400).json({
          error: "Missing required parameter: signRequestId",
        });
      }
      await client.signRequests.cancelSignRequest(signRequestId.toString());
      return res.status(200).json({
        message: "Sign Request Cancelled Successfully",
        signRequestId,
      });
    } catch (error) {
      console.error("Error deleting sign request:", error);
      return res.status(500).json({
        error: "Failed to cancel sign request.",
        details: (error as Error).message,
      });
    }
  }
);

// GET /api/box/e-sign
const getSignRequests = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const { id, fileId, email, userId } = req.query;

    if (id) {
      try {
        const signRequest = await client.signRequests.getSignRequestById(id.toString());
        return res.status(200).json({
          message: "Sign Request Retrieved",
          data: signRequest,
        });
      } catch (error) {
        if (
          (error as any).statusCode === 404 ||
          (error as any).response?.status === 404 ||
          (error as any).status === 404 ||
          /404|not found/i.test((error as Error).message)
        ) {
          return res.status(404).json({
            error: "Sign Request not found",
            data: null,
          });
        }
        throw error;
      }
    }

    if (userId) {
      const user = await userService.getUserById(userId as string);
      if (
        !user ||
        !(user as any).signRequestsId ||
        !Array.isArray((user as any).signRequestsId)
      ) {
        return res.status(200).json({
          message: "No Sign Requests Found for this User",
          data: [],
        });
      }

      const response = await getSignRequestsByExternalId((user as any).boxUserId);

      const signRequestsData = await Promise.all(
        (user as any).signRequestsId.map(async (request: string) => {
          try {
            return await client.signRequests.getSignRequestById(request);
          } catch (err) {
            console.error(
              `Failed to fetch sign request ${request}:`,
              (err as Error).message
            );
            return null;
          }
        })
      );

      const validSignRequests = signRequestsData.filter(
        (req: any) => req !== null
      );

      const statusMapping = {
        pending: ["created", "sent", "converting", "viewed"],
        completed: ["signed", "completed", "finalizing"],
        rejected: ["declined", "expired", "canceled", "failed"],
      };

      const groupedSignRequests = {
        pending: [] as any[],
        completed: [] as any[],
        rejected: [] as any[],
        tracked: response,
      };

      validSignRequests.forEach((req: any) => {
        const status = req.status || "unknown";

        if (
          statusMapping.pending.includes(status) &&
          req?.sourceFiles?.length > 0
        ) {
          groupedSignRequests.pending.push(req);
        } else if (statusMapping.completed.includes(status)) {
          groupedSignRequests.completed.push(req);
        } else {
          groupedSignRequests.rejected.push(req);
        }
      });

      return res.status(200).json({
        message: "Sign Request Retrieved",
        data: groupedSignRequests,
      });
    }
    const allSignRequests = await client.signRequests.getSignRequests();
    let signRequests = allSignRequests.entries || [];
    if (fileId) {
      signRequests = signRequests.filter((req: any) =>
        (req?.sourceFiles || req?.source_files || req?.rawData?.source_files || []).some(
          (file: any) => file.id === fileId
        )
      );
    }

    if (email) {
      signRequests = signRequests.filter((req: any) =>
        req.signers?.some((signer: any) => signer.email === email)
      );
    }

    return res.status(200).json({
      message: "Filtered Sign Requests Retrieved",
      count: signRequests.length,
      data: signRequests,
    });
  } catch (error) {
    console.error("Error fetching sign requests:", error);
    return res.status(500).json({
      error: "Failed to retrieve sign requests.",
      details: (error as Error).message,
    });
  }
});

export default {
  createSignRequest,
  cancelSignRequest,
  getSignRequests,
};

