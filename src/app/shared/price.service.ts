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
}
