import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  type: 'all' | 'teacher' | 'student';
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  animations: [
    trigger('sidebarExpansion', [
      state('collapsed', style({
        width: '70px'
      })),
      state('expanded', style({
        width: '260px'
      })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  isExpanded = false;
  currentUser: User | null = null;
  defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  private userSubscription: Subscription | undefined;

  commonNavItems: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/home', type: 'all' },
    { label: 'Find Lessons', icon: 'event_seat', route: '/find-lessons', type: 'all' },
    { label: 'My Booked Lessons', icon: 'event_note', route: '/my-booked-lessons', type: 'all' },
    { label: 'Search Teachers', icon: 'search', route: '/search', type: 'all' },
  ];

  studentNavItems: NavItem[] = [];

  teacherNavItems: NavItem[] = [
    { label: 'Manage Bookings', icon: 'rule_folder', route: '/manage-bookings', type: 'teacher' },
    { label: 'My Calendar', icon: 'event_available', route: '/calendar', type: 'teacher' },
    { label: 'My Students', icon: 'group', route: '/students', type: 'teacher' },
  ];


  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserObservable().subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  shouldShowItem(item: NavItem): boolean {
    if (!this.currentUser) return false;

    if (item.type === 'teacher') {
      return this.currentUser.hasTeacherRights;
    }
    if (item.type === 'student') {
      return !this.currentUser.hasTeacherRights;
    }
    return true;
  }
}
