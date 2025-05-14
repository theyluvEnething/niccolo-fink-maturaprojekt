import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../services/user.service';
import { CalendarAvailability, User } from '../../../models/user.model';

export interface TeacherAvailabilityPopupData {
  date: Date;
  existingSlots: CalendarAvailability[];
  currentUser: User | null;
}

interface TimeSlotDisplay {
  value: number;
  display: string;
}

@Component({
  selector: 'app-teacher-availability-popup',
  templateUrl: './teacher-availability-popup.component.html',
  styleUrls: ['./teacher-availability-popup.component.scss']
})
export class TeacherAvailabilityPopupComponent implements OnInit {
  newStartHour: number = 9.0;
  newEndHour: number = 17.0;

  timeSlots: TimeSlotDisplay[] = [];
  existingSlotsOnDate: CalendarAvailability[] = [];

  sliderMin: number = 0;
  sliderMax: number = 24;
  sliderStep: number = 0.25; // 15 minutes
  sliderValueStart: number = 9.0;
  sliderValueEnd: number = 17.0;

  constructor(
    public dialogRef: MatDialogRef<TeacherAvailabilityPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TeacherAvailabilityPopupData,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.existingSlotsOnDate = [...this.data.existingSlots].sort((a, b) => a.startHour - b.startHour);
    this.sliderValueStart = this.newStartHour;
    this.sliderValueEnd = this.newEndHour;
  }

  private generateTimeSlots(): void {
    for (let hour = 0; hour <= 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 24 && minute > 0) continue; // Max is 24:00
        const value = hour + minute / 60;
        if (value > 24) continue; // Ensure we don't exceed 24.0
        this.timeSlots.push({
          value: value,
          display: this.formatHourForDisplay(value)
        });
      }
    }
    // Ensure 24:00 is exactly 24.0 and not duplicated if loop naturally creates it
    if (!this.timeSlots.find(ts => ts.value === 24)) {
        const lastSlot = this.timeSlots[this.timeSlots.length -1];
        if(lastSlot.value < 24) {
             this.timeSlots.push({ value: 24, display: this.formatHourForDisplay(24)});
        }
    }
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  handleSliderValueChange(): void {
    if (this.sliderValueStart > this.sliderValueEnd) {
      // If start thumb crosses end thumb, swap them
      const temp = this.sliderValueStart;
      this.sliderValueStart = this.sliderValueEnd;
      this.sliderValueEnd = temp;
    }
    this.newStartHour = this.sliderValueStart;
    this.newEndHour = this.sliderValueEnd;
  }

  handleSelectorValueChange(): void {
    if (this.newStartHour !== null && this.newEndHour !== null) {
      if (this.newStartHour >= this.newEndHour) {
        // Temporarily allow invalid state for direct input, slider will correct or save will catch
      }
      this.sliderValueStart = this.newStartHour;
      this.sliderValueEnd = this.newEndHour;
    }
  }

  onSaveNewSlot(): void {
    if (this.newStartHour === null || this.newEndHour === null) {
      this.snackBar.open('Please select start and end times.', 'Close', { duration: 3000 });
      return;
    }

    if (this.newStartHour >= this.newEndHour) {
      this.snackBar.open('End time must be after start time.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.data.currentUser) {
      this.snackBar.open('User not identified. Cannot save.', 'Close', { duration: 3000 });
      return;
    }

    const dateString = this.formatDateToYYYYMMDD(this.data.date);
    const addedSlot = this.userService.addAvailabilitySlot(
      this.data.currentUser.id,
      dateString,
      this.newStartHour,
      this.newEndHour
    );

    if (addedSlot) {
      this.existingSlotsOnDate.push(addedSlot);
      this.existingSlotsOnDate.sort((a, b) => a.startHour - b.startHour);
      this.snackBar.open('Availability slot added.', 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Failed to add slot. It might conflict with an existing one.', 'Close', { duration: 3000 });
    }
  }

  onDeleteSlot(slotId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.data.currentUser) return;

    const slotToDelete = this.existingSlotsOnDate.find(s => s.id === slotId);
    if (slotToDelete?.sessionId) {
        this.snackBar.open('Cannot delete a booked slot.', 'Close', { duration: 3000});
        return;
    }

    const success = this.userService.deleteAvailabilitySlot(this.data.currentUser.id, slotId);
    if (success) {
      this.existingSlotsOnDate = this.existingSlotsOnDate.filter(s => s.id !== slotId);
      this.snackBar.open('Availability slot deleted.', 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Failed to delete slot.', 'Close', { duration: 3000 });
    }
  }

  getFormattedDate(): string {
    return this.data.date.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatSlotTime(slot: CalendarAvailability): string {
    return `${this.formatHourForDisplay(slot.startHour)} - ${this.formatHourForDisplay(slot.endHour)}`;
  }

  formatHourForDisplay(value: number | null): string {
    if (value === null) return '';
    const hour = Math.floor(value);
    const minutes = (value % 1) * 60;
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  formatHourForSliderDisplay = (value: number | null): string => {
    return this.formatHourForDisplay(value);
  }
}
