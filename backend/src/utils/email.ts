
import { EmailClient } from "@azure/communication-email";
import { EmailType } from "../config/constants.ts";
import { reverseSanitizeName } from "./commonUtils.ts";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const client = new EmailClient(connectionString!);

const escapeHtml = (text: string): string =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const replacePlaceholders = (template: string, variables: any): string => {
  if (!template) return "";
  let result = template;
  Object.keys(variables).forEach((key) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(
      placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g",
    );
    result = result.replace(regex, variables[key] || "");
  });
  return result;
};

const generateSectionHTML = (
  sectionContent: string,
  emailType: string,
  redirectedLink?: string,
  portalName?: string,
): string => {
  switch (emailType) {
    case "login_code":
      return `
        <div style="
          background: #f3f3f9; 
          padding: 25px 20px; 
          border-radius: 8px; 
          font-size: 32px; 
          text-align: center; 
          font-weight: bold; 
          letter-spacing: 3px; 
          margin: 30px 0;
          color: #333;
          font-family: 'Courier New', monospace;
        ">
          ${sectionContent}
        </div>
      `;
    case "file_upload":
      return `
        <div style="
          border-left: 4px solid #3b82f6;
          background: #f9fafb;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        ">
          ${sectionContent}
        </div>
      `;
    case "invite_link":
    case "resend_invite":
      return `
        <div style="
          background-color: rgb(243, 243, 252);
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
        ">
          <div style="margin-bottom: 20px">
            <p style="margin: 0px 0px 10px; text-align: left">
              <font color="#333333">
                <span style="font-size: 15px">
                  ${sectionContent}
                </span>
              </font>
            </p>
          </div>
        </div>
      `;
    default:
      return `
        <div style="
          background: #f8fafc;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        ">
          ${sectionContent}
        </div>
      `;
  }
};

const generateEmailHTML = (templateData: any, variables: any): string => {
  const { logo, title, greetings, content, section, footer } = templateData;
  const logoURL = logo || `${process.env.NEXT_PUBLIC_APP_BASE_URL}/iaa.png`;
  const processedTitle = replacePlaceholders(title, variables);
  const processedGreetings = replacePlaceholders(greetings, variables);
  const processedContent = replacePlaceholders(content, variables);
  const processedSection = replacePlaceholders(section, variables);
  const processedFooter = replacePlaceholders(footer, variables);

  return `
    <div><br /></div>
    <table cellspacing="0" cellpadding="0" style="background-color: #fff; width: 100%; min-width: 100%; padding: 40px 0;">
      <tbody>
        <tr>
          <td align="center">
            <div style="border: 1px solid #eee; max-width: 600px; width: 100%; margin: 0 auto;">
              <div style="padding: 40px 50px 20px 50px; text-align: center;">
                <div style="
                  width: 150px;
                  height: 100px;
                  background-image: url(${logoURL});
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
                  margin: 0 auto 20px auto;
                "></div>
                <h1 style="font-family: Lato, Helvetica; text-align: center; margin: 0;">
                  ${processedTitle}
                </h1>
              </div>
              <div style="padding: 0 50px 40px 50px; line-height: 1.6; text-align: left;">
                <p style="font-size: 16px; color: #333; margin: 0 0 16px 0; text-align: left; font-weight: bold;">
                  ${processedGreetings}
                </p>
                <p style="font-size: 16px; margin: 0px 0px 20px; color: #555;">
                  ${processedContent}
                </p>
                ${generateSectionHTML(
    processedSection,
    variables.emailType,
    variables.RedirectedLink,
    variables.portalName,
  )}
              </div>
              <div style="
                font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                background-color: rgb(248, 249, 250);
                text-align: center;
                padding: 20px 50px;
                border-top: 1px solid rgb(238, 238, 238);
              ">
                <div style="color: rgb(102, 102, 102); font-size: 14px; line-height: 1.6; white-space: pre-line;">
                  ${processedFooter}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div><br /></div>
  `;
};

export const sendSetPasswordEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string,
  portalName: string = "",
  userExist: boolean = false,
  from: string = "",
  portalId: string = "IAAClientPortal",
): Promise<void> => {
  try {
    console.log("Sending dynamic set password email to:", userEmail);
    const portal =
      portalName !== "" ? reverseSanitizeName(portalName) : "IAA";
    const resetLink =
      portalName !== ""
        ? from === "reset"
          ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}`
          : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}?isNew=true`
        : from === "reset"
          ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}`
          : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}?isNew=true`;
    const redirectLink =
      portalName !== ""
        ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`
        : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/login`;
    const emailType = userExist ? "invite_link" : "resend_invite";

    let templateData = null;
    templateData = {
      subject: "Welcome to IAA",
      logo: null,
      title: "Welcome to IAA",
      greetings: "Hi {{UserName}},",
      content: userExist
        ? "Thanks for registering for the IAA. To access {{portalName}} portal, click the button below. You will be directed to secure login page where you can sign in using your registered email address."
        : "Thanks for registering for the IAA. Please click the link below to create a password. Once completed you will be directed to the {{portalName}} Portal Log In page.",
      section: userExist
        ? "You can get started using this link: {{RedirtectedLink}}"
        : "Create password using this link: {{RedirtectedLink}}",
      footer:
        `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
      // };
    };

    const templateVariables = {
      UserName: userName.split(" ")[0],
      portalName: portal,
      RedirtectedLink: userExist ? redirectLink : resetLink,
      emailType: emailType,
    };

    const subject = replacePlaceholders(
      templateData?.subject || "",
      templateVariables,
    );
    const htmlContent = generateEmailHTML(templateData, templateVariables);

    const emailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
        bcc: [{ address: "kinjal.blurbee@gmail.com" }],
      },
      content: {
        subject: subject,
        html: htmlContent,
      },
    };

    console.log("Sending set password email with subject:", subject);
    await client.beginSend(emailContent);
    console.log("Dynamic set password email sent successfully");
  } catch (error) {
    console.error("Error sending set password email:", error);
    throw new Error("Failed to send set password email");
  }
};

export const sendSuccessPortalEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string,
  portalName: string,
  userExist: boolean = false,
): Promise<void> => {
  try {
    const portal =
      portalName !== "" ? reverseSanitizeName(portalName) : "IAA";
    const resetLink =
      portalName !== ""
        ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}`
        : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}`;
    const redirectLink = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`;

    const successEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
      },
      content: {
        subject: `Your ${portal} portal has been created successfully`,
        html: `
          <table cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; width: 100%; min-width: 100%; padding: 40px 0;">
            <tbody>
              <tr>
                <td align="center">
                  <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px;">
                    <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                      <h1 style="margin: 0; font-size: 22px; font-family: Lato, Helvetica, Arial, sans-serif;">🎉 Welcome to ${portal} Portal! 🎉</h1>
                    </div>
                    <div style="padding: 40px 50px; line-height: 1.6; text-align: left;">
                      <p style="color: #333333; font-size: 16px; margin-bottom: 20px;">
                        <strong>Hi ${userName},</strong>
                      </p>
                      <p style="color: #333333; font-size: 16px; margin-bottom: 20px;">
                        We're excited to welcome you to the <strong>${portal}</strong> Portal! Your portal has been successfully created.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${redirectLink}" target="_blank" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 20px; font-size: 16px; border-radius: 5px; text-decoration: none;">
                          Login to Your Portal
                        </a>
                      </div>
                    </div>
                    <div style="background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666666;">
                      <p style="margin: 0;">© ${new Date().getFullYear()} ${portal} Portal. All rights reserved.</p>
                      <p style="margin: 0;">This is an automated message, please do not reply directly to this email.</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        `,
      },
    };

    await client.beginSend(successEmailContent);
    console.log("Success email sent");
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send success email");
  }
};

export const sendLoginCodeEmail = async (
  userEmail: string,
  userName: string,
  loginCode: string,
  portalName: string = "",
  portalId: string = "IAAClientPortal",
): Promise<void> => {
  try {
    console.log("Sending login code email to:", userEmail);
    const portal =
      portalName !== "" ? reverseSanitizeName(portalName) : "IAA";
    const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;
    const userNameFirst = userName.split(" ")[0] || userName;

    const subject = `Login Verification Code - ${portal}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                    ${logoURL
        ? `
                    <div style="
                      width: 150px;
                      height: 100px;
                      background-image: url(${logoURL});
                      background-size: contain;
                      background-repeat: no-repeat;
                      background-position: center;
                      margin: 0 auto 20px auto;
                    "></div>
                    `
        : ""
      }
                    <h1 style="
                      font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                      font-size: 24px;
                      font-weight: 600;
                      color: #333333;
                      text-align: center;
                      margin: 0;
                      line-height: 1.4;
                    ">
                      Login Verification Code
                    </h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                    <p style="
                      font-size: 16px;
                      color: #333333;
                      margin: 0 0 16px 0;
                      font-weight: 600;
                    ">
                      Hi ${userNameFirst},
                    </p>
                    <p style="
                      font-size: 16px;
                      color: #555555;
                      margin: 0 0 30px 0;
                      line-height: 1.6;
                    ">
                      Use the verification code below to sign in to your <strong>${portal}</strong> account. This code is valid for the next 10 minutes.
                    </p>
                    
                    <!-- Verification Code Box -->
                    <div style="
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      padding: 30px 20px;
                      border-radius: 12px;
                      text-align: center;
                      margin: 30px 0;
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                      <div style="
                        font-size: 36px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        color: #333333;
                        font-family: 'Courier New', monospace;
                        text-align: center;
                        line-height: 1.2;
                        margin: 0;
                      ">
                        ${loginCode}
                      </div>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="
                      background-color: #fff3cd;
                      border-left: 4px solid #ffc107;
                      padding: 15px 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #856404;
                        margin: 0;
                        line-height: 1.5;
                      ">
                        <strong>Security Notice:</strong> If you didn't request this code, please ignore this email or contact support if you have concerns.
                      </p>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="
                    background-color: #f8f9fa;
                    text-align: center;
                    padding: 20px 50px;
                    border-top: 1px solid #eeeeee;
                  ">
                    <p style="
                      font-size: 14px;
                      color: #666666;
                      margin: 0 0 10px 0;
                      line-height: 1.6;
                    ">
                      ©  ${portal}. All rights reserved.
                    </p>
                    <p style="
                      font-size: 12px;
                      color: #999999;
                      margin: 0;
                      line-height: 1.6;
                    ">
                      This is an automated message, please do not reply directly to this email.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const codeEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
      },
      content: {
        subject: subject,
        html: htmlContent,
      },
    };

    console.log("Sending login code email with subject:", subject);
    await client.beginSend(codeEmailContent);
    console.log("Login code email sent successfully");
  } catch (error) {
    console.error("Error sending login code email:", error);
    throw new Error("Failed to send login code email");
  }
};

export const sendFileUploadNotificationEmail = async (
  collaborators: string[],
  allFiles: any[],
  uploaderEmail: string,
  folderName: string = "Shared Folder",
  portalName: string = "",
  portalId: string = "IAAClientPortal",
): Promise<any[]> => {
  try {
    console.log(
      "Sending dynamic file upload notification emails to:",
      collaborators,
    );
    const portal =
      portalName !== "" ? reverseSanitizeName(portalName) : "IAA";
    const redirectLink = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`;

    const createFileList = (): string => {
      const filesByUploader: any = {};
      allFiles.forEach((file) => {
        const email = file.description || "Unknown uploader";
        if (!filesByUploader[email]) {
          filesByUploader[email] = [];
        }
        filesByUploader[email].push(file.name);
      });

      let fileList = "";
      Object.entries(filesByUploader).forEach(
        ([email, fileNames]: [string, any]) => {
          fileList += `Uploaded by: ${email}\n`;
          fileNames.forEach((name: string) => {
            fileList += `• ${name}\n`;
          });
          fileList += "\n";
        },
      );
      return fileList;
    };

    let templateData = null;
    console.log("No custom template found, using default template");
    templateData = {
        subject: "New Files Uploaded to {{FolderName}}",
        logo: null,
        title: "New Files Available",
        greetings: "Hi,",
        content:
          'New files have been uploaded to "{{FolderName}}" that you have access to.',
        section: "{{FileName}}",
        footer:
          `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
      };

    const emailPromises = collaborators.map(async (collaboratorEmail) => {
      const templateVariables = {
        FolderName: folderName,
        FileName: createFileList(),
        UploaderName: uploaderEmail,
        portalName: portal,
        RedirectedLink: redirectLink,
        emailType: "file_upload",
      };

      const subject = replacePlaceholders(
        templateData?.subject || "",
        templateVariables,
      );
      const htmlContent = generateEmailHTML(templateData, templateVariables);

      const fileUploadEmailContent = {
        senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
        recipients: {
          to: [{ address: collaboratorEmail }],
          bcc: [{ address: "kinjal.blurbee@gmail.com" }],
        },
        content: {
          subject: subject,
          html: htmlContent,
        },
      };

      try {
        console.log("Sending file upload notification to:", collaboratorEmail);
        await client.beginSend(fileUploadEmailContent);
        console.log(
          "Dynamic file upload notification email sent to:",
          collaboratorEmail,
        );
        return { success: true, email: collaboratorEmail };
      } catch (error) {
        console.error(`Failed to send email to ${collaboratorEmail}:`, error);
        return {
          success: false,
          email: collaboratorEmail,
          error: (error as Error).message,
        };
      }
    });

    const emailResults = await Promise.allSettled(emailPromises);
    return emailResults.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : { success: false, error: result.reason },
    );
  } catch (error) {
    console.error("Error sending file upload notification emails:", error);
    throw new Error("Failed to send file upload notification emails");
  }
};

export const sendDocumentStatusNotificationEmail = async (
  userEmail: string,
  userName: string,
  documentName: string,
  documentStatus: string,
  documentTypeName?: string,
  portalName: string = "",
  portalId: string = "IAAClientPortal",
): Promise<void> => {
  try {
    console.log("Sending document status notification email to:", userEmail);
    const portal =
      portalName !== "" ? reverseSanitizeName(portalName) : "IAA";

    // Determine status color and message
    const statusColors: { [key: string]: string } = {
      Approved: "#28a745",
      Rejected: "#dc3545",
      Pending: "#ffc107",
      UnderReview: "#17a2b8",
    };

    const statusMessages: { [key: string]: string } = {
      Approved: "Your document has been approved!",
      Rejected:
        "Your document has been rejected. Please review and resubmit if needed.",
      Pending: "Your document is pending review.",
      UnderReview: "Your document is currently under review.",
    };

    const statusColor = statusColors[documentStatus] || "#6c757d";
    const statusMessage =
      statusMessages[documentStatus] ||
      `Your document status has been updated to ${documentStatus}.`;

    let templateData = null;
    console.log(
      "No custom template found for document_status, using default template",
    );
    templateData = {
        subject: "Document Status Update - {{DocumentName}}",
        logo: null,
        title: "Document Status Update",
        greetings: "Hi {{UserName}},",
        content: "{{StatusMessage}}",
        section:
          "Document: {{DocumentName}}\nType: {{DocumentTypeName}}\nStatus: {{DocumentStatus}}",
        footer:
          `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
      };

    const templateVariables = {
      UserName: userName.split(" ")[0],
      DocumentName: documentName,
      DocumentTypeName: documentTypeName || "Document",
      DocumentStatus: documentStatus,
      StatusMessage: statusMessage,
      portalName: portal,
      emailType: "document_status",
    };

    const subject = replacePlaceholders(
      templateData?.subject || `Document Status Update - ${documentName}`,
      templateVariables,
    );

    const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;

    // Generate custom HTML for document status email
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                    ${logoURL
        ? `
                    <div style="
                      width: 150px;
                      height: 100px;
                      background-image: url(${logoURL});
                      background-size: contain;
                      background-repeat: no-repeat;
                      background-position: center;
                      margin: 0 auto 20px auto;
                    "></div>
                    `
        : ""
      }
                    <h1 style="
                      font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                      font-size: 24px;
                      font-weight: 600;
                      color: #333333;
                      text-align: center;
                      margin: 0;
                      line-height: 1.4;
                    ">
                      Document Status Update
                    </h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                    <p style="
                      font-size: 16px;
                      color: #333333;
                      margin: 0 0 16px 0;
                      font-weight: 600;
                    ">
                      Hi ${templateVariables.UserName},
                    </p>
                    <p style="
                      font-size: 16px;
                      color: #555555;
                      margin: 0 0 30px 0;
                      line-height: 1.6;
                    ">
                      ${statusMessage}
                    </p>
                    
                    <!-- Document Details -->
                    <div style="
                      background-color: #f8f9fa;
                      border-left: 4px solid ${statusColor};
                      padding: 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 16px;
                        color: #333333;
                        margin: 0 0 10px 0;
                        font-weight: 600;
                      ">
                        Document Details:
                      </p>
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 5px 0;
                        line-height: 1.8;
                      ">
                        <strong>Document Name:</strong> ${documentName}
                      </p>
                      ${documentTypeName
        ? `
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 5px 0;
                        line-height: 1.8;
                      ">
                        <strong>Document Type:</strong> ${documentTypeName}
                      </p>
                      `
        : ""
      }
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 5px 0;
                        line-height: 1.8;
                      ">
                        <strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${documentStatus}</span>
                      </p>
                    </div>
                    
                    <!-- Additional info for rejected documents -->
                    <div style="
                      background-color: #fff3cd;
                      border-left: 4px solid #ffc107;
                      padding: 15px 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #856404;
                        margin: 0;
                        line-height: 1.5;
                      ">
                        <strong>Note:</strong> If you have any questions about why your document was rejected, please contact your administrator or support team.
                      </p>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="
                    background-color: #f8f9fa;
                    text-align: center;
                    padding: 20px 50px;
                    border-top: 1px solid #eeeeee;
                  ">
                    <p style="
                      font-size: 14px;
                      color: #666666;
                      margin: 0 0 10px 0;
                      line-height: 1.6;
                    ">
                      © ${new Date().getFullYear()} ${portal}. All rights reserved.
                    </p>
                    <p style="
                      font-size: 12px;
                      color: #999999;
                      margin: 0;
                      line-height: 1.6;
                    ">
                      This is an automated message, please do not reply directly to this email.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const documentStatusEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
        bcc: [{ address: "kinjal.blurbee@gmail.com" }],
      },
      content: {
        subject: subject,
        html: htmlContent,
      },
    };

    console.log(
      "Sending document status notification email with subject:",
      subject,
    );
    await client.beginSend(documentStatusEmailContent);
    console.log("Document status notification email sent successfully");
  } catch (error) {
    console.error("Error sending document status notification email:", error);
    throw new Error("Failed to send document status notification email");
  }
};

export const sendDocumentUploadNotificationToAdmins = async (
  adminEmails: string[],
  userName: string,
  userEmail: string,
  documentName: string,
  documentType: string,
  documentCategory: string,
  portalName: string = "",
  portalId: string = "IAAClientPortal",
): Promise<any[]> => {
  try {
    console.log(
      "Sending document upload notification emails to admins/moderators:",
      adminEmails,
    );
    const portal =
      portalName !== "" ? reverseSanitizeName(portalName) : "IAA";

    let templateData = null;
    console.log(
      "No custom template found for document_upload_notification, using default template",
    );
    templateData = {
      subject: "New Document Uploaded - {{DocumentName}}",
      logo: null,
      title: "New Document Upload Notification",
      greetings: "Hi,",
      content:
        "A new document has been uploaded to the portal that requires your review.",
      section:
        "Uploaded by: {{UserName}} ({{UserEmail}})\nDocument Name: {{DocumentName}}\nDocument Type: {{DocumentType}}\nDocument Category: {{DocumentCategory}}",
      footer:
        `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
    };

    const emailPromises = adminEmails.map(async (adminEmail) => {
      const templateVariables = {
        UserName: userName,
        UserEmail: userEmail,
        DocumentName: documentName,
        DocumentType: documentType || "N/A",
        DocumentCategory: documentCategory || "N/A",
        portalName: portal,
        emailType: "document_upload_notification",
      };

      const subject = replacePlaceholders(
        templateData?.subject || `New Document Uploaded - ${documentName}`,
        templateVariables,
      );

      const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;

      // Generate HTML email
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
            <tbody>
              <tr>
                <td align="center">
                  <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                    ${logoURL
          ? `
                    <div style="
                      width: 150px;
                      height: 100px;
                      background-image: url(${logoURL});
                      background-size: contain;
                      background-repeat: no-repeat;
                      background-position: center;
                      margin: 0 auto 20px auto;
                    "></div>
                    `
          : ""
        }
                    <h1 style="
                      font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                      font-size: 24px;
                      font-weight: 600;
                      color: #333333;
                      text-align: center;
                      margin: 0;
                      line-height: 1.4;
                    ">
                      New Document Upload Notification
                    </h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                    <p style="
                      font-size: 16px;
                      color: #333333;
                      margin: 0 0 16px 0;
                      font-weight: 600;
                    ">
                      Hi,
                    </p>
                    <p style="
                      font-size: 16px;
                      color: #555555;
                      margin: 0 0 30px 0;
                      line-height: 1.6;
                    ">
                      A new document has been uploaded to the ${portal} portal that requires your review.
                    </p>
                    
                    <!-- Document Details -->
                    <div style="
                      background-color: #f8f9fa;
                      border-left: 4px solid #007bff;
                      padding: 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 16px;
                        color: #333333;
                        margin: 0 0 15px 0;
                        font-weight: 600;
                      ">
                        Document Details:
                      </p>
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 8px 0;
                        line-height: 1.8;
                      ">
                        <strong>Uploaded by:</strong> ${userName} (${userEmail})
                      </p>
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 8px 0;
                        line-height: 1.8;
                      ">
                        <strong>Document Name:</strong> ${documentName}
                      </p>
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 8px 0;
                        line-height: 1.8;
                      ">
                        <strong>Document Type:</strong> ${documentType || "N/A"}
                      </p>
                      <p style="
                        font-size: 14px;
                        color: #555555;
                        margin: 8px 0;
                        line-height: 1.8;
                      ">
                        <strong>Document Category:</strong> ${documentCategory || "N/A"}
                      </p>
                    </div>
                    
                    <!-- Note Section -->
                    <div style="
                      background-color: #fff3cd;
                      border-left: 4px solid #ffc107;
                      padding: 15px 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #856404;
                        margin: 0;
                        line-height: 1.5;
                      ">
                        <strong>Note:</strong> Please review the uploaded document and take appropriate action as needed.
                      </p>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                    <div style="
                      background-color: #f8f9fa;
                      text-align: center;
                      padding: 20px 50px;
                      border-top: 1px solid #eeeeee;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #666666;
                        margin: 0 0 10px 0;
                        line-height: 1.6;
                      ">
                        © ${new Date().getFullYear()} ${portal}. All rights reserved.
                      </p>
                      <p style="
                        font-size: 12px;
                        color: #999999;
                        margin: 0;
                        line-height: 1.6;
                      ">
                        This is an automated message, please do not reply directly to this email.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const documentUploadEmailContent = {
        senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
        recipients: {
          to: [{ address: adminEmail }],
          // bcc: [{ address: "kinjal.blurbee@gmail.com" }],
          bcc: [{ address: "dainik.blurbee@gmail.com" }],
        },
        content: {
          subject: subject,
          html: htmlContent,
        },
      };

      try {
        console.log("Sending document upload notification to:", adminEmail);
        await client.beginSend(documentUploadEmailContent);
        console.log(
          "Document upload notification email sent successfully to:",
          adminEmail,
        );
        return { success: true, email: adminEmail };
      } catch (error) {
        console.error(`Failed to send email to ${adminEmail}:`, error);
        return {
          success: false,
          email: adminEmail,
          error: (error as Error).message,
        };
      }
    });

    const emailResults = await Promise.allSettled(emailPromises);
    return emailResults.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : { success: false, error: result.reason },
    );
  } catch (error) {
    console.error("Error sending document upload notification emails:", error);
    throw new Error("Failed to send document upload notification emails");
  }
};

type WorkflowLabelContext = {
  categoryTitle?: string;
  taskTitle?: string;
  subtaskTitle?: string;
};

const resolvePortalDisplay = (portalName: string): string =>
  (() => {
    const raw = String(portalName || "").trim();
    if (!raw) return "IAA";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
      return "Portal";
    }
    // If this already looks like a display name, keep it as-is.
    if (/\s/.test(raw)) return raw;
    return reverseSanitizeName(raw);
  })();

const getWorkflowAdminTemplateDefaults = (
  variant: "upload" | "reupload",
): any => ({
  subject:
    variant === "reupload"
      ? "Document re-uploaded - {{DocumentName}}"
      : "New workflow document uploaded - {{DocumentName}}",
  logo: null,
  title:
    variant === "reupload"
      ? "Document Re-uploaded - Review Required"
      : "New Workflow Upload Notification",
  greetings: "Hi,",
  content:
    variant === "reupload"
      ? "A client has re-uploaded a workflow document after rejection. Please review it."
      : "A client has uploaded a workflow document that requires your review.",
  section:
    "Category: {{CategoryTitle}}\nTask: {{TaskTitle}}\nSubtask: {{SubtaskTitle}}\nUploaded by: {{UserName}} ({{UserEmail}})\nDocument Name: {{DocumentName}}\nDocument Type: {{DocumentType}}",
  footer: `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
});

const sendWorkflowAdminNotificationInternal = async (
  adminEmails: string[],
  userName: string,
  userEmail: string,
  documentName: string,
  documentType: string,
  labels: WorkflowLabelContext,
  portalName: string,
  portalId: string,
  templateType:
    | typeof EmailType.WORKFLOW_DOCUMENT_UPLOAD_NOTIFICATION
    | typeof EmailType.WORKFLOW_DOCUMENT_REUPLOAD_NOTIFICATION,
): Promise<any[]> => {
  const portal = resolvePortalDisplay(portalName);
  const categoryTitle = labels.categoryTitle || "N/A";
  const taskTitle = labels.taskTitle || "N/A";
  const subtaskTitle = labels.subtaskTitle || "N/A";
  const isReupload =
    templateType === EmailType.WORKFLOW_DOCUMENT_REUPLOAD_NOTIFICATION;

  let templateData: any = null;
  if (!templateData) {
    templateData = getWorkflowAdminTemplateDefaults(isReupload ? "reupload" : "upload");
  }

  const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;
  const introText = isReupload
    ? `A client has re-uploaded a workflow document in the ${portal} portal after rejection.`
    : `A client has uploaded a workflow document in the ${portal} portal that requires review.`;
  const noteText = isReupload
    ? "Please review the re-uploaded document and take action."
    : "Please review the uploaded document and take action.";

  const emailPromises = adminEmails.map(async (adminEmail) => {
    const templateVariables = {
      UserName: userName,
      UserEmail: userEmail,
      DocumentName: documentName,
      DocumentType: documentType || "Not Specified",
      CategoryTitle: categoryTitle,
      TaskTitle: taskTitle,
      SubtaskTitle: subtaskTitle,
      portalName: portal,
      emailType: templateType,
    };

    const subject = replacePlaceholders(
      templateData?.subject ||
        (isReupload
          ? `Document re-uploaded - ${documentName}`
          : `New workflow document uploaded - ${documentName}`),
      templateVariables,
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                    <div style="width: 150px; height: 100px; background-image: url(${logoURL}); background-size: contain; background-repeat: no-repeat; background-position: center; margin: 0 auto 20px auto;"></div>
                    <h1 style="font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; color: #333333; text-align: center; margin: 0; line-height: 1.4;">
                      ${isReupload ? "Document Re-uploaded - Review Required" : "New Workflow Upload Notification"}
                    </h1>
                  </div>
                  <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                    <p style="font-size: 16px; color: #333333; margin: 0 0 16px 0; font-weight: 600;">Hi,</p>
                    <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.6;">${escapeHtml(introText)}</p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 15px 0; font-weight: 600;">Workflow Details:</p>
                      <p style="font-size: 14px; color: #555555; margin: 8px 0; line-height: 1.8;"><strong>Category:</strong> ${escapeHtml(categoryTitle)}</p>
                      <p style="font-size: 14px; color: #555555; margin: 8px 0; line-height: 1.8;"><strong>Task:</strong> ${escapeHtml(taskTitle)}</p>
                      <p style="font-size: 14px; color: #555555; margin: 8px 0; line-height: 1.8;"><strong>Subtask:</strong> ${escapeHtml(subtaskTitle)}</p>
                      <p style="font-size: 14px; color: #555555; margin: 8px 0; line-height: 1.8;"><strong>Uploaded by:</strong> ${escapeHtml(userName)} (${escapeHtml(userEmail)})</p>
                      <p style="font-size: 14px; color: #555555; margin: 8px 0; line-height: 1.8;"><strong>Document Name:</strong> ${escapeHtml(documentName)}</p>
                      <p style="font-size: 14px; color: #555555; margin: 8px 0; line-height: 1.8;"><strong>Document Type:</strong> ${escapeHtml(documentType || "Not Specified")}</p>
                    </div>
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="font-size: 14px; color: #856404; margin: 0; line-height: 1.5;"><strong>Note:</strong> ${escapeHtml(noteText)}</p>
                    </div>
                  </div>
                  <div style="background-color: #f8f9fa; text-align: center; padding: 20px 50px; border-top: 1px solid #eeeeee;">
                    <p style="font-size: 14px; color: #666666; margin: 0 0 10px 0; line-height: 1.6;">© ${new Date().getFullYear()} ${escapeHtml(portal)}. All rights reserved.</p>
                    <p style="font-size: 12px; color: #999999; margin: 0; line-height: 1.6;">This is an automated message, please do not reply directly to this email.</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const content = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: adminEmail }],
      },
      content: {
        subject,
        html: htmlContent,
      },
    };

    try {
      await client.beginSend(content);
      return { success: true, email: adminEmail };
    } catch (error) {
      return { success: false, email: adminEmail, error: (error as Error).message };
    }
  });

  const results = await Promise.allSettled(emailPromises);
  return results.map((r) =>
    r.status === "fulfilled" ? r.value : { success: false, error: r.reason },
  );
};

export const sendWorkflowUploadNotificationToAdmins = async (
  adminEmails: string[],
  userName: string,
  userEmail: string,
  documentName: string,
  documentType: string,
  labels: WorkflowLabelContext,
  portalName: string = "",
  portalId: string = "IAAClientPortal",
) =>
  sendWorkflowAdminNotificationInternal(
    adminEmails,
    userName,
    userEmail,
    documentName,
    documentType,
    labels,
    portalName,
    portalId,
    EmailType.WORKFLOW_DOCUMENT_UPLOAD_NOTIFICATION,
  );

export const sendWorkflowReuploadNotificationToAdmins = async (
  adminEmails: string[],
  userName: string,
  userEmail: string,
  documentName: string,
  documentType: string,
  labels: WorkflowLabelContext,
  portalName: string = "",
  portalId: string = "IAAClientPortal",
) =>
  sendWorkflowAdminNotificationInternal(
    adminEmails,
    userName,
    userEmail,
    documentName,
    documentType,
    labels,
    portalName,
    portalId,
    EmailType.WORKFLOW_DOCUMENT_REUPLOAD_NOTIFICATION,
  );

export const sendWorkflowRejectNotificationToUser = async (
  userEmail: string,
  userName: string,
  documentName: string,
  documentType: string,
  rejectReason: string,
  labels: WorkflowLabelContext,
  portalName: string = "",
  portalId: string = "IAAClientPortal",
  options?: { revokeAfterApproval?: boolean },
): Promise<void> => {
  const portal = resolvePortalDisplay(portalName);
  const categoryTitle = labels.categoryTitle || "N/A";
  const taskTitle = labels.taskTitle || "N/A";
  const subtaskTitle = labels.subtaskTitle || "N/A";
  const isReuploadAfterApproval = options?.revokeAfterApproval === true;

  let templateData: any = null;

  const defaultRejectTemplate = {
    subject: "Workflow Document Rejected - {{DocumentName}}",
    logo: null,
    title: "Document Rejected",
    greetings: "Hi {{UserName}},",
    content:
      "Your uploaded workflow document was rejected. Please review the feedback and upload again.",
    section:
      "Category: {{CategoryTitle}}\nTask: {{TaskTitle}}\nSubtask: {{SubtaskTitle}}\nDocument Name: {{DocumentName}}\nDocument Type: {{DocumentType}}\nStatus: Rejected\nFeedback: {{RejectReason}}",
    footer:
      `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
  };

  const defaultReuploadTemplate = {
    subject: "Re-upload required - {{DocumentName}}",
    logo: null,
    title: "Need to re-upload document",
    greetings: "Hi {{UserName}},",
    content:
      "You need to re-upload this document. Please read the reviewer feedback below and submit a new file.",
    section:
      "Category: {{CategoryTitle}}\nTask: {{TaskTitle}}\nSubtask: {{SubtaskTitle}}\nDocument Name: {{DocumentName}}\nDocument Type: {{DocumentType}}\nStatus: Rejected\nFeedback: {{RejectReason}}",
    footer:
      `IAA ${new Date().getFullYear()}. All rights reserved.\n\nThis is an automated message, please do not reply directly to this email.`,
  };

  let effectiveTemplate: any = templateData ? { ...templateData } : null;
  if (!effectiveTemplate) {
    effectiveTemplate = isReuploadAfterApproval
      ? { ...defaultReuploadTemplate }
      : { ...defaultRejectTemplate };
  } else if (isReuploadAfterApproval) {
    effectiveTemplate = {
      ...effectiveTemplate,
      subject: "Re-upload required - {{DocumentName}}",
      title: "Need to re-upload document",
      content:
        "You need to re-upload this document. Please read the reviewer feedback below and submit a new file.",
    };
  }

  const variables = {
    UserName: userName.split(" ")[0] || userName,
    DocumentName: documentName,
    DocumentType: documentType || "Not Specified",
    CategoryTitle: categoryTitle,
    TaskTitle: taskTitle,
    SubtaskTitle: subtaskTitle,
    RejectReason: rejectReason || "",
    portalName: portal,
    emailType: EmailType.WORKFLOW_DOCUMENT_REJECT_NOTIFICATION,
  };
  const subject = replacePlaceholders(
    effectiveTemplate?.subject ||
      (isReuploadAfterApproval
        ? `Re-upload required - ${documentName}`
        : `Workflow Document Rejected - ${documentName}`),
    variables,
  );

  // Keep workflow reject email visual style consistent with existing document status UI.
  const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;
  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                    ${logoURL
        ? `
                    <div style="
                      width: 150px;
                      height: 100px;
                      background-image: url(${logoURL});
                      background-size: contain;
                      background-repeat: no-repeat;
                      background-position: center;
                      margin: 0 auto 20px auto;
                    "></div>
                    `
        : ""
      }
                    <h1 style="
                      font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                      font-size: 24px;
                      font-weight: 600;
                      color: #333333;
                      text-align: center;
                      margin: 0;
                      line-height: 1.4;
                    ">
                      ${escapeHtml(effectiveTemplate?.title || "Document Status Update")}
                    </h1>
                  </div>

                  <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                    <p style="
                      font-size: 16px;
                      color: #333333;
                      margin: 0 0 16px 0;
                      font-weight: 600;
                    ">
                      Hi ${escapeHtml(variables.UserName)},
                    </p>
                    <p style="
                      font-size: 16px;
                      color: #555555;
                      margin: 0 0 30px 0;
                      line-height: 1.6;
                    ">
                      ${escapeHtml(
                        effectiveTemplate?.content ||
                          (isReuploadAfterApproval
                            ? "You need to re-upload this document. Please read the reviewer feedback below and submit a new file."
                            : "Your document has been rejected. Please review and resubmit if needed."),
                      )}
                    </p>

                    <div style="
                      background-color: #f8f9fa;
                      border-left: 4px solid #dc3545;
                      padding: 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 16px;
                        color: #333333;
                        margin: 0 0 10px 0;
                        font-weight: 600;
                      ">
                        Document Details:
                      </p>
                      <p style="font-size: 14px; color: #555555; margin: 5px 0; line-height: 1.8;">
                        <strong>Document Name:</strong> ${escapeHtml(documentName)}
                      </p>
                      <p style="font-size: 14px; color: #555555; margin: 5px 0; line-height: 1.8;">
                        <strong>Document Type:</strong> ${escapeHtml(documentType || "Not Specified")}
                      </p>
                      <p style="font-size: 14px; color: #555555; margin: 5px 0; line-height: 1.8;">
                        <strong>Subtask:</strong> ${escapeHtml(subtaskTitle)}
                      </p>
                      <p style="font-size: 14px; color: #555555; margin: 5px 0; line-height: 1.8;">
                        <strong>Task:</strong> ${escapeHtml(taskTitle)}
                      </p>
                      <p style="font-size: 14px; color: #555555; margin: 5px 0; line-height: 1.8;">
                        <strong>Category:</strong> ${escapeHtml(categoryTitle)}
                      </p>
                      <p style="font-size: 14px; color: #555555; margin: 5px 0; line-height: 1.8;">
                        <strong>Status:</strong> <span style="color: #dc3545; font-weight: 600;">Rejected</span>
                      </p>
                    </div>

                    <div style="
                      background-color: #fdecea;
                      border-left: 4px solid #dc3545;
                      padding: 15px 20px;
                      margin: 24px 0 0 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #721c24;
                        margin: 0;
                        line-height: 1.5;
                      ">
                        <strong>Reviewer feedback:</strong> ${escapeHtml(rejectReason || "No feedback provided.")}
                      </p>
                    </div>

                    <div style="
                      background-color: #fff3cd;
                      border-left: 4px solid #ffc107;
                      padding: 15px 20px;
                      margin: 30px 0;
                      border-radius: 4px;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #856404;
                        margin: 0;
                        line-height: 1.5;
                      ">
                        <strong>Note:</strong> ${
                          isReuploadAfterApproval
                            ? "If you have any questions about this re-upload request, please contact your administrator or support team."
                            : "If you have any questions about why your document was rejected, please contact your administrator or support team."
                        }
                      </p>
                    </div>
                  </div>

                  <div style="
                    background-color: #f8f9fa;
                    text-align: center;
                    padding: 20px 50px;
                    border-top: 1px solid #eeeeee;
                  ">
                    <p style="
                      font-size: 14px;
                      color: #666666;
                      margin: 0 0 10px 0;
                      line-height: 1.6;
                    ">
                      © ${new Date().getFullYear()} ${escapeHtml(portal)}. All rights reserved.
                    </p>
                    <p style="
                      font-size: 12px;
                      color: #999999;
                      margin: 0;
                      line-height: 1.6;
                    ">
                      This is an automated message, please do not reply directly to this email.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

  await client.beginSend({
    senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
    recipients: { to: [{ address: userEmail }] },
    content: { subject, html },
  });
};

export const sendTaskCompletedNotificationEmail = async (
  triggerType: string,
  userEmail: string,
  subject: string,
  body: string = "",
  portalName: string = "IAA",
  type: "task" | "subtask" | "assign" = "task",
): Promise<void> => {
  try {
    console.log("Sending task completed notification email to:", userEmail);
    const portal = portalName !== "" ? reverseSanitizeName(portalName) : "IAA";

    const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;

    // Customize title based on type
    const getTitle = () => {
      if (type === "subtask") {
        return "Subtask Completed";
      }
      if (type === "assign") {
        return "Task Assigned";
      }
      return "Task Completed";
    };

    // Generate HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                    ${logoURL
        ? `
                    <div style="
                      width: 150px;
                      height: 100px;
                      background-image: url(${logoURL});
                      background-size: contain;
                      background-repeat: no-repeat;
                      background-position: center;
                      margin: 0 auto 20px auto;
                    "></div>
                    `
        : ""
      }
                    <h1 style="
                      font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                      font-size: 24px;
                      font-weight: 600;
                      color: #333333;
                      text-align: center;
                      margin: 0;
                      line-height: 1.4;
                    ">
                      ${getTitle()}
                    </h1>
                  </div>
                  <!-- Content -->
                  <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                    <p style="
                      font-size: 16px;
                      color: #555555;
                      margin: 0 0 30px 0;
                      line-height: 1.6;
                    ">
                      ${body}
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="
                    background-color: #f8f9fa;
                    text-align: center;
                    padding: 20px 50px;
                    border-top: 1px solid #eeeeee;
                  ">
                    <p style="
                      font-size: 14px;
                      color: #666666;
                      margin: 0 0 10px 0;
                      line-height: 1.6;
                    ">
                      © ${new Date(Date.now()).getFullYear()} ${portal}. All rights reserved.
                    </p>
                    <p style="
                      font-size: 12px;
                      color: #999999;
                      margin: 0;
                      line-height: 1.6;
                    ">
                      This is an automated message, please do not reply directly to this email.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const leadApprovalEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
        bcc: [{ address: "kinjal.blurbee@gmail.com" }],
      },
      content: {
        subject: subject,
        html: htmlContent,
      },
    };

    console.log(
      "Sending lead approval notification email with subject:",
      subject,
    );
    await client.beginSend(leadApprovalEmailContent);
    console.log("Lead approval notification email sent successfully");
  } catch (error) {
    console.error("Error sending lead approval notification email:", error);
    throw new Error("Failed to send lead approval notification email");
  }
};

export const sendNewUserJoinedNotificationEmail = async (
  triggerType: string,
  userEmail: string,
  subject: string,
  body: string = "",
  portalName: string = "IAA",
): Promise<void> => {
  try {
    console.log("Sending new user joined notification email to:", userEmail);
    const portal = portalName !== "" ? reverseSanitizeName(portalName) : "IAA";

    const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/iaa.png`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%; padding: 40px 0;">
            <tbody>
              <tr>
                <td align="center">
                  <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                  <div style="background-color: #ffffff; padding: 40px 50px 20px 50px; text-align: center;">
                      ${logoURL
                              ? `
                      <div style="
                        width: 150px;
                        height: 100px;
                        background-image: url(${logoURL});
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        margin: 0 auto 20px auto;
                      "></div>
                      `
                        : ""
                      }
                      <h1 style="
                        font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                        font-size: 24px;
                        font-weight: 600;
                        color: #333333;
                        text-align: center;
                        margin: 0;
                        line-height: 1.4;
                      ">
                        New User Joined
                      </h1>
                    </div>
                    <!-- Content -->
                    <div style="padding: 0 50px 40px 50px; line-height: 1.6;">
                      <p style="
                        font-size: 16px;
                        color: #555555;
                        margin: 0 0 30px 0;
                        line-height: 1.6;
                      ">
                      ${body}
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="
                      background-color: #f8f9fa;
                      text-align: center;
                      padding: 20px 50px;
                      border-top: 1px solid #eeeeee;
                    ">
                      <p style="
                        font-size: 14px;
                        color: #666666;
                        margin: 0 0 10px 0;
                        line-height: 1.6;
                      ">
                        © ${new Date(Date.now()).getFullYear()} ${portal}. All rights reserved.
                      </p>
                      <p style="
                        font-size: 12px;
                        color: #999999;
                        margin: 0;
                        line-height: 1.6;
                      ">
                        This is an automated message, please do not reply directly to this email.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
      </html>
    `;

    const newUserJoinedEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
        bcc: [{ address: "kinjal.blurbee@gmail.com" }],
      },
      content: {
        subject: subject,
        html: htmlContent,
      },
    };

    console.log(
      "Sending new user joined notification email with subject:",
      subject,
    );
    await client.beginSend(newUserJoinedEmailContent);
    console.log("New user joined notification email sent successfully");
  } catch (error) {
    console.error("Error sending new user joined notification email:", error);
    throw new Error("Failed to send new user joined notification email");
  }
};
