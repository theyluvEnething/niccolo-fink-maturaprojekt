import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserService } from './services/user.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';
  showSidebar = true;
  private routerSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateSidebarVisibility(event.urlAfterRedirects);
    });

    this.userSubscription = this.userService.getCurrentUserObservable().subscribe((user: User | null) => {
      this.updateSidebarVisibility(this.router.url);
    });

    this.updateSidebarVisibility(this.router.url);
  }

  private updateSidebarVisibility(currentUrl: string): void {
    if (currentUrl === '/login' || !this.userService.getCurrentUser()) {
      this.showSidebar = false;
    } else {
      this.showSidebar = true;
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
