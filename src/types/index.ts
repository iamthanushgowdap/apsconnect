
export type UserRole = "student" | "admin" | "pending" | "faculty";

// Branch type is now string to allow admins to define custom branch names.
export type Branch = string;

// defaultBranches provides a list of common/suggested branches for forms.
export const defaultBranches: Branch[] = ["CSE", "ISE", "ECE", "ME", "CIVIL", "AI & ML", "OTHER"];

export type Semester = "1st Sem" | "2nd Sem" | "3rd Sem" | "4th Sem" | "5th Sem" | "6th Sem" | "7th Sem" | "8th Sem";
export const semesters: Semester[] = ["1st Sem", "2nd Sem", "3rd Sem", "4th Sem", "5th Sem", "6th Sem", "7th Sem", "8th Sem"];

// This interface represents the more detailed user profile stored in localStorage.
export interface UserProfile {
  uid: string; // For students, USN. For faculty/admin, email.
  email: string;
  displayName?: string;
  role: UserRole;
  avatarDataUrl?: string; // Stores the profile picture as a base64 data URI
  
  // Student-specific fields
  usn?: string; // University Seat Number for students
  branch?: Branch; // Student's single branch (derived from USN or set)
  semester?: Semester; // Student's current semester
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

export type PostCategory = "event" | "news" | "link" | "note" | "schedule";
export const postCategories: PostCategory[] = ["event", "news", "link", "note", "schedule"];

export interface PostAttachment {
  name: string;
  type: string;
  size: number;
  // In a real app, this would be a URL to the stored file
  // For mock, we might store a data URI if small, or just name/type
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string; // UID of admin/faculty
  authorName: string; // Display name for convenience
  authorRole: UserRole; // Role of the author ('admin' or 'faculty')
  authorAvatarUrl?: string; // Optional avatar of the post author
  createdAt: string; // ISO string format
  updatedAt?: string; // ISO string format
  category: PostCategory;
  // If targetBranches is empty, it's considered a general post for all branches.
  // Otherwise, it's targeted to the specified branches.
  targetBranches: Branch[]; 
  attachments: PostAttachment[];
  likes?: string[]; // Array of user UIDs who liked the post
}
