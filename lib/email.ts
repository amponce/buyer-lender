import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // Replace with your SMTP server
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'your-email@example.com', // Replace with your SMTP username
    pass: 'your-email-password', // Replace with your SMTP password
  },
});

// Function to send an email
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string; }) {
  try {
    const info = await transporter.sendMail({
      from: 'your-email@example.com', // Replace with your email address
      to,
      subject,
      text,
    });
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
} 