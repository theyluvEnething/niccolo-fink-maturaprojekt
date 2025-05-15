import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../models/user.model';

export interface UserDetailPopupData {
  user: User;
}

@Component({
  selector: 'app-user-detail-popup',
  templateUrl: './user-detail-popup.component.html',
  styleUrls: ['./user-detail-popup.component.scss']
})
export class UserDetailPopupComponent {
  user: User;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  constructor(
    public dialogRef: MatDialogRef<UserDetailPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailPopupData
  ) {
    this.user = data.user;
  }

  getArrayDisplay(arr: string[] | undefined): string {
    return arr && arr.length > 0 ? arr.join(', ') : 'N/A';
  }

  getAvailabilityDisplay(): string {
    if (!this.user.availability || this.user.availability.length === 0) {
      return 'N/A';
    }
    return this.user.availability.map(slot =>
      `${slot.date} (${slot.startHour.toFixed(2)} - ${slot.endHour.toFixed(2)})${slot.sessionId ? ' (Booked)' : ''}`
    ).join('; ');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
