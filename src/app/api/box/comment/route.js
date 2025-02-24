import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";
import { logApiCall } from "@/app/lib/api-log-middleware";
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

export async function GET(req) {
  try {
    await logApiCall(req);

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId parameter" },
        { status: 400 }
      );
    }

    const data = await client.files.getComments(fileId);

    const comments = data.entries;

    console.log("comments", comments);

    // Fetch user details for each comment
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        try {
          // const boxUser = await client.users.get(comment.created_by.id);
          const user = await userService.getUserByBoxUserId(
            comment.created_by.id
          );
          return {
            ...comment,
            user, // Attach user details
          };
        } catch (error) {
          console.error(
            `Error fetching user for comment ${comment.id}:`,
            error
          );
          return {
            ...comment,
            user: null, // Fallback if user fetch fails
          };
        }
      })
    );

    return NextResponse.json({
      message: "Comments retrieved successfully",
      data: enrichedComments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve comments." || error.response?.body.message,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await logApiCall(req);

    const { fileId, message, boxUserId } = await req.json();

    if (!fileId || !message || !boxUserId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    const newClient = sdk.getAppAuthClient("user", boxUserId);
    const comment = await newClient.comments.create(fileId, message);

    return NextResponse.json({
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error creating sign request:", error);
    return NextResponse.json(
      {
        error: error.response?.body.message,
        details: error.message,
      },
      { status: 500 }
    );
  }
}
