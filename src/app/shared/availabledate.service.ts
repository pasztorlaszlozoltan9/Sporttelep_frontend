import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AvailabledateService {

  constructor(private http: HttpClient) { 
  }

  getAvailableDates() {
    const url ='http://localhost:8000/api/availableDates';
    return this.http.get(url);
  }

  addAvailableDate(availableDate: any) {
    const url ='http://localhost:8000/api/availableDates';
    return this.http.post(url, availableDate);
  }
}
