export type UserRole = 'student' | 'teacher';

export interface StudentInfo {
  grade: number;
  classNum: number;
  studentNum: number;
  realName: string;
}

export interface CurrentUser {
  id: string;
  role: UserRole;
  anonymousName: string;
  avatar: string;
  studentInfo?: StudentInfo;
  isLoggedIn: boolean;
}

export type DiscussionMode = 'pro_con' | 'free_notes' | 'three_step';
export type ThreeStepStage = 1 | 2 | 3; // 1: 입론, 2: 반론, 3: 최종발언
export type StanceType = 'agree' | 'disagree' | 'neutral';
export type NoteColor = 'yellow' | 'pink' | 'mint' | 'lavender' | 'blue' | 'peach';

export interface Discussion {
  id: string;
  title: string;
  description: string;
  mode: DiscussionMode;
  currentStage: ThreeStepStage; // for three_step
  isActive: boolean;
  allowSubmissions: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Post {
  id: string;
  discussionId: string;
  mode: DiscussionMode;
  authorId: string;
  anonymousName: string;
  avatar: string;
  content: string;
  
  // Specific to pro_con
  stance?: StanceType;
  
  // Specific to free_notes
  color?: NoteColor;
  
  // Specific to three_step
  stage?: ThreeStepStage;
  replyToPostId?: string;
  replyToSummary?: string;
  
  // Interactions
  likes: number;
  likedBy: string[]; // array of user IDs
  commentsCount: number;
  
  // Moderation
  isBlinded?: boolean;
  isPinned?: boolean;
  
  // Teacher-only student metadata (secured, hidden from students)
  studentInfo?: StudentInfo;
  
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  anonymousName: string;
  avatar: string;
  content: string;
  createdAt: number;
  studentInfo?: StudentInfo;
}

export interface BackendConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isUsingFallback: boolean;
  provider: 'supabase' | 'firebase' | 'local';
  error?: string;
}

export type FirebaseConnectionStatus = BackendConnectionStatus;

export interface SupabaseAppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}
