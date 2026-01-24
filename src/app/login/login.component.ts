import { Component } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  loginForm !: any;

  constructor(
    private auth: AuthService,
    private builder: FormBuilder
  ) {}

  ngOnInit() {
    this.loginForm = this.builder.group({
      name: [''],
      password: [''],
      email: [''],
    })

  }

  login() {
    console.log('belépés...')
    console.log(this.loginForm.value)

    this.auth.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        console.log(response)
        localStorage.setItem('token', response.accessToken)
      },
      error: () => {}
    })    

  }

}
