
export type UserRole = "student" | "admin" | "pending" | "faculty";

export type Branch = "CSE" | "ISE" | "ECE" | "ME" | "CIVIL" | "OTHER";

export const branches: Branch[] = ["CSE", "ISE", "ECE", "ME", "CIVIL", "OTHER"];

// This interface represents the more detailed user profile stored in localStorage.
export interface UserProfile {
  uid: string; // For students, USN. For faculty/admin, email.
  email: string;
  displayName?: string;
  role: UserRole;
  branch?: Branch; // Can be derived from USN for students or set for faculty
  usn?: string; // University Seat Number for students
  registrationDate: string; // ISO string format (e.g., new Date().toISOString())
  isApproved: boolean;
  phoneNumber?: string; // Primarily for faculty, set by admin
  // !!! MOCK ONLY: In a real application, NEVER store plaintext passwords.
  // This is included here to simulate admin setting a password for faculty.
  password?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string; // Denormalized for easier display
  createdAt: string; // ISO string format
  updatedAt?: string; // ISO string format
  category: "event" | "news" | "link" | "note" | "schedule";
  targetBranches: Branch[]; // Which branches this post is for
  // Add other post fields like attachments, expiryDate, etc.
}
