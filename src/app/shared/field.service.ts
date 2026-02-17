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

   updateField(id: number, field: any) {
    const url = `http://localhost:8000/api/fields/${id}`;
    return this.http.put(url, field, { headers: this.getHeaders() });
  }

  deleteField(id: number) {
    const url = `http://localhost:8000/api/fields/${id}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}
