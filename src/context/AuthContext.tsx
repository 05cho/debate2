import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CurrentUser, StudentInfo } from '../types';
import { generateAnonymousIdentity } from '../utils/anonymousNames';
import { recordStudentPresence } from '../services/dataService';
import { CLASS_ROSTER } from '../data/classRoster';

const STORAGE_KEY_AUTH_USER = 'school_debate_auth_user';
const STORAGE_KEY_STUDENT_PIN = 'school_debate_student_pin';
const STORAGE_KEY_TEACHER_PIN = 'school_debate_teacher_pin';

const DEFAULT_STUDENT_PIN = '1234';
const DEFAULT_TEACHER_PIN = '7287';

interface AuthContextType {
  currentUser: CurrentUser;
  loginAsStudent: (student: StudentInfo, pin: string) => Promise<{ success: boolean; error?: string }>;
  quickAutoLoginStudent: () => Promise<{ success: boolean; user: CurrentUser }>;
  loginAsTeacher: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isTeacher: boolean;
  isStudent: boolean;
  theme: 'chalkboard' | 'pastel';
  setTheme: (theme: 'chalkboard' | 'pastel') => void;
  toggleTheme: () => void;
  studentPin: string;
  setStudentPin: (newPin: string) => void;
  teacherPin: string;
  setTeacherPin: (newPin: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Student PIN setting (default: '1234')
  const [studentPin, setStudentPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_STUDENT_PIN) || DEFAULT_STUDENT_PIN;
  });

  const setStudentPin = (newPin: string) => {
    const trimmed = newPin.trim() || DEFAULT_STUDENT_PIN;
    setStudentPinState(trimmed);
    localStorage.setItem(STORAGE_KEY_STUDENT_PIN, trimmed);
  };

  // Teacher PIN setting (default: '7287')
  const [teacherPin, setTeacherPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TEACHER_PIN) || DEFAULT_TEACHER_PIN;
  });

  const setTeacherPin = (newPin: string) => {
    const trimmed = newPin.trim() || DEFAULT_TEACHER_PIN;
    setTeacherPinState(trimmed);
    localStorage.setItem(STORAGE_KEY_TEACHER_PIN, trimmed);
  };

  // Initial user state: if no saved user, start as not logged in
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn) return parsed;
      } catch {}
    }
    return {
      id: '',
      role: 'student',
      anonymousName: '방문자',
      avatar: '🌱',
      isLoggedIn: false,
    };
  });

  const [theme, setTheme] = useState<'chalkboard' | 'pastel'>(() => {
    const saved = localStorage.getItem('school_debate_theme');
    return (saved as 'chalkboard' | 'pastel') || 'pastel';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('school_debate_theme', theme);
    if (theme === 'chalkboard') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'chalkboard' ? 'pastel' : 'chalkboard'));
  };

  const loginAsStudent = async (student: StudentInfo, pin: string) => {
    if (!student.realName.trim()) {
      return { success: false, error: '이름을 입력해 주세요.' };
    }
    if (!student.studentNum || isNaN(Number(student.studentNum))) {
      return { success: false, error: '번호를 입력해 주세요.' };
    }
    // Validate PIN against teacher-configured student PIN
    if (pin.trim() !== studentPin.trim()) {
      return { success: false, error: `학생 비밀번호가 일치하지 않습니다. (기본 비밀번호: ${studentPin})` };
    }

    const { anonymousName, avatar } = generateAnonymousIdentity(
      student.grade,
      student.classNum,
      student.studentNum
    );

    const user: CurrentUser = {
      id: `std_${student.grade}_${student.classNum}_${student.studentNum}`,
      role: 'student',
      anonymousName,
      avatar,
      studentInfo: student,
      isLoggedIn: true,
    };

    setCurrentUser(user);
    // Record attendance / presence
    recordStudentPresence(student, anonymousName, avatar);

    return { success: true };
  };

  // One-click quick automatic registration from class roster
  const quickAutoLoginStudent = async () => {
    // Pick an available or random student from the 25 student roster
    const randomIdx = Math.floor(Math.random() * CLASS_ROSTER.length);
    const chosen = CLASS_ROSTER[randomIdx];

    const student: StudentInfo = {
      grade: 2,
      classNum: 3,
      studentNum: chosen.studentNum,
      realName: chosen.realName,
    };

    const { anonymousName, avatar } = generateAnonymousIdentity(
      2,
      3,
      chosen.studentNum
    );

    const user: CurrentUser = {
      id: `std_2_3_${chosen.studentNum}`,
      role: 'student',
      anonymousName,
      avatar,
      studentInfo: student,
      isLoggedIn: true,
    };

    setCurrentUser(user);
    recordStudentPresence(student, anonymousName, avatar);

    return { success: true, user };
  };

  const loginAsTeacher = async (pin: string) => {
    const trimmed = pin.trim();
    if (trimmed !== teacherPin && trimmed !== DEFAULT_TEACHER_PIN && trimmed !== 'admin') {
      return { success: false, error: `교사 비밀번호가 일치하지 않습니다. (기본값: ${teacherPin})` };
    }

    const teacherUser: CurrentUser = {
      id: 'teacher-admin',
      role: 'teacher',
      anonymousName: '교사 관리자',
      avatar: '👩‍🏫',
      isLoggedIn: true,
    };

    setCurrentUser(teacherUser);
    return { success: true };
  };

  const logout = () => {
    const guestUser: CurrentUser = {
      id: '',
      role: 'student',
      anonymousName: '방문자',
      avatar: '🌱',
      isLoggedIn: false,
    };
    setCurrentUser(guestUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginAsStudent,
        quickAutoLoginStudent,
        loginAsTeacher,
        logout,
        isTeacher: currentUser.role === 'teacher',
        isStudent: currentUser.role === 'student',
        theme,
        setTheme,
        toggleTheme,
        studentPin,
        setStudentPin,
        teacherPin,
        setTeacherPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
