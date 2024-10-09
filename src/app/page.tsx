'use client';

import BookingApp from './components/BookingApp'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-gray-300">
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 max-w-screen-sm mx-auto bg-black">
        <BookingApp />
      </main>
      {/* Add media query for smaller devices */}
      <style jsx>{`
        @media (max-width: 375px) { /* Adjust the max-width as needed */
          main {
           
            max-width: 85%; /* Limit the width for smaller screens */
          }
        }
      `}</style>
    </div>
  )
}