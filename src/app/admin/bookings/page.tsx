'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/utils/supabase'
import { Booking } from '@/app/types/bookings'
import { Calendar, Clock, Scissors, User, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2 } from 'lucide-react'
import DatePicker from 'react-datepicker' // Use default import for DatePicker
import 'react-datepicker/dist/react-datepicker.css' // Import the CSS for the date picker

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // State for selected date

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setIsLoading(true)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 2); // Get the date for two days from today

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      console.error('Σφάλμα κατά τη λήψη των κρατήσεων:', error)
    } else {
      // Filter bookings for today and the next two days
      const filteredBookings = (data || []).filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= today && bookingDate <= endDate;
      });
      setBookings(filteredBookings);
    }
    setIsLoading(false)
  }

  const handleDateChange = (date: Date | null, event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    setSelectedDate(date?.toISOString().split('T')[0] || '');
    // Fetch bookings for the selected date
    fetchBookingsForSelectedDate(date?.toISOString().split('T')[0] || '');
  }

  const fetchBookingsForSelectedDate = async (date: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date); // Fetch bookings for the selected date

    if (error) {
      console.error('Σφάλμα κατά τη λήψη των κρατήσεων:', error);
    } else {
      setBookings(data || []);
    }
    setIsLoading(false);
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
      default: return 'text-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-orange-500 text-2xl">Φόρτωση κρατήσεων...</div>
      </div>
    )
  }

  return (
    <>
      <DatePicker 
        selected={new Date(selectedDate)} // Convert string to Date
        onChange={handleDateChange} 
        className="mb-4" // Add styling as needed
      />
      <Card className="bg-gray-900 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            <Calendar className="mr-2 text-orange-500" />
            Διαχείριση Κρατήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-b border-gray-700">
                  <TableHead className="text-orange-500">Ημερομηνία</TableHead>
                  <TableHead className="text-orange-500">Ώρα</TableHead>
                  <TableHead className="text-orange-500">Υπηρεσία</TableHead>
                  <TableHead className="text-orange-500">Πελάτης</TableHead>
                  <TableHead className="text-orange-500">Κατάσταση</TableHead>
                  <TableHead className="text-orange-500">Ενέργειες</TableHead>
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
                      {booking.time.slice(0, 5)} {/* Αφαιρεί τα δευτερόλεπτα */}
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
                                Αυτή η ενέργεια δεν μπορεί να αναιρεθί. Θα διαγράψει μόνιμα την κράτηση.
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
    </>
  )
}