export interface CalendarAvailability {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  hour: number; // 0-23, representing the start of the hour slot
  sessionId?: string; // ID of the session if this slot is booked
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
}
