import { BlobServiceClient } from "@azure/storage-blob";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);
const containerClient = blobServiceClient.getContainerClient("uploads");

export const uploadToAzureBlob = async (file: any, name: string): Promise<string> => {
  const blockBlobClient = containerClient.getBlockBlobClient(name);

  try {
    let buffer: Buffer;
    if (file.arrayBuffer) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (file.buffer) {
      buffer = file.buffer;
    } else {
      throw new Error("File must have either arrayBuffer() method or buffer property");
    }

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type || file.mimetype || "application/octet-stream",
      },
    });

    const blobUrl = blockBlobClient.url;
    return blobUrl;
  } catch (error) {
    console.error("Error uploading to Azure Blob Storage:", error);
    throw error;
  }
};

