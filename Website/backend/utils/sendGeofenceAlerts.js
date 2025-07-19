import nodemailer from "nodemailer";

export const sendGeofenceAlert = async (
    to,
    date,
    time,
    vehicleName,
    deviceId,
    vehicleNumber,
    speed
) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const htmlContent = `
    <html>
  <head>
    <style>
      * {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      body {
        background-color: #171717;
        color: #E5E7EB;
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        padding: 20px;
      }
      .email-box {
        background-color: #1F1F1F;
        border: 1px solid #2D2D2D;
        border-radius: 8px;
        overflow: hidden;
        max-width: 600px;
        margin: 0 auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      .header {
        background-color: #161616;
        padding: 16px;
        text-align: left;
        font-size: 24px;
        font-weight: bold;
        color: #FFFFFF;
        letter-spacing: 1px;
        border-bottom: 1px solid #333;
      }
      .content {
        padding: 24px;
      }
      .alert-title {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        font-size: 20px;
        color: #A78BFA;
      }
      .alert-title .icon {
        color: #FCD34D;
        margin-right: 10px;
        font-size: 22px;
      }
      .alert-box {
        background-color: #2C2C2C;
        border-left: 4px solid #EF4444;
        margin: 15px 0;
        padding: 12px 15px;
        border-radius: 4px;
      }
      .vehicle-info {
        margin-top: 20px;
        background-color: #262626;
        border-radius: 4px;
        padding: 15px;
      }
      .vehicle-info p {
        margin: 10px 0;
        display: flex;
        justify-content: space-between;
      }
      .vehicle-info .label {
        color: #9CA3AF;
        font-weight: 500;
      }
      .vehicle-info .value {
        color: #E5E7EB;
        font-weight: 400;
      }
      .button {
        display: block;
        margin: 25px auto;
        padding: 12px 24px;
        background-color: #7E22CE;
        text-decoration: none;
        color: #FFFFFF;
        border-radius: 4px;
        font-weight: 500;
        text-align: center;
        width: 60%;
        transition: all 0.3s ease;
      }
      .button:hover {
        background-color: #6B21A8;
      }
      .footer {
        background-color: #161616;
        padding: 12px;
        text-align: center;
        font-size: 12px;
        color: #6B7280;
        border-top: 1px solid #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="email-box">
        <div class="header">
          TrackLink
        </div>
        <div class="content">
          <div class="alert-title">
            <span class="icon">⚠️</span> Geofence Alert
          </div>
          
          <div class="alert-box">
            <p style="color: white;">Your vehicle <strong>${vehicleName}</strong> has crossed outside the geofence boundary.</p>
          </div>
          
          <div class="vehicle-info">
            <p>
              <span class="label">Date:</span>
              <span class="value"> ${date}</span>
            </p>
            <p>
              <span class="label">Time:</span>
              <span class="value"> ${time}</span>
            </p>
            <p>
              <span class="label">Vehicle:</span>
              <span class="value"> ${vehicleName}</span>
            </p>
            ${
                vehicleNumber
                    ? `
            <p>
              <span class="label">Number:</span>
              <span class="value"> ${vehicleNumber}</span>
            </p>
            `
                    : ""
            }
            <p>
              <span class="label">Device ID:</span>
              <span class="value"> ${deviceId}</span>
            </p>
            <p>
              <span class="label">Status:</span>
              <span class="value"> Outside Geofence</span>
            </p>
            ${
                speed
                    ? `
            <p>
              <span class="label">Speed:</span>
              <span class="value"> ${speed} km/h</span>
            </p>
            `
                    : ""
            }
          </div>
          
          <a class="button" style="color:white;" href="https://tracelink.obzentechnolabs.com/dashboard">View Location</a>
          
          <p style="text-align: center; margin-top: 15px; color: #9CA3AF; font-size: 14px;">
            Please check your TrackLink dashboard for more details and current location.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} TrackLink. All rights reserved.
        </div>
      </div>
    </div>
  </body>
</html>
  `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `TrackLink Alert: ${vehicleName} Has Crossed Geofence`,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Geofence alert email sent");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
