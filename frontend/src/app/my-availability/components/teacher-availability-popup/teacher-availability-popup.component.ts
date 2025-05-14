import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface TeacherAvailabilityPopupData {
  date: Date;
}

export interface TeacherAvailabilityPopupResult {
  startHour: number;
  endHour: number;
}

@Component({
  selector: 'app-teacher-availability-popup',
  templateUrl: './teacher-availability-popup.component.html',
  styleUrls: ['./teacher-availability-popup.component.scss']
})
export class TeacherAvailabilityPopupComponent {
  startHour: number | null = 9;
  endHour: number | null = 17;
  hours: number[] = Array.from({ length: 24 }, (_, i) => i); // 0-23

  constructor(
    public dialogRef: MatDialogRef<TeacherAvailabilityPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TeacherAvailabilityPopupData,
    private snackBar: MatSnackBar
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.startHour === null || this.endHour === null) {
      this.snackBar.open('Please select both start and end hours.', 'Close', { duration: 3000 });
      return;
    }
    if (this.startHour >= this.endHour) {
      this.snackBar.open('End hour must be after start hour.', 'Close', { duration: 3000 });
      return;
    }
    if (this.startHour < 0 || this.startHour > 23 || this.endHour < 1 || this.endHour > 24) {
        this.snackBar.open('Hours must be within the 0-23 range for start and 1-24 for end.', 'Close', { duration: 3000 });
        return;
    }

    this.dialogRef.close({ startHour: this.startHour, endHour: this.endHour });
  }

  getFormattedDate(): string {
    return this.data.date.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
