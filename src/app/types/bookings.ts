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
  }
  
  export interface Service {
    name: string
    price: number
    duration: number
  }