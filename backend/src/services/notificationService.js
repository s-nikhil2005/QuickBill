const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// SEND WHATSAPP
exports.sendWhatsApp = async (phone, message) => {
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+91${phone}`,
      body: message
    });

    return { success: true, id: response.sid };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// SEND SMS
exports.sendSMS = async (phone, message) => {
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_SMS_NUMBER,
      to: `+91${phone}`,
      body: message
    });

    return { success: true, id: response.sid };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
