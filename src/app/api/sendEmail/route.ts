   // src/app/api/sendEmail/route.ts
   import { NextResponse } from 'next/server';
   import nodemailer from 'nodemailer'; // Import Nodemailer
   import fs from 'fs';
   import path from 'path';

   export async function POST(req: Request) {
     try {
       const { userEmail, bookingDetails } = await req.json();

       // Validate input
       if (!userEmail || !bookingDetails) {
           return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
       }

       // Read the HTML template
       const templatePath = path.join(process.cwd(), 'src', 'app', 'api', 'sendEmail', 'templates', 'bookingConfirmation.html');
       let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

       // Replace placeholders with actual values
       htmlTemplate = htmlTemplate
           .replace(/{{fullName}}/g, bookingDetails.fullName) // Use regex to replace all instances
           .replace(/{{phoneNumber}}/g, bookingDetails.phoneNumber)
           .replace(/{{date}}/g, bookingDetails.date)
           .replace(/{{time}}/g, bookingDetails.time)
           .replace(/{{services}}/g, bookingDetails.services);

       // Create a transporter using your domain email
       const transporter = nodemailer.createTransport({
           host: 'smtp.zoho.eu', // Your SMTP server
           port: 587, // Common port for SMTP
           secure: false, // Use true for port 465, false for other ports
           auth: {
               user: 'barberian@resvly.gr', // Your domain email
               pass: 'w%ol3mYm', // Your email password
           },
       });

       // Set up email data
       const mailOptions = {
           from: 'barberian@resvly.gr', // Sender address
           to: userEmail, // List of receivers
           subject: 'Booking Confirmation', // Subject line
           html: htmlTemplate, // Use the HTML template
       };

       // Send email
       const info = await transporter.sendMail(mailOptions);

       return NextResponse.json({ message: 'Email sent successfully', info }, { status: 200 });
     } catch (error) {
       console.error('Error sending email:', error);
       return NextResponse.json({ error: 'Error sending email', details: (error as Error).message }, { status: 500 });
     }
   }