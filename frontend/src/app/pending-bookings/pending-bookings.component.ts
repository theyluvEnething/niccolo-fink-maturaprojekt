import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { BookingRequestService } from '../services/booking-request.service';
import { User } from '../models/user.model';
import { BookingRequest } from '../models/booking-request.model';
import { Session } from '../models/session.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface PendingBookingViewModel extends BookingRequest {
  student?: User;
}

@Component({
  selector: 'app-pending-bookings',
  templateUrl: './pending-bookings.component.html',
  styleUrls: ['./pending-bookings.component.scss']
})
export class PendingBookingsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  pendingRequests: PendingBookingViewModel[] = [];
  isLoading: boolean = false;
  teacherNotesMap: { [requestId: string]: string } = {};

  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private bookingRequestService: BookingRequestService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      this.currentUser = user;
      if (this.currentUser && this.currentUser.hasTeacherRights) {
        this.loadPendingRequests();
      } else if (this.currentUser) {
        this.snackBar.open('Access denied. This page is for teachers.', 'Close', { duration: 3000 });
        this.router.navigate(['/home']);
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

  loadPendingRequests(): void {
    if (!this.currentUser) return;
    this.isLoading = true;
    const rawRequests = this.bookingRequestService.getBookingRequestsForTeacher(this.currentUser.id, 'pending');
    this.pendingRequests = rawRequests.map(req => {
      const studentDetails = this.userService.getUserById(req.studentId);
      return { ...req, student: studentDetails || undefined };
    }).sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
    this.isLoading = false;
  }

  acceptRequest(request: PendingBookingViewModel): void {
    const notes = this.teacherNotesMap[request.id] || '';
    const session = this.bookingRequestService.acceptBookingRequest(request.id, notes);
    if (session) {
      this.snackBar.open(`Booking request from ${request.student?.fullName || 'Student'} accepted.`, 'Close', { duration: 3000 });
      this.loadPendingRequests(); // Refresh list
    } else {
      this.snackBar.open('Failed to accept booking request. The slot might be unavailable.', 'Close', { duration: 4000 });
      this.loadPendingRequests(); // Refresh list as status might have changed to rejected
    }
  }

  rejectRequest(request: PendingBookingViewModel): void {
    const notes = this.teacherNotesMap[request.id] || '';
    const success = this.bookingRequestService.rejectBookingRequest(request.id, notes);
    if (success) {
      this.snackBar.open(`Booking request from ${request.student?.fullName || 'Student'} rejected.`, 'Close', { duration: 3000 });
      this.loadPendingRequests(); // Refresh list
    } else {
      this.snackBar.open('Failed to reject booking request.', 'Close', { duration: 3000 });
    }
  }

  formatRequestTime(request: BookingRequest): string {
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const formatHour = (value: number): string => {
      const hour = Math.floor(value);
      const minutes = Math.round((value % 1) * 60);
      return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    return `${formatDate(request.requestedDate)}, ${formatHour(request.requestedStartHour)} - ${formatHour(request.requestedEndHour)}`;
  }
}
