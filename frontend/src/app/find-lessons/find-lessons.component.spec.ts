import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FindLessonsComponent } from './find-lessons.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UserService } from '../services/user.service';
import { BookingRequestService } from '../services/booking-request.service';

describe('FindLessonsComponent', () => {
  let component: FindLessonsComponent;
  let fixture: ComponentFixture<FindLessonsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FindLessonsComponent],
      imports: [
        MatDialogModule,
        MatSnackBarModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [UserService, BookingRequestService]
    });
    fixture = TestBed.createComponent(FindLessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
