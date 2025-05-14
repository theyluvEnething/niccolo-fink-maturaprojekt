import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SessionService } from '../services/session.service';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';
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
  pendingRequestsCount = 0; // Mocked for now
  totalStudentsCount = 0;

  recentActivityItems: ActivityItem[] = []; // Mocked for now

  private userSubscription: Subscription | undefined;
  private sessionsSubscription: Subscription | undefined;


  constructor(
    private userService: UserService,
    private sessionService: SessionService,
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

    if (this.currentUser.hasTeacherRights) {
      this.totalStudentsCount = this.currentUser.teachingStudentIds?.length || 0;
      const teacherSessions = this.sessionService.getSessionsForTeacher(this.currentUser.id);
      this.upcomingLessonsCount = teacherSessions.filter(s => new Date(this.getSlotDate(s.availabilitySlotId)) >= new Date()).length;

      this.recentActivityItems = [
        { message: 'New lesson booked by Alex P. for Friday.', type: 'success' },
        { message: 'Availability updated: Added new slots for next week.', type: 'warning' }
      ];
      this.pendingRequestsCount = 1; // Mock
    } else {
      const studentSessions = this.sessionService.getSessionsForStudent(this.currentUser.id);
      this.upcomingLessonsCount = studentSessions.filter(s => new Date(this.getSlotDate(s.availabilitySlotId)) >= new Date()).length;
      this.recentActivityItems = [
        { message: 'Lesson with GM Magnus confirmed for tomorrow.', type: 'success' },
        { message: 'Reminder: Upcoming lesson in 2 days.', type: 'info' }
      ];
      this.pendingRequestsCount = 0; // Students don't have pending requests in this model
      this.totalStudentsCount = 0; // Not applicable for students
    }
  }

  getSlotDate(slotId: string): string {
    const slot = this.userService.getAvailabilitySlotById(slotId);
    return slot ? slot.date : new Date(0).toISOString(); // Return epoch if slot not found
  }


  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.sessionsSubscription) {
      this.sessionsSubscription.unsubscribe();
    }
  }
}
