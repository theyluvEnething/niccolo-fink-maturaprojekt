import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { User, CalendarAvailability } from '../models/user.model';
import { TeacherAvailabilityPopupComponent, TeacherAvailabilityPopupData, TeacherAvailabilityPopupResult } from './components/teacher-availability-popup/teacher-availability-popup.component';

interface DayViewModel {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfMonth: number;
  isToday: boolean;
  isPast: boolean;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
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
  calendarDays: DayViewModel[] = [];
  teacherAvailabilities: CalendarAvailability[] = [];
  isLoading: boolean = false;

  private readonly numberOfDaysToShow = 30;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
    if (this.currentUser && this.currentUser.hasTeacherRights) {
      this.loadTeacherAvailabilities();
    } else {
      this.snackBar.open('You do not have permission to view this page.', 'Close', { duration: 3000 });
    }
  }

  private loadTeacherAvailabilities(): void {
    if (!this.currentUser) return;
    this.isLoading = true;
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + this.numberOfDaysToShow - 1);

    this.teacherAvailabilities = this.userService.getTeacherAvailabilityForPeriod(
      this.currentUser.id,
      this.formatDateToYYYYMMDD(today),
      this.formatDateToYYYYMMDD(endDate)
    );
    this.generateCalendarDays();
    this.isLoading = false;
  }

  private generateCalendarDays(): void {
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < this.numberOfDaysToShow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = this.formatDateToYYYYMMDD(date);

      const slotsForDay = this.teacherAvailabilities.filter(slot => slot.date === dateString);
      const totalSlots = slotsForDay.length;
      const bookedSlots = slotsForDay.filter(slot => slot.sessionId).length;
      const availableSlots = totalSlots - bookedSlots;

      let statusColor: DayViewModel['statusColor'] = 'default';
      let statusText = 'No slots';

      if (totalSlots > 0) {
        if (bookedSlots === totalSlots) {
          statusColor = 'red';
          statusText = 'Fully Booked';
        } else if (bookedSlots > 0) {
          statusColor = 'yellow';
          statusText = `${availableSlots}/${totalSlots} slots available`;
        } else {
          statusColor = 'green';
          statusText = `${totalSlots} slots available`;
        }
      }

      this.calendarDays.push({
        date: date,
        dateString: dateString,
        dayOfMonth: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        availableSlots: availableSlots,
        statusColor: statusColor,
        statusText: statusText
      });
    }
  }

  openAvailabilityPopup(day: DayViewModel): void {
    if (day.isPast) {
      this.snackBar.open('Cannot set availability for past dates.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.currentUser) return;

    const dialogRef = this.dialog.open<TeacherAvailabilityPopupComponent, TeacherAvailabilityPopupData, TeacherAvailabilityPopupResult>(
      TeacherAvailabilityPopupComponent,
      {
        width: '450px',
        data: { date: day.date }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentUser) {
        const { startHour, endHour } = result;
        this.userService.addAvailabilitySlots(this.currentUser.id, day.dateString, startHour, endHour);
        this.snackBar.open(`Availability added for ${day.dateString} from ${startHour}:00 to ${endHour}:00`, 'Close', { duration: 3000 });
        this.loadTeacherAvailabilities(); // Refresh calendar
      }
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDayAbbreviation(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
}
