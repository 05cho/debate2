import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CurrentUser, StudentInfo } from '../types';
import { generateAnonymousIdentity } from '../utils/anonymousNames';

const STORAGE_KEY_AUTH_USER = 'school_debate_auth_user';
const STORAGE_KEY_STUDENT_PIN = 'school_debate_student_pin';
const STORAGE_KEY_TEACHER_PIN = 'school_debate_teacher_pin';

const DEFAULT_STUDENT_PIN = '1234';
const DEFAULT_TEACHER_PIN = '1234';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Student PIN setting (customizable by teacher, default: '1234')
  const [studentPin, setStudentPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_STUDENT_PIN) || DEFAULT_STUDENT_PIN;
  });

  const setStudentPin = (newPin: string) => {
    const trimmed = newPin.trim() || DEFAULT_STUDENT_PIN;
    setStudentPinState(trimmed);
    localStorage.setItem(STORAGE_KEY_STUDENT_PIN, trimmed);
  };

  // Initial user state: if no saved user, start as not logged in (so student login is visible!)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn) return parsed;
      } catch {}
    }
    // Default: not logged in yet so the login scene is naturally presented!
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
      id: `std_${student.grade}_${student.classNum}_${student.studentNum}_${Date.now()}`,
      role: 'student',
      anonymousName,
      avatar,
      studentInfo: student,
      isLoggedIn: true,
    };

    setCurrentUser(user);
    return { success: true };
  };

  // One-click quick automatic registration for testing / demonstration
  const quickAutoLoginStudent = async () => {
    const randomGrade = Math.floor(Math.random() * 6) + 1; // 1~6학년
    const randomClass = Math.floor(Math.random() * 4) + 1; // 1~4반
    const randomNum = Math.floor(Math.random() * 30) + 1; // 1~30번
    const sampleNames = ['김하늘', '이준호', '박민서', '정다은', '최서준', '윤지우', '강현우', '오예은'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + `(${randomNum}번)`;

    const student: StudentInfo = {
      grade: randomGrade,
      classNum: randomClass,
      studentNum: randomNum,
      realName: randomName,
    };

    const { anonymousName, avatar } = generateAnonymousIdentity(
      randomGrade,
      randomClass,
      randomNum
    );

    const user: CurrentUser = {
      id: `std_auto_${Date.now()}`,
      role: 'student',
      anonymousName,
      avatar,
      studentInfo: student,
      isLoggedIn: true,
    };

    setCurrentUser(user);
    return { success: true, user };
  };

  const loginAsTeacher = async (pin: string) => {
    const allowedPins = [DEFAULT_TEACHER_PIN, 'teacher', 'admin', 'teacher1234'];
    if (!allowedPins.includes(pin.trim())) {
      return { success: false, error: '교사 관리자 비밀번호가 일치하지 않습니다. (기본값: 1234)' };
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
