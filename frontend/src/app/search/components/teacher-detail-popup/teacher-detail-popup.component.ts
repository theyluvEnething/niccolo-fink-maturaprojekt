import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface TeacherDetailPopupData {
  teacher: User;
  currentUser: User;
}

@Component({
  selector: 'app-teacher-detail-popup',
  templateUrl: './teacher-detail-popup.component.html',
  styleUrls: ['./teacher-detail-popup.component.scss']
})
export class TeacherDetailPopupComponent implements OnInit {
  teacher: User;
  currentUser: User;
  isSubscribed: boolean = false;
  isSelf: boolean = false;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  constructor(
    public dialogRef: MatDialogRef<TeacherDetailPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TeacherDetailPopupData,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.teacher = data.teacher;
    this.currentUser = data.currentUser;
  }

  ngOnInit(): void {
    this.isSelf = this.currentUser.id === this.teacher.id;
    if (!this.isSelf) {
      this.checkSubscriptionStatus();
    }
  }

  private checkSubscriptionStatus(): void {
    this.isSubscribed = this.userService.isSubscribedToTeacher(this.currentUser.id, this.teacher.id);
  }

  subscribe(): void {
    if (this.isSelf) return;
    if (this.userService.subscribeToTeacher(this.currentUser.id, this.teacher.id)) {
      this.isSubscribed = true;
      this.snackBar.open(`Subscribed to ${this.teacher.fullName}`, 'Close', { duration: 2000 });
    } else {
      this.snackBar.open(`Failed to subscribe to ${this.teacher.fullName}`, 'Close', { duration: 3000 });
    }
  }

  unsubscribe(): void {
    if (this.isSelf) return;
    if (this.userService.unsubscribeFromTeacher(this.currentUser.id, this.teacher.id)) {
      this.isSubscribed = false;
      this.snackBar.open(`Unsubscribed from ${this.teacher.fullName}`, 'Close', { duration: 2000 });
    } else {
      this.snackBar.open(`Failed to unsubscribe from ${this.teacher.fullName}`, 'Close', { duration: 3000 });
    }
  }


  onClose(): void {
    this.dialogRef.close();
  }
}
