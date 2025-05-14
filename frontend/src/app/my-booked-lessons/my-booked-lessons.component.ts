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

interface DisplayableLessonItem {
  type: 'confirmed' | 'pending';
  id: string; // Session ID or BookingRequest ID
  teacher: User | null;
  slot?: CalendarAvailability;
  bookingRequest?: BookingRequest | null; // Only for pending or if session originated from a request
  session?: Session; // Only for confirmed
  lessonDate: Date | null;
  startTime: string;
  endTime: string;
  statusText: string;
}

@Component({
  selector: 'app-my-booked-lessons',
  templateUrl: './my-booked-lessons.component.html',
  styleUrls: ['./my-booked-lessons.component.scss']
})
export class MyBookedLessonsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  displayableItems: DisplayableLessonItem[] = [];
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
        this.loadDisplayableItems();
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

  private loadDisplayableItems(): void {
    if (!this.currentUser) return;
    this.isLoading = true;

    const confirmedLessons: DisplayableLessonItem[] = this.sessionService.getSessionsForStudent(this.currentUser.id)
      .map(session => {
        const teacher = this.userService.getUserById(session.teacherId);
        const slot = this.userService.getAvailabilitySlotById(session.availabilitySlotId);
        const bookingRequest = session.bookingRequestId
          ? this.bookingRequestService.getBookingRequestById(session.bookingRequestId)
          : null;
        return {
          type: 'confirmed',
          id: session.id,
          session,
          teacher,
          slot: slot || undefined,
          bookingRequest: bookingRequest || null,
          lessonDate: slot ? new Date(slot.date) : null,
          startTime: slot ? this.formatDecimalHour(slot.startHour) : 'N/A',
          endTime: slot ? this.formatDecimalHour(slot.endHour) : 'N/A',
          statusText: 'Confirmed'
        };
      });

    const pendingRequests: DisplayableLessonItem[] = this.bookingRequestService.getBookingRequestsForStudent(this.currentUser.id, 'pending')
      .map(request => {
        const teacher = this.userService.getUserById(request.teacherId);
        const slot = this.userService.getAvailabilitySlotById(request.availabilitySlotId);
        return {
          type: 'pending',
          id: request.id,
          bookingRequest: request,
          teacher,
          slot: slot || undefined,
          lessonDate: slot ? new Date(slot.date) : null,
          startTime: slot ? this.formatDecimalHour(slot.startHour) : 'N/A',
          endTime: slot ? this.formatDecimalHour(slot.endHour) : 'N/A',
          statusText: 'Pending Approval'
        };
      });

    this.displayableItems = [...confirmedLessons, ...pendingRequests]
      .filter(item => item.lessonDate !== null && item.lessonDate >= new Date(new Date().setHours(0,0,0,0)))
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

  cancelItem(item: DisplayableLessonItem): void {
    if (!this.currentUser) return;

    if (item.type === 'confirmed' && item.session) {
      if (this.sessionService.cancelSession(item.session.id)) {
        this.snackBar.open('Lesson cancelled successfully.', 'Close', { duration: 3000 });
        this.loadDisplayableItems();
      } else {
        this.snackBar.open('Failed to cancel lesson.', 'Close', { duration: 3000 });
      }
    } else if (item.type === 'pending' && item.bookingRequest) {
      if (this.bookingRequestService.cancelBookingRequestByStudent(item.bookingRequest.id, this.currentUser.id)) {
        this.snackBar.open('Booking request cancelled successfully.', 'Close', { duration: 3000 });
        this.loadDisplayableItems();
      } else {
        this.snackBar.open('Failed to cancel booking request.', 'Close', { duration: 3000 });
      }
    }
  }
}
