export interface Session {
  id: string;
  studentId: string;
  teacherId: string;
  availabilitySlotId: string; // Links to the CalendarAvailability.id
  status: 'scheduled' | 'cancelled';
  // date and hour can be derived from the linked CalendarAvailability slot
}
