import { logApiCall } from '@/app/lib/api-log-middleware';
import BoxSDK from 'box-node-sdk';

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID
  }
});

const client = sdk.getAppAuthClient('enterprise', process.env.BOX_ENTERPRISE_ID);

export async function POST(request) {
  try {
    await logApiCall(request);
    const { name, boxFolderId } = await request.json();
    
    // Create folder in the user's specific folder instead of root
    const userFolderId = boxFolderId; //'290641338009'; // This is your specific folder ID
    console.log('Creating folder in user folder:', userFolderId);
    
    const folder = await client.folders.create(userFolderId, name, {
      fields: ['id', 'name', 'path_collection', 'created_at']
    });
    
    console.log('Created folder:', folder);
    
    // After creating the folder, let's verify it exists in the parent folder
    const parentFolder = await client.folders.getItems(userFolderId, {
      fields: 'id,name,type'
    });
    
    console.log('Parent folder contents:', parentFolder.entries);
    
    return Response.json(folder);
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error response:', error.response?.body);
    return Response.json(
      { 
        error: 'Failed to create folder',
        details: error.message,
        response: error.response?.body 
      }, 
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await logApiCall(req)
    const folderId = req.nextUrl.searchParams.get('folderId') || '0';
    const items = await fetchNestedItems(folderId);
    return Response.json({
      message: 'Folder items fetched successfully',
      items,
    });
  }catch (error) {
    console.error('Error fetching folder items:', error);
    return Response.json(
      { error: error.message },
      { status: error.response?.statusCode || 500 }
    );
  }
}

async function fetchNestedItems(folderId) {
  const result = [];
  try {
    const folderItems = await client.folders.getItems(folderId, { 
      fields: "id,name,type,shared_link,created_at,modified_at,collaborators",
      limit: 100 
    });

    for (const item of folderItems.entries) {
      let collaborators = []
      if(item.type == "folder"){
        collaborators = await fetchCollaborators(item.id);
      }
      if (item.type === 'folder') {
        // Recursively fetch items inside subfolder
        const nestedItems = await fetchNestedItems(item.id);
        result.push({ ...item, collaborators, children: nestedItems });
      } else {
        // File, directly push to the result
        result.push({ ...item, collaborators });
      }
    }
  } catch (error) {
    console.error(`Error fetching items for folder ${folderId}:`, error.message);
  }

  return result;
}

async function fetchCollaborators(itemId) {
  try {
    const collaborations = await client.folders.getCollaborations(itemId);
    return collaborations.entries.map((collaboration) => {
      console.log('collaboration:', collaboration);
      return({
      id: collaboration.id,
      role: collaboration.role,
      user: collaboration.accessible_by,
    })});
  } catch (error) {
    console.error(`Error fetching collaborators for item ${itemId}:`, error.message);
    return [];
  }
}

export async function DELETE(req) {
  try{
    await logApiCall(req, ()=>{});
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return Response.json({ error: 'No folderId provided' }, { status: 400 });
    }

    await client.folders.delete(folderId);

    return Response.json({
      message: 'File deleted successfully',
      folderId: folderId,
    });

  }catch (error) { 
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.response?.statusCode || 500 }
    );
  }
}