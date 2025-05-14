import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyBookedLessonsComponent } from './my-booked-lessons.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

describe('MyBookedLessonsComponent', () => {
  let component: MyBookedLessonsComponent;
  let fixture: ComponentFixture<MyBookedLessonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyBookedLessonsComponent ],
      imports: [
        MatSnackBarModule,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        MatButtonModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyBookedLessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
