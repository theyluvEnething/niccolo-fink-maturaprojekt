import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { User, CalendarAvailability } from '../models/user.model';
import { TeacherAvailabilityPopupComponent, TeacherAvailabilityPopupData } from './components/teacher-availability-popup/teacher-availability-popup.component';

interface DayViewModel {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfMonth: number;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean; // True if the day falls within the primary month being displayed
  totalSlots: number;
  bookedSlots: number;
  statusColor: 'default' | 'green' | 'yellow' | 'red';
  statusText: string;
}

@Component({
  selector: 'app-my-availability',
  templateUrl: './my-availability.component.html',
  styleUrls: ['./my-availability.component.scss']
})
export class MyAvailabilityComponent implements OnInit {
  currentUser: User | null = null;
  calendarWeeks: DayViewModel[][] = [];
  weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  isLoading: boolean = false;
  currentMonthDisplay: string = '';

  private teacherAvailabilities: CalendarAvailability[] = [];
  private readonly numberOfWeeksToDisplay = 4;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
    if (this.currentUser && this.currentUser.hasTeacherRights) {
      this.loadTeacherAvailabilitiesAndBuildCalendar();
    } else {
      this.snackBar.open('You do not have permission to view this page.', 'Close', { duration: 3000 });
    }
  }

  private loadTeacherAvailabilitiesAndBuildCalendar(): void {
    if (!this.currentUser) return;
    this.isLoading = true;

    const today = new Date();
    const firstDayOfCalendar = this.getMondayOfWeek(today);
    const lastDayOfCalendar = new Date(firstDayOfCalendar);
    lastDayOfCalendar.setDate(firstDayOfCalendar.getDate() + (this.numberOfWeeksToDisplay * 7) - 1);

    this.teacherAvailabilities = this.userService.getTeacherAvailabilityForPeriod(
      this.currentUser.id,
      this.formatDateToYYYYMMDD(firstDayOfCalendar),
      this.formatDateToYYYYMMDD(lastDayOfCalendar)
    );
    this.generateCalendarWeeks(firstDayOfCalendar);
    this.isLoading = false;
  }

  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday
    return new Date(d.setDate(diff));
  }

  private generateCalendarWeeks(startDate: Date): void {
    this.calendarWeeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const primaryMonthDate = new Date(startDate);
    primaryMonthDate.setDate(startDate.getDate() + Math.floor((this.numberOfWeeksToDisplay * 7) / 2)); // A date roughly in the middle
    const primaryMonth = primaryMonthDate.getMonth();
    this.currentMonthDisplay = primaryMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric'});

    let currentDatePointer = new Date(startDate);

    for (let week = 0; week < this.numberOfWeeksToDisplay; week++) {
      const weekDays: DayViewModel[] = [];
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const date = new Date(currentDatePointer);
        date.setHours(0,0,0,0);
        const dateString = this.formatDateToYYYYMMDD(date);

        const slotsForDay = this.teacherAvailabilities.filter(slot => slot.date === dateString);
        const totalSlots = slotsForDay.length;
        const bookedSlots = slotsForDay.filter(slot => slot.sessionId).length;

        let statusColor: DayViewModel['statusColor'] = 'default';
        let statusText = 'No slots';

        if (totalSlots > 0) {
          if (bookedSlots === totalSlots) {
            statusColor = 'red';
            statusText = 'Fully Booked';
          } else if (bookedSlots > 0) {
            statusColor = 'yellow';
            statusText = `${totalSlots - bookedSlots} / ${totalSlots} available`;
          } else {
            statusColor = 'green';
            statusText = `${totalSlots} slots available`;
          }
        }

        weekDays.push({
          date: new Date(date),
          dateString: dateString,
          dayOfMonth: date.getDate(),
          isToday: date.toDateString() === today.toDateString(),
          isPast: date < today,
          isCurrentMonth: date.getMonth() === primaryMonth, // Highlight based on the primary month of the view
          totalSlots: totalSlots,
          bookedSlots: bookedSlots,
          statusColor: statusColor,
          statusText: statusText
        });
        currentDatePointer.setDate(currentDatePointer.getDate() + 1);
      }
      this.calendarWeeks.push(weekDays);
    }
  }

  openAvailabilityPopup(day: DayViewModel): void {
    if (day.isPast) {
      this.snackBar.open('Cannot set availability for past dates.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.currentUser || !this.currentUser.hasTeacherRights) return;

    const existingSlotsForDate = this.teacherAvailabilities.filter(slot => slot.date === day.dateString);

    const dialogRef = this.dialog.open<TeacherAvailabilityPopupComponent, TeacherAvailabilityPopupData, any>(
      TeacherAvailabilityPopupComponent,
      {
        width: '500px',
        data: { date: day.date, existingSlots: existingSlotsForDate, currentUser: this.currentUser }
      }
    );

    dialogRef.afterClosed().subscribe(() => {
        this.loadTeacherAvailabilitiesAndBuildCalendar();
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
