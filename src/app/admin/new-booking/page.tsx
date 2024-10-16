'use client'

import { useState, useEffect } from 'react'
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
import { useRouter } from 'next/navigation'
import { Checkbox } from "@/components/ui/checkbox"
import { format, addMinutes, parse, isAfter, isBefore, startOfDay, endOfDay, isSameDay, setHours, setMinutes, isEqual } from 'date-fns'


export default function NewBookingPage() {
  const [bookingDetails, setBookingDetails] = useState({
    date: undefined as Date | undefined,
    time: '',
    services: [] as string[],
    fullname: '',
    phonenumber: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [availableTimes, setAvailableTimes] = useState<string[]>([]); // Add state for available times
  const [specialHours, setSpecialHours] = useState<any[]>([]); // Add state for special hours
  const [isDateSelected, setIsDateSelected] = useState(false); // Add state to track date selection

  useEffect(() => {
    if (bookingDetails.date) {
      fetchAvailableTimes(bookingDetails.date); // Fetch available times when date is selected
    }
  }, [bookingDetails.date]);

  const fetchWorkingHoursForDay = async (dayOfWeek: number) => {
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek);

    if (error) {
      console.error('Error fetching working hours:', error);
      return null; // Return null if there's an error
    }

    return data[0]; // Return the first working hours entry for the day
  }

  const fetchSpecialHoursForDate = async (dateString: string) => {
    const { data, error } = await supabase
      .from('special_hours')
      .select('*')
      .eq('date', dateString);

    if (error) {
      console.error('Error fetching special hours:', error);
      return null; // Return null if there's an error
    }

    return data[0]; // Return the first special hours entry for the date
  }

  const fetchAvailableTimes = async (date: Date) => {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Adjust Sunday from 0 to 7
    const dateString = format(date, 'yyyy-MM-dd');

    // Fetch working hours for the selected day
    const workingHours = await fetchWorkingHoursForDay(dayOfWeek); // Fetch working hours

    // Check if it's a special day
    const specialDay = specialHours.find(sh => sh.date === dateString);
    if (specialDay) {
        if (specialDay.start_time === '00:00' && specialDay.end_time === '00:00') {
            setAvailableTimes([]); // Shop is closed
            return;
        }
        // Use special hours
        const slots = await generateTimeSlots(specialDay.start_time, specialDay.end_time, date);
        setAvailableTimes(slots); // Set available times
    } else {
        // Use regular working hours
        if (workingHours) {
            const slots = await generateTimeSlots(workingHours.start_time, workingHours.end_time, date);
            setAvailableTimes(slots); // Set available times
        } else {
            setAvailableTimes([]); // Shop is closed
        }
    }

    // Fetch breaks and filter out slots
    // ... (existing code for fetching breaks)
  };

  const generateTimeSlots = async (startTime: string, endTime: string, date: Date): Promise<string[]> => {
    const start = parse(startTime, 'HH:mm:ss', date);
    const end = parse(endTime, 'HH:mm:ss', date);
    const slots: string[] = [];

    let current = start;
    while (isBefore(current, end)) {
        // Check if the current time slot is in the past for today's date
        if (isSameDay(date, new Date()) && isBefore(current, new Date())) {
            current = addMinutes(current, 30);
            continue;
        }
        slots.push(format(current, 'HH:mm'));
        current = addMinutes(current, 30); // 30-minute intervals
    }

    // Fetch bookings for the selected date
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', format(date, 'yyyy-MM-dd'));

    if (error) {
        console.error('Error fetching bookings:', error);
        return slots; // Return the slots even if there's an error
    }

    // Filter out booked slots
    const availableSlots = slots.filter(slot => {
        const slotStart = parse(slot, 'HH:mm', date);
        return !bookings.some(booking => {
            const bookingStart = parse(booking.time, 'HH:mm:ss', date);
            const bookingEnd = addMinutes(bookingStart, booking.duration || 45);
            return isEqual(slotStart, bookingStart);
        });
    });

    return availableSlots; // Return the available slots
  };

  // Add the function to fetch booked slots for the selected date
  const fetchBookedSlots = async (dateString: string): Promise<string[]> => { // Specify return type
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('time')
      .eq('date', dateString);

    if (error) {
      console.error('Error fetching bookings:', error);
      return []; // Ensure it returns an empty array on error
    }

    return bookings ? bookings.map(booking => booking.time) : []; // Return booked times or empty array if bookings is undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Check if at least one service is selected
    if (bookingDetails.services.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one service.",
      })
      setIsLoading(false)
      return; // Prevent form submission
    }

    // Log the booking details
    console.log(bookingDetails); // Log the booking details

    // Prepare the data to be inserted
    const insertData = {
        date: bookingDetails.date ? format(bookingDetails.date, 'yyyy-MM-dd') : null,
        time: bookingDetails.time,
        service: bookingDetails.services.join(','), // Only keep 'service'
        fullname: bookingDetails.fullname,
        phonenumber: bookingDetails.phonenumber,
        email: bookingDetails.email,
        status: 'pending'
    };

    // Log the data being sent to Supabase
    console.log('Data to be inserted:', insertData);

    const { data, error } = await supabase
      .from('bookings')
      .insert([insertData]);

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
      
      // Clear the form by resetting the bookingDetails state
      setBookingDetails({
        date: undefined,
        time: '',
        services: [],
        fullname: '',
        phonenumber: '',
        email: '',
      });
    }
  }

  useEffect(() => {
    const fetchSpecialHours = async () => {
      const { data, error } = await supabase
        .from('special_hours')
        .select('*');

      if (error) {
        console.error('Error fetching special hours:', error);
      } else {
        setSpecialHours(data); // Set the fetched special hours
      }
    };

    fetchSpecialHours(); // Fetch special hours on component mount
  }, []);

  // Update the date selection handler
  const handleDateSelect = (date: Date | undefined) => {
    setBookingDetails({ ...bookingDetails, date });
    setIsDateSelected(!!date); // Set date selected state
  };

  return (
    <Card className="bg-gray-900 border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Plus className="mr-2 text-orange-500" />
          Νέο Ραντεβού
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="date" className="text-white flex items-center">
                <Calendar className="mr-2 text-orange-500" />
                Ημερομηνία
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal bg-gray-800 text-white border-gray-700 ${!bookingDetails.date && "text-muted-foreground"}`}
                  >
                    {bookingDetails.date ? format(bookingDetails.date, "PPP") : <span>Επιλέξτε ημερομηνία</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <CalendarComponent
                    mode="single"
                    selected={bookingDetails.date}
                    onSelect={(date) => handleDateSelect(date)}
                    initialFocus
                    className="text-white"
                    styles={{
                      day: { color: "white" },
                      month: { color: "white" },
                      nav_button_previous: { color: "white" },
                      nav_button_next: { color: "white" },
                      caption: { color: "white" },
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Label htmlFor="time" className="text-white flex items-center">
                <Clock className="mr-2 text-orange-500" />
                Ώρα
              </Label>
              {isDateSelected && ( // Conditionally render time selection
                <Select
                  value={bookingDetails.time}
                  onValueChange={(value) => setBookingDetails({ ...bookingDetails, time: value })}
                >
                  <SelectTrigger className="bg-gray-800 text-white border-gray-700">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {availableTimes.map((time) => ( // Use availableTimes for options
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="fullname" className="text-white flex items-center">
                <User className="mr-2 text-orange-500" />
                Όνομα Πελάτη
              </Label>
              <Input
                id="fullname"
                value={bookingDetails.fullname}
                onChange={(e) => setBookingDetails({ ...bookingDetails, fullname: e.target.value })}
                required
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div className="flex-1">
              <Label className="text-white flex items-center">
                <Scissors className="mr-2 text-orange-500" />
                Υπηρεσίες
              </Label>
              <div className="space-y-2">
                {['Ανδρικό', 'Shaver', 'Παιδικό', 'Ξύρισμα', 'Γενειάδα', 'Καθαρισμός Αυχένα'].map((service) => (
                  <div key={service} className="flex items-center">
                    <Checkbox
                      id={service}
                      checked={bookingDetails.services.includes(service)}
                      onCheckedChange={(checked) => {
                        setBookingDetails({
                          ...bookingDetails,
                          services: checked
                            ? [...bookingDetails.services, service]
                            : bookingDetails.services.filter((s) => s !== service),
                        })
                      }}
                    />
                    <label htmlFor={service} className="ml-2 text-white">{service}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="phonenumber" className="text-white flex items-center">
                <Phone className="mr-2 text-orange-500" />
                Τηλέφωνο Πελάτη
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
            <div className="flex-1">
              <Label htmlFor="email" className="text-white flex items-center">
                <Mail className="mr-2 text-orange-500" />
                Email Πελάτη (Προαιρετικό)
              </Label>
              <Input
                id="email"
                type="email"
                value={bookingDetails.email}
                onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Προσθήκη...' : 'Προσθήκη Ραντεβού'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
