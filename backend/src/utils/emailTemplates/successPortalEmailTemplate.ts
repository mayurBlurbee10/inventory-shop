export const successPortalEmailTemplate = ({
  userName,
  portal,
  resetLink,
  redirectLink,
  userEmail,
}: {
  userName: string;
  portal: string;
  resetLink: string;
  redirectLink: string;
  userEmail: string;
}): string => `
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
      `;
