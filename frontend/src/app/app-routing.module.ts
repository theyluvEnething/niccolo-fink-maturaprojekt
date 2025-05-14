import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { MyAvailabilityComponent } from './my-availability/my-availability.component';
import { LessonBookingsComponent } from './lesson-bookings/lesson-bookings.component';
import { MyStudentsComponent } from './my-students/my-students.component';
import { SearchComponent } from './search/search.component';
import { TeacherGuard } from './guards/teacher.guard';
import { ProfileComponent } from './profile/profile.component';
import { PendingBookingsComponent } from './pending-bookings/pending-bookings.component';
import { ManageBookingsComponent } from './manage-bookings/manage-bookings.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  {
    path: 'calendar',
    component: MyAvailabilityComponent,
    canActivate: [TeacherGuard]
  },
  { path: 'lessons', component: LessonBookingsComponent },
  {
    path: 'students',
    component: MyStudentsComponent,
    canActivate: [TeacherGuard]
  },
  { path: 'search', component: SearchComponent },
  { path: 'profile', component: ProfileComponent },
  {
    path: 'pending-bookings',
    component: PendingBookingsComponent,
    canActivate: [TeacherGuard]
  },
  {
    path: 'manage-bookings',
    component: ManageBookingsComponent,
    canActivate: [TeacherGuard]
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
