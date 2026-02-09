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
}
