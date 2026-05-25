import { NextResponse } from 'next/server';

// Helper function to get Zendesk auth headers
const getZendeskAuthHeaders = () => ({
  'Authorization': 'Basic ' + btoa(`${process.env.ZENDESK_ADMIN_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`)
});

// Helper function to create Zendesk ticket
const createZendeskTicket = async (ticketData) => {
  const response = await fetch(`${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/tickets.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getZendeskAuthHeaders()
    },
    body: JSON.stringify(ticketData)
  });

  const result = await response.json();
  const ticketId = result.ticket?.id;

  if (response.ok && ticketId) {
    console.log('Zendesk ticket created successfully:', ticketId);
    return { success: true, ticketId, result };
  } else {
    console.error('Zendesk API error:', result);
    const errorMessage = result.error || result.description || 'Failed to create Zendesk ticket';
    throw new Error(errorMessage);
  }
};

// Helper function to validate request data from FormData
const validateFormData = (formData) => {
  const subject = formData.get('subject');
  const message = formData.get('message');
  const submitterName = formData.get('submitterName');
  const submitterEmail = formData.get('submitterEmail');
  
  if (!subject || !message || !submitterEmail || !submitterName) {
    return {
      isValid: false,
      error: "Missing required fields: subject, message, submitter email, and submitter name"
    };
  }
  
  return { isValid: true };
};

// Helper function to extract files from FormData
const extractFilesFromFormData = (formData) => {
  const files = [];
  for (const [key, value] of formData.entries()) {
    if (key === 'files' && value instanceof File) {
      files.push(value);
    }
  }
  return files;
};

// Helper function to convert File to buffer for Zendesk upload
const fileToBuffer = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Helper function to upload a single file to Zendesk from buffer
const uploadFileBufferToZendesk = async (file) => {
  try {
    const formData = new FormData();
    const buffer = await fileToBuffer(file);
    
    formData.append('file', new Blob([buffer], { type: file.type }), file.name);
    formData.append('filename', file.name);

    const response = await fetch(`${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/uploads.json`, {
      method: 'POST',
      headers: getZendeskAuthHeaders(),
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.upload?.token) {
      return result.upload.token;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Helper function to build ticket data
const buildTicketData = (subject, message, submitterEmail, uploadTokens, submitterName) => ({
  ticket: {
    subject,
    comment: {
      body: message,
      uploads: uploadTokens,
    },
    requester: {
      name: submitterName || submitterEmail.split("@")[0],
      email: submitterEmail,
    },
    tags: ["portal_submission"],
  }
});

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Validate request
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Extract data from FormData
    const subject = formData.get('subject');
    const message = formData.get('message');
    const submitterName = formData.get('submitterName');
    const submitterEmail = formData.get('submitterEmail');

    // Extract and upload files
    const files = extractFilesFromFormData(formData);
    const uploadTokens = [];
    
    if (files.length > 0) {
      const uploadPromises = files.map(file => uploadFileBufferToZendesk(file));
      const tokens = await Promise.all(uploadPromises);
      uploadTokens.push(...tokens.filter(token => token !== null));
    }

    // Build ticket data
    const ticketData = buildTicketData(subject, message, submitterEmail, uploadTokens, submitterName);

    // Create ticket
    const { success, ticketId, result } = await createZendeskTicket(ticketData);

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId,
      ticketUrl: `${process.env.ZENDESK_SUBDOMAIN_URL}/requests/${ticketId}`,
      uploadedFiles: uploadTokens.length
    });

  } catch (error) {
    console.error('Error creating Zendesk ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create support ticket',
      details: error.message
    }, { status: 500 });
  }
}