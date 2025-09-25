// const nodemailer = require("nodemailer");
import nodemailer from "nodemailer";
import fs from "fs";
// import jwt from "jsonwebtoken";

export default async function sendMail(to_email, token) {
  try {

    console.log("Send mail called");

    // const SECRET_KEY = process.env.SECRET_KEY; 

    // const token = jwt.sign({ email: to_email }, SECRET_KEY, { expiresIn: "15m" });
    
    // const resetLink = `https://sapui5-dist.onrender.com/ResetPassword?token=${token}`;
    const resetLink = `https://skilltrials.com/#/ResetPassword/${token}`;

    const htmlTemplate = fs
      .readFileSync("forgotpassword.html", "utf8")
      .replace("{{reset_link}}", resetLink);

    const transporter = nodemailer.createTransport({
      secure: false,
      //host: "smtp.gmail.com",
      host: "smtp.zoho.in",
      port: 587,
      // port: "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to_email,
      subject: "Hello from skilltrials",
    //   text: "This works on Render!",
      html: htmlTemplate,
    });
    console.log("✅ Email sent");
  } catch (err) {
    console.error("Error:", err);
  }
}
