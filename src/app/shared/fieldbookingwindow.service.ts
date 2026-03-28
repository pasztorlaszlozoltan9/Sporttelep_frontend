import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FieldBookingWindowService {
  private readonly url = 'http://localhost:8000/api/field-booking-windows';

  constructor(private http: HttpClient) {}

  getFieldBookingWindows() {
    return this.http.get(this.url);
  }

  addFieldBookingWindow(windowData: any) {
    return this.http.post(this.url, windowData);
  }

  updateFieldBookingWindow(id: number, windowData: any) {
    return this.http.put(`${this.url}/${id}`, windowData);
  }

  deleteFieldBookingWindow(id: number) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
