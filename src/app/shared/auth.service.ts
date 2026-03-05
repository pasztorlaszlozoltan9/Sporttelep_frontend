import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  checkLoginStatus(): any {
    throw new Error('Method not implemented.');
  }

  isLoggedIn: boolean = false;

  host = 'http://localhost:8000/api/'
  constructor(private http: HttpClient, private router: Router) {}

  login(user: any) {
    const url = this.host + 'login'
    return this.http.post(url, user)
  }

  register(user:any){
    const url =this.host + "register"
    return this.http.post(url, user)
  }

  logout(){
    localStorage.removeItem('token');
    this.router.navigate(['/login']);

  }

  sendVerificationToken(token: string) {
    const url = this.host + '/verify-email/' + token
    return this.http.get(url)
  }
}