import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  loginForm !: any;
  registerForm !: any;

  constructor(
    private auth: AuthService,
    private builder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.builder.group({
      name: [''],
      password: [''],
      email: [''],
    });
    this.registerForm = this.builder.group({
      name: [''],
      email: [''],
      phone: [''],
      fullname: [''],
      password: [''],
      password_confirmation: ['']
    })

  }

  login() {
    console.log('belépés...')
    if (!this.loginForm) { console.error('loginForm not initialized'); return }
    console.log(this.loginForm.value)

    this.auth.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        console.log(response)
        localStorage.setItem('token', response.accessToken)
        this.router.navigate(['/profil'])
      },
      error: () => {}
    })    

  }

  register() {
    console.log('regisztráció...')
    if (!this.registerForm) { console.error('registerForm not initialized'); return }
    console.log(this.registerForm.value)
    
    this.auth.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        console.log(response)
        localStorage.setItem('token', response.accessToken)
        this.router.navigate(['/profil'])
      },
      error:()=>{}
      
    })
  }

}
