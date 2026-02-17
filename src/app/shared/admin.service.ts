import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AvailabledateService } from './availabledate.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  protected readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/users';
  private readonly registerUrl = 'http://localhost:8000/api/register';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers() {
    return this.http.get(this.url, { headers: this.getHeaders() });
  }

  addUser(user: any) {
    return this.http.post(this.registerUrl, user, { headers: this.getHeaders() });
  }

  updateUser(id: number, user: any) {
    const url = `${this.url}/${id}`;
    return this.http.put(url, user, { headers: this.getHeaders() });
  }

  deleteUser(id: number) {
    const url = `${this.url}/${id}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}
