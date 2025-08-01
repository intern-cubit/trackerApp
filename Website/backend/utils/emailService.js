import nodemailer from "nodemailer";

export const sendResetEmail = async (to, token) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const resetLink = `https://cubit2k25.vercel.app/reset-password/${token}`;

    const htmlContent = `
    <html>
      <head>
        <style>
            *{
            color: #D1D5DB; /* Tailwind gray-100 */
            }
          body {
            background-color: #1F2937; /* Tailwind gray-800 */
            color: #D1D5DB; /* Tailwind gray-100 */
            font-family: sans-serif;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 100%;
            padding: 20px;
            color: #D1D5DB;
          }
          .email-box {
            background-color: #374151; /* Tailwind gray-700 */
            border-radius: 8px;
            overflow: hidden;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            color: #D1D5DB;
          }
          .header {
            background-color: #4B5563; /* Tailwind gray-600 */
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #D1D5DB;
          }
          .content {
            padding: 30px;
            text-align: center;
            color: #D1D5DB;
          }
          .content h2 {
            margin-bottom: 10px;
            color: #D1D5DB;
          }
          .content p {
            line-height: 1.6;
            font-size: 16px;
            color: #D1D5DB;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #7C3AED; /* Tailwind purple-700 */
            text-decoration: none;
            color: #FFFFFF; /* Tailwind white */
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            background-color: #4B5563;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #D1D5DB; /* Tailwind gray-300 */
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-box">
            <div class="header">
              CuBIT
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>
                We received a request to reset your password. Click the button below to reset your password.
              </p>
              <a class="button" href="${resetLink}" style="color: white">Reset Password</a>
              <p style="margin-top: 20px;">
                If you did not request a password reset, please ignore this email.
              </p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} CuBIT. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: "CuBIT Password Reset Request",
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

export const sendSecurityAlert = async (alertData) => {
    try {
        let transporter = nodemailer.createTransporter({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const {
            deviceId,
            deviceName,
            userEmail,
            userName,
            alertType,
            severity,
            timestamp,
            details
        } = alertData;

        // Create severity-based styling
        const severityColors = {
            LOW: '#10B981', // green
            MEDIUM: '#F59E0B', // yellow
            HIGH: '#EF4444', // red
            CRITICAL: '#DC2626' // dark red
        };

        const severityColor = severityColors[severity] || '#6B7280';

        const htmlContent = `
        <html>
          <head>
            <style>
                * {
                    color: #D1D5DB;
                }
                body {
                    background-color: #1F2937;
                    color: #D1D5DB;
                    font-family: sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    padding: 20px;
                    color: #D1D5DB;
                }
                .email-box {
                    background-color: #374151;
                    border-radius: 8px;
                    overflow: hidden;
                    max-width: 600px;
                    margin: 0 auto;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    color: #D1D5DB;
                }
                .header {
                    background-color: ${severityColor};
                    padding: 20px;
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #FFFFFF;
                }
                .severity-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    background-color: ${severityColor};
                    color: #FFFFFF;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .content {
                    padding: 30px;
                    color: #D1D5DB;
                }
                .alert-details {
                    background-color: #4B5563;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    padding: 8px 0;
                    border-bottom: 1px solid #6B7280;
                }
                .detail-label {
                    font-weight: bold;
                    color: #F3F4F6;
                }
                .detail-value {
                    color: #D1D5DB;
                }
                .footer {
                    background-color: #4B5563;
                    padding: 15px;
                    text-align: center;
                    font-size: 14px;
                    color: #D1D5DB;
                }
                .urgent {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="email-box">
                <div class="header ${severity === 'CRITICAL' ? 'urgent' : ''}">
                    🚨 Security Alert
                </div>
                <div class="content">
                  <div class="severity-badge">${severity} ALERT</div>
                  <h2>Security Event Detected</h2>
                  <p>Hello ${userName},</p>
                  <p>A security event has been detected on your device <strong>${deviceName}</strong>.</p>
                  
                  <div class="alert-details">
                    <div class="detail-row">
                      <span class="detail-label">Alert Type:</span>
                      <span class="detail-value">${alertType}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Device:</span>
                      <span class="detail-value">${deviceName} (${deviceId})</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Severity:</span>
                      <span class="detail-value">${severity}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Timestamp:</span>
                      <span class="detail-value">${timestamp}</span>
                    </div>
                    ${details ? Object.entries(details).map(([key, value]) => 
                        `<div class="detail-row">
                           <span class="detail-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                           <span class="detail-value">${value}</span>
                         </div>`
                    ).join('') : ''}
                  </div>
                  
                  <p><strong>Recommended Actions:</strong></p>
                  <ul>
                    <li>Log into your dashboard to review the incident</li>
                    <li>Check your device's current status and location</li>
                    <li>Contact support if you need assistance</li>
                    ${severity === 'CRITICAL' ? '<li><strong>Take immediate action - this is a critical security event</strong></li>' : ''}
                  </ul>
                  
                  <p>If you did not expect this alert, please contact support immediately.</p>
                </div>
                <div class="footer">
                  &copy; ${new Date().getFullYear()} CuBIT Tracker Security System. All rights reserved.
                </div>
              </div>
            </div>
          </body>
        </html>
        `;

        const subject = `${severity} Security Alert - ${alertType} - ${deviceName}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: subject,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Security alert email sent to ${userEmail} for ${alertType}`);
        
    } catch (error) {
        console.error("Error sending security alert email:", error);
        throw error;
    }
};
