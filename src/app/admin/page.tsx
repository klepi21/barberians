'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { Calendar, Clock, PlusCircle, Settings, User } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type Booking = {
  id: number
  date: string
  time: string
  service: string
  fullname: string
}

export default function AdminDashboard() {
  const [totalBookings, setTotalBookings] = useState(0)
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

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
      console.error('Error fetching bookings:', error)
    } else {
      setTotalBookings(total || 0)
      setTodayBookings(todayData as Booking[] || [])
    }
    setIsLoading(false)
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
        <h2 className="text-2xl font-bold text-white mb-4">Today's Schedule</h2>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-orange-500 text-2xl">Loading dashboard data...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Total Bookings</span>
            </div>
            <div className="text-4xl font-bold text-white mb-4">{totalBookings}</div>
            <Button asChild variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none">
              <Link href="/admin/bookings">View All Bookings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Today's Bookings</span>
            </div>
            <div className="text-4xl font-bold text-white mb-4">{todayBookings.length}</div>
            <Button asChild variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none">
              <Link href="/admin/bookings">View Today's Bookings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <PlusCircle className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">New Booking</span>
            </div>
            <div className="text-lg text-gray-300 mb-4">Create a new booking quickly</div>
            <Button asChild variant="outline" className="w-full bg-orange-500 hover:bg-orange-600 text-white border-none">
              <Link href="/admin/new-booking">Add New Booking</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Settings className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Manage Hours</span>
            </div>
            <div className="text-lg text-gray-300 mb-4">Update working hours</div>
            <Button asChild variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none">
              <Link href="/admin/hours">Manage Working Hours</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {todayBookings.length > 0 ? renderCalendar() : (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Today's Schedule</h2>
          <p className="text-gray-400">No bookings for today.</p>
        </div>
      )}
    </div>
  )
}