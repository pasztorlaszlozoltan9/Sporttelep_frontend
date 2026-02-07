import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
 
    constructor(private http: HttpClient) { }
      getAvailableDates() {
        const url ='http://localhost:8000/api/availabledates';
        return this.http.get(url);
      }
  }
