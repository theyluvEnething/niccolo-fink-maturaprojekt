import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { BookingRequestService } from '../services/booking-request.service';
import { User, CalendarAvailability } from '../models/user.model';
import { BookingRequestPopupComponent, BookingRequestPopupData } from './components/booking-request-popup/booking-request-popup.component';
import { Subscription } from 'rxjs';

interface LessonDayViewModel {
  date: Date;
  dateString: string;
  dayOfMonth: number;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  statusColor: 'default' | 'green';
  statusText: string;
  availableSlotsOnDay: CalendarAvailability[];
  teacherDetailsMap: Map<string, User>;
}

@Component({
  selector: 'app-lesson-bookings',
  templateUrl: './lesson-bookings.component.html',
  styleUrls: ['./lesson-bookings.component.scss']
})
export class LessonBookingsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  calendarWeeks: LessonDayViewModel[][] = [];
  weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  isLoading: boolean = false;
  currentMonthDisplay: string = '';
  private readonly numberOfWeeksToDisplay = 5;
  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private bookingRequestService: BookingRequestService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.loadSubscribedTeachersAvailability();
      } else {
        this.calendarWeeks = [];
        this.snackBar.open('Please log in to view lesson bookings.', 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private loadSubscribedTeachersAvailability(): void {
    if (!this.currentUser || !this.currentUser.subscribedTeacherIds || this.currentUser.subscribedTeacherIds.length === 0) {
      this.snackBar.open('You are not subscribed to any teachers.', 'Close', { duration: 3000 });
      this.calendarWeeks = [];
      this.isLoading = false;
      return;
    }
    this.isLoading = true;

    const today = new Date();
    const firstDayOfCalendar = this.getMondayOfWeek(today);
    const lastDayOfCalendar = new Date(firstDayOfCalendar);
    lastDayOfCalendar.setDate(firstDayOfCalendar.getDate() + (this.numberOfWeeksToDisplay * 7) - 1);

    const startDateString = this.formatDateToYYYYMMDD(firstDayOfCalendar);
    const endDateString = this.formatDateToYYYYMMDD(lastDayOfCalendar);

    let allAvailableSlots: CalendarAvailability[] = [];
    const teacherDetailsMap = new Map<string, User>();

    this.currentUser.subscribedTeacherIds.forEach(teacherId => {
      const teacher = this.userService.getUserById(teacherId);
      if (teacher) {
        teacherDetailsMap.set(teacherId, teacher);
        const teacherSlots = this.userService.getTeacherAvailabilityForPeriod(teacherId, startDateString, endDateString);
        allAvailableSlots.push(...teacherSlots);
      }
    });

    const filteredSlots = allAvailableSlots.filter(slot =>
      !slot.sessionId &&
      !this.bookingRequestService.hasPendingRequestForSlot(slot.id, 'pending') &&
      !this.bookingRequestService.hasPendingRequestForSlot(slot.id, 'accepted')
    );

    this.generateCalendarWeeks(firstDayOfCalendar, filteredSlots, teacherDetailsMap);
    this.isLoading = false;
  }

  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private generateCalendarWeeks(startDate: Date, aggregatedSlots: CalendarAvailability[], teacherDetailsMap: Map<string, User>): void {
    this.calendarWeeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const primaryMonthDate = new Date(startDate);
    primaryMonthDate.setDate(startDate.getDate() + Math.floor((this.numberOfWeeksToDisplay * 7) / 2));
    const primaryMonth = primaryMonthDate.getMonth();
    this.currentMonthDisplay = primaryMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    let currentDatePointer = new Date(startDate);

    for (let week = 0; week < this.numberOfWeeksToDisplay; week++) {
      const weekDays: LessonDayViewModel[] = [];
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const date = new Date(currentDatePointer);
        date.setHours(0, 0, 0, 0);
        const dateString = this.formatDateToYYYYMMDD(date);

        const slotsForDay = aggregatedSlots.filter(slot => slot.date === dateString);
        const statusColor: LessonDayViewModel['statusColor'] = slotsForDay.length > 0 ? 'green' : 'default';
        const statusText = slotsForDay.length > 0 ? `${slotsForDay.length} slot(s) available` : 'No slots';

        weekDays.push({
          date: new Date(date),
          dateString: dateString,
          dayOfMonth: date.getDate(),
          isToday: date.toDateString() === today.toDateString(),
          isPast: date < today,
          isCurrentMonth: date.getMonth() === primaryMonth,
          statusColor: statusColor,
          statusText: statusText,
          availableSlotsOnDay: slotsForDay,
          teacherDetailsMap: teacherDetailsMap
        });
        currentDatePointer.setDate(currentDatePointer.getDate() + 1);
      }
      this.calendarWeeks.push(weekDays);
    }
  }

  openBookingPopup(day: LessonDayViewModel): void {
    if (day.isPast || day.availableSlotsOnDay.length === 0) {
      this.snackBar.open('No available slots or date is in the past.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.currentUser) return;

    const dialogRef = this.dialog.open<BookingRequestPopupComponent, BookingRequestPopupData, any>(
      BookingRequestPopupComponent,
      {
        width: '600px',
        data: {
          date: day.date,
          availableSlots: day.availableSlotsOnDay,
          currentUser: this.currentUser,
          teacherDetailsMap: day.teacherDetailsMap
        }
      }
    );

    dialogRef.afterClosed().subscribe(requestMade => {
      if (requestMade) {
        this.loadSubscribedTeachersAvailability();
      }
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
