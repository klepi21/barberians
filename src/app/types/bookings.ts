export interface Booking {
    id?: number;
    user_id?: number;
    date: string;
    time: string;
    service: string;
    status: string;
    email: string;
    fullname: string;
    phonenumber: string;
    barber: string;
  }
  
  export interface Service {
    name: string
    price: number
    duration: number
  }

  export interface WorkingHours {
    id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }
  
  export interface SpecialHours {
    id?: number;
    date: string;
    start_time: string;
    end_time: string;
  }