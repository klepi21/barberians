'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Heart, MoreHorizontal, Star, User, Phone, Mail, Check, MapPin, Calendar, Clock, Scissors, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/utils/supabase'
import { Service, Booking, WorkingHours, SpecialHours } from '@/app/types/bookings'
import { PostgrestError } from '@supabase/supabase-js'
import { format, addMinutes, parse, isAfter, isBefore, startOfDay, endOfDay, isSameDay, setHours, setMinutes, isEqual } from 'date-fns'
import Image from 'next/image'
import oldsIcon from '@/images/olds.png'

const HARDCODED_SERVICES: Service[] = [
  { name: 'Ανδρικό', price: 13, duration: 30 },
  { name: 'Shaver', price: 15, duration: 30 },
  { name: 'Παιδικό', price: 10, duration: 30 },
  { name: 'Ξύρισμα', price: 13, duration: 30 },
  { name: 'Γενειάδα', price: 5, duration: 30 },
  { name: 'Καθαρισμός Αυχένα', price: 5, duration: 30 },
]   

export default function BookingApp() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookingDetails, setBookingDetails] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
  })
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mathChallenge, setMathChallenge] = useState({ num1: 0, num2: 0, answer: '' })
  const timeRef = useRef<HTMLDivElement>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [errors, setErrors] = useState({
    email: '',
    phoneNumber: ''
  })
  const [searchPhoneNumber, setSearchPhoneNumber] = useState('')
  const [userBookings, setUserBookings] = useState<Booking[]>([])

  const { toast } = useToast()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const greekDays = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ']
  const greekMonths = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ]

  useEffect(() => {
    fetchServices()
    fetchWorkingHours()
    fetchSpecialHours()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes(selectedDate)
    }
  }, [selectedDate])

  const fetchServices = async () => {
    setIsLoading(true)
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setServices(HARDCODED_SERVICES)
    setIsLoading(false)
  }

  const fetchWorkingHours = async () => {
    const { data, error } = await supabase.from('working_hours').select('*')
    if (error) {
      console.error('Error fetching working hours:', error)
    } else {
      setWorkingHours(data)
    }
  }

  const fetchSpecialHours = async () => {
    const { data, error } = await supabase.from('special_hours').select('*')
    if (error) {
      console.error('Error fetching special hours:', error)
    } else {
      setSpecialHours(data)
    }
  }

  const fetchAvailableTimes = async (date: Date) => {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Adjust Sunday from 0 to 7
    const dateString = format(date, 'yyyy-MM-dd')

    // Check if it's a special day
    const specialDay = specialHours.find(sh => sh.date === dateString)
    if (specialDay) {
      if (specialDay.start_time === '00:00' && specialDay.end_time === '00:00') {
        setAvailableTimes([]) // Shop is closed
        return
      }
      // Use special hours
      await generateTimeSlots(specialDay.start_time, specialDay.end_time, date)
    } else {
      // Use regular working hours
      const workingDay = workingHours.find(wh => wh.day_of_week === dayOfWeek)
      if (workingDay) {
        await generateTimeSlots(workingDay.start_time, workingDay.end_time, date)
      } else {
        setAvailableTimes([]) // Shop is closed
      }
    }
  }

  const generateTimeSlots = async (startTime: string, endTime: string, date: Date) => {
    console.log('Generating time slots for:', format(date, 'yyyy-MM-dd'))
    const start = parse(startTime, 'HH:mm:ss', date)
    const end = parse(endTime, 'HH:mm:ss', date)
    const slots: string[] = []

    let current = start
    while (isBefore(current, end)) {
      slots.push(format(current, 'HH:mm'))
      current = addMinutes(current, 30) // 30-minute intervals
    }

    console.log('All possible slots:', slots)

    // Fetch bookings for the selected date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', format(date, 'yyyy-MM-dd'))

    if (error) {
      console.error('Error fetching bookings:', error)
      return
    }

    console.log('Fetched bookings:', bookings)

    // Filter out booked slots
    const availableSlots = slots.filter(slot => {
      const slotStart = parse(slot, 'HH:mm', date)
      const isAvailable = !bookings.some(booking => {
        const bookingStart = parse(booking.time, 'HH:mm:ss', date)
        const bookingEnd = addMinutes(bookingStart, booking.duration || 45)
        
        // Check if the slot start time is exactly at the booking start time
        const overlap = isEqual(slotStart, bookingStart)
        
        if (overlap) {
          console.log(`Slot ${slot} overlaps with booking:`, booking)
        }
        return overlap
      })
      if (!isAvailable) {
        console.log(`Slot ${slot} is not available`)
      }
      return isAvailable
    })

    console.log('Available slots:', availableSlots)
    setAvailableTimes(availableSlots)
  }

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev => {
      const newServices = prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]

      // Handle special combinations
      if (newServices.includes('Ανδρικό') && newServices.includes('Γενιάδα')) {
        return ['Ανδρικό', 'Γενιάδα']
      }
      if (newServices.includes('Shaver') && newServices.includes('Γενιάδα')) {
        return ['Shaver', 'Γενιάδα']
      }
      if ((newServices.includes('Shaver') || newServices.includes('Ανδρικό')) && newServices.includes('Ξύρισμα')) {
        return newServices.filter(s => s === 'Shaver' || s === 'Ανδρικό' || s === 'Ξύρισμα').slice(0, 2)
      }

      // Limit to maximum of 2 services
      return newServices.slice(0, 2)
    })
  }

  const calculateTotalPrice = () => {
    if (selectedServices.length === 0) return 0

    if (selectedServices.includes('Ανδρικό') && selectedServices.includes('Γενιάδα')) {
      return 15
    }
    if (selectedServices.includes('Shaver') && selectedServices.includes('Γενιάδα')) {
      return 16
    }
    if (selectedServices.includes('Shaver') && selectedServices.includes('Ξύρισμα')) {
      return 28
    }
    if (selectedServices.includes('Ανδρικό') && selectedServices.includes('Ξύρισμα')) {
      return 26
    }

    return selectedServices.reduce((total, serviceName) => {
      const service = services.find(s => s.name === serviceName)
      return total + (service ? service.price : 0)
    }, 0)
  }

  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const duration = 30 // All combinations result in 30 minutes total
    const endDate = new Date(2022, 0, 1, hours, minutes + duration)
    return endDate.toTimeString().slice(0, 5)
  }

  const generateMathChallenge = () => {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    setMathChallenge({ num1, num2, answer: '' })
  }

  const handleBookNow = () => {
    setIsBookingDialogOpen(true)
    generateMathChallenge()
  }

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const validatePhoneNumber = (phone: string) => {
    const re = /^69\d{8}$/
    return re.test(phone)
  }

  const handleInputChange = (field: 'fullName' | 'phoneNumber' | 'email', value: string) => {
    setBookingDetails({ ...bookingDetails, [field]: value })

    if (field === 'email') {
      setErrors(prev => ({
        ...prev,
        email: validateEmail(value) ? '' : 'Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email'
      }))
    } else if (field === 'phoneNumber') {
      setErrors(prev => ({
        ...prev,
        phoneNumber: validatePhoneNumber(value) ? '' : 'Ο αριθμός τηλεφώνου πρέπει να ξεκινάει με 69 και να έχει 10 ψηφία'
      }))
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(bookingDetails.email) || !validatePhoneNumber(bookingDetails.phoneNumber)) {
      return // Don't submit if validation fails
    }
    if (!selectedDate || !selectedTime || selectedServices.length === 0) return

    const correctAnswer = mathChallenge.num1 + mathChallenge.num2
    if (parseInt(mathChallenge.answer) !== correctAnswer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Incorrect answer to the math challenge. Please try again.",
      })
      return
    }

    setIsLoading(true)
    
    try {
      // First, check if the user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, booking_count')
        .eq('email', bookingDetails.email)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      let userId: number

      if (existingUser) {
        // User exists, update their booking count
        const { error: updateError } = await supabase
          .from('users')
          .update({ booking_count: (existingUser.booking_count || 0) + 1 })
          .eq('id', existingUser.id)

        if (updateError) throw updateError
        userId = existingUser.id
      } else {
        // User doesn't exist, create a new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            full_name:  bookingDetails.fullName,
            email: bookingDetails.email,
            telephone: bookingDetails.phoneNumber,
            booking_count: 1
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        if (!newUser) throw new Error('Failed to create new user')
        userId = newUser.id
      }

      // Now create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            service: selectedServices.join(', '),
            fullname: bookingDetails.fullName,
            phonenumber: bookingDetails.phoneNumber,
            email: bookingDetails.email,
            status: 'pending',
            user_id: userId,
            duration: 30 // All combinations result in 30 minutes total
          }
        ])

      if (bookingError) throw bookingError

      setIsBookingDialogOpen(false)
      setIsSuccessDialogOpen(true)
      toast({
        title: "Success",
        description: "Your booking has been created successfully.",
      })

      // Refresh available times after successful booking
      fetchAvailableTimes(selectedDate)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create booking. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const changeMonth = (offset: number) => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() + offset)
      return newMonth < today ? today : newMonth
    })
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const isDateDisabled = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const specialDay = specialHours.find(sh => sh.date === dateString)
    if (specialDay) {
      return specialDay.start_time === '00:00' && specialDay.end_time === '00:00'
    }
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Adjust Sunday from 0 to 7
    const workingDay = workingHours.find(wh => wh.day_of_week === dayOfWeek)
    return date < today || !workingDay
  }

  const scroll = (scrollOffset: number) => {
    if (timeRef.current) {
      timeRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' })
    }
  }

  const handleSearchBookings = async () => {
    if (!validatePhoneNumber(searchPhoneNumber)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Παρακαλώ εισάγετε έναν έγκυρο αριθμό τηλεφώνου.",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('phonenumber', searchPhoneNumber)
        .order('date', { ascending: true })

      if (error) throw error

      setUserBookings(data)
      if (data.length === 0) {
        toast({
          title: "No bookings found",
          description: "Δεν βρέθηκαν κρατήσεις για αυτόν τον αριθμό τηλεφώνου.",
        })
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Αποτυχία ανάκτησης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-black text-white rounded-3xl shadow-lg overflow-hidden">
      <div className="relative h-64">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-lH2W7JXnk7kGYHhdp5D5hpP30q71oa.png"
          alt="Εσωτερικό κουρείου"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end space-x-4">
            <Avatar className="w-20 h-20 border-2 border-white">
              <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%CE%A3%CF%84%CE%B9%CE%B3%CE%BC%CE%B9%CE%BF%CC%81%CF%84%CF%85%CF%80%CE%BF%20%CE%BF%CE%B8%CE%BF%CC%81%CE%BD%CE%B7%CF%82%202024-10-02,%207.08.15%E2%80%AF%CE%BC%CE%BC-Mn4SQF4bF8fy3jcbTM1T2cvJUGrqt6.png" alt="BARBERIANS CUTS ON THE ROCKS" />
              <AvatarFallback>BC</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <h1 className="text-2xl font-bold">BARBERIANS CUTS ON THE ROCKS</h1>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                {/* <span className="ml-1">4.8 (114)</span> */}
                <span className="ml-2 text-orange-400">Μπαρμπέρης</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Heart className="w-6 h-6" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-6 h-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 text-white">
                  <DropdownMenuItem className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>Καλέστε μας</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Οδηγίες</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="booking" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900 p-1 rounded-xl mb-4">
          <TabsTrigger 
            value="booking" 
            className="rounded-lg py-2 px-4 data-[state=active]:bg-orange-400 data-[state=active]:text-black transition-all duration-200"
          >
            Κράτηση
          </TabsTrigger>
          <TabsTrigger 
            value="my-bookings" 
            className="rounded-lg py-2 px-4 data-[state=active]:bg-orange-400 data-[state=active]:text-black transition-all duration-200"
          >
            Οι Κρατήσεις μου
          </TabsTrigger>
        </TabsList>
        <TabsContent value="booking" className="mt-0">
          <div className="p-4">
            <div className="mb-6 glass-effect rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{greekMonths[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeMonth(-1)}
                    disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeMonth(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {greekDays.map(day => (
                  <div key={day} className="text-center text-sm font-bold text-gray-400">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  const isDisabled = isDateDisabled(date)
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "secondary" : "ghost"}
                      className={`h-10 font-bold ${
                        isSelected
                          ? 'bg-white text-black hover:bg-gray-200'
                          : isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-800'
                      }`}
                      onClick={() => !isDisabled && handleDateSelect(date)}
                      disabled={isDisabled}
                    >
                      {index + 1}
                    </Button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="mb-6 glass-effect rounded-xl p-4 " style={{ width: '340px' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-400">ΩΡΑ</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scroll(-100)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scroll(100)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div 
                  ref={timeRef}
                  className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "secondary" : "ghost"}
                      className={`flex-shrink-0 w-16 h-10 font-bold ${
                        selectedTime === time
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-2">ΥΠΗΡΕΣΙΕΣ</h3>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <div key={service.name} className="flex-1 min-w-[calc(50%-0.25rem)] flex items-center justify-between bg-black border border-gray-800 rounded-lg p-2">
                    <label
                      htmlFor={service.name}
                      className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      {service.name}
                      {service.name === 'Ξύρισμα' && (
                        <Image
                          src={oldsIcon}
                          alt="Olds icon"
                          width={32}
                          height={32}
                          className="ml-1"
                        />
                      )}
                      
                    </label>
                    <div className="relative">
                      <Switch
                        id={service.name}
                        checked={selectedServices.includes(service.name)}
                        onCheckedChange={() => toggleService(service.name)}
                        className="bg-black data-[state=checked]:bg-orange-400"
                      />
                      <Scissors className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-400 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-black">
                  {selectedDate ? selectedDate.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Επιλέξτε ημερομηνία'}
                </span>
                <span className="text-black font-semibold">
                  {selectedTime && `${selectedTime} - ${calculateEndTime(selectedTime)}`}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-black font-semibold">Σύνολο:</span>
                <span className="text-black font-semibold">{calculateTotalPrice()}€</span>
              </div>
              <p className="text-xs text-black/70 text-center italic">
                Η πληρωμή γίνεται στο κατάστημα με μετρητά ή κάρτα
              </p>
              <Button 
                className="w-full bg-black text-white hover:bg-gray-800" 
                onClick={handleBookNow}
                disabled={!selectedDate || !selectedTime || selectedServices.length === 0 || isLoading}
              >
                {isLoading ? 'Παρακαλώ περιμένετε...'  : 'Κράτηση Τώρα'}
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="my-bookings" className="mt-0">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Οι Κρατήσεις μου</h2>
            <div className="mb-4">
              <Label htmlFor="searchPhoneNumber" className="sr-only">Αριθμός Τηλεφώνου</Label>
              <div className="flex space-x-2">
                <Input
                  id="searchPhoneNumber"
                  placeholder="Αριθμός Τηλεφώνου"
                  value={searchPhoneNumber}
                  onChange={(e) => setSearchPhoneNumber(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
                <Button onClick={handleSearchBookings} disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Αναζήτηση
                </Button>
              </div>
            </div>
            {userBookings.length > 0 ? (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{booking.service}</span>
                      <span className="text-orange-400">{booking.status}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>{new Date(booking.date).toLocaleDateString('el-GR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p>{booking.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <Calendar className="w-16 h-16 mb-4 text-gray-600" />
                <p className="text-center">Δεν βρέθηκαν κρατήσεις. Εισάγετε τον αριθμό τηλεφώνου σας για να δείτε τις κρατήσεις σας.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="bg-black text-white border border-gray-800 rounded-3xl p-0 overflow-hidden max-w-md">
          <div className="bg-gradient-to-b from-orange-400 to-orange-600 p-6 rounded-t-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Ολοκληρώστε την Κράτησή σας</DialogTitle>
              <DialogDescription className="text-black/80">
                Παρακαλώ συμπληρώστε τα στοιχεία σας για να επιβεβαιώσετε το ραντεβού σας.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="name" className="sr-only">Ονοματεπώνυμο</Label>
                <Input
                  id="name"
                  className="pl-10 bg-gray-900 border-gray-700 rounded-xl focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Ονοματεπώνυμο"
                  value={bookingDetails.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <Label htmlFor="phone" className="sr-only">Αριθμός Τηλεφώνου</Label>
                <Input
                  id="phone"
                  className="pl-10 bg-gray-900 border-gray-700 rounded-xl focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Αριθμός Τηλεφώνου (ξεκινάει με 69)"
                  value={bookingDetails.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>
              <div className="relative">
                <Label htmlFor="email" className="sr-only">Διεύθυνση Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="pl-10 bg-gray-900 border-gray-700 rounded-xl focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Διεύθυνση Email"
                  value={bookingDetails.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl space-y-2">
              <h4 className="font-semibold text-lg mb-2">Λεπτομέρειες Κράτησης</h4>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                <span>{selectedDate?.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                <span>{selectedTime} - {calculateEndTime(selectedTime || '')}</span>
              </div>
              <div className="flex items-center">
                <Scissors className="mr-2 h-4 w-4 text-gray-400" />
                <span>{selectedServices.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                <span className="font-semibold">Σύνολο:</span>
                <span className="font-semibold text-orange-400">{calculateTotalPrice()}€</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mathChallenge" className="text-sm font-medium text-gray-400">
                Παρακαλώ λύστε αυτό το απλό μαθηματικό πρόβλημα:
              </Label>
              <div className="flex items-center space-x-2">
                <span>{mathChallenge.num1} + {mathChallenge.num2} =</span>
                <Input
                  id="mathChallenge"
                  type="number"
                  className="w-20 bg-gray-900 border-gray-700 rounded-xl focus:ring-orange-400 focus:border-orange-400"
                  value={mathChallenge.answer}
                  onChange={(e) => setMathChallenge({...mathChallenge, answer: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full bg-orange-400 text-black hover:bg-orange-500 rounded-xl" 
                disabled={isLoading}
              >
                {isLoading ? 'Επεξεργασία...' : 'Επιβεβαίωση Κράτησης'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="bg-black text-white border border-gray-800 rounded-3xl p-0 overflow-hidden max-w-md">
          <div className="bg-gradient-to-b from-green-400 to-green-600 p-6 rounded-t-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Η Κράτηση Επιβεβαιώθηκε!</DialogTitle>
              <DialogDescription className="text-black/80">
                Το ραντεβού σας έχει κλειστεί με επιτυχία.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 flex flex-col items-center">
            <div className="bg-green-500 rounded-full p-3 mb-4">
              <Check className="h-10 w-10 text-white" />
            </div>
            <p className="text-center mb-6">
              Σας έχουμε στείλει ένα email επιβεβαίωσης με τις λεπτομέρειες του ραντεβού σας. Ανυπομονούμε να σας δούμε!
            </p>
            <Button 
              className="w-full bg-green-500 text-black hover:bg-green-600 rounded-xl" 
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              Εντάξει
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}