export interface Session {
  id: string;
  studentId: string;
  teacherId: string;
  availabilitySlotId: string; // Links to the CalendarAvailability.id
  status: 'scheduled' | 'cancelled';
  bookingRequestId?: string; // ID of the BookingRequest that led to this session
}
