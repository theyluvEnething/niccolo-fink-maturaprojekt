import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../services/user.service';
import { BookingRequestService } from '../../../services/booking-request.service';
import { CalendarAvailability, User } from '../../../models/user.model';

export interface BookingRequestPopupData {
  date: Date;
  availableSlots: CalendarAvailability[];
  currentUser: User;
  teacherDetailsMap: Map<string, User>;
}

interface SlotViewModel extends CalendarAvailability {
  teacher?: User;
  isRequestedByCurrentUser?: boolean;
}

@Component({
  selector: 'app-booking-request-popup',
  templateUrl: './booking-request-popup.component.html',
  styleUrls: ['./booking-request-popup.component.scss']
})
export class BookingRequestPopupComponent implements OnInit {
  displaySlots: SlotViewModel[] = [];

  constructor(
    public dialogRef: MatDialogRef<BookingRequestPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookingRequestPopupData,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private bookingRequestService: BookingRequestService
  ) {}

  ngOnInit(): void {
    this.displaySlots = this.data.availableSlots.map(slot => {
      const teacher = this.data.teacherDetailsMap.get(slot.userId);
      const isRequested = this.bookingRequestService.hasPendingRequestForSlot(slot.id, 'pending') ||
                          this.bookingRequestService.hasPendingRequestForSlot(slot.id, 'accepted');
      return {
        ...slot,
        teacher: teacher,
        isRequestedByCurrentUser: isRequested && this.bookingRequestService.getBookingRequestsForStudent(this.data.currentUser.id, 'pending').some(r => r.availabilitySlotId === slot.id)
      };
    }).sort((a,b) => {
        if (a.teacher?.fullName && b.teacher?.fullName) {
            if (a.teacher.fullName < b.teacher.fullName) return -1;
            if (a.teacher.fullName > b.teacher.fullName) return 1;
        }
        return a.startHour - b.startHour;
    });
  }

  requestBooking(slot: SlotViewModel): void {
    if (!this.data.currentUser || !slot.teacher) {
      this.snackBar.open('Error: User or teacher information is missing.', 'Close', { duration: 3000 });
      return;
    }

    const request = this.bookingRequestService.createBookingRequest(
      this.data.currentUser.id,
      slot.teacher.id,
      slot.id
    );

    if (request) {
      this.snackBar.open('Booking request sent successfully!', 'Close', { duration: 2000 });
      this.dialogRef.close(true);
    } else {
      this.snackBar.open('Failed to send booking request. The slot may no longer be available.', 'Close', { duration: 3000 });
      this.dialogRef.close(false);
    }
  }

  getFormattedDate(): string {
    return this.data.date.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatSlotTime(slot: CalendarAvailability): string {
    const formatHour = (value: number): string => {
      const hour = Math.floor(value);
      const minutes = (value % 1) * 60;
      return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    return `${formatHour(slot.startHour)} - ${formatHour(slot.endHour)}`;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
