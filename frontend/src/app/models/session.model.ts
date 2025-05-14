export interface Session {
    id: string;
    studentId: string;
    teacherId: string;
    date: string; // ISO date string
    hour: number; // hour of the session
    status: 'scheduled' | 'cancelled';
  }