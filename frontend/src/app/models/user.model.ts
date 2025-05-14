export interface CalendarAvailability {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  startHour: number; // 0-23.75, representing the start time (e.g., 9.0 for 9:00, 9.25 for 9:15)
  endHour: number; // 0.25-24, representing the end time (e.g., 9.25 for 9:15, 10.0 for 10:00)
  sessionId?: string; // ID of the session if this slot is booked
  durationHours?: number; // Calculated for convenience
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password?: string;
  hasTeacherRights: boolean;
  availability?: CalendarAvailability[];
  subscribedTeacherIds?: string[];
  teachingStudentIds?: string[];
  profilePictureUrl?: string;
  chessTitle?: string;
  rating?: number;
}
