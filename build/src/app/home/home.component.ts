import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SessionService } from '../services/session.service';
import { BookingRequestService } from '../services/booking-request.service';
import { User } from '../models/user.model';
import { Subscription } from 'rxjs';

interface ActivityItem {
  message: string;
  type: 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  pageTitle = 'Dashboard';

  upcomingLessonsCount = 0;
  pendingRequestsCount = 0;
  totalStudentsCount = 0;

  recentActivityItems: ActivityItem[] = [];

  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private sessionService: SessionService,
    private bookingRequestService: BookingRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.pageTitle = this.currentUser.hasTeacherRights ? 'Teacher Dashboard' : 'Student Dashboard';
        this.loadDashboardData();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  loadDashboardData(): void {
    if (!this.currentUser) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (this.currentUser.hasTeacherRights) {
      this.totalStudentsCount = this.currentUser.teachingStudentIds?.length || 0;

      const teacherSessions = this.sessionService.getSessionsForTeacher(this.currentUser.id);
      this.upcomingLessonsCount = teacherSessions.filter(s => {
        const slot = this.userService.getAvailabilitySlotById(s.availabilitySlotId);
        return slot && new Date(slot.date) >= now;
      }).length;

      this.pendingRequestsCount = this.bookingRequestService.getBookingRequestsForTeacher(this.currentUser.id, 'pending').length;

      this.recentActivityItems = [
        { message: 'New lesson booked by Alex P. for Friday.', type: 'success' },
        { message: 'Availability updated: Added new slots for next week.', type: 'warning' }
      ];
    } else {
      const studentSessions = this.sessionService.getSessionsForStudent(this.currentUser.id);
      this.upcomingLessonsCount = studentSessions.filter(s => {
        const slot = this.userService.getAvailabilitySlotById(s.availabilitySlotId);
        return slot && new Date(slot.date) >= now;
      }).length;

      this.recentActivityItems = [
        { message: 'Lesson with GM Magnus confirmed for tomorrow.', type: 'success' },
        { message: 'Reminder: Upcoming lesson in 2 days.', type: 'info' }
      ];
      this.pendingRequestsCount = 0;
      this.totalStudentsCount = 0;
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
