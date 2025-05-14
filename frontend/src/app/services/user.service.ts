import { Injectable } from '@angular/core';
import { User, CalendarAvailability } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [];
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUserObservable: Observable<User | null>;
  private readonly defaultProfilePic = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUserObservable = this.currentUserSubject.asObservable();
    this.seedUsers();
  }

  private seedUsers() {
    const teacherId1 = uuidv4();
    const studentId1 = uuidv4();
    const userWithBothRightsId = uuidv4();

    const sampleAvailabilitySlots = [
      { startHour: 9.0, endHour: 10.0 },
      { startHour: 10.25, endHour: 12.5 },
      { startHour: 14.0, endHour: 15.75 },
    ];
    const today = new Date();
    const initialAvailabilitiesTeacher1: CalendarAvailability[] = [];
    const initialAvailabilitiesBothRights: CalendarAvailability[] = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = this.formatDateToYYYYMMDD(date);

      sampleAvailabilitySlots.forEach(slotData => {
        if (i % 2 === 0) {
          initialAvailabilitiesTeacher1.push({
            id: uuidv4(),
            userId: teacherId1,
            date: dateString,
            startHour: slotData.startHour,
            endHour: slotData.endHour,
            durationHours: slotData.endHour - slotData.startHour
          });
        }
        if (i % 2 !== 0) {
           const newStart = slotData.startHour + 1 > 23.75 ? slotData.startHour : slotData.startHour + 1;
           const newEnd = slotData.endHour + 1 > 24 ? slotData.endHour : slotData.endHour + 1;
           initialAvailabilitiesBothRights.push({
            id: uuidv4(),
            userId: userWithBothRightsId,
            date: dateString,
            startHour: newStart,
            endHour: newEnd,
            durationHours: newEnd - newStart
          });
        }
      });
    }

    this.users.push({
      id: studentId1,
      username: 'studentUser',
      fullName: 'Regular Student',
      email: 'student@email.com',
      password: '1234',
      hasTeacherRights: false,
      subscribedTeacherIds: [teacherId1, userWithBothRightsId],
      profilePictureUrl: this.defaultProfilePic,
      chessTitle: 'Novice',
      rating: 1200
    });

    this.users.push({
      id: teacherId1,
      username: 'teacherUser',
      fullName: 'Dedicated Teacher',
      email: 'teacher@email.com',
      password: '1234',
      hasTeacherRights: true,
      availability: initialAvailabilitiesTeacher1,
      teachingStudentIds: [studentId1],
      subscribedTeacherIds: [userWithBothRightsId],
      profilePictureUrl: this.defaultProfilePic,
      chessTitle: 'CM',
      rating: 2200
    });

    this.users.push({
      id: userWithBothRightsId,
      username: 'versatileUser',
      fullName: 'Magnus Carlsen',
      email: 'magnus@email.com',
      password: '1234',
      hasTeacherRights: true,
      availability: initialAvailabilitiesBothRights,
      subscribedTeacherIds: [teacherId1],
      teachingStudentIds: [],
      profilePictureUrl: 'https://images.chesscomfiles.com/uploads/v1/master_player/3b0ddf4e-bd82-11e8-9421-af517c2ebfed.138ccc14.250x250o.709428b50ec9.jpg',
      chessTitle: 'GM',
      rating: 2830
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  login(email: string, passwordInput: string): User | null {
    const userFound = this.users.find(u => u.email === email && u.password === passwordInput);
    if (userFound) {
      const { password, ...userToStore } = userFound;
      let userForSession = JSON.parse(JSON.stringify(userToStore)) as User;
      userForSession.profilePictureUrl = userForSession.profilePictureUrl || this.defaultProfilePic;
      this.currentUserSubject.next(userForSession);
      return userForSession;
    }
    this.currentUserSubject.next(null);
    return null;
  }

  logout() {
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.getValue();
    if (!user) return null;
    const userToReturn = { ...user };
    userToReturn.profilePictureUrl = userToReturn.profilePictureUrl || this.defaultProfilePic;
    delete userToReturn.password;
    return JSON.parse(JSON.stringify(userToReturn));
  }

  getCurrentUserObservable(): Observable<User | null> {
    return this.currentUserObservable;
  }

  getAllUsers(): User[] {
    return this.users.map(u => {
      const { password, ...user } = u;
      const userWithPic = { ...user, profilePictureUrl: user.profilePictureUrl || this.defaultProfilePic };
      return JSON.parse(JSON.stringify(userWithPic)) as User;
    });
  }

  getUsersWithTeacherRights(): User[] {
    return this.users
      .filter(u => u.hasTeacherRights)
      .map(u => {
        const { password, ...user } = u;
        const userWithPic = { ...user, profilePictureUrl: user.profilePictureUrl || this.defaultProfilePic };
        return JSON.parse(JSON.stringify(userWithPic)) as User;
      });
  }

  getUserById(id: string): User | null {
    const userFound = this.users.find(x => x.id === id);
    if (!userFound) return null;
    const { password, ...userToReturn } = userFound;
    const userWithPic = { ...userToReturn, profilePictureUrl: userToReturn.profilePictureUrl || this.defaultProfilePic };
    return JSON.parse(JSON.stringify(userWithPic)) as User;
  }

  updateUserProfile(userId: string, profileData: Partial<Pick<User, 'fullName' | 'chessTitle' | 'rating' | 'profilePictureUrl'>>): User | null {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...profileData,
      profilePictureUrl: profileData.profilePictureUrl || this.defaultProfilePic
    };

    const currentLoggedInUser = this.currentUserSubject.getValue();
    if (currentLoggedInUser && currentLoggedInUser.id === userId) {
      const updatedLoggedInUser = {
        ...currentLoggedInUser,
        ...profileData,
        profilePictureUrl: profileData.profilePictureUrl || this.defaultProfilePic
      };
      this.currentUserSubject.next(updatedLoggedInUser);
    }
    const { password, ...updatedUserToReturn } = this.users[userIndex];
    return JSON.parse(JSON.stringify(updatedUserToReturn));
  }


  addAvailabilitySlot(teacherId: string, date: string, startHour: number, endHour: number): CalendarAvailability | null {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.hasTeacherRights) {
      console.error('Teacher not found or user does not have teacher rights.');
      return null;
    }

    if (!teacher.availability) {
      teacher.availability = [];
    }

    for (const existingSlot of teacher.availability) {
      if (existingSlot.date === date) {
        if (startHour < existingSlot.endHour && endHour > existingSlot.startHour) {
          console.warn(`Slot conflict for ${date} between ${this.formatDecimalHour(startHour)} and ${this.formatDecimalHour(endHour)}. Skipping.`);
          return null;
        }
      }
    }

    const newSlot: CalendarAvailability = {
      id: uuidv4(),
      userId: teacherId,
      date: date,
      startHour,
      endHour,
      durationHours: endHour - startHour
    };
    teacher.availability.push(newSlot);
    teacher.availability.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return a.startHour - b.startHour;
    });

    const currentLoggedInUser = this.currentUserSubject.getValue();
    if (currentLoggedInUser && currentLoggedInUser.id === teacherId) {
      currentLoggedInUser.availability = [...(teacher.availability || [])];
      this.currentUserSubject.next({...currentLoggedInUser});
    }
    return JSON.parse(JSON.stringify(newSlot));
  }

  deleteAvailabilitySlot(teacherId: string, slotId: string): boolean {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.availability) return false;

    const slotIndex = teacher.availability.findIndex(s => s.id === slotId);
    if (slotIndex === -1 || teacher.availability[slotIndex].sessionId) {
      return false;
    }

    teacher.availability.splice(slotIndex, 1);
    const currentLoggedInUser = this.currentUserSubject.getValue();
    if (currentLoggedInUser && currentLoggedInUser.id === teacherId) {
      currentLoggedInUser.availability = [...(teacher.availability || [])];
      this.currentUserSubject.next({...currentLoggedInUser});
    }
    return true;
  }


  getTeacherAvailabilityForDate(teacherId: string, date: string): CalendarAvailability[] {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.availability) {
      return [];
    }
    return JSON.parse(JSON.stringify(teacher.availability.filter(slot => slot.date === date)));
  }

  getTeacherAvailabilityForPeriod(teacherId: string, startDate: string, endDate: string): CalendarAvailability[] {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.availability) {
      return [];
    }
    return JSON.parse(JSON.stringify(teacher.availability.filter(slot => {
      const slotDate = slot.date;
      return slotDate >= startDate && slotDate <= endDate;
    })));
  }

  updateAvailabilitySlotBooking(teacherId: string, slotId: string, sessionId?: string): boolean {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.availability) return false;

    const slotIndex = teacher.availability.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return false;

    if (sessionId) {
      teacher.availability[slotIndex].sessionId = sessionId;
    } else {
      delete teacher.availability[slotIndex].sessionId;
    }

    const currentLoggedInUser = this.currentUserSubject.getValue();
    if (currentLoggedInUser && currentLoggedInUser.id === teacherId) {
      currentLoggedInUser.availability = [...(teacher.availability || [])];
      this.currentUserSubject.next({...currentLoggedInUser});
    }
    return true;
  }

  getAvailabilitySlotById(slotId: string): CalendarAvailability | undefined {
    for (const user of this.users) {
        if (user.availability) {
            const slot = user.availability.find(s => s.id === slotId);
            if (slot) return JSON.parse(JSON.stringify(slot));
        }
    }
    return undefined;
  }

  subscribeToTeacher(studentId: string, teacherIdToSubscribe: string): boolean {
    if (studentId === teacherIdToSubscribe) {
      console.error('User cannot subscribe to themselves.');
      return false;
    }

    const studentUser = this.users.find(u => u.id === studentId);
    if (!studentUser) {
      console.error('Subscribing user not found.');
      return false;
    }

    if (!studentUser.subscribedTeacherIds) {
      studentUser.subscribedTeacherIds = [];
    }

    if (!studentUser.subscribedTeacherIds.includes(teacherIdToSubscribe)) {
      studentUser.subscribedTeacherIds.push(teacherIdToSubscribe);

      const currentLoggedInUser = this.currentUserSubject.getValue();
      if (currentLoggedInUser && currentLoggedInUser.id === studentId) {
        const updatedLoggedInUser = { ...currentLoggedInUser, subscribedTeacherIds: [...studentUser.subscribedTeacherIds] };
        this.currentUserSubject.next(updatedLoggedInUser);
      }
      return true;
    }
    return true;
  }

  unsubscribeFromTeacher(studentId: string, teacherIdToUnsubscribe: string): boolean {
    const studentUser = this.users.find(u => u.id === studentId);
    if (!studentUser || !studentUser.subscribedTeacherIds) {
      return false;
    }

    const index = studentUser.subscribedTeacherIds.indexOf(teacherIdToUnsubscribe);
    if (index > -1) {
      studentUser.subscribedTeacherIds.splice(index, 1);

      const currentLoggedInUser = this.currentUserSubject.getValue();
      if (currentLoggedInUser && currentLoggedInUser.id === studentId) {
        const updatedLoggedInUser = { ...currentLoggedInUser, subscribedTeacherIds: [...studentUser.subscribedTeacherIds] };
        this.currentUserSubject.next(updatedLoggedInUser);
      }
      return true;
    }
    return false;
  }

  isSubscribedToTeacher(studentId: string, teacherId: string): boolean {
    const studentUser = this.users.find(u => u.id === studentId);
    if (!studentUser || !studentUser.subscribedTeacherIds) {
      return false;
    }
    return studentUser.subscribedTeacherIds.includes(teacherId);
  }

  private formatDecimalHour(value: number): string {
    const hour = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
