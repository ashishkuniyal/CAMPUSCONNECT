import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}
});


export default async function sendEmail(to, subject, html){
await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
}