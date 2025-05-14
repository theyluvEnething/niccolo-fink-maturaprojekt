import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  editableUser: Partial<User> = {};
  originalUserJson: string = '';
  defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  private userSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.editableUser = { ...user };
        if (!this.editableUser.profilePictureUrl) {
          this.editableUser.profilePictureUrl = this.defaultProfilePic;
        }
        this.originalUserJson = JSON.stringify(this.editableUser);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  saveProfile(): void {
    if (this.currentUser && this.editableUser) {
      const updateData: Partial<Pick<User, 'fullName' | 'chessTitle' | 'rating' | 'profilePictureUrl'>> = {
        fullName: this.editableUser.fullName,
        chessTitle: this.editableUser.chessTitle || '',
        rating: this.editableUser.rating || undefined,
        profilePictureUrl: this.editableUser.profilePictureUrl || this.defaultProfilePic
      };

      const updatedUser = this.userService.updateUserProfile(this.currentUser.id, updateData);
      if (updatedUser) {
        this.currentUser = { ...this.currentUser, ...updatedUser };
        this.editableUser = { ...this.currentUser };
         if (!this.editableUser.profilePictureUrl) {
          this.editableUser.profilePictureUrl = this.defaultProfilePic;
        }
        this.originalUserJson = JSON.stringify(this.editableUser);
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Failed to update profile.', 'Close', { duration: 3000 });
      }
    }
  }

  isProfileChanged(): boolean {
    return JSON.stringify(this.editableUser) !== this.originalUserJson;
  }

  onProfilePicUrlChange(): void {
    if (!this.editableUser.profilePictureUrl) {
      this.editableUser.profilePictureUrl = this.defaultProfilePic;
    }
  }

  handleImageError(): void {
    if (this.editableUser) {
      this.editableUser.profilePictureUrl = this.defaultProfilePic;
      this.snackBar.open('Invalid image URL. Using placeholder.', 'Close', { duration: 3000 });
    }
  }
}
