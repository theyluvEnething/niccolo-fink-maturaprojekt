import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { BookingRequestService } from '../services/booking-request.service';
import { User } from '../models/user.model';
import { BookingRequest } from '../models/booking-request.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface ManageBookingViewModel extends BookingRequest {
  student?: User;
}

@Component({
  selector: 'app-manage-bookings',
  templateUrl: './manage-bookings.component.html',
  styleUrls: ['./manage-bookings.component.scss']
})
export class ManageBookingsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  allBookingRequests: ManageBookingViewModel[] = [];
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
        this.loadAllBookingRequests();
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

  loadAllBookingRequests(): void {
    if (!this.currentUser) return;
    this.isLoading = true;
    const rawRequests = this.bookingRequestService.getBookingRequestsForTeacher(this.currentUser.id);
    this.allBookingRequests = rawRequests.map(req => {
      const studentDetails = this.userService.getUserById(req.studentId);
      return { ...req, student: studentDetails || undefined };
    }).sort((a, b) => {
      const statusOrder = { 'pending': 1, 'accepted': 2, 'rejected': 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });
    this.isLoading = false;
  }

  acceptRequest(request: ManageBookingViewModel): void {
    if (request.status !== 'pending') {
      this.snackBar.open('This request is not pending and cannot be accepted.', 'Close', {duration: 3000});
      return;
    }
    const notes = this.teacherNotesMap[request.id] || '';
    const session = this.bookingRequestService.acceptBookingRequest(request.id, notes);
    if (session) {
      this.snackBar.open(`Booking request from ${request.student?.fullName || 'Student'} accepted.`, 'Close', { duration: 3000 });
      this.loadAllBookingRequests();
    } else {
      this.snackBar.open('Failed to accept booking request. The slot might be unavailable or an error occurred.', 'Close', { duration: 4000 });
      this.loadAllBookingRequests();
    }
  }

  rejectRequest(request: ManageBookingViewModel): void {
    if (request.status !== 'pending') {
      this.snackBar.open('This request is not pending and cannot be rejected.', 'Close', {duration: 3000});
      return;
    }
    const notes = this.teacherNotesMap[request.id] || '';
    const success = this.bookingRequestService.rejectBookingRequest(request.id, notes);
    if (success) {
      this.snackBar.open(`Booking request from ${request.student?.fullName || 'Student'} rejected.`, 'Close', { duration: 3000 });
      this.loadAllBookingRequests();
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

  getRequestDate(request: BookingRequest): string {
    return new Date(request.requestDate).toLocaleString();
  }

  getStatusClass(status: BookingRequest['status']): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }
}
