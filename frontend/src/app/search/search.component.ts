import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { TeacherDetailPopupComponent, TeacherDetailPopupData } from './components/teacher-detail-popup/teacher-detail-popup.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  allTeachers: User[] = [];
  filteredTeachers: User[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  private searchSubject = new Subject<string | null>();
  private searchSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.loadTeachers();
      } else {
        this.router.navigate(['/login']);
      }
    });

    this.searchSubscription = this.searchSubject.pipe(
      filter(term => term !== null),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyFilter(searchTerm as string);
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private loadTeachers(): void {
    this.isLoading = true;
    this.allTeachers = this.userService.getUsersWithTeacherRights();
    this.applyFilter(this.searchTerm);
    this.isLoading = false;
  }

  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  private applyFilter(term: string): void {
    if (!term) {
      this.filteredTeachers = [...this.allTeachers];
      return;
    }
    const lowerCaseTerm = term.toLowerCase();
    this.filteredTeachers = this.allTeachers.filter(teacher =>
      teacher.fullName.toLowerCase().includes(lowerCaseTerm) ||
      (teacher.chessTitle && teacher.chessTitle.toLowerCase().includes(lowerCaseTerm)) ||
      (teacher.rating && teacher.rating.toString().includes(lowerCaseTerm))
    );
  }

  openTeacherDetailPopup(teacher: User): void {
    if (!this.currentUser) {
      this.snackBar.open('You must be logged in to view teacher details.', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open<TeacherDetailPopupComponent, TeacherDetailPopupData, boolean>(
      TeacherDetailPopupComponent,
      {
        width: '450px',
        data: { teacher, currentUser: this.currentUser }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Potentially refresh data or UI if needed after subscription,
        // for now, the popup handles its own state for the button.
      }
    });
  }
}
