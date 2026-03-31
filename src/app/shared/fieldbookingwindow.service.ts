import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FieldBookingWindowService {
  private readonly url = 'http://localhost:8000/api/field-booking-windows';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getFieldBookingWindows() {
    return this.http.get(this.url, { headers: this.getHeaders() });
  }

  addFieldBookingWindow(windowData: any) {
    return this.http.post(this.url, windowData, { headers: this.getHeaders() });
  }

  updateFieldBookingWindow(id: number, windowData: any) {
    return this.http.put(`${this.url}/${id}`, windowData, { headers: this.getHeaders() });
  }

  deleteFieldBookingWindow(id: number) {
    return this.http.delete(`${this.url}/${id}`, { headers: this.getHeaders() });
  }
}
