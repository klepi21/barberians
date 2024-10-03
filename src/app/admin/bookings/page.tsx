'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/utils/supabase'
import { Booking } from '@/app/types/bookings'
import { Calendar, Clock, Scissors, User, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
    setIsLoading(false)
  }

  const updateBookingStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating booking status:', error)
    } else {
      setBookings(bookings.map(booking => 
        booking.id === id ? { ...booking, status: newStatus } : booking
      ))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500'
      case 'done': return 'text-green-500'
      case 'cancelled': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-orange-500 text-2xl">Loading bookings...</div>
      </div>
    )
  }

  return (
    <Card className="bg-gray-900 border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Calendar className="mr-2 text-orange-500" />
          Manage Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 border-b border-gray-700">
                <TableHead className="text-orange-500">Date</TableHead>
                <TableHead className="text-orange-500">Time</TableHead>
                <TableHead className="text-orange-500">Service</TableHead>
                <TableHead className="text-orange-500">Customer</TableHead>
                <TableHead className="text-orange-500">Status</TableHead>
                <TableHead className="text-orange-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <TableCell className="text-white">
                    <Calendar className="inline mr-2 text-orange-500" />
                    {new Date(booking.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white">
                    <Clock className="inline mr-2 text-orange-500" />
                    {booking.time}
                  </TableCell>
                  <TableCell className="text-white">
                    <Scissors className="inline mr-2 text-orange-500" />
                    {booking.service}
                  </TableCell>
                  <TableCell className="text-white">
                    <User className="inline mr-2 text-orange-500" />
                    {booking.fullname}
                  </TableCell>
                  <TableCell className={`font-semibold ${getStatusColor(booking.status)}`}>
                    <AlertCircle className="inline mr-2" />
                    {booking.status}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={booking.status}
                      onValueChange={(value) => updateBookingStatus(booking.id!, value)}
                    >
                      <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white border-gray-700">
                        <SelectItem value="pending" className="hover:bg-gray-700">Pending</SelectItem>
                        <SelectItem value="done" className="hover:bg-gray-700">Done</SelectItem>
                        <SelectItem value="cancelled" className="hover:bg-gray-700">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}