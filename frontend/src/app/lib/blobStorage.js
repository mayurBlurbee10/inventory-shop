import { BlobServiceClient } from "@azure/storage-blob";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient("uploads");

export const uploadToAzureBlob = async (file, name) => {
  const blockBlobClient = containerClient.getBlockBlobClient(name);

  try {
    const arrayBuffer = await file.arrayBuffer();

    await blockBlobClient.uploadData(arrayBuffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });


    const blobUrl = blockBlobClient.url;
    return blobUrl;
  } catch (error) {
    console.error("Error uploading to Azure Blob Storage:", error);
    throw error;
  }
};
