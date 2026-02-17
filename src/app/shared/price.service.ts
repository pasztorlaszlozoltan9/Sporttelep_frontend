import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

   constructor(private http: HttpClient) { }
        getPrices() {
          const url ='http://localhost:8000/api/prices';
          return this.http.get(url);
        }

        addPrice(price: any) {
          const url = 'http://localhost:8000/api/prices';
          return this.http.post(url, price);
        }

    updatePrice(id: number, price: any) {
      const url = `http://localhost:8000/api/prices/${id}`;
      return this.http.put(url, price);
    }

    deletePrice(id: number) {
      const url = `http://localhost:8000/api/prices/${id}`;
      return this.http.delete(url);
    }
}
