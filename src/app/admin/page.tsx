'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { Calendar, Clock, PlusCircle, Settings, User, Bell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from "@/components/ui/use-toast"

type Booking = {
  id: number
  date: string
  time: string
  service: string
  fullname: string
}

const PIN = '1234'  // Replace with your desired PIN

export default function ProtectedAdminDashboard() {
  const [pinInput, setPinInput] = useState<string[]>([]); // Change to store individual pin inputs
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPinInput, setShowPinInput] = useState(true)

  const [totalBookings, setTotalBookings] = useState(0)
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newBookings, setNewBookings] = useState<Booking[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('adminAuthenticated')
    if (storedAuth === 'true') {
      setIsAuthenticated(true)
      setShowPinInput(false)
      fetchDashboardData()
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData()
      const subscription = supabase
        .channel('bookings')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookings' },
          (payload) => {
            handleNewBooking(payload.new as Booking);
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [isAuthenticated])

  const handlePinButtonClick = (number: string) => {
    if (pinInput.length < 4) { // Limit to 4 digits
      setPinInput(prev => [...prev, number]);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pinInput.join(''); // Join the array to form the PIN
    if (enteredPin === PIN) {
      setIsAuthenticated(true)
      setShowPinInput(false)
      sessionStorage.setItem('adminAuthenticated', 'true')
      fetchDashboardData()
    } else {
      alert('Incorrect PIN. Please try again.');
      setPinInput([]);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { count: total } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    const { data: todayData, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', today)
      .order('time')

    if (error) {
      console.error('Σφάλμα κατά τη λήψη των κρατήσεων:', error)
    } else {
      setTotalBookings(total || 0)
      setTodayBookings(todayData as Booking[] || [])
    }
    setIsLoading(false)
  }

  const handleNewBooking = (newBooking: Booking) => {
    console.log('Λήφθηκε νέα κράτηση:', newBooking)
    setNewBookings(prev => [...prev, newBooking])
    setTotalBookings(prev => prev + 1)
    if (newBooking.date === new Date().toISOString().split('T')[0]) {
      setTodayBookings(prev => [...prev, newBooking].sort((a, b) => a.time.localeCompare(b.time)))
    }
    playNotificationSound()
    toast({
      title: "Νέα Κράτηση",
      description: `Ο/Η ${newBooking.fullname} έκανε κράτηση για ${newBooking.service} στις ${newBooking.time}`,
    })
  }

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.error('Σφάλμα κατά την αναπαραγωγή ήχου:', error));
    }
  }

  const renderCalendar = () => {
    const bookingsByHour: { [key: string]: Booking[] } = {}

    todayBookings.forEach(booking => {
      const hour = booking.time.split(':')[0]
      if (!bookingsByHour[hour]) {
        bookingsByHour[hour] = []
      }
      bookingsByHour[hour].push(booking)
    })

    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Πρόγραμμα Σήμερα</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(bookingsByHour).map(([hour, bookings]) => (
            <Card key={hour} className="bg-gray-700 border-none">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{hour}:00</h3>
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-600 rounded p-2 mb-2">
                    <p className="text-white"><User className="inline-block mr-2 text-orange-500" />{booking.fullname}</p>
                    <p className="text-gray-300"><Clock className="inline-block mr-2 text-orange-500" />{booking.time}</p>
                    <p className="text-gray-300"><PlusCircle className="inline-block mr-2 text-orange-500" />{booking.service}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (showPinInput) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="w-full max-w-md bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-white text-center">Admin Authentication</h1>
            <div className="mb-4 text-white text-center">
              {pinInput.join(' ')} {/* Display the entered PIN */}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button key={num} onClick={() => handlePinButtonClick(num.toString())} className="bg-gray-700 text-white">
                  {num}
                </Button>
              ))}
              <Button onClick={() => handlePinButtonClick('0')} className="bg-gray-700 text-white col-span-3">
                0
              </Button>
            </div>
            <Button onClick={handlePinSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-orange-500 text-2xl">Φόρτωση δεδομένων πίνακα ελέγχου...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Πίνακας Ελέγχου Διαχειριστή</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Σύνολο Κρατήσεων</span>
            </div>
            <div className="text-4xl font-bold text-white mb-4">{totalBookings}</div>
            <Button asChild variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none">
              <Link href="/admin/bookings">Προβολή Όλων των Κρατήσεων</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Σημερινές Κρατήσεις</span>
            </div>
            <div className="text-4xl font-bold text-white mb-4">{todayBookings.length}</div>
            <Button asChild variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none">
              <Link href="/admin/bookings">Προβολή Σημερινών Κρατήσεων</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <PlusCircle className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Νέα Κράτηση</span>
            </div>
            <div className="text-lg text-gray-300 mb-4">Δημιουργία νέας κράτησης γρήγορα</div>
            <Button asChild variant="outline" className="w-full bg-orange-500 hover:bg-orange-600 text-white border-none">
              <Link href="/admin/new-booking">Προσθήκη Νέας Κράτησης</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Settings className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Διαχείριση Ωρών</span>
            </div>
            <div className="text-lg text-gray-300 mb-4">Ενημέρωση ωρών εργασίας</div>
            <Button asChild variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none">
              <Link href="/admin/hours">Διαχείριση Ωρών Εργασίας</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {newBookings.length > 0 && (
        <Card className="bg-orange-500 border-none shadow-lg mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Bell className="text-white w-8 h-8" />
              <span className="text-sm font-medium text-white">Νέες Κρατήσεις</span>
            </div>
            <div className="text-2xl font-bold text-white mb-4">{newBookings.length} νέα/ες κράτηση/εις</div>
            <Button onClick={() => setNewBookings([])} variant="outline" className="w-full bg-white hover:bg-gray-100 text-orange-500 border-none">
              Εκκαθάριση Ειδοποιήσεων
            </Button>
          </CardContent>
        </Card>
      )}

      {todayBookings.length > 0 ? renderCalendar() : (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Πρόγραμμα Σήμερα</h2>
          <p className="text-gray-400">Δεν υπάρχουν κρατήσεις για σήμερα.</p>
        </div>
      )}

      <audio ref={audioRef} src="/notification-sound.wav" />
    </div>
  )
}