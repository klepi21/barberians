import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, PlusCircle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Booking = {
    id: number
    date: string
    time: string
    service: string
    fullname: string
    status: string
  }

type MobileBookingsProps = {
  todayBookings: Booking[];
  handleUpdateBookingStatus: (id: number, status: string) => Promise<void>;
};

const MobileBookings: React.FC<MobileBookingsProps> = ({ todayBookings, handleUpdateBookingStatus }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Πρόγραμμα Σήμερα</h2>
      {todayBookings.length > 0 ? (
        todayBookings.map((booking) => (
          <Card key={booking.id} className="bg-gray-700 border-none shadow-lg mb-4">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <User className="text-orange-400 mr-2" />
                <p className="text-white font-medium">{booking.fullname}</p>
                {booking.status === 'done' && <CheckCircle className="text-green-500 ml-2" />}
                {booking.status === 'pending' && <span className="text-yellow-500 ml-2">Pending</span>}
              </div>
              <div className="flex items-center mb-2">
                <Clock className="text-orange-400 mr-2" />
                <p className="text-gray-300">{booking.time.split(':').slice(0, 2).join(':')}</p>
              </div>
              <div className="flex items-center">
                <PlusCircle className="text-orange-400 mr-2" />
                <p className="text-gray-300">{booking.service}</p>
              </div>
              <Select
                value={booking.status}
                onValueChange={(value) => handleUpdateBookingStatus(booking.id, value)}
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
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-gray-400">Δεν υπάρχουν κρατήσεις για σήμερα.</p>
      )}
    </div>
  );
};

export default MobileBookings;
