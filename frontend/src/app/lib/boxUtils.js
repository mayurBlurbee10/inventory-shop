import { fetchWrapper } from "./fetchWrapper";

export async function getAccessToken() {
    const response = await fetchWrapper('https://api.box.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.BOX_CLIENT_ID,
        client_secret: process.env.BOX_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    },'get-access-token');
  
    if (!response.ok) {
      throw new Error('Failed to get access token');
    }
  
    const data = await response.json();
    return data.access_token;
  }
  
  export async function createAppUser(accessToken, email) {
    const response = await fetchWrapper('https://api.box.com/2.0/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: email.split('@')[0],
        is_platform_access_only: true,
        external_app_user_id: email,
      }),
    }, 'create-user-box');
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create app user');
    }
  
    return response.json();
  }
  
  export async function createCollaboration(accessToken, userId, folderId, role) {
    const response = await fetchWrapper('https://api.box.com/2.0/collaborations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item: {
          type: 'folder',
          id: folderId,
        },
        accessible_by: {
          type: 'user',
          id: userId,
        },
        role: role,
      }),
    }, 'create-collaboration');
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create collaboration');
    }
  
    return response.json();
  }