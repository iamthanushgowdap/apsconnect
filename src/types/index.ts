
export type UserRole = "student" | "admin" | "pending" | "faculty";

export type Branch = "CSE" | "ISE" | "ECE" | "ME" | "CIVIL" | "OTHER";

export const branches: Branch[] = ["CSE", "ISE", "ECE", "ME", "CIVIL", "OTHER"];

// This interface represents the more detailed user profile stored in localStorage.
export interface UserProfile {
  uid: string; // For students, USN. For faculty/admin, email.
  email: string;
  displayName?: string;
  role: UserRole;
  
  // Student-specific fields
  usn?: string; // University Seat Number for students
  branch?: Branch; // Student's single branch (derived from USN or set)
  registrationDate: string; // ISO string format (e.g., new Date().toISOString())
  
  isApproved: boolean;
  
  approvedByUid?: string; // UID of admin/faculty who approved
  approvedByDisplayName?: string; // Display name of admin/faculty who approved
  approvalDate?: string; // ISO string for when approved

  rejectionReason?: string;
  rejectedByUid?: string; // UID of admin/faculty who rejected
  rejectedByDisplayName?: string; // Display name of admin/faculty who rejected
  rejectedDate?: string; // ISO string for when rejected

  // Faculty-specific fields
  assignedBranches?: Branch[]; // Branches faculty is associated with
  facultyTitle?: string; // e.g., "Professor", "HOD of CSE"
  phoneNumber?: string; // Primarily for faculty, set by admin
  
  // !!! MOCK ONLY: In a real application, NEVER store plaintext passwords.
  // This is included here to simulate admin setting/updating a password for faculty.
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
