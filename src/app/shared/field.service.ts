import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FieldService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getFields() {
    const url ='http://localhost:8000/api/fields';
    return this.http.get(url, { headers: this.getHeaders() });
  }

  addField(field: any) {
    const url ='http://localhost:8000/api/fields';
    return this.http.post(url, field, { headers: this.getHeaders() });
  }
}
