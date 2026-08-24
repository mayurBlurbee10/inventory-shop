export const welcomeLoginEmailTemplate = ({
  userName,
  userEmail,
  portalName,
  currentTime,
}: {
  userName: string;
  userEmail: string;
  portalName: string;
  currentTime: string;
}): string => `
          <table cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; width: 100%; min-width: 100%; padding: 40px 0;">
            <tbody>
              <tr>
                <td align="center">
                  <div style="border: 1px solid #eeeeee; box-sizing: border-box; margin: 0 auto; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                      <h1 style="margin: 0; font-size: 28px; font-family: Lato, Helvetica, Arial, sans-serif;">Welcome Back! 👋</h1>
                    </div>
                    <div style="padding: 40px 50px; line-height: 1.8; text-align: left;">
                      <p style="color: #333333; font-size: 16px; margin-bottom: 15px;">
                        <strong>Hi ${userName.split(" ")[0]},</strong>
                      </p>
                      <p style="color: #555555; font-size: 15px; margin-bottom: 20px;">
                        We're happy to see you again! You've just logged in to your <strong>${portalName}</strong> portal. Your account is secure and active.
                      </p>
                      <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 5px; margin: 25px 0;">
                        <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">
                          <strong>Login Details:</strong>
                        </p>
                        <p style="color: #555555; font-size: 14px; margin: 5px 0;">
                          📧 <strong>Email:</strong> ${userEmail}
                        </p>
                        <p style="color: #555555; font-size: 14px; margin: 5px 0;">
                          🕐 <strong>Login Time:</strong> ${currentTime}
                        </p>
                        <p style="color: #555555; font-size: 14px; margin: 5px 0;">
                          🔐 <strong>Portal:</strong> ${portalName}
                        </p>
                      </div>
                      <p style="color: #666666; font-size: 14px; margin: 20px 0;">
                        If this login was not authorized by you, please change your password immediately or contact our support team.
                      </p>
                    </div>
                    <div style="background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #eeeeee; font-size: 13px; color: #666666;">
                      <p style="margin: 0;">© 2024 ${portalName}. All rights reserved.</p>
                      <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply directly to this email.</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        `;
