import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const client = new EmailClient(connectionString);

function reverseSanitizeName(sanitizedName) {
  // If the sanitized name ends with a hyphen, remove it
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  // Replace hyphens with spaces
  reversedName = reversedName.replace(/-/g, " ");

  // Capitalize the first letter of each word
  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Return the reconstructed name
  return reversedName;
}

export const sendSetPasswordEmail = async (
  userEmail,
  userName,
  resetToken,
  portalName,
  userExist = false,
  from = ''
) => {
  try {
    const portal = portalName !== '' ? reverseSanitizeName(portalName) : 'Mstrategy';
    const resetLink = portalName !== '' 
      ? from === 'reset' ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}` : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}?isNew=true`
      : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}`;

    const redirectLink = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`;
    const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/MStrategy_Group.png`;

    const emailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL, // Sender email
      recipients: {
        to: [{ address: userEmail }],
      }, // Recipient email address
      content: {
        subject: `You're invited to the Universal Portal Wealth Demo!`,
        html: `
        <div><br /></div>
          <table
            cellspacing="0"
            cellpadding="0"
            style="
              background-color: #fff;
              width: 100%;
              min-width: 100%;
              padding: 40px 0;
            "
          >
            <tbody>
              <tr>
                <td align="center">
                  <div
                    style="
                      border: 1px solid rgb(238, 238, 238);
                      box-sizing: border-box;
                      margin: 0px auto;
                      max-width: 600px;
                      width: 100%;
                    "
                  >
                    <div style="padding: 40px 50px; line-height: 1.6">
                      <div style="
                        width: 150px;
                        height: 100px;
                        background-image: url(${logoURL});
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                      ">
                      </div>
                      <h1 style="font-family: Lato, Helvetica" class="align-left">
                        Welcome to Universal Portal Wealth Demo<br />
                      </h1>
                      <p
                        style="margin: 0px 0px 20px; text-align: left"
                        class="align-left"
                      >
                        <span class="colour" style="color: rgb(51, 51, 51)"
                          ><span
                            class="size"
                            style="font-size: 16px; margin: 0px 0px 20px"
                            ><b>Hi ${userName.split(" ")[0]}</b>,</span
                          ></span
                        ><br />
                      </p>
                      <p
                        style="margin: 0px 0px 20px; text-align: left"
                        class="align-left"
                      >
                        <span class="colour" style="color: rgb(51, 51, 51)"
                          ><span
                            class="size"
                            style="font-size: 16px; margin: 0px 0px 20px"
                            >Thanks for registering for the Universal Portal Wealth demo from M Strategy. Please click the link below to create a password. Once completed you will be directed to the Universal Portal Wealth Log In page. </span
                          ></span
                        ><br />
                      </p>
                      <div
                        style="
                          background-color: rgb(243, 243, 252);
                          border-radius: 8px;
                          padding: 25px;
                          margin: 30px 0;
                        "
                      >
                        <div style="margin-bottom: 20px">
                          <p
                            style="margin: 0px 0px 10px; text-align: left"
                            class="align-left"
                          >
                            <font color="#333333">
                              <span style="font-size: 15px"
                                >  ${
                                  userExist
                                    ? "You can get started using this link"
                                    : "Create password using this link"
                                } :<br /><a
                                  href="${userExist ? redirectLink : resetLink}"
                                  target="_blank"
                                  >${userExist ? redirectLink : resetLink}</a
                                ><br
                              /></span>
                            </font> 
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      style="
                        font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                        background-color: rgb(248, 249, 250);
                        text-align: center;
                        padding: 20px 50px;
                        border-top: 1px solid rgb(238, 238, 238);
                      "
                    >
                      <p
                        style="margin: 0px 0px 10px; text-align: center"
                        class="align-center"
                      >
                        <span class="colour" style=""
                          ><span
                            class="size"
                            style="
                              color: rgb(102, 102, 102);
                              font-size: 14px;
                              margin: 0px 0px 10px;
                            "
                            >M Strategy Group 2025.</span
                          ><span
                            class="size"
                            style="
                              color: rgb(102, 102, 102);
                              font-size: 14px;
                              margin: 0px 0px 10px;
                            "
                          >
                            All rights reserved.</span
                          ></span
                        ><br />
                      </p>
                      <p style="margin: 0px; text-align: center" class="align-center">
                        <span class="colour" style="color: rgb(102, 102, 102)"
                          ><span class="size" style="font-size: 14px; margin: 0px"
                            >This is an automated message, please do not reply directly to
                            this email.</span
                          ></span
                        ><br />
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <br />
          <style>
            @media screen and (max-width: 600px) {
              div[style*="max-width: 600px"] {
                width: 100% !important;
                padding: 0 !important;
              }
              div[style*="padding: 40px 50px"],
              div[style*="padding: 20px 50px"] {
                padding: 20px !important;
              }
              h1[style*="font-size: 24px"] {
                font-size: 20px !important;
              }
              .action-buttons a {
                display: block !important;
                margin: 10px 0 !important;
              }
            }
            @media screen and (min-width: 601px) {
              table[style*="width: 100%"] {
                padding: 40px !important;
              }
            }
          </style>
        <div><br /></div>
      `,
      },
    };
    await client.beginSend(emailContent);
    console.log("Set password email sent");
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send set password email");
  }
};

// export const sendSuccessPortalEmail = async (
//   userEmail,
//   userName,
//   resetToken,
//   portalName,
//   userExist = false
// ) => {
//   try {
//     const portal = portalName !== '' ? reverseSanitizeName(portalName) : 'Mstrategy';

//     const resetLink = portalName !== '' 
//       ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}`
//       : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}`;

//     const redirectLink = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`;

//     const successEmailContent = {
//       senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL, // Sender email
//       recipients: {
//         to: [{ address: userEmail }],
//       }, // Recipient email address
//       content: {
//         subject: `Your <strong>${portal}</strong> portal has been created successfully`,
//         html: `
//           <div style="background-color: #F4F4F4; padding: 40px; font-family: Arial, sans-serif;">
//             <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #E0E0E0;">
   
//               <div style="background-color: #28a745; color: white; padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
//                 <strong>Success! Your portal has been created successfully.</strong>
//               </div>

//               <div style="padding: 30px; text-align: center;">
//                 <p style="color: #333333; font-size: 16px; line-height: 1.6;">
//                   Congratulations! Your <strong>${portal}</strong> portal has been successfully created.
//                 </p>
//                 <a 
//                 href="${userExist ? redirectLink : resetLink}"
//                 target="_blank"
//                 style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;"
//                 >
//                 ${
//                   userExist
//                     ? `Visit ${portal} Portal`
//                     : "Reset your password"
//                 }
//                 </a>
//               </div>

//               <div style="padding: 20px; text-align: center; color: #888888; font-size: 12px;">
//                 <p style="margin: 0;">© 2024 ${portal} Portal. All rights reserved.</p>
//                 <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
//               </div>
//             </div>
//           </div>
//       `,
//       },
//     };

//     await client.beginSend(successEmailContent);
//     console.log("Success email sent");
//   } catch (error) {
//     console.error("Error sending email: ", error);
//     throw new Error("Failed to send success email");
//   }
// };


export const sendSuccessPortalEmail = async (
  userEmail,
  userName,
  resetToken,
  portalName,
  userExist = false
) => {
  try {
    const portal = portalName !== '' ? reverseSanitizeName(portalName) : 'Mstrategy';

    const resetLink = portalName !== '' 
      ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/setpassword/${resetToken}`
      : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/setpassword/${resetToken}`;

    const redirectLink = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalName}/login`;

    const successEmailContent = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_EMAIL, // Sender email
      recipients: {
        to: [{ address: userEmail }],
      }, // Recipient email address
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
                        We’re excited to welcome you to the <strong>${portal}</strong> Portal! Your portal has been successfully created, and you're now ready to start using it. Below are your login details and next steps to get started.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${redirectLink}" target="_blank" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 20px; font-size: 16px; border-radius: 5px; text-decoration: none; margin-right: 10px;">
                          Login to Your Portal
                        </a>
                        <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 20px; font-size: 16px; border-radius: 5px; text-decoration: none;">
                          Reset Your Password
                        </a>
                      </div>
                      <p style="color: #333333; font-size: 15px; margin-top: 20px;">
                        🔹 <strong>Note:</strong> If you have forgotten your password, you can reset it using the "Reset Your Password" link above.
                      </p>
                      <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <h2 style="color: #856404; font-size: 18px; margin-bottom: 15px;">End User Credentials</h2>
                        <p style="color: #333333; font-size: 15px;">🔹 <strong>Email:</strong>user_${userEmail}</p>
                        <p style="color: #333333; font-size: 15px;">🔹 <strong>Password:</strong>000</p>
                        <p style="color: #856404; font-size: 15px; margin-top: 10px;">
                          📝 <strong>Note:</strong> You can use these credentials to log in as a standard user in this portal.
                        </p>
                      </div>  
                    </div>
                    <div style="background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666666;">
                      <p style="margin: 0;">© 2024 ${portal} Portal. All rights reserved.</p>
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