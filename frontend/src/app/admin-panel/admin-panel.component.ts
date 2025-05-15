import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { UserDetailPopupComponent, UserDetailPopupData } from './components/user-detail-popup/user-detail-popup.component';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  allUsers: User[] = [];
  isLoading: boolean = true;
  readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  constructor(
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  private loadAllUsers(): void {
    this.isLoading = true;
    this.allUsers = this.userService.getAllUsersForAdmin();
    this.isLoading = false;
  }

  openUserDetailPopup(user: User): void {
    this.dialog.open<UserDetailPopupComponent, UserDetailPopupData, void>(
      UserDetailPopupComponent,
      {
        width: '700px',
        data: { user }
      }
    );
  }

  getUserRoleText(user: User): string {
    let roles = [];
    if (user.isAdmin) roles.push('Admin');
    if (user.hasTeacherRights) roles.push('Teacher');
    if (roles.length === 0) return 'Student';
    return roles.join(' / ');
  }
}
