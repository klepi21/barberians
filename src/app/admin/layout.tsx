'use client';

import { ReactNode, useState } from 'react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const menuItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/hours", label: "Working Hours" },
    { href: "/admin/new-booking", label: "New Booking" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-black p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">BARBERIANS Admin</h1>
          <div className="hidden md:flex space-x-4">
            {menuItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" className="text-white hover:text-orange-500 hover:bg-gray-800 font-bold">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
          <Button className="md:hidden text-white hover:text-orange-500" variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 p-4 animate-in slide-in-from-top-5">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" onClick={toggleMenu} className="text-white hover:text-orange-500 hover:bg-gray-700 font-bold justify-start">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      )}
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  )
}