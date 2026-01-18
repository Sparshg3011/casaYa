import * as brevo from '@getbrevo/brevo';
import { config } from 'dotenv';

config();

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export async function sendWelcomeEmail(
  to: string, 
  name: string, 
  googleDriveUrl?: string
): Promise<EmailResult> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    // Temporarily use a verified email domain until rentcasaya.com is verified
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const replyToEmail = 'Yashank@rentcasaya.com';
    const downloadLink = googleDriveUrl || process.env.GOOGLE_DRIVE_DOWNLOAD_URL;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to CasaYa – Here's Your Free Guide 🎉</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to CasaYa – Here's Your Free Guide 🎉</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Hi ${name},
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Welcome to CasaYa – where finding and keeping great tenants becomes effortless.
              </p>

              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                As promised, here's your <strong>FREE guide: "10 Proven Tips to Avoid Bad Tenants"</strong>.
              </p>

              ${downloadLink ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${downloadLink}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                    📥 Download Your Guide
                  </a>
                </div>
              ` : ''}

              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px;">
                <strong>Inside, you'll discover:</strong>
              </p>
              
              <ul style="color: #4b5563; line-height: 1.6; padding-left: 0; list-style: none;">
                <li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #10b981;">✅</span>
                  How to spot red flags before signing a lease
                </li>
                <li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #10b981;">✅</span>
                  The smartest ways to verify tenant reliability
                </li>
                <li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #10b981;">✅</span>
                  Legal and fair screening practices to protect your property
                </li>
                <li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #10b981;">✅</span>
                  Pro tips landlords use to avoid costly mistakes
                </li>
              </ul>

              <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                We've built CasaYa to be your <strong>AI real estate agent for residential rentals</strong> – helping you:
              </p>

              <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Connect with verified tenants quickly</li>
                <li style="margin-bottom: 8px;">Automate listing, screening, and lease generation</li>
                <li style="margin-bottom: 8px;">Collect rent seamlessly</li>
              </ul>

              <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                <strong>Our goal?</strong> Save you time, reduce vacancy rates, and give you peace of mind.
              </p>

              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Next steps:</h3>
                <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Download your guide above.</li>
                  <li style="margin-bottom: 8px;">Keep an eye out for our <strong>Rent in Peace newsletter</strong> – packed with rental market insights, landlord tips, and updates on tools that make property management easier.</li>
                </ul>
              </div>

              <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0; font-size: 16px;">
                To your success,<br>
                <strong>Andres Parra Arze</strong><br>
                Founder & CEO, CasaYa
              </p>

              <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px; font-style: italic;">
                P.S. Got questions? Just hit reply – we read every message.
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    const textContent = `
      Welcome to CasaYa – Here's Your Free Guide 🎉

      Hi ${name},

      Welcome to CasaYa – where finding and keeping great tenants becomes effortless.

      As promised, here's your FREE guide: "10 Proven Tips to Avoid Bad Tenants".
      ${downloadLink ? `📥 Download Your Guide: ${downloadLink}` : 'Your download link will be available shortly.'}

      Inside, you'll discover:
      ✅ How to spot red flags before signing a lease
      ✅ The smartest ways to verify tenant reliability
      ✅ Legal and fair screening practices to protect your property
      ✅ Pro tips landlords use to avoid costly mistakes

      We've built CasaYa to be your AI real estate agent for residential rentals – helping you:
      • Connect with verified tenants quickly
      • Automate listing, screening, and lease generation
      • Collect rent seamlessly

      Our goal? Save you time, reduce vacancy rates, and give you peace of mind.

      Next steps:
      1. Download your guide above.
      2. Keep an eye out for our Rent in Peace newsletter – packed with rental market insights, landlord tips, and updates on tools that make property management easier.

      To your success,
      Andres Parra Arze
      Founder & CEO, CasaYa

      P.S. Got questions? Just hit reply – we read every message.
    `;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Welcome to CasaYa – Here\'s Your Free Guide 🎉';
    sendSmtpEmail.to = [{ email: to, name: name }];
    sendSmtpEmail.sender = { name: 'CasaYa Newsletter', email: fromEmail };
    sendSmtpEmail.replyTo = { name: 'CasaYa Newsletter', email: replyToEmail };
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.tags = ['newsletter-welcome'];

    console.log('Sending email to:', to);
    console.log('From email:', fromEmail);
    console.log('Email payload:', {
      subject: sendSmtpEmail.subject,
      to: sendSmtpEmail.to,
      sender: sendSmtpEmail.sender,
      replyTo: sendSmtpEmail.replyTo
    });

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Brevo response:', {
      messageId: response.body?.messageId,
      statusCode: response.response?.statusCode,
      headers: response.response?.headers
    });
    
    return {
      success: true,
      message: 'Welcome email sent successfully',
      messageId: response.body?.messageId
    };

  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.body,
      status: error.response?.status
    });
    return {
      success: false,
      message: `Failed to send email: ${error.message}`
    };
  }
}

export async function verifyEmailService(): Promise<EmailResult> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return {
        success: false,
        message: 'Brevo API key not configured'
      };
    }

    const accountApi = new brevo.AccountApi();
    accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
    await accountApi.getAccount();
    return {
      success: true,
      message: 'Email service is ready'
    };
  } catch (error: any) {
    console.error('Email service verification failed:', error);
    return {
      success: false,
      message: `Email service error: ${error.message}`
    };
  }
}
