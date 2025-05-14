import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isLoggedIn = false;

  constructor(private router: Router, private userService: UserService) {}

  logIn(type: 'student' | 'teacher' | 'versatile') {
    let user: User | null = null;
    if (type === 'student') {
      user = this.userService.login('student@email.com', '1234');
    } else if (type === 'teacher') {
      user = this.userService.login('teacher@email.com', '1234');
    } else {
      user = this.userService.login('magnus@email.com', '1234');
    }

    if (user) {
      this.isLoggedIn = true;
      this.router.navigate(['/home']);
    } else {
      this.isLoggedIn = false;
      console.error('Login failed');
    }
  }
}
