import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-students',
  templateUrl: './my-students.component.html',
  styleUrls: ['./my-students.component.scss']
})
export class MyStudentsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  allStudents: User[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      if (user) {
        this.currentUser = user;
        if (this.currentUser && this.currentUser.hasTeacherRights) {
          this.loadStudents();
        } else {
          this.snackBar.open('Access denied. This page is for teachers.', 'Close', { duration: 3000 });
          this.router.navigate(['/home']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private loadStudents(): void {
    if (!this.currentUser || !this.currentUser.teachingStudentIds) {
      this.isLoading = false;
      this.allStudents = [];
      return;
    }

    this.isLoading = true;
    this.allStudents = this.currentUser.teachingStudentIds
      .map(studentId => this.userService.getUserById(studentId))
      .filter(student => student !== null) as User[];

    this.isLoading = false;
  }
}
