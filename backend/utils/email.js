const nodemailer = require('nodemailer');

// Create a transporter — uses Ethereal (free test email) by default
// For production, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use Ethereal free test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Using Ethereal test email. Preview URLs will be logged.');
  }

  return transporter;
}

async function sendResolutionEmail(complaint, areaResidents) {
  try {
    const transport = await getTransporter();

    const recipients = areaResidents
      .filter(r => r.email)
      .map(r => r.email);

    if (recipients.length === 0) {
      console.log('No residents to notify for area:', complaint.location?.area);
      return;
    }

    const info = await transport.sendMail({
      from: '"Urban Tracker Ratnagiri" <notifications@urbantracker.gov.in>',
      to: recipients.join(', '),
      subject: `✅ Complaint Resolved: ${complaint.title}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0e1a; color: #f1f5f9; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; margin: 0;">Urban Tracker</h1>
            <p style="color: #94a3b8; font-size: 13px;">Ratnagiri Municipal Hub</p>
          </div>
          
          <div style="background: #151c2c; padding: 20px; border-radius: 10px; margin-bottom: 16px;">
            <h2 style="color: #10b981; margin: 0 0 12px;">Complaint Resolved ✅</h2>
            <p style="margin: 0 0 8px;"><strong>Title:</strong> ${complaint.title}</p>
            <p style="margin: 0 0 8px;"><strong>Type:</strong> ${complaint.type}</p>
            <p style="margin: 0 0 8px;"><strong>Area:</strong> ${complaint.location?.area || 'N/A'}</p>
            <p style="margin: 0 0 8px;"><strong>Description:</strong> ${complaint.description}</p>
            ${complaint.resolvedAt ? `<p style="margin: 0;"><strong>Resolved:</strong> ${new Date(complaint.resolvedAt).toLocaleString()}</p>` : ''}
          </div>
          
          <div style="background: #151c2c; padding: 20px; border-radius: 10px; margin-bottom: 16px;">
            <p style="color: #94a3b8; font-size: 13px;">
              We value your feedback! Please log in to <strong>Urban Tracker</strong> to rate the work done and help us improve our municipal services.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 11px; text-align: center;">
            This is an automated notification from Ratnagiri Municipal Corporation.
          </p>
        </div>
      `,
    });

    console.log('Resolution email sent:', info.messageId);

    // Log Ethereal preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email at:', previewUrl);
    }

    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failure shouldn't block the resolution
  }
}

module.exports = { sendResolutionEmail };
