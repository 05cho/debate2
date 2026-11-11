export interface RosterStudent {
  studentNum: number;
  realName: string;
}

export const CLASS_ROSTER: RosterStudent[] = [
  { studentNum: 1, realName: '안은비' },
  { studentNum: 2, realName: '오세아' },
  { studentNum: 3, realName: '유예솔' },
  { studentNum: 4, realName: '이다영' },
  { studentNum: 5, realName: '이하윤' },
  { studentNum: 6, realName: '정수진' },
  { studentNum: 7, realName: '정하임' },
  { studentNum: 8, realName: '조윤서' },
  { studentNum: 9, realName: '조은채' },
  { studentNum: 10, realName: '최아린' },
  { studentNum: 11, realName: '홍소현' },
  { studentNum: 12, realName: '구본솔' },
  { studentNum: 13, realName: '구준서' },
  { studentNum: 14, realName: '김다온' },
  { studentNum: 15, realName: '김세율' },
  { studentNum: 16, realName: '김진성' },
  { studentNum: 17, realName: '양도윤' },
  { studentNum: 18, realName: '유서형' },
  { studentNum: 19, realName: '이서호' },
  { studentNum: 20, realName: '이시윤' },
  { studentNum: 21, realName: '이하람' },
  { studentNum: 22, realName: '이하준' },
  { studentNum: 23, realName: '임수찬' },
  { studentNum: 24, realName: '최지민' },
  { studentNum: 25, realName: '홍윤제' },
];

export function findStudentByNum(num: number): RosterStudent | undefined {
  return CLASS_ROSTER.find((s) => s.studentNum === num);
}

export function findStudentByName(name: string): RosterStudent | undefined {
  const trimmed = name.trim();
  return CLASS_ROSTER.find((s) => s.realName === trimmed);
}
