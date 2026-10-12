import { resend, transporter } from "../lib/email.js";

type MailOptions = { to: string; subject: string; html: string };

// SMTP (Nodemailer) is used when configured; Resend is only a fallback
function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export class EmailService {
  //   SEND EMAIL - SMTP NODEMAILER
  private async sendWithSmtp(options: MailOptions) {
    console.log(`[Email Service] [SMTP] Sending "${options.subject}" to ${options.to}`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Shop App" <${process.env.SMTP_USER}>`,
      ...options,
    });
    console.log(`[Email Service] [SMTP] Email sent successfully to ${options.to}: ${info.messageId}`);
  }

  //   SEND EMAIL - RESEND
  private async sendWithResend(options: MailOptions) {
    console.log(
      `[Email Service] [Resend] Sending "${options.subject}" to ${options.to} (API key set: ${!!process.env.RESEND_API_KEY})`
    );
    const { data, error } = await resend.emails.send({
      // Must be on a domain verified in Resend; onboarding@resend.dev only delivers to the account owner's email
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      ...options,
    });
    if (error) {
      console.error(`[Email Service] [Resend] API error:`, error);
      throw new Error(`failed to send Email with resend: ${error.message}`);
    }
    console.log(`[Email Service] [Resend] Email sent successfully to ${options.to} ${data.id}`);
  }

  /** Returns true when the email was handed to the provider. */
  private async sendMail(options: MailOptions) {
    try {
      if (smtpConfigured()) {
        await this.sendWithSmtp(options);
      } else {
        await this.sendWithResend(options);
      }
      return true;
    } catch (error) {
      console.error(`[Email Service Error] Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, name: string, url: string) {
    return this.sendMail({
      to: email,
      subject: "Verify your email address",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 16px;">Verify your Email Address</h2>
                    <p style="color: #555; line-height: 1.5;">Hi ${
                      name || "there"
                    },</p>
                    <p style="color: #555; line-height: 1.5;">Thank you for signing up for Shop App. Please click the button below to verify your email address and activate your account: (Valid for 15 Minutes)</p>
                    <div style="margin: 24px 0;">
                        <a href="${url}" style="background-color: #09090b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p style="color: #777; font-size: 14px; line-height: 1.5;">If the button doesn't work, copy and paste the following link into your browser:</p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all;"><a href="${url}" style="color: #3b82f6;">${url}</a></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 12px;">If you did not request this email, please ignore it.</p>
                </div>
            `,
    });
  }

  async sendResetPasswordEmail(email: string, name: string, url: string) {
    return this.sendMail({
      to: email,
      subject: "Reset your password",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 16px;">Reset Your Password</h2>
                    <p style="color: #555; line-height: 1.5;">Hi ${
                      name || "there"
                    },</p>
                    <p style="color: #555; line-height: 1.5;">We received a request to reset your account password. Click the button below to set a new password:</p>
                    <div style="margin: 24px 0;">
                        <a href="${url}" style="background-color: #09090b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #777; font-size: 14px; line-height: 1.5;">If the button doesn't work, copy and paste the following link into your browser:</p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all;"><a href="${url}" style="color: #3b82f6;">${url}</a></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
                </div>
            `,
    });
  }

  async sendStaffInvitationEmail(args: {
    email: string;
    name: string;
    shopName: string;
    roleLabel: string;
    inviterName: string;
    url: string;
    expiresInDays: number;
  }) {
    const { email, name, shopName, roleLabel, inviterName, url, expiresInDays } = args;
    return this.sendMail({
      to: email,
      subject: `You're invited to join ${shopName}`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 16px;">Join ${shopName}</h2>
                    <p style="color: #555; line-height: 1.5;">Hi ${name || "there"},</p>
                    <p style="color: #555; line-height: 1.5;">${inviterName} has invited you to join <strong>${shopName}</strong> as <strong>${roleLabel}</strong>. Click the button below to accept the invitation:</p>
                    <div style="margin: 24px 0;">
                        <a href="${url}" style="background-color: #09090b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Accept Invitation</a>
                    </div>
                    <p style="color: #777; font-size: 14px; line-height: 1.5;">If the button doesn't work, copy and paste the following link into your browser:</p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all;"><a href="${url}" style="color: #3b82f6;">${url}</a></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 12px;">This invitation expires in ${expiresInDays} days. If you weren't expecting it, you can ignore this email.</p>
                </div>
            `,
    });
  }
}

export const emailService = new EmailService();
