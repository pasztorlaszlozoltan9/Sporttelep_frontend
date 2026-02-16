import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  host = 'http://localhost:8000/api/';

  constructor(private router: Router, private http: HttpClient) { }

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const userId = decodedToken.id;
      // console.log('Decoded token:', decodedToken);

      // Fetch user data to check roleId
      this.http.get(`${this.host}users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).subscribe({
        next: (response: any) => {
          const user = response.data;
          // console.log('User roleId:', user.roleId);
          if (user.roleId == 1) {
            // console.log('User is  admin, redirecting to admin');
            this.router.navigate(['/admin']);
          } else {
            // console.log('User is not admin, redirecting to profil');
            this.router.navigate(['/profil']);
          }
    },
        error: (error) => {
          console.error('Error fetching user data:', error);
          this.router.navigate(['/login']);
        }
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

