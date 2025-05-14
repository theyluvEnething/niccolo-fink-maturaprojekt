import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  teacherOnly?: boolean;
}

interface PlannedFeature {
  label: string;
  icon: string;
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
export class SidebarComponent implements OnInit {
  isExpanded = false;
  currentUser: User | null = null;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'My Availability', icon: 'event_available', route: '/my-availability', teacherOnly: true },
    { label: 'Lesson Bookings', icon: 'book_online', route: '/lesson-bookings' },
    { label: 'My Students', icon: 'group', route: '/my-students', teacherOnly: true },
    { label: 'Search Teacher', icon: 'search', route: '/search-teacher' }
  ];

  plannedFeatures: PlannedFeature[] = [
    { label: 'Integrated Chat (Soon)', icon: 'chat_bubble_outline' },
    { label: 'Analysis Tool (Soon)', icon: 'analytics' },
    { label: 'Video Calls (Soon)', icon: 'videocam' }
  ];

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  shouldShowItem(item: NavItem): boolean {
    if (!item.teacherOnly) {
      return true;
    }
    return !!this.currentUser?.hasTeacherRights;
  }
}
