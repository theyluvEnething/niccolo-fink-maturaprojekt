import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { MyAvailabilityComponent } from './my-availability/my-availability.component';
import { FindLessonsComponent } from './find-lessons/find-lessons.component';
import { MyBookedLessonsComponent } from './my-booked-lessons/my-booked-lessons.component';
import { MyStudentsComponent } from './my-students/my-students.component';
import { SearchComponent } from './search/search.component';
import { TeacherGuard } from './guards/teacher.guard';
import { ProfileComponent } from './profile/profile.component';
import { ManageBookingsComponent } from './manage-bookings/manage-bookings.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  {
    path: 'calendar',
    component: MyAvailabilityComponent,
    canActivate: [TeacherGuard]
  },
  { path: 'find-lessons', component: FindLessonsComponent },
  { path: 'my-booked-lessons', component: MyBookedLessonsComponent },
  {
    path: 'students',
    component: MyStudentsComponent,
    canActivate: [TeacherGuard]
  },
  { path: 'search', component: SearchComponent },
  { path: 'profile', component: ProfileComponent },
  {
    path: 'manage-bookings',
    component: ManageBookingsComponent,
    canActivate: [TeacherGuard]
  },
  {
    path: 'admin-panel',
    component: AdminPanelComponent,
    canActivate: [AdminGuard]
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
