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

    const sampleAvailabilityHours = [9, 10, 11, 14, 15];
    const today = new Date();
    const initialAvailabilitiesTeacher1: CalendarAvailability[] = [];
    const initialAvailabilitiesBothRights: CalendarAvailability[] = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().slice(0, 10);
      sampleAvailabilityHours.forEach(hour => {
        if (i % 2 === 0) { // Add some availability for teacher1
          initialAvailabilitiesTeacher1.push({
            id: uuidv4(),
            userId: teacherId1,
            date: dateString,
            hour: hour,
          });
        }
        if (i % 2 !== 0) { // Add some for versatileUser on different days/hours
           initialAvailabilitiesBothRights.push({
            id: uuidv4(),
            userId: userWithBothRightsId,
            date: dateString,
            hour: hour + 1 > 23 ? hour : hour + 1, // slight variation
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
      subscribedTeacherIds: [teacherId1]
    });

    this.users.push({
      id: teacherId1,
      username: 'teacherUser',
      fullName: 'Dedicated Teacher',
      email: 'teacher@email.com',
      password: '1234',
      hasTeacherRights: true,
      availability: initialAvailabilitiesTeacher1,
      teachingStudentIds: [studentId1]
    });

    this.users.push({
      id: userWithBothRightsId,
      username: 'versatileUser',
      fullName: 'Magnus Carlsen',
      email: 'magnus@email.com',
      password: '1234',
      hasTeacherRights: true,
      availability: initialAvailabilitiesBothRights,
      subscribedTeacherIds: [],
      teachingStudentIds: []
    });
  }

  login(email: string, passwordInput: string): User | null {
    const userFound = this.users.find(u => u.email === email && u.password === passwordInput);
    if (userFound) {
      const { password, ...userToStore } = userFound;
      this.currentUser = JSON.parse(JSON.stringify(userToStore)) as User; // Deep copy
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
    return JSON.parse(JSON.stringify(userToReturn)); // Deep copy
  }

  getAllUsers(): User[] {
    return this.users.map(u => {
      const { password, ...user } = u;
      return JSON.parse(JSON.stringify(user)) as User; // Deep copy
    });
  }

  getUsersWithTeacherRights(): User[] {
    return this.users
      .filter(u => u.hasTeacherRights)
      .map(u => {
        const { password, ...user } = u;
        return JSON.parse(JSON.stringify(user)) as User; // Deep copy
      });
  }

  getUserById(id: string): User | null {
    const userFound = this.users.find(x => x.id === id);
    if (!userFound) return null;
    const { password, ...userToReturn } = userFound;
    return JSON.parse(JSON.stringify(userToReturn)) as User; // Deep copy
  }

  addAvailabilitySlots(teacherId: string, date: string, startHour: number, endHour: number): CalendarAvailability[] {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.hasTeacherRights) {
      console.error('Teacher not found or user does not have teacher rights.');
      return [];
    }

    if (!teacher.availability) {
      teacher.availability = [];
    }

    const addedSlots: CalendarAvailability[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const existingSlot = teacher.availability.find(slot => slot.date === date && slot.hour === hour);
      if (existingSlot) {
        console.warn(`Slot for ${date} at ${hour}:00 already exists for teacher ${teacherId}. Skipping.`);
        continue;
      }

      const newSlot: CalendarAvailability = {
        id: uuidv4(),
        userId: teacherId,
        date: date,
        hour: hour,
      };
      teacher.availability.push(newSlot);
      addedSlots.push(newSlot);
    }

    if (this.currentUser && this.currentUser.id === teacherId) {
      this.currentUser.availability = [...(teacher.availability || [])];
    }
    return addedSlots;
  }

  getTeacherAvailabilityForPeriod(teacherId: string, startDate: string, endDate: string): CalendarAvailability[] {
    const teacher = this.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.availability) {
      return [];
    }
    return teacher.availability.filter(slot => {
      const slotDate = slot.date;
      return slotDate >= startDate && slotDate <= endDate;
    });
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

    if (this.currentUser && this.currentUser.id === teacherId) {
      this.currentUser.availability = [...(teacher.availability || [])];
    }
    return true;
  }

  getAvailabilitySlotById(slotId: string): CalendarAvailability | undefined {
    for (const user of this.users) {
        if (user.availability) {
            const slot = user.availability.find(s => s.id === slotId);
            if (slot) return slot;
        }
    }
    return undefined;
  }
}
