
export type UserRole = "student" | "admin" | "pending" | "faculty";

export type Branch = "CSE" | "ISE" | "ECE" | "ME" | "CIVIL" | "OTHER";

export const branches: Branch[] = ["CSE", "ISE", "ECE", "ME", "CIVIL", "OTHER"];

export interface UserProfile {
  uid: string; // For students, this could be USN
  email: string;
  displayName?: string;
  role: UserRole;
  branch?: Branch; // Can be derived from USN
  usn?: string; // University Seat Number
  registrationDate: Date;
  isApproved: boolean;
  // Add any other profile fields needed
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string; // Denormalized for easier display
  createdAt: Date;
  updatedAt?: Date;
  category: "event" | "news" | "link" | "note" | "schedule";
  targetBranches: Branch[]; // Which branches this post is for
  // Add other post fields like attachments, expiryDate, etc.
}

