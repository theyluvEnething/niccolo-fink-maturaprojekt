import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-students',
  templateUrl: './my-students.component.html',
  styleUrls: ['./my-students.component.scss']
})
export class MyStudentsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  allStudentsRaw: User[] = [];
  filteredStudents: User[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  private userSubscription: Subscription | undefined;
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | undefined;

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
          this.loadAndFilterStudents();
        } else {
          this.snackBar.open('Access denied. This page is for teachers.', 'Close', { duration: 3000 });
          this.router.navigate(['/home']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.applyFilterToStudents(term);
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private loadAndFilterStudents(): void {
    this.isLoading = true;
    if (!this.currentUser || !this.currentUser.teachingStudentIds) {
      this.allStudentsRaw = [];
      this.filteredStudents = [];
      this.isLoading = false;
      return;
    }

    this.allStudentsRaw = this.currentUser.teachingStudentIds
      .map(studentId => this.userService.getUserById(studentId))
      .filter(student => student !== null) as User[];

    this.applyFilterToStudents(this.searchTerm);
    this.isLoading = false;
  }

  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  private applyFilterToStudents(term: string): void {
    if (!term) {
      this.filteredStudents = [...this.allStudentsRaw];
      return;
    }
    const lowerCaseTerm = term.toLowerCase();
    this.filteredStudents = this.allStudentsRaw.filter(student =>
      student.fullName.toLowerCase().includes(lowerCaseTerm) ||
      student.email.toLowerCase().includes(lowerCaseTerm) ||
      (student.chessTitle && student.chessTitle.toLowerCase().includes(lowerCaseTerm)) ||
      (student.rating && student.rating.toString().includes(lowerCaseTerm))
    );
  }
}
