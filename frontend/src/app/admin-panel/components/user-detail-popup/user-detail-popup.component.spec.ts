import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserDetailPopupComponent } from './user-detail-popup.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

describe('UserDetailPopupComponent', () => {
  let component: UserDetailPopupComponent;
  let fixture: ComponentFixture<UserDetailPopupComponent>;

  const mockDialogData = {
    user: {
      id: '1',
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      hasTeacherRights: false,
      isAdmin: false
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserDetailPopupComponent ],
      imports: [ NoopAnimationsModule, MatDialogModule, MatIconModule, MatButtonModule ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDetailPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
