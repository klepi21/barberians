   // src/app/api/sendEmail/route.ts
   import { NextResponse } from 'next/server';
   // import nodemailer from 'nodemailer'; // Remove this line
   import sgMail from '@sendgrid/mail'; // Add SendGrid import

   const apiKey = process.env.SENDGRID_API_KEY;
   if (!apiKey) {
       throw new Error("SENDGRID_API_KEY is not defined");
   }
   sgMail.setApiKey(apiKey); // Set SendGrid API key

   export async function POST(req: Request) {
     try {
       const { userEmail, bookingDetails } = await req.json();

       const msg = {
         to: userEmail,
         from: process.env.EMAIL_USER || 'default@example.com', // Ensure 'from' is always a valid email
         cc: process.env.PERSONAL_EMAIL, // Your personal email
         subject: 'Booking Confirmation',
         text: `Your booking has been confirmed!\n\nDetails:\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\nServices: ${bookingDetails.services.join(', ')}\n\nThank you!`,
       };

       await sgMail.send(msg); // Use SendGrid to send the email
       return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
     } catch (error: unknown) {
       const errorMessage = (error as Error).message || 'Unknown error'; // Type assertion to Error
       console.error('Error sending email:', (error as any).response ? (error as any).response.body : error); // Log detailed error response
       return NextResponse.json({ error: 'Error sending email', details: errorMessage }, { status: 500 });
     }
   }