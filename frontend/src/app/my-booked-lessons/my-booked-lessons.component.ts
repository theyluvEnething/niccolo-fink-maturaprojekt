import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { UserService } from '../services/user.service';
import { SessionService } from '../services/session.service';
import { BookingRequestService } from '../services/booking-request.service';
import { User, CalendarAvailability } from '../models/user.model';
import { Session } from '../models/session.model';
import { BookingRequest } from '../models/booking-request.model';

interface BookedLessonViewModel {
  session: Session;
  teacher: User | null;
  slot?: CalendarAvailability;
  bookingRequest: BookingRequest | null;
  lessonDate: Date | null;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-my-booked-lessons',
  templateUrl: './my-booked-lessons.component.html',
  styleUrls: ['./my-booked-lessons.component.scss']
})
export class MyBookedLessonsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  bookedLessons: BookedLessonViewModel[] = [];
  isLoading: boolean = true;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private sessionService: SessionService,
    private bookingRequestService: BookingRequestService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.loadBookedLessons();
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

  private loadBookedLessons(): void {
    if (!this.currentUser) return;
    this.isLoading = true;
    const studentSessions = this.sessionService.getSessionsForStudent(this.currentUser.id);

    this.bookedLessons = studentSessions.map(session => {
      const teacher = this.userService.getUserById(session.teacherId);
      const slot = this.userService.getAvailabilitySlotById(session.availabilitySlotId);
      const bookingRequest = session.bookingRequestId
        ? this.bookingRequestService.getBookingRequestById(session.bookingRequestId)
        : null;

      return {
        session,
        teacher,
        slot: slot || undefined,
        bookingRequest: bookingRequest || null,
        lessonDate: slot ? new Date(slot.date) : null,
        startTime: slot ? this.formatDecimalHour(slot.startHour) : 'N/A',
        endTime: slot ? this.formatDecimalHour(slot.endHour) : 'N/A'
      };
    }).filter(lesson => lesson.lessonDate !== null && lesson.lessonDate >= new Date(new Date().setHours(0,0,0,0)) )
      .sort((a, b) => {
        if (!a.lessonDate || !b.lessonDate) return 0;
        const dateComparison = a.lessonDate.getTime() - b.lessonDate.getTime();
        if (dateComparison !== 0) return dateComparison;
        if (a.slot && b.slot) return a.slot.startHour - b.slot.startHour;
        return 0;
      });

    this.isLoading = false;
  }

  formatDecimalHour(value: number): string {
    const hour = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  cancelLesson(session: Session): void {
    if (this.sessionService.cancelSession(session.id)) {
      this.snackBar.open('Lesson cancelled successfully.', 'Close', { duration: 3000 });
      this.loadBookedLessons();
    } else {
      this.snackBar.open('Failed to cancel lesson.', 'Close', { duration: 3000 });
    }
  }
}
