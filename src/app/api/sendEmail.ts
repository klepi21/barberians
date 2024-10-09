   // src/pages/api/sendEmail.ts
   import type { NextApiRequest, NextApiResponse } from 'next';
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS,
     },
   });

   const sendEmail = async (req: NextApiRequest, res: NextApiResponse) => {
     if (req.method === 'POST') {
       const { userEmail, bookingDetails } = req.body;

       console.log('Sending email to:', userEmail); // Log the email address
       const mailOptions = {
         from: process.env.EMAIL_USER,
         to: userEmail,
         cc: process.env.PERSONAL_EMAIL, // Add your personal email here
         subject: 'Booking Confirmation',
         text: `Your booking has been confirmed!\n\nDetails:\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\nServices: ${bookingDetails.services.join(', ')}\n\nThank you!`,
       };

       try {
         await transporter.sendMail(mailOptions);
         console.log('Email sent successfully'); // Log success
         return res.status(200).json({ message: 'Email sent successfully' });
       } catch (error) {
         console.error('Error sending email:', error); // Log error
         return res.status(500).json({ error: 'Error sending email' });
       }
     } else {
       res.setHeader('Allow', ['POST']);
       return res.status(405).end(`Method ${req.method} Not Allowed`);
     }
   };

   export default sendEmail;