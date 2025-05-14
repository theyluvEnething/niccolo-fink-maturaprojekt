import { Injectable } from '@angular/core';
import { BookingRequest } from '../models/booking-request.model';
import { User, CalendarAvailability } from '../models/user.model';
import { Session } from '../models/session.model';
import { UserService } from './user.service';
import { SessionService } from './session.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class BookingRequestService {
  private bookingRequests: BookingRequest[] = [];

  constructor(
    private userService: UserService,
    private sessionService: SessionService
  ) {}

  createBookingRequest(studentId: string, teacherId: string, availabilitySlotId: string, studentNotes?: string): BookingRequest | null {
    const student = this.userService.getUserById(studentId);
    const teacher = this.userService.getUserById(teacherId);
    const slot = this.userService.getAvailabilitySlotById(availabilitySlotId);

    if (!student || !teacher || !slot) {
      console.error('Invalid student, teacher, or slot for booking request.');
      return null;
    }

    if (slot.sessionId || this.hasPendingRequestForSlot(availabilitySlotId, 'accepted') || this.hasPendingRequestForSlot(availabilitySlotId, 'pending')) {
      console.error('Slot is already booked or has a pending/accepted request.');
      return null;
    }

    const newRequest: BookingRequest = {
      id: uuidv4(),
      studentId,
      teacherId,
      availabilitySlotId,
      requestDate: new Date().toISOString(),
      status: 'pending',
      requestedDate: slot.date,
      requestedStartHour: slot.startHour,
      requestedEndHour: slot.endHour,
      studentNotes: studentNotes
    };

    this.bookingRequests.push(newRequest);
    return JSON.parse(JSON.stringify(newRequest));
  }

  getBookingRequestsForTeacher(teacherId: string, status?: BookingRequest['status']): BookingRequest[] {
    let requests = this.bookingRequests.filter(req => req.teacherId === teacherId);
    if (status) {
      requests = requests.filter(req => req.status === status);
    }
    return JSON.parse(JSON.stringify(requests));
  }

  getBookingRequestsForStudent(studentId: string, status?: BookingRequest['status']): BookingRequest[] {
    let requests = this.bookingRequests.filter(req => req.studentId === studentId);
    if (status) {
      requests = requests.filter(req => req.status === status);
    }
    return JSON.parse(JSON.stringify(requests));
  }

  acceptBookingRequest(requestId: string, teacherNotes?: string): Session | null {
    const requestIndex = this.bookingRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      console.error('Booking request not found.');
      return null;
    }

    const request = this.bookingRequests[requestIndex];
    if (request.status !== 'pending') {
      console.error('Booking request is not in pending state.');
      return null;
    }

    const slot = this.userService.getAvailabilitySlotById(request.availabilitySlotId);
    if (!slot || slot.sessionId) {
        console.error('Slot is no longer available or already booked.');
        request.status = 'rejected';
        request.teacherNotes = teacherNotes || 'Slot became unavailable.';
        return null;
    }

    const session = this.sessionService.bookSession(request.studentId, request.teacherId, request.availabilitySlotId, request.id);
    if (session) {
      request.status = 'accepted';
      request.teacherNotes = teacherNotes;
      return session;
    } else {
      console.error('Failed to create session from booking request.');
      return null;
    }
  }

  rejectBookingRequest(requestId: string, teacherNotes?: string): boolean {
    const requestIndex = this.bookingRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return false;
    }

    const request = this.bookingRequests[requestIndex];
    if (request.status !== 'pending') {
      return false;
    }

    request.status = 'rejected';
    request.teacherNotes = teacherNotes;
    return true;
  }

  cancelBookingRequestByStudent(requestId: string, studentId: string): boolean {
    const requestIndex = this.bookingRequests.findIndex(req => req.id === requestId && req.studentId === studentId);
    if (requestIndex === -1) {
      console.error('Booking request not found or does not belong to the student.');
      return false;
    }

    const request = this.bookingRequests[requestIndex];
    if (request.status !== 'pending') {
      console.error('Only pending booking requests can be cancelled by the student.');
      return false;
    }

    this.bookingRequests.splice(requestIndex, 1);
    return true;
  }

  getBookingRequestById(requestId: string): BookingRequest | undefined {
    const request = this.bookingRequests.find(req => req.id === requestId);
    return request ? JSON.parse(JSON.stringify(request)) : undefined;
  }

  hasPendingRequestForSlot(availabilitySlotId: string, status: 'pending' | 'accepted' = 'pending'): boolean {
    return this.bookingRequests.some(req => req.availabilitySlotId === availabilitySlotId && req.status === status);
  }
}
