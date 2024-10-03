'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Heart, MoreHorizontal, Star, User, Phone, Mail, Check, MapPin, Calendar, Clock, Scissors } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/utils/supabase'
import { Service, Booking } from '@/app/types/bookings'

const HARDCODED_SERVICES: Service[] = [
  { name: 'Κούρεμα', price: 10, duration: 45 },
  { name: 'Γένια', price: 5, duration: 20 },
  { name: 'Πλήρες', price: 20, duration: 45 },
]   

export default function BookingApp() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
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

  const { toast } = useToast()

  const times = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

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
  }, [])

  const fetchServices = async () => {
    setIsLoading(true)
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setServices(HARDCODED_SERVICES)
    setIsLoading(false)
  }

  const toggleService = (serviceName: string) => {
    setSelectedService(prev => prev === serviceName ? null : serviceName)
  }

  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const duration = selectedService ? services.find(s => s.name === selectedService)?.duration || 45 : 45
    const endDate = new Date(2022, 0, 1, hours, minutes + duration)
    return endDate.toTimeString().slice(0, 5)
  }

  const totalPrice = selectedService 
    ? services.find(s => s.name === selectedService)?.price || 0 
    : 0

  const generateMathChallenge = () => {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    setMathChallenge({ num1, num2, answer: '' })
  }

  const handleBookNow = () => {
    setIsBookingDialogOpen(true)
    generateMathChallenge()
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !selectedService) return

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
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          service: selectedService,
          fullname: bookingDetails.fullName,
          phonenumber: bookingDetails.phoneNumber,
          email: bookingDetails.email,
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
      setIsBookingDialogOpen(false)
      setIsSuccessDialogOpen(true)
      toast({
        title: "Success",
        description: "Your booking has been created successfully.",
      })
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
    return date < today || date.getDay() === 0 || date.getDay() === 1
  }

  const isTimeDisabled = (time: string) => {
    if (!selectedDate) return true
    if (selectedDate.getTime() !== today.getTime()) return false
    const [hours, minutes] = time.split(':').map(Number)
    const selectedDateTime = new Date(selectedDate)
    selectedDateTime.setHours(hours, minutes, 0, 0)
    return selectedDateTime <= new Date()
  }

  const scroll = (scrollOffset: number) => {
    if (timeRef.current) {
      timeRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' })
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
                <span className="ml-1">4.8 (114)</span>
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
          <div className="mb-6 glass-effect rounded-xl p-4">
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
              {times.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "secondary" : "ghost"}
                  className={`flex-shrink-0 w-16 h-10 font-bold ${
                    selectedTime === time
                      ? 'bg-white text-black hover:bg-gray-200'
                      : isTimeDisabled(time)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => !isTimeDisabled(time) && setSelectedTime(time)}
                  disabled={isTimeDisabled(time)}
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {service.name} - {service.price}€
                </label>
                <div className="relative">
                  <Switch
                    id={service.name}
                    checked={selectedService === service.name}
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
            <span className="text-black font-semibold">{totalPrice}€</span>
          </div>
          <Button 
            className="w-full bg-black text-white hover:bg-gray-800" 
            onClick={handleBookNow}
            disabled={!selectedDate || !selectedTime || !selectedService || isLoading}
          >
            {isLoading ? 'Παρακαλώ περιμένετε...' : 'Κράτηση Τώρα'}
          </Button>
        </div>
      </div>

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
                  onChange={(e) => setBookingDetails({...bookingDetails, fullName: e.target.value})}
                  required
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <Label htmlFor="phone" className="sr-only">Αριθμός Τηλεφώνου</Label>
                <Input
                  id="phone"
                  className="pl-10 bg-gray-900 border-gray-700 rounded-xl focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Αριθμός Τηλεφώνου"
                  value={bookingDetails.phoneNumber}
                  onChange={(e) => setBookingDetails({...bookingDetails, phoneNumber: e.target.value})}
                  required
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <Label htmlFor="email" className="sr-only">Διεύθυνση Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="pl-10 bg-gray-900 border-gray-700 rounded-xl focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Διεύθυνση Email"
                  value={bookingDetails.email}
                  onChange={(e) => setBookingDetails({...bookingDetails, email: e.target.value})}
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                <span>{selectedService}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                <span className="font-semibold">Σύνολο:</span>
                <span className="font-semibold text-orange-400">{totalPrice}€</span>
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
              Σας έχουμε στείλει ένα email επιβεβαίωσης με όλες τις λεπτομέρειες του ραντεβού σας.
            </p>
            <Button className="w-full bg-orange-400 text-black hover:bg-orange-500 rounded-xl" onClick={() => setIsSuccessDialogOpen(false)}>
              Κλείσιμο
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .glass-effect {
          background: rgba(255, 165, 0, 0.05);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 165, 0, 0.1);
          box-shadow: 0 8px 32px 0 rgba(255, 165, 0, 0.2);
        }
      `}</style>
    </div>
  )
}