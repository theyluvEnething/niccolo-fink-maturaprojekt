import { Injectable } from '@angular/core';
import { User, CalendarAvailability } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.seedUsers();
  }

  private seedUsers() {
    const teacherId1 = uuidv4();
    const studentId1 = uuidv4();
    const userWithBothRightsId = uuidv4();

    const today = new Date();
    let availabilitiesTeacher1: CalendarAvailability[] = [];
    const hoursToSeed: number[] = [];

    for (let i = 1; i <= 5; i++) {
      for (let hour of hoursToSeed) {
        const availDate = new Date(today.getFullYear(), today.getMonth() + 1, i);
        availabilitiesTeacher1.push({
          id: uuidv4(),
          userId: teacherId1,
          date: availDate.toISOString().slice(0, 10),
          hour,
        });
      }
    }

    let availabilitiesBothRights: CalendarAvailability[] = [];
    for (let i = 6; i <= 10; i++) {
        for (let hour of hoursToSeed) {
        const availDate = new Date(today.getFullYear(), today.getMonth() + 1, i);
        availabilitiesBothRights.push({
            id: uuidv4(),
            userId: userWithBothRightsId,
            date: availDate.toISOString().slice(0,10),
            hour,
        });
        }
    }

    this.users.push({
      id: studentId1,
      username: 'studentUser',
      fullName: 'Regular Student',
      email: 'student@email.com',
      password: '1234',
      hasTeacherRights: false,
      subscribedTeacherIds: [teacherId1]
    });

    this.users.push({
      id: teacherId1,
      username: 'teacherUser',
      fullName: 'Dedicated Teacher',
      email: 'teacher@email.com',
      password: '1234',
      hasTeacherRights: true,
      availability: availabilitiesTeacher1,
      teachingStudentIds: [studentId1]
    });

    this.users.push({
      id: userWithBothRightsId,
      username: 'versatileUser',
      fullName: 'Magnus Carlsen',
      email: 'magnus@email.com',
      password: '1234',
      hasTeacherRights: true,
      availability: availabilitiesBothRights,
      subscribedTeacherIds: [],
      teachingStudentIds: []
    });
  }

  login(email: string, passwordInput: string): User | null {
    const userFound = this.users.find(u => u.email === email && u.password === passwordInput);
    if (userFound) {
      const { password, ...userToStore } = userFound;
      this.currentUser = userToStore as User;
      return this.currentUser;
    }
    this.currentUser = null;
    return null;
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) return null;
    const userToReturn = { ...this.currentUser };
    delete userToReturn.password;
    return userToReturn;
  }

  getAllUsers(): User[] {
    return this.users.map(u => {
      const { password, ...user } = u;
      return user as User;
    });
  }

  getUsersWithTeacherRights(): User[] {
    return this.users
      .filter(u => u.hasTeacherRights)
      .map(u => {
        const { password, ...user } = u;
        return user as User;
      });
  }

  getUserById(id: string): User | null {
    const userFound = this.users.find(x => x.id === id);
    if (!userFound) return null;
    const { password, ...userToReturn } = userFound;
    return userToReturn as User;
  }

  updateUserAvailability(userId: string, availability: CalendarAvailability[]) {
    const user = this.users.find(u => u.id === userId);
    if (user && user.hasTeacherRights) {
      user.availability = availability;
    }
  }
}
