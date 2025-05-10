export type UserRole = "student" | "admin" | "pending" | "faculty";

// Branch type is now string to allow admins to define custom branch names.
export type Branch = string;

// defaultBranches provides a list of common/suggested branches for forms.
export const defaultBranches: Branch[] = ["CSE", "ISE", "ECE", "ME", "CIVIL", "AI & ML", "OTHER"];

export type Semester = "1st Sem" | "2nd Sem" | "3rd Sem" | "4th Sem" | "5th Sem" | "6th Sem" | "7th Sem" | "8th Sem";
export const semesters: Semester[] = ["1st Sem", "2nd Sem", "3rd Sem", "4th Sem", "5th Sem", "6th Sem", "7th Sem", "8th Sem"];

export type PostCategory = "event" | "news" | "link" | "note" | "schedule";
export const postCategories: PostCategory[] = ["event", "news", "link", "note", "schedule"];

// Notification Preferences
export interface NotificationPreferences {
  news: boolean;
  events: boolean;
  notes: boolean;
  schedules: boolean;
  general: boolean; // For posts not fitting other categories or targeted to all
}

// This interface represents the more detailed user profile stored in localStorage.
export interface UserProfile {
  uid: string; // For students, USN. For faculty/admin, email.
  email: string;
  displayName?: string;
  role: UserRole;
  avatarDataUrl?: string; // Stores the profile picture as a base64 data URI
  pronouns?: string; // e.g., "he/him", "she/her", "they/them"
  
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
  assignedSemesters?: Semester[]; // Semesters faculty is associated with
  facultyTitle?: string; // e.g., "Professor", "HOD of CSE"
  phoneNumber?: string; // Primarily for faculty, set by admin
  
  password?: string; 
  notificationPreferences?: NotificationPreferences;
}


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
  // Fields for calendar events
  eventDate?: string; // ISO string for the date of the event
  eventStartTime?: string; // e.g., "10:00"
  eventEndTime?: string; // e.g., "12:00"
  eventLocation?: string;
}

// Timetable related types
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
export const daysOfWeek: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface TimeSlotDescriptor {
  time: string;
  label: string; // "Period 1", "Short Break", "Period 2", etc.
  isBreak: boolean;
}

export const timeSlotDescriptors: TimeSlotDescriptor[] = [
  { time: "9:00 AM - 9:50 AM",   label: "Period 1",    isBreak: false },
  { time: "9:50 AM - 10:40 AM",  label: "Period 2",    isBreak: false },
  { time: "10:40 AM - 11:00 AM", label: "Short Break", isBreak: true  },
  { time: "11:00 AM - 11:50 AM", label: "Period 3",    isBreak: false },
  { time: "11:50 AM - 12:40 PM", label: "Period 4",    isBreak: false },
  { time: "12:40 PM - 1:20 PM",  label: "Lunch Break", isBreak: true  },
  { time: "1:20 PM - 2:10 PM",   label: "Period 5",    isBreak: false },
  { time: "2:10 PM - 3:00 PM",   label: "Period 6",    isBreak: false },
  { time: "3:00 PM - 3:50 PM",   label: "Period 7",    isBreak: false }
];

export const defaultTimeSlots = timeSlotDescriptors.map(d => d.time); 
export const defaultPeriods = timeSlotDescriptors.length; 

export const saturdayLastSlotIndex = timeSlotDescriptors.findIndex(d => d.label === "Period 4");


export interface TimeTableEntry {
  period: number; 
  subject: string; 
}

export interface TimeTableDaySchedule {
  day: DayOfWeek;
  entries: TimeTableEntry[]; 
}

export interface TimeTable {
  id: string; 
  branch: Branch;
  semester: Semester;
  schedule: TimeTableDaySchedule[]; 
  lastUpdatedBy: string; 
  lastUpdatedAt: string; 
}

// Study Material related types
export interface StudyMaterialAttachment {
  name: string;
  type: string;
  size: number;
  // In a real backend, this would be a URL. For localStorage mock, it's just metadata.
  // mockFileId could be used to simulate a download later if needed.
  mockFileId: string; 
}

export interface StudyMaterial {
  id: string;
  branch: Branch;
  semester: Semester;
  title: string;
  description?: string;
  attachments: StudyMaterialAttachment[]; // Array to support multiple files per material entry
  uploadedByUid: string; // UID of admin/faculty who uploaded
  uploadedByDisplayName: string;
  uploadedAt: string; // ISO string
}

export const STUDY_MATERIAL_STORAGE_KEY = 'apsconnect_study_materials';


// Search related types
export type SearchResultItem = 
  | ({ type: 'post' } & Post)
  | ({ type: 'user' } & UserProfile)
  | ({ type: 'timetable' } & TimeTable) // Added for timetable search
  | ({ type: 'studymaterial' } & StudyMaterial); // Added for study material search


export interface SearchResults {
  posts: Post[];
  users: UserProfile[];
  timetables: TimeTable[];
  studyMaterials: StudyMaterial[];
}

// Anonymous Reporting System Types
export type ReportRecipientType = 'faculty' | 'admin';
export type ReportStatus = 'new' | 'viewed' | 'resolved' | 'archived';

export interface Report {
  id: string;
  recipientType: ReportRecipientType;
  reportContent: string;
  submittedAt: string; // ISO Date string
  status: ReportStatus;
  // Contextual information, not directly identifying the student in the report object
  contextBranch?: Branch; // Branch context of the student submitting, if applicable
  contextSemester?: Semester; // Semester context of the student submitting, if applicable
  // Admin/Faculty actions
  viewedAt?: string;
  resolvedAt?: string;
  resolvedByUid?: string;
  resolutionNotes?: string;
}

export const REPORT_STORAGE_KEY = 'apsconnect_reports';
