import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    endTime: null,
    priceId: null,
    note: null
  };

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getBookings() {
    const url = 'http://localhost:8000/api/bookings';
    return this.http.get(url, { headers: this.getHeaders() });
  }

  addBooking(booking: any) {
    const url = 'http://localhost:8000/api/bookings';
    return this.http.post(url, booking, { headers: this.getHeaders() });
  }

  sendBookingSuccessEmailToUser(bookingId: number) {
    const url = `http://localhost:8000/api/bookings/${bookingId}/send-confirmation-email`;
    return this.http.post(url, {}, { headers: this.getHeaders() });
  }

  updateBooking(id: number, booking: any) {
    const url = `http://localhost:8000/api/bookings/${id}`;
    return this.http.put(url, booking, { headers: this.getHeaders() });
  }
  deleteBooking(id: number) {
    const url = `http://localhost:8000/api/bookings/${id}`;
    return this.http.delete(url, { headers: this.getHeaders() });
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
      endTime: null,
      priceId: null,
      note: null
    };
  }
}
