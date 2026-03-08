import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingData: any = {
    sportId: null,
    locationId: null,
    fieldId: null,
    userId: null,
    date: null,
    startTime: null,
    availableDateId: null,
    priceId: null,
    note: null
  };

  constructor(private http: HttpClient) { }

  getBookings() {
    const url = 'http://localhost:8000/api/bookings';
    return this.http.get(url);
  }

  addBooking(booking: any) {
    const url = 'http://localhost:8000/api/bookings';
    return this.http.post(url, booking);
  }

  sendBookingSuccessEmailToUser(bookingId: number) {
    const url = `http://localhost:8000/api/bookings/${bookingId}/send-confirmation-email`;
    return this.http.post(url, {});
  }

  updateBooking(id: number, booking: any) {
    const url = `http://localhost:8000/api/bookings/${id}`;
    return this.http.put(url, booking);
  }
  deleteBooking(id: number) {
    const url = `http://localhost:8000/api/bookings/${id}`;
    return this.http.delete(url);
  }

  setBookingData(data: any): void {
    this.bookingData = { ...this.bookingData, ...data };
  }

  getBookingData(): any {
    return this.bookingData;
  }

  clearBookingData(): void {
    this.bookingData = {
      sportId: null,
      locationId: null,
      fieldId: null,
      userId: null,
      date: null,
      startTime: null,
      availableDateId: null,
      priceId: null,
      note: null
    };
  }
}
