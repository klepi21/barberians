'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { Calendar, Clock, PlusCircle, Settings, User, Bell, CheckCircle, Phone, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { el } from 'date-fns/locale'
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Booking = {
  id: number
  date: string
  time: string
  service: string
  fullname: string
  status: string
  phonenumber: string
}

const SERVICE_NAME_MAP: { [key: string]: string } = {
  'Ανδρικό': 'Ανδρικό κούρεμα απλό',
  'Shaver': 'Ανδρικό κούρεμα Shaver',
  // Add more mappings here if needed
}

const SERVICES_PRICING: { [key: string]: number } = {
  'Ανδρικό κούρεμα απλό': 13,
  'Ανδρικό κούρεμα Shaver': 15,
  'Κούρεμα παιδικό': 10,
  'Ξύρισμα': 13,
  'Περιποίηση Γενειάδας': 5,
  'Καθαρισμός Αυχένα': 5,
  'Κούρεμα Ανδρικό με περιποίηση γενειάδας': 15,
  'Κούρεμα Ανδρικό Shaver με περιποίηση γενειάδας': 16,
}

const PIN = '1005'

export default function ProtectedAdminDashboard() {
  const [pinInput, setPinInput] = useState<string[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPinInput, setShowPinInput] = useState(true)
  const [totalBookings, setTotalBookings] = useState(0)
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newBookings, setNewBookings] = useState<Booking[]>([])
  const [topServices, setTopServices] = useState<{service: string, count: number}[]>([])
  const [customerRetention, setCustomerRetention] = useState(0)
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
      fetchTopServices()
      calculateCustomerRetention()
      const subscription = supabase
        .channel('bookings')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookings' },
          (payload) => {
            handleNewBooking(payload.new as Booking)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [isAuthenticated])

  const fetchTopServices = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('service')
      .eq('status', 'done')

    if (error) {
      console.error('Error fetching top services:', error)
      return
    }

    const serviceCounts = data.reduce((acc: { [key: string]: number }, booking) => {
      const mappedService = SERVICE_NAME_MAP[booking.service] || booking.service
      acc[mappedService] = (acc[mappedService] || 0) + 1
      return acc
    }, {})

    const sortedServices = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setTopServices(sortedServices)
  }

  const calculateCustomerRetention = async () => {
    try {
      // Get total unique customers
      const { data: uniqueCustomers, error: uniqueError } = await supabase
        .from('bookings')
        .select('phonenumber')
        .not('phonenumber', 'is', null)

      if (uniqueError) throw uniqueError

      // Get customers with multiple bookings
      const { data: repeatCustomers, error: repeatError } = await supabase
        .from('bookings')
        .select('phonenumber')
        .not('phonenumber', 'is', null)

      if (repeatError) throw repeatError

      // Count unique phone numbers
      const uniquePhones = new Set(uniqueCustomers.map(b => b.phonenumber))
      const repeatPhones = repeatCustomers.reduce((acc: { [key: string]: number }, booking) => {
        acc[booking.phonenumber] = (acc[booking.phonenumber] || 0) + 1
        return acc
      }, {})

      const repeatCount = Object.values(repeatPhones).filter(count => count > 1).length
      const totalUnique = uniquePhones.size

      const retentionRate = totalUnique > 0 ? (repeatCount / totalUnique) * 100 : 0
      setCustomerRetention(Math.round(retentionRate))
    } catch (error) {
      console.error('Error calculating customer retention:', error)
    }
  }

  const handlePinButtonClick = (number: string) => {
    if (pinInput.length < 4) {
      setPinInput(prev => [...prev, number])
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const enteredPin = pinInput.join('')
    if (enteredPin === PIN) {
      setIsAuthenticated(true)
      setShowPinInput(false)
      sessionStorage.setItem('adminAuthenticated', 'true')
      fetchDashboardData()
    } else {
      alert('Λάθος PIN. Παρακαλώ προσπαθήστε ξανά.')
      setPinInput([])
    }
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    const localDate = new Date().toISOString().split('T')[0]

    const { count: total } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    const { data: todayData, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', localDate)
      .order('time')

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setTotalBookings(total || 0)
      setTodayBookings(todayData as Booking[] || [])
    }
    setIsLoading(false)
  }

  const handleNewBooking = (newBooking: Booking) => {
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
      audioRef.current.play().catch(error => console.error('Error playing sound:', error))
    }
  }

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
    
    fetchDashboardData()
  }

  if (showPinInput) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="w-full max-w-md bg-black border border-orange-500/20 shadow-lg">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-white text-center">Είσοδος Διαχειριστή</h1>
            <div className="mb-4 text-white text-center">
              {pinInput.map((_, i) => '•').join(' ')}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button 
                  key={num} 
                  onClick={() => handlePinButtonClick(num.toString())} 
                  className="bg-black border border-orange-500/20 text-white hover:bg-orange-500/10"
                >
                  {num}
                </Button>
              ))}
              <Button 
                onClick={() => handlePinButtonClick('0')} 
                className="bg-black border border-orange-500/20 text-white hover:bg-orange-500/10 col-span-3"
              >
                0
              </Button>
            </div>
            <Button 
              onClick={handlePinSubmit} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Είσοδος
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-orange-500 text-2xl">Φόρτωση δεδομένων...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Πίνακας Ελέγχου</h1>
      
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="bg-black border border-orange-500/20 shadow-lg hover:border-orange-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Συνολικές Κρατήσεις</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{totalBookings}</div>
            <div className="text-sm text-gray-500">Όλες οι κρατήσεις</div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-orange-500/20 shadow-lg hover:border-orange-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Διατήρηση Πελατών</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{customerRetention}%</div>
            <div className="text-sm text-gray-500">Επαναλαμβανόμενοι πελάτες</div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-orange-500/20 shadow-lg hover:border-orange-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-orange-500 w-8 h-8" />
              <span className="text-sm font-medium text-gray-400">Σημερινές Κρατήσεις</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{todayBookings.length}</div>
            <Button 
              asChild 
              variant="outline" 
              className="w-full bg-black border border-orange-500/20 text-white hover:bg-orange-500/10"
            >
              <Link href="/modk/bookings">Προβολή Προγράμματος</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="bg-black border border-orange-500/20 shadow-lg hover:border-orange-500/40 transition-all duration-300 mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Calendar className="mr-2 text-orange-500" />
            Σημερινό Πρόγραμμα
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-black border border-orange-500/10 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{booking.time.slice(0, 5)}</span>
                    <span className="text-sm text-gray-400">{booking.service}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white">{booking.fullname}</span>
                    <a href={`tel:${booking.phonenumber}`} className="text-sm text-orange-500">
                      {booking.phonenumber}
                    </a>
                  </div>
                </div>
                <Select
                  value={booking.status}
                  onValueChange={(value) => handleUpdateBookingStatus(booking.id!, value)}
                >
                  <SelectTrigger className="w-[180px] bg-black border-orange-500/20 text-white">
                    <SelectValue placeholder="Ενημέρωση κατάστασης" />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-white border-orange-500/20">
                    <SelectItem value="pending" className="hover:bg-orange-500/10">Εκκρεμεί</SelectItem>
                    <SelectItem value="done" className="hover:bg-orange-500/10">Ολοκληρώθηκε</SelectItem>
                    <SelectItem value="cancelled" className="hover:bg-orange-500/10">Ακυρώθηκε</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {todayBookings.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Δεν υπάρχουν κρατήσεις για σήμερα
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Services */}
      <Card className="bg-black border border-orange-500/20 shadow-lg hover:border-orange-500/40 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <TrendingUp className="mr-2 text-orange-500" />
            Δημοφιλείς Υπηρεσίες
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={service.service} className="flex items-center justify-between p-4 bg-black border border-orange-500/10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <span className="text-orange-500 font-bold">#{index + 1}</span>
                  </div>
                  <span className="text-white">
                    {service.service}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">{service.count} κρατήσεις</span>
                  <span className="text-orange-500 font-bold">
                    {SERVICES_PRICING[service.service as keyof typeof SERVICES_PRICING] || 0}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <audio ref={audioRef} src="/notification-sound.wav" />
    </div>
  )
}