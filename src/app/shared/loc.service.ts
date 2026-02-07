import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LocService {


  constructor(private http: HttpClient) { }
  getLocation() {
    const url ='http://localhost:8000/api/locations';
    return this.http.get(url);
  }
}
