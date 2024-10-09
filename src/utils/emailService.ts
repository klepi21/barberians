// src/utils/emailService.ts
import nodemailer from 'nodemailer';

declare module 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service
  auth: {
    user: 'Barberiansest2017@gmail.com', // Your email
    pass: 'Barberiansest2017!', // Your email password or app password
  },
});

export const sendBookingEmail = async (userEmail: string, bookingDetails: any) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: userEmail, // User's email
    cc: 'your-personal-email@example.com', // Your personal email
    subject: 'Booking Confirmation',
    text: `Your booking has been confirmed!\n\nDetails:\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\nServices: ${bookingDetails.services.join(', ')}\n\nThank you!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};