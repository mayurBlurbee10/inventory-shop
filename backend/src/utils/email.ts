import { EmailClient } from "@azure/communication-email";
import { reverseSanitizeName } from "./commonUtils.ts";
import { setPasswordEmailTemplate } from "./emailTemplates/setPasswordEmailTemplate.ts";
import { successPortalEmailTemplate } from "./emailTemplates/successPortalEmailTemplate.ts";
import { welcomeLoginEmailTemplate } from "./emailTemplates/welcomeLoginEmailTemplate.ts";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const client = new EmailClient(connectionString!);

export const sendSetPasswordEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string,
  portalName: string = "",
  userExist: boolean = false,
  from: string = "",
  portalId: string = "Universal Portal Demo",
): Promise<void> => {
  try {
    const portal = portalName !== "" ? reverseSanitizeName(portalName) : "Mstrategy";
    const resetLink = portalName !== ""
      ? from === "reset" ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}` : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}?isNew=true`
      : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}`;

    const redirectLink = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`;
    const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/MStrategy_Group.png`;

    const emailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
        bcc: [
          { address: "gp@mstrategygroup.com" },
          { address: "kinjal.blurbee@gmail.com" },
        ],
      },
      content: {
        subject: `You're invited to the Universal Portal Wealth Demo!`,
        html: setPasswordEmailTemplate({
          userName,
          userExist,
          resetLink,
          redirectLink,
          logoURL,
        }),
      },
    };

    console.log("Sending set password email to:", userEmail);
    await client.beginSend(emailContent);
    console.log("Set password email sent successfully");
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
    const portal = portalName !== "" ? reverseSanitizeName(portalName) : "Mstrategy";

    const resetLink = portalName !== ""
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
        html: successPortalEmailTemplate({
          userName,
          portal,
          resetLink,
          redirectLink,
          userEmail,
        }),
      },
    };

    await client.beginSend(successEmailContent);
    console.log("Success email sent");
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send success email");
  }
};

/**
 * Send welcome login email when user logs in
 */
export const sendWelcomeLoginEmail = async (
  userEmail: string,
  userName: string,
  portalId: string = "Universal Portal Demo"
): Promise<void> => {
  try {
    const portalName = portalId !== "Universal Portal Demo" ? reverseSanitizeName(portalId) : "Universal Portal";
    const currentTime = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    });

    const welcomeEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL!,
      recipients: {
        to: [{ address: userEmail }],
      },
      content: {
        subject: `Welcome back to ${portalName}! 👋`,
        html: welcomeLoginEmailTemplate({
          userName,
          userEmail,
          portalName,
          currentTime,
        }),
      },
    };

    console.log("Sending welcome login email to:", userEmail);
    await client.beginSend(welcomeEmailContent);
    console.log("Welcome login email sent successfully");
  } catch (error) {
    console.error("Error sending welcome login email:", error);
    throw new Error("Failed to send welcome login email");
  }
};
