'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/utils/supabase'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Scissors, User, Phone, Mail, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useRouter } from 'next/navigation'

export default function NewBookingPage() {
  const [bookingDetails, setBookingDetails] = useState({
    date: undefined as Date | undefined,
    time: '',
    service: '',
    fullname: '',
    phonenumber: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          ...bookingDetails,
          date: bookingDetails.date ? format(bookingDetails.date, 'yyyy-MM-dd') : null,
          status: 'pending'
        }
      ])

    setIsLoading(false)

    if (error) {
      console.error('Error creating booking:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create booking. Please try again.",
      })
    } else {
      toast({
        title: "Success",
        description: "New booking created successfully.",
      })
      // Redirect to a success page or refresh the current page
      router.push('/admin/booking-success')
    }
  }

  return (
    <Card className="bg-gray-900 border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Plus className="mr-2 text-orange-500" />
          Add New Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date" className="text-white flex items-center">
              <Calendar className="mr-2 text-orange-500" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal bg-gray-800 text-white border-gray-700 ${!bookingDetails.date && "text-muted-foreground"}`}
                >
                  {bookingDetails.date ? format(bookingDetails.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                <CalendarComponent
                  mode="single"
                  selected={bookingDetails.date}
                  onSelect={(date) => setBookingDetails({ ...bookingDetails, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="time" className="text-white flex items-center">
              <Clock className="mr-2 text-orange-500" />
              Time
            </Label>
            <Select
              value={bookingDetails.time}
              onValueChange={(value) => setBookingDetails({ ...bookingDetails, time: value })}
            >
              <SelectTrigger className="bg-gray-800 text-white border-gray-700">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                {Array.from({ length: 57 }, (_, i) => {
                  const hour = Math.floor(i / 4) + 8
                  const minute = (i % 4) * 15
                  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                  return <SelectItem key={time} value={time}>{time}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="service" className="text-white flex items-center">
              <Scissors className="mr-2 text-orange-500" />
              Service
            </Label>
            <Select
              value={bookingDetails.service}
              onValueChange={(value) => setBookingDetails({ ...bookingDetails, service: value })}
            >
              <SelectTrigger className="bg-gray-800 text-white border-gray-700">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                <SelectItem value="Κούρεμα">Κούρεμα</SelectItem>
                <SelectItem value="Γένια">Γένια</SelectItem>
                <SelectItem value="Πλήρες">Πλήρες</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fullname" className="text-white flex items-center">
              <User className="mr-2 text-orange-500" />
              Customer Name
            </Label>
            <Input
              id="fullname"
              value={bookingDetails.fullname}
              onChange={(e) => setBookingDetails({ ...bookingDetails, fullname: e.target.value })}
              required
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="phonenumber" className="text-white flex items-center">
              <Phone className="mr-2 text-orange-500" />
              Customer Phone
            </Label>
            <Input
              id="phonenumber"
              type="tel"
              value={bookingDetails.phonenumber}
              onChange={(e) => setBookingDetails({ ...bookingDetails, phonenumber: e.target.value })}
              required
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-white flex items-center">
              <Mail className="mr-2 text-orange-500" />
              Customer Email (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              value={bookingDetails.email}
              onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Adding...' : 'Add Booking'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}