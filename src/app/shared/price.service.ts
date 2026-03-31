import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

   constructor(private http: HttpClient) { }

        private getHeaders(): HttpHeaders {
          const token = localStorage.getItem('token');
          return new HttpHeaders({
            'Authorization': `Bearer ${token}`
          });
        }

        getPrices() {
          const url ='http://localhost:8000/api/prices';
          return this.http.get(url, { headers: this.getHeaders() });
        }

        addPrice(price: any) {
          const url = 'http://localhost:8000/api/prices';
          return this.http.post(url, price, { headers: this.getHeaders() });
        }

    updatePrice(id: number, price: any) {
      const url = `http://localhost:8000/api/prices/${id}`;
      return this.http.put(url, price, { headers: this.getHeaders() });
    }

    deletePrice(id: number) {
      const url = `http://localhost:8000/api/prices/${id}`;
      return this.http.delete(url, { headers: this.getHeaders() });
    }
}
