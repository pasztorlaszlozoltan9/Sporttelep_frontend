import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  protected readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/users';

  getUsers() {
    return this.http.get(this.url);
  }

  addUser(user: any) {
    return this.http.post(this.url, user);
  }
}
