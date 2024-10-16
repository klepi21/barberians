'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/utils/supabase'
import { Booking } from '@/app/types/bookings'
import { Calendar, Clock, Scissors, User, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2 } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    fetchBookingsForSelectedDate(selectedDate)
  }, [selectedDate])

  const fetchBookingsForSelectedDate = async (date: Date) => {
    setIsLoading(true)
    // Get the start and end of the day in local timezone
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    // Convert to UTC for the database query
    const startOfDayUTC = new Date(startOfDay.getTime() - startOfDay.getTimezoneOffset() * 60000).toISOString();
    const endOfDayUTC = new Date(endOfDay.getTime() - endOfDay.getTimezoneOffset() * 60000).toISOString();

    console.log(`Fetching bookings for date range: ${startOfDayUTC} to ${endOfDayUTC}`);

    const { data, error } = await supabase
      .from('bookings')
      .select('*') // Ensure phone number is included in the bookings table
      .gte('date', startOfDayUTC.split('T')[0]) // Start of the day
      .lte('date', endOfDayUTC.split('T')[0]) // End of the day
      .order('time')

    if (error) {
      console.error('Σφάλμα κατά τη λήψη των κρατήσεων:', error)
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
      console.error('Σφάλμα κατά την ενημέρωση της κατάστασης κράτησης:', error)
    } else {
      setBookings(bookings.map(booking => 
        booking.id === id ? { ...booking, status: newStatus } : booking
      ))
    }
  }

  const deleteBooking = async (id: number) => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Σφάλμα κατά τη διαγραφή της κράτησης:', error)
    } else {
      setBookings(bookings.filter(booking => booking.id !== id))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500'
      case 'done': return 'text-green-500'
      case 'cancelled': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const CustomDatePickerHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => (
    <div className="flex items-center justify-between px-2 py-2">
      <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1">
        <ChevronLeft className="h-6 w-6 text-gray-400" />
      </button>
      <span className="text-lg font-bold text-gray-200">
        {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </span>
      <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1">
        <ChevronRight className="h-6 w-6 text-gray-400" />
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-orange-500 text-2xl">Φόρτωση κρατήσεων...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <Card className="bg-gray-800 border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
              <Calendar className="mr-2" />
              Επιλογή Ημερομηνίας
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                  if (date) {
                      setSelectedDate(date);
                  }
              }}
              dateFormat="dd/MM/yyyy"
              renderCustomHeader={CustomDatePickerHeader}
              inline
              calendarClassName="bg-gray-800 border-none shadow-md rounded-lg text-white"
              dayClassName={date =>
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth()
                  ? "bg-orange-500 text-white rounded-full"
                  : "text-gray-300 hover:bg-gray-700 rounded-full"
              }
              wrapperClassName="w-full"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500">
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            <Calendar className="mr-2" />
            Διαχείριση Κρατήσεων - {selectedDate.toLocaleDateString('el-GR')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 border-b border-gray-600">
                  <TableHead className="text-orange-500">Ώρα</TableHead>
                  <TableHead className="text-orange-500">Υπηρεσία</TableHead>
                  <TableHead className="text-orange-500">Πελάτης</TableHead>
                  <TableHead className="text-orange-500">Τηλέφωνο</TableHead>
                  <TableHead className="text-orange-500">Κατάσταση</TableHead>
                  <TableHead className="text-orange-500">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <TableCell className="text-white">
                      <Clock className="inline mr-2 text-orange-500" />
                      {booking.time.slice(0, 5)}
                    </TableCell>
                    <TableCell className="text-white">
                      <Scissors className="inline mr-2 text-orange-500" />
                      {booking.service}
                    </TableCell>
                    <TableCell className="text-white">
                      <User className="inline mr-2 text-orange-500" />
                      {booking.fullname}
                    </TableCell>
                    <TableCell className="text-white">
                      {booking.phonenumber} 
                    </TableCell>
                    <TableCell className={`font-semibold ${getStatusColor(booking.status)}`}>
                      <AlertCircle className="inline mr-2" />
                      {booking.status === 'pending' ? 'Εκκρεμεί' :
                       booking.status === 'done' ? 'Ολοκληρώθηκε' :
                       booking.status === 'cancelled' ? 'Ακυρώθηκε' : booking.status}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Select
                          value={booking.status}
                          onValueChange={(value) => updateBookingStatus(booking.id!, value)}
                        >
                          <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
                            <SelectValue placeholder="Ενημέρωση κατάστασης" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 text-white border-gray-700">
                            <SelectItem value="pending" className="hover:bg-gray-700">Εκκρεμεί</SelectItem>
                            <SelectItem value="done" className="hover:bg-gray-700">Ολοκληρώθηκε</SelectItem>
                            <SelectItem value="cancelled" className="hover:bg-gray-700">Ακυρώθηκε</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Θα διαγράψει μόνιμα την κράτηση.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Ακύρωση</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => deleteBooking(booking.id!)}
                              >
                                Διαγραφή
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
