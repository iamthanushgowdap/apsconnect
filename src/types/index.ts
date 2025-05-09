
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
  
  password?: string; 
}

export type PostCategory = "event" | "news" | "link" | "note" | "schedule";
export const postCategories: PostCategory[] = ["event", "news", "link", "note", "schedule"];

export interface PostAttachment {
  name: string;
  type: string;
  size: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string; 
  authorName: string; 
  authorRole: UserRole; 
  authorAvatarUrl?: string; 
  createdAt: string; 
  updatedAt?: string; 
  category: PostCategory;
  targetBranches: Branch[]; 
  attachments: PostAttachment[];
  likes?: string[]; 
}

// Timetable related types
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
export const daysOfWeek: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// TimeTableEntry and TimeTableDaySchedule are no longer needed for image-based timetable
// export interface TimeTableEntry { ... }
// export interface TimeTableDaySchedule { ... }

export interface TimeTable {
  id: string; // Unique ID for the timetable, e.g., `${branch}_${semester}`
  branch: Branch;
  semester: Semester;
  imageDataUrl: string; // Stores the timetable image as a base64 data URI
  lastUpdatedBy: string; // UID of user who last updated
  lastUpdatedAt: string; // ISO string
}
