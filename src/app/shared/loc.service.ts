import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LocService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getLocation() {
    const url ='http://localhost:8000/api/locations';
    return this.http.get(url, { headers: this.getHeaders() });
  }

  addLocation(location: any) {
    const url ='http://localhost:8000/api/locations';
    return this.http.post(url, location, { headers: this.getHeaders() });
}

    updateLocation(id: number, location: any) {
    const url = `http://localhost:8000/api/locations/${id}`;
    return this.http.put(url, location, { headers: this.getHeaders() });
  }

  deleteLocation(id: number) {
    const url = `http://localhost:8000/api/locations/${id}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}
