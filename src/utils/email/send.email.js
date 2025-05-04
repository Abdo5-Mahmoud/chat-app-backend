import nodemailer from "nodemailer";

export const sendEmail = async ({
  to = "",
  cc = "",
  bcc = "",
  html = "",
  text = "",
  subject = "social app",
  attachments = [],
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // async..await is not allowed in global scope, must use a wrapper
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"A5-ChatApp" <${process.env.EMAIL_USER}>`, // sender
    to,
    cc,
    bcc,
    html,
    text,
    subject,
    attachments,
  });

  // console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
};
