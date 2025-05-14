import { Injectable } from '@angular/core';
import { Session } from '../models/session.model';
import { CalendarAvailability } from '../models/user.model';
import { UserService } from './user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private sessions: Session[] = [];

  constructor(private userService: UserService) { }

  bookSession(studentId: string, teacherId: string, availabilitySlotId: string, bookingRequestId?: string): Session | null {
    const slotToBook = this.userService.getAvailabilitySlotById(availabilitySlotId);

    if (!slotToBook || slotToBook.userId !== teacherId || slotToBook.sessionId) {
      console.error('Slot not available, does not belong to the teacher, or does not exist');
      return null;
    }

    const newSession: Session = {
      id: uuidv4(),
      studentId,
      teacherId,
      availabilitySlotId: slotToBook.id,
      status: 'scheduled',
      bookingRequestId: bookingRequestId
    };

    this.sessions.push(newSession);
    this.userService.updateAvailabilitySlotBooking(teacherId, slotToBook.id, newSession.id);
    return JSON.parse(JSON.stringify(newSession));
  }

  cancelSession(sessionId: string): boolean {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return false;

    const sessionToCancel = this.sessions[sessionIndex];
    sessionToCancel.status = 'cancelled';

    this.userService.updateAvailabilitySlotBooking(sessionToCancel.teacherId, sessionToCancel.availabilitySlotId, undefined);
    // Also update the session in our local array
    this.sessions[sessionIndex] = sessionToCancel;
    return true;
  }

  getSessionsForTeacher(teacherId: string): Session[] {
    return JSON.parse(JSON.stringify(this.sessions.filter(s => s.teacherId === teacherId && s.status === 'scheduled')));
  }

  getSessionsForStudent(studentId: string): Session[] {
    return JSON.parse(JSON.stringify(this.sessions.filter(s => s.studentId === studentId && s.status === 'scheduled')));
  }

  getSessionsBySlotIds(slotIds: string[]): Session[] {
    return JSON.parse(JSON.stringify(this.sessions.filter(s => slotIds.includes(s.availabilitySlotId) && s.status === 'scheduled')));
  }

  getSessionById(sessionId: string): Session | undefined {
    const session = this.sessions.find(s => s.id === sessionId);
    return session ? JSON.parse(JSON.stringify(session)) : undefined;
  }
}
