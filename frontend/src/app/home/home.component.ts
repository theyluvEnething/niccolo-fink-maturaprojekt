import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  userTitle = 'User';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
    if (this.currentUser) {
      this.userTitle = this.currentUser.hasTeacherRights ? 'Teacher' : 'Student';
    }
  }
}
