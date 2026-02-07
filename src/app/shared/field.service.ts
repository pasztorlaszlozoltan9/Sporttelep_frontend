import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FieldService {

   constructor(private http: HttpClient) { }
        getFields() {
          const url ='http://localhost:8000/api/fields';
          return this.http.get(url);
        }
}
