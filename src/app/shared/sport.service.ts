import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SportService {


  constructor(private http: HttpClient) { }
  getSport() {
    const url ='http://localhost:8000/api/sports';
    return this.http.get(url);
  }
}
