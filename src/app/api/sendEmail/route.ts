   // src/app/api/sendEmail/route.ts
   import { NextResponse } from 'next/server';
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS,
     },
   });

   export async function POST(req: Request) {
     const { userEmail, bookingDetails } = await req.json();

     const mailOptions = {
       from: process.env.EMAIL_USER,
       to: userEmail,
       cc: process.env.PERSONAL_EMAIL, // Your personal email
       subject: 'Booking Confirmation',
       text: `Your booking has been confirmed!\n\nDetails:\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\nServices: ${bookingDetails.services.join(', ')}\n\nThank you!`,
     };

     try {
       await transporter.sendMail(mailOptions);
       return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
     } catch (error) {
       console.error('Error sending email:', error);
       return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
     }
   }