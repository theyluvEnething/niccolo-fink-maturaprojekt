export interface CalendarAvailability {
  id: string;
  userId: string;
  date: string;
  hour: number;
  sessionId?: string;
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
