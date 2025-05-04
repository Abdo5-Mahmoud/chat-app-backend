import { customAlphabet } from "nanoid";
import { EventEmitter } from "node:events";
import { generateHash } from "../security/hash.security.js";
import { sendEmail } from "../email/send.email.js";
import { userModel } from "../../DB/models/User.model.js";
import * as dbServices from "../../DB/db.service.js";
import {
  verifyAccountTempl,
  ViewUsers,
} from "../email/template/verifyAccount.temp.js";

export const otpTypesInDb = {
  confirmEmail: "confirmEmailOtp",
  forgetPassword: "forgetPasswordOtp",
  twoStepVerification: "twoStepVerificationOtp",
};

const sendMail = async ({ emailData, subject }) => {
  const { email } = emailData;
  const otp = customAlphabet("1234567890", 4)();
  const hashOtp = generateHash({ plaintText: otp });
  const user = await dbServices.findOne({
    model: userModel,
    filter: { email },
  });
  let dataUpdate = "";

  switch (subject) {
    case "confirmEmail":
      dataUpdate = { confirmEmailOtp: hashOtp };
      break;
    case "forgetPassword":
      dataUpdate = { forgetPasswordOtp: hashOtp };
      break;
    case "twoStepVerification":
      dataUpdate = { twoStepVerificationOtp: hashOtp };
      break;
    default:
      break;
  }
  await dbServices.updateOne({
    model: userModel,
    filter: { email },
    data: {
      $set: {
        ...dataUpdate,
        otpExp: Date.now() + 1000 * 60 * 5,
        otpCounter:
          user.otpCounter >= 5
            ? 1
            : user.otpCounter > 0
            ? user.otpCounter + 1
            : 1,
        otpTimer: user.otpCounter > 4 ? Date.now() + 1000 * 60 * 5 : Date.now(),
      },
    },
  });

  const html = verifyAccountTempl({ otp, subject });
  await sendEmail({
    to: email,
    subject,
    html,
  });
};

export const emailEvent = new EventEmitter();

emailEvent.on("sendConfirmEmail", async (emailData) => {
  // console.log("email sent");
  sendMail({ emailData, subject: "confirmEmail" });
});

emailEvent.on("forgetPassword", async (emailData) => {
  sendMail({ emailData, subject: "forgetPassword" });
});
emailEvent.on("twoStepVerification", async (emailData) => {
  sendMail({ emailData, subject: "twoStepVerification" });
});

export const sendViewdProfileMessage = new EventEmitter();
sendViewdProfileMessage.on("send email", async (emailData) => {
  const { user, userViewrs, username } = emailData;
  const email = user.email;
  const subject = `Profile Viewed`;

  const lists = `<h3>Your profile has been viewed ${
    userViewrs.count
  } times from </h3>
  <li>${username} at ${userViewrs.time.map((time) => new Date(time))}
    </li>
  `;
  const html = ViewUsers(lists);

  await sendEmail({ to: email, subject, html });
});
