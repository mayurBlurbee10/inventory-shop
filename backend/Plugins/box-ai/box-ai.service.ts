import BoxSDKNode from "box-node-sdk";
import userService from "../../src/services/user.service.js";
import { addCollaborator } from "../../src/utils/helper.js";
import { getBoxClient, getUserBoxClient } from "../../src/utils/boxClient.ts";
import { AiAskModeField } from "box-node-sdk/lib/schemas/aiAsk.js";
import { AiItemAskTypeField } from "box-node-sdk/lib/schemas/aiItemAsk.js";

const client = getBoxClient();

const getHubDetails = async (hubId: string) => {
  const hub = await client.hubs.getHubByIdV2025R0(hubId);
  return hub;
};

async function askAIHubGlobal(
  items: any,
  prompt: string,
  mode: "single_item_qa" | "multiple_item_qa" = "multiple_item_qa",
  boxUserId: string = "38549341603"
) {
  // For multiple hubs, we need to get the hub owner's boxUserId for each hub
  // since different hubs belong to different users
  const responses = [];
  const allCitations = [];
  const answerSegments: { text: string; hubId: string; hubName: string }[] = [];

  for (const item of items) {
    try {
      // Get hub details to find the owner
      const hubDetails = await getHubDetails(item.id);
      console.log("hubDetails======================>", hubDetails);
      console.log("item======================>", [item]);
      const hubOwnerBoxUserId = hubDetails?.createdBy?.id;

      const userClient = getUserBoxClient(hubOwnerBoxUserId!);
      const response = await userClient.ai.createAiAsk({
        mode: "single_item_qa",
        prompt,
        items: [item],
        includeCitations: true,
      });
      if (response?.answer) {
        console.log("responses======================>", response);
        const answerText = response.answer as string;
        responses.push(answerText);
        answerSegments.push({
          text: answerText,
          hubId: item.id,
          hubName: hubDetails.title || `Hub ${item.id}`,
        });

        // Collect all citations for the combined view
        if (response?.citations && Array.isArray(response.citations)) {
          // Add metadata to citations to track which hub they came from
          const citationsWithMetadata = response.citations.map((citation: any) => ({
            ...citation,
            hubId: item.id,
            hubName: hubDetails.title || `Hub ${item.id}`,
            responseIndex: responses.length - 1 // Index of this response
          }));
          allCitations.push(...citationsWithMetadata);
        }
      }
    } catch (error) {
      console.error(`Error querying hub ${item.id}:`, error);
      // Continue with other hubs even if one fails
    }
  }

  // Combine all responses
  let combinedAnswer = "";
  if (responses.length === 0) {
    combinedAnswer = "No relevant information found in the available hubs.";
  } else if (responses.length === 1) {
    combinedAnswer = responses[0];
  } else {
    combinedAnswer = `Based on the information from ${responses.length} hubs:\n\n${responses.join('\n\n')}`;
  }
  console.log("combinedAnswer==============>", combinedAnswer);
  console.log("allCitations==============>", allCitations);

  // Return both answer and citations
  return {
    answer: combinedAnswer,
    citations: allCitations,
    answerSegments,
  };
}

async function askAIHub(
  hubId: string,
  prompt: string,
  mode: "single_item_qa" | "multiple_item_qa" = "single_item_qa",
  boxUserId: string = "38549341603"
) {
  const userClient = getUserBoxClient(boxUserId);

  const response = await userClient.ai.createAiAsk({
    mode: mode as AiAskModeField,
    prompt,
    items: [{ type: "hubs" as AiItemAskTypeField, id: hubId }],
    includeCitations: true,
  });

  return {
    answer: response?.answer ?? "",
    citations: response?.citations ?? [],
  };
}

const getAllHubs = async (portalId: string) => {
  const hubs: any[] = [];
  const users = await userService.getUsersByPortalForHub(portalId);

  for (const user of users) {
    const userClient = getUserBoxClient(user?.boxUserId);
    const response = await userClient.hubs.getHubsV2025R0({
      scope: "all",
      sort: "name",
      direction: "ASC",
    });
    if (response?.entries) hubs.push(...response.entries);
  }
  return hubs;
};

const createHub = async (
  title: string,
  description: string,
  boxUserId: string
) => {
  const userClient = getUserBoxClient(boxUserId);

  // 1. Create hub as the user
  const hub = await userClient.hubs.createHubV2025R0({
    title,
    description,
  });

  // 2. Get enterprise admin user
  const enterpriseUser = await client.users.getUserMe();

  // 3. Add Enterprise Admin as collaborator
  const collaboration = await userClient.hubCollaborations.createHubCollaborationV2025R0({
    hub: { id: hub.id, type: "hubs" },
    accessibleBy: {
      type: "user",
      id: enterpriseUser.id,
    },
    role: "co-owner",
  });

  return { hub, collaboration, user: enterpriseUser };
};


const getHubItems = async (hubId: string) => {
  const response = await client.hubItems.getHubItemsV2025R0({
    hubId: hubId,
  });
  return response.entries;
};


const getHubById = async (hubId: string) => {
  const hub = await getHubDetails(hubId);

  const hubItems = await getHubItems(hubId);

  return { ...hub, items: hubItems };
};

const addItemsToHub = async (
  hubId: string,
  addItems: Array<{ id: string; type: "file" | "folder" }>,
  removeItems: Array<{ id: string; type: "file" | "folder" }>
) => {
  let operations: Array<any> = [];
  const hubDetails = await getHubDetails(hubId);
  const existingItems = await getHubItems(hubId);

  const hubOwner = hubDetails?.createdBy?.id;
  const userClient = getUserBoxClient(hubOwner!);

  if (addItems?.length) {
    for (const data of addItems) {
      const alreadyExists = existingItems?.some(
        (item: any) => item.id === data.id && item.type === data.type
      );

      if (!alreadyExists) {
        try {
          await addCollaborator(data?.id, hubOwner!, "editor", data?.type);
        } catch (err: any) {
          // Ignore if collaborator already exists
          console.log(
            `Hub owner is already a collaborator on ${data.type} ${data.id}`
          );
        }

        operations.push({
          action: "add",
          item: { id: data.id, type: data.type },
        });
      }
    }
  }

  if (removeItems?.length) {
    removeItems.forEach((data) =>
      operations.push({
        action: "remove",
        item: { id: data.id, type: data.type },
      })
    );
  }

  if (!operations.length) {
    return { message: "No operations to perform" };
  }

  const response = await userClient.hubItems.manageHubItemsV2025R0(hubId, {
    operations,
  });

  return { hub: response };
};

const listAiAgents = async (
  boxUserId: string = "38549341603",
  options?: {
    mode?: Array<"ask" | "text_gen" | "extract">;
    agent_state?: Array<"enabled" | "disabled" | "enabled_for_selected_users">;
    include_box_default?: boolean;
    fields?: Array<"ask" | "text_gen" | "extract">;
    limit?: number;
    marker?: string;
  }
) => {
  const userClient = getUserBoxClient(boxUserId);
  return userClient.aiStudio.getAiAgents(options);
};

const deleteHub = async (hubId: string) => {
  const hubDetails = await client.hubs.getHubByIdV2025R0(hubId);
  const hubOwnerId = hubDetails?.createdBy?.id;

  // Get a client acting as the hub owner
  const userClient = getUserBoxClient(hubOwnerId!);

  // Delete the hub as the owner
  await userClient.hubs.deleteHubByIdV2025R0(hubId);
};


const createHubForAdmin = async (adminUser: any) => {
  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  if (!adminUser.boxUserId) {
    throw new Error("Admin user does not have a Box user ID");
  }

  if (!adminUser.folderId) {
    throw new Error("Admin user does not have a Box folder ID");
  }

  const hubName = `${adminUser.firstName} ${adminUser.lastName}'s Hub`;

  const hubDescription = `This is ${adminUser.firstName} ${adminUser.lastName}'s Hub`;

  console.log(
    `Creating hub: ${hubName} for user: ${adminUser.firstName} ${adminUser.lastName}`
  );

  const created = await createHub(
    hubName,
    hubDescription,
    String(adminUser.boxUserId)
  );

  const hub = created.hub;

  console.log("Hub created successfully:", {
    hubId: hub.id,
    hubName: hub.title,
  });

  // Add admin folder
  const addItems: { id: string; type: "file" | "folder" }[] = [
    {
      id: String(adminUser.folderId),
      type: "folder",
    },
  ];

  console.log(`Adding folder ${adminUser.folderId} to hub ${hub.id}`);

  await addItemsToHub(hub.id, addItems, []);

  console.log("Folder added to hub successfully");

  return hub;
};

export default {
  askAIHubGlobal,
  askAIHub,
  getAllHubs,
  getHubById,
  createHub,
  addItemsToHub,
  listAiAgents,
  deleteHub,
  createHubForAdmin
};