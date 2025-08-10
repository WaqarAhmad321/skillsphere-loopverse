

export type UserRole = 'learner' | 'mentor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

export interface Mentor extends User {
  role: 'mentor';
  rating: number;
  reviews: number;
  availability: Record<string, string[]>; // e.g. { '2024-08-20': ['10:00', '11:00'] }
  subjects: string[];
  isApproved: boolean;
  portfolioUrl?: string;
}

export interface Session {
  id: string;
  mentorId: string;
  learnerId: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  feedback?: {
    rating: number;
    comment: string;
  };
  keywords?: string;
  summary?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: string;
  timestamp: string; // ISO string
  isRead: boolean;
}
