import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SportService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getSport() {
    const url ='http://localhost:8000/api/sports';
    return this.http.get(url, { headers: this.getHeaders() });
  }

  addSport(sport: any) {
    const url ='http://localhost:8000/api/sports';
    return this.http.post(url, sport, { headers: this.getHeaders() });
  }
}
