'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { supabase } from '@/utils/supabase'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Save } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const timeSlots = Array.from({ length: 31 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

export default function WorkingHoursPage() {
  const [generalHours, setGeneralHours] = useState<Record<string, { isOpen: boolean, start: string, end: string }>>(
    daysOfWeek.reduce((acc, day) => ({
      ...acc,
      [day]: { isOpen: false, start: '09:00', end: '17:00' }
    }), {})
  )
  const [specificDate, setSpecificDate] = useState<Date | undefined>(undefined)
  const [specificHours, setSpecificHours] = useState({ isOpen: true, start: '09:00', end: '17:00' })
  const [isLoading, setIsLoading] = useState(false)
  const [savedSpecificDates, setSavedSpecificDates] = useState<any[]>([])
  const [breaks, setBreaks] = useState<Record<string, { start: string, end: string }[]>>(
    daysOfWeek.reduce((acc, day) => ({
      ...acc,
      [day]: [] // Initialize with empty breaks
    }), {})
  )
  const [newBreak, setNewBreak] = useState<{ day: string, start: string, end: string }>({ day: 'Monday', start: '', end: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkingHours()
    fetchSpecificDates()
  }, [])

  const fetchWorkingHours = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')

    if (error) {
      console.error('Error fetching working hours:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch working hours. You can still set new hours.",
      })
    } else if (data) {
      const hoursObj = daysOfWeek.reduce((acc, day, index) => {
        const dbRow = data.find(row => row.day_of_week === index + 1)
        return {
          ...acc,
          [day]: {
            isOpen: !!dbRow,
            start: dbRow ? dbRow.start_time : '09:00',
            end: dbRow ? dbRow.end_time : '17:00'
          }
        }
      }, {})
      setGeneralHours(hoursObj)
    }
    setIsLoading(false)
  }

  const handleGeneralHoursChange = (day: string, field: string, value: any) => {
    setGeneralHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const saveGeneralHours = async () => {
    setIsLoading(true)
    
    // First, delete all existing records
    const { error: deleteError } = await supabase
      .from('working_hours')
      .delete()
      .not('day_of_week', 'is', null) // This ensures we don't accidentally delete any rows with null day_of_week

    if (deleteError) {
      console.error('Error deleting existing hours:', deleteError)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update working hours. Please try again.",
      })
      setIsLoading(false)
      return
    }

    // Then, insert new records
    const { error: insertError } = await supabase
      .from('working_hours')
      .insert(
        Object.entries(generalHours)
          .filter(([_, hours]) => hours.isOpen) // Only insert for open days
          .map(([day, hours]) => ({
            day_of_week: daysOfWeek.indexOf(day) + 1,
            start_time: hours.start,
            end_time: hours.end
          }))
      )

    if (insertError) {
      console.error('Error saving general hours:', insertError)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save general hours. Please try again.",
      })
    } else {
      await fetchWorkingHours() // Fetch updated hours
      toast({
        title: "Success",
        description: "General working hours updated successfully.",
      })
    }
    setIsLoading(false)
  }

  const fetchSpecificDates = async () => {
    const { data, error } = await supabase
      .from('special_hours')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching special dates:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch special dates.",
      })
    } else {
      setSavedSpecificDates(data || [])
    }
  }

  const handleSpecificHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!specificDate) return

    const formattedDate = format(specificDate, 'yyyy-MM-dd')

    // Use '00:00' for start_time and end_time to indicate a closed day
    const specialHours = {
      date: formattedDate,
      start_time: specificHours.isOpen ? specificHours.start : '00:00',
      end_time: specificHours.isOpen ? specificHours.end : '00:00'
    }

    const { error } = await supabase
      .from('special_hours')
      .upsert(specialHours, { onConflict: 'date' })

    if (error) {
      console.error('Error saving special hours:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save special hours. Please try again.",
      })
    } else {
      toast({
        title: "Success",
        description: "Special working hours set successfully.",
      })
      // Reset form and fetch updated special dates
      setSpecificDate(undefined)
      setSpecificHours({ isOpen: true, start: '09:00', end: '17:00' })
      fetchSpecificDates()
    }
  }

  const addBreak = async () => {
    const { error } = await supabase
      .from('breaks') // Assuming the table name is 'breaks'
      .insert({
        day_of_week: daysOfWeek.indexOf(newBreak.day) + 1,
        start_time: newBreak.start,
        end_time: newBreak.end
      })

    if (error) {
      console.error('Error adding break:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add break. Please try again.",
      })
    } else {
      // Update local state to reflect the new break
      setBreaks(prev => ({
        ...prev,
        [newBreak.day]: [...prev[newBreak.day], { start: newBreak.start, end: newBreak.end }]
      }))
      toast({
        title: "Success",
        description: "Break added successfully.",
      })
      setNewBreak({ day: 'Monday', start: '', end: '' }) // Reset form
    }
  }

  const clearBreaks = async (day: string) => {
    const { error } = await supabase
      .from('breaks')
      .delete()
      .eq('day_of_week', daysOfWeek.indexOf(day) + 1)

    if (error) {
      console.error('Error clearing breaks:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear breaks. Please try again.",
      })
    } else {
      setBreaks(prev => ({ ...prev, [day]: [] })) // Clear local state
      toast({
        title: "Success",
        description: "Breaks cleared successfully.",
      })
    }
  }

  return (
    <div className="space-y-8 p-6 bg-gray-900 min-h-screen text-white">
      <Card className="bg-gray-800 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            <Clock className="mr-2 text-orange-500" />
            Γενικές Ώρες Εργασίας
          </CardTitle>
        </CardHeader>
        <CardContent>
          {daysOfWeek.map(day => (
            <div key={day} className="flex items-center space-x-4 mb-4">
              <Switch
                checked={generalHours[day]?.isOpen}
                onCheckedChange={(checked) => handleGeneralHoursChange(day, 'isOpen', checked)}
              />
              <span className="w-24 text-white">{translateDay(day)}</span>
              {generalHours[day]?.isOpen ? (
                <>
                  <Select
                    value={generalHours[day]?.start}
                    onValueChange={(value) => handleGeneralHoursChange(day, 'start', value)}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Ώρα έναρξης" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time} className="hover:bg-gray-700">{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-white">έως</span>
                  <Select
                    value={generalHours[day]?.end}
                    onValueChange={(value) => handleGeneralHoursChange(day, 'end', value)}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Ώρα λήξης" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time} className="hover:bg-gray-700">{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <span className="text-red-400 font-bold">ΚΛΕΙΣΤΟ</span>
              )}
            </div>
          ))}
          <Button 
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" 
            onClick={saveGeneralHours}
            disabled={isLoading}
          >
            {isLoading ? 'Αποθήκευση...' : 'Αποθήκευση Γενικών Ωρών'}
          </Button>

          <div className="mt-8 border-t border-gray-700 pt-4">
            <h3 className="text-xl font-semibold mb-4">Τρέχουσες Ώρες Εργασίας</h3>
            {daysOfWeek.map(day => (
              <div key={`saved-${day}`} className="flex items-center space-x-4 mb-2">
                <span className="w-24 text-white">{translateDay(day)}:</span>
                {generalHours[day]?.isOpen ? (
                  <span className="text-green-400">
                    Ανοιχτά {generalHours[day].start} - {generalHours[day].end}
                  </span>
                ) : (
                  <span className="text-red-400">Κλειστά</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            <Calendar className="mr-2 text-orange-500" />
            Ειδικές Ώρες Ημερομηνίας
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSpecificHoursSubmit} className="space-y-4">
            <div>
              <Label htmlFor="specificDate" className="text-white">Ημερομηνία</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal bg-gray-700 text-white border-gray-600 ${!specificDate && "text-muted-foreground"}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {specificDate ? format(specificDate, "PPP") : <span>Επιλέξτε ημερομηνία</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <CalendarComponent
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-4">
              <Switch
                checked={specificHours.isOpen}
                onCheckedChange={(checked) => setSpecificHours(prev => ({ ...prev, isOpen: checked }))}
              />
              <span className="text-white">Ανοιχτά</span>
              {specificHours.isOpen ? (
                <>
                  <Select
                    value={specificHours.start}
                    onValueChange={(value) => setSpecificHours(prev => ({ ...prev, start: value }))}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Ώρα έναρξης" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time} className="hover:bg-gray-700">{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-white">έως</span>
                  <Select
                    value={specificHours.end}
                    onValueChange={(value) => setSpecificHours(prev => ({ ...prev, end: value }))}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Ώρα λήξης" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time} className="hover:bg-gray-700">{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <span className="text-red-400 font-bold">ΚΛΕΙΣΤΟ</span>
              )}
            </div>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
              <Save className="mr-2 h-4 w-4" /> Ορισμός Ειδικών Ωρών
            </Button>
          </form>

          <div className="mt-8 border-t border-gray-700 pt-4">
            <h3 className="text-xl font-semibold mb-4">Αποθηκευμένες Ειδικές Ημερομηνίες</h3>
            {savedSpecificDates.length === 0 ? (
              <p className="text-gray-400">Δεν έχουν οριστεί ακόμη ειδικές ημερομηνίες.</p>
            ) : (
              savedSpecificDates.map((date) => (
                <div key={date.id} className="flex items-center space-x-4 mb-2">
                  <span className="w-32 text-white">{format(new Date(date.date), 'PPP')}:</span>
                  {date.start_time === '00:00' && date.end_time === '00:00' ? (
                    <span className="text-red-400 font-bold">ΚΛΕΙΣΤΟ</span>
                  ) : (
                    <span className="text-green-400">
                      Ανοιχτά {date.start_time.slice(0, 5)} - {date.end_time.slice(0, 5)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 border-t border-gray-700 pt-4">
        <h3 className="text-xl font-semibold mb-4">Διαλείμματα</h3>
        <div className="flex items-center space-x-4 mb-4">
          <Select
            value={newBreak.day}
            onValueChange={(value) => setNewBreak(prev => ({ ...prev, day: value }))}
          >
            <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Επιλέξτε ημέρα" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              {daysOfWeek.map(day => (
                <SelectItem key={day} value={day} className="hover:bg-gray-700">{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={newBreak.start}
            onValueChange={(value) => setNewBreak(prev => ({ ...prev, start: value }))}
          >
            <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Ώρα έναρξης" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              {timeSlots.map(time => (
                <SelectItem key={time} value={time} className="hover:bg-gray-700">{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={newBreak.end}
            onValueChange={(value) => setNewBreak(prev => ({ ...prev, end: value }))}
          >
            <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Ώρα λήξης" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              {timeSlots.map(time => (
                <SelectItem key={time} value={time} className="hover:bg-gray-700">{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addBreak} className="bg-orange-500 hover:bg-orange-600 text-white">
            Προσθήκη Διαλείμματος
          </Button>
        </div>

        {daysOfWeek.map(day => (
          <div key={day} className="flex items-center space-x-4 mb-2">
            <span className="w-24 text-white">{translateDay(day)}:</span>
            {breaks[day].length > 0 ? (
              <>
                {breaks[day].map((breakItem, index) => (
                  <span key={index} className="text-green-400">
                    {breakItem.start} - {breakItem.end}
                  </span>
                ))}
                <Button onClick={() => clearBreaks(day)} className="text-red-400">
                  Διαγραφή Διαλειμμάτων
                </Button>
              </>
            ) : (
              <span className="text-red-400">Δεν υπάρχουν διαλείμματα</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function translateDay(day: string): string {
  const translations: Record<string, string> = {
    'Monday': 'Δευτέρα',
    'Tuesday': 'Τρίτη',
    'Wednesday': 'Τετάρτη',
    'Thursday': 'Πέμπτη',
    'Friday': 'Παρασκευή',
    'Saturday': 'Σάββατο',
    'Sunday': 'Κυριακή'
  }
  return translations[day] || day
}