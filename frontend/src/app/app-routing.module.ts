import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { MyAvailabilityComponent } from './my-availability/my-availability.component';
import { LessonBookingsComponent } from './lesson-bookings/lesson-bookings.component';
import { MyStudentsComponent } from './my-students/my-students.component';
import { SearchComponent } from './search/search.component';
import { TeacherGuard } from './guards/teacher.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: HomeComponent },
  {
    path: 'my-availability',
    component: MyAvailabilityComponent,
    canActivate: [TeacherGuard]
  },
  { path: 'lesson-bookings', component: LessonBookingsComponent },
  {
    path: 'my-students',
    component: MyStudentsComponent,
    canActivate: [TeacherGuard]
  },
  { path: 'search-teacher', component: SearchComponent },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
