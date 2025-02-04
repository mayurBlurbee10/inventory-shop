import { logApiCall } from "@/app/lib/api-log-middleware";
import BoxSDK from "box-node-sdk";
import { NextResponse } from "next/server";
import userService from "@/services/userService";
const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});
const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);
export async function POST(req) {
  try {
    await logApiCall(req);
    const { fileId, signerEmail, boxUserId, userId, portal, signerId } =
      await req.json();
    if (
      !fileId ||
      !signerEmail ||
      !boxUserId ||
      !userId ||
      !portal ||
      !signerId
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    const client = sdk.getAppAuthClient("user", boxUserId);
    const signRequest = await client.signRequests.create({
      source_files: [{ id: fileId, type: "file" }],
      signers: [
        {
          email: signerEmail,
          role: "signer",
          embed_url_external_user_id: userId,
          suppress_notifications: true,
          redirect_url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portal}/dashboard`,
        },
      ],
      is_document_prepared: false,
    });
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // const signRequestDetails = await client.signRequests.getById(signRequest.id);
    await userService.saveSignRequest(signerId, signRequest);
    return NextResponse.json({
      message: "Sign Request Created",
      data: signRequest,
    });
  } catch (error) {
    console.error("Error creating sign request:", error);
    return NextResponse.json(
      {
        error: "Failed to create sign request.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
export async function DELETE(req) {
  try {
    await logApiCall(req);
    const { searchParams } = new URL(req.url);
    const signRequestId = searchParams.get("signRequestId");
    if (!signRequestId) {
      return NextResponse.json(
        { error: "Missing required parameter: signRequestId" },
        { status: 400 }
      );
    }
    await client.signRequests.cancelById({ sign_request_id: signRequestId });
    return NextResponse.json({
      message: "Sign Request Cancelled Successfully",
      signRequestId,
    });
  } catch (error) {
    console.error("Error deleting sign request:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel sign request.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  try {
    await logApiCall(req);
    const { searchParams } = new URL(req.url);
    const signRequestId = searchParams.get("id");
    const fileId = searchParams.get("fileId");
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");
    if (signRequestId) {
      const signRequest = await client.signRequests.getById({
        sign_request_id: signRequestId,
      });
      return NextResponse.json({
        message: "Sign Request Retrieved",
        data: signRequest,
      });
    }
    if (userId) {
      const user = await userService.getUserById(userId);
      if (
        !user ||
        !user.signRequestsId ||
        !Array.isArray(user.signRequestsId)
      ) {
        return NextResponse.json({
          message: "No Sign Requests Found for this User",
          data: [],
        });
      }
      const signRequestsData = await Promise.all(
        user.signRequestsId.map(async (request) => {
          try {
            return await client.signRequests.getById({
              sign_request_id: request,
            });
          } catch (err) {
            console.error(
              `Failed to fetch sign request ${request}:`,
              err.message
            );
            return null;
          }
        })
      );
      const validSignRequests = signRequestsData.filter((req) => req !== null);
      const statusMapping = {
        pending: ["created", "sent", "converting", "viewed"],
        completed: ["signed", "completed"],
        rejected: ["declined", "expired", "canceled", "failed"],
      };
      const groupedSignRequests = {
        pending: [],
        completed: [],
        rejected: [],
      };
      validSignRequests.forEach((req) => {
        const status = req.status || "unknown";
      
        if (statusMapping.pending.includes(status)) {
          groupedSignRequests.pending.push(req);
        } else if (statusMapping.completed.includes(status)) {
          groupedSignRequests.completed.push(req);
        } else {
          groupedSignRequests.rejected.push(req);
        }
      });
      return NextResponse.json({
        message: "Sign Request Retrieved",
        data: groupedSignRequests,
      });
    }
    const allSignRequests = await client.signRequests.getAll();
    let signRequests = allSignRequests.entries;
    if (fileId) {
      signRequests = signRequests.filter((req) =>
        req.source_files.some((file) => file.id === fileId)
      );
    }
    if (email) {
      signRequests = signRequests.filter((req) =>
        req.signers.some((signer) => signer.email === email)
      );
    }
    return NextResponse.json({
      message: "Filtered Sign Requests Retrieved",
      count: signRequests.length,
      data: signRequests,
    });
  } catch (error) {
    console.error("Error fetching sign requests:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve sign requests.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}