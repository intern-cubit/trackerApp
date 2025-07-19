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
