const contactUsContent = (senderName, senderEmail, query, senderMobile) => {
  return `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #333;">Hello, admin</h2>
                <h1 style="color: #007bff;">Name: ${senderName}</h1>
                <p>Email of the user is ${senderEmail}</p>
                <p>Mobile of the user is  ${senderMobile}</p>
                <p>Message:</p>
                <p>${query}</p>
                <br>
                <p>Best regards,</p>
                <p>Team ....</p>
            </div>
        `;
};
const otpContent = (otp) => {
  return `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #333;">Hello,</h2>
                <p>Thank you for using ${process.env.APP_NAME}. Your OTP code is:</p>
                <h1 style="color: #007bff;">${otp}</h1>
                <p>This OTP code is valid for 5 minutes. Please do not share this code with anyone.</p>
                <p>If you did not request this OTP, please ignore this email.</p>
                <br>
                <p>Best regards,</p>
                <p>Team unfazed</p>
            </div>
        `;
};

function getPropertyQueryTemplate(
  senderName,
  senderEmail,
  senderMobile,
  query,
  propertyName,
) {
  return `
      <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #0078d7; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Property Query</h1>
        </div>
        <div style="padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <p>Dear Dealer,</p>
          <p>You have received a new query regarding one of your properties. Below are the details of the inquiry:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">Sender Name:</td>
              <td style="padding: 8px;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;">${senderEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Mobile:</td>
              <td style="padding: 8px;">${senderMobile}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Query:</td>
              <td style="padding: 8px;">${query}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Property Title:</td>
              <td style="padding: 8px;">${propertyName}</td>
            </tr>
          </table>
          <p>Please respond to the query at your earliest convenience.</p>
          <p>Thank you!</p>
          <p><strong>Best Regards,</strong><br>team Makaan</p>
        </div>
        <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
          <p>
            If you have any questions, please contact us at
            <a href="mailto:support@example.com" style="color: #0078d7; text-decoration: none;">support@example.com</a>
          </p>
          <p>&copy; 2024 Makaan. All Rights Reserved.</p>
        </div>
      </div>
    `;
}

export { contactUsContent, otpContent, getPropertyQueryTemplate };
