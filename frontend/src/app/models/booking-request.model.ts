export interface BookingRequest {
  id: string;
  studentId: string;
  teacherId: string;
  availabilitySlotId: string;
  requestDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedDate: string;
  requestedStartHour: number;
  requestedEndHour: number;
  studentNotes?: string;
  teacherNotes?: string;
}
