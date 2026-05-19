import { BlobServiceClient } from "@azure/storage-blob";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);
const containerClient = blobServiceClient.getContainerClient("uploads");

export const uploadToAzureBlob = async (file: any, name: string) => {
  const blockBlobClient = containerClient.getBlockBlobClient(name);

  try {

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype, // ✅ use mimetype instead of file.type
      },
    });

    const blobUrl = blockBlobClient.url;
    return blobUrl;
  } catch (error) {
    console.error("Error uploading to Azure Blob Storage:", error);
    throw error;
  }
};

export const deleteFromAzureBlob = async (imageUrl: string) => {
  try {
    // Example: https://<account>.blob.core.windows.net/uploads/myimage.jpg
    const url = new URL(imageUrl);

    // Get path after container
    // "/uploads/myimage.jpg" -> ["", "uploads", "myimage.jpg"]
    const parts = url.pathname.split("/");
    if (parts.length < 3) {
      throw new Error("Invalid blob URL format");
    }

    // Extract the blob name
    const blobName = parts.slice(2).join("/");

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();

    console.log(`Blob deleted: ${blobName}`);
  } catch (error) {
    console.error("Error deleting blob:", error);
    throw error;
  }
};