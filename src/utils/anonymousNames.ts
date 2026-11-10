// Korean Adjectives (긍정적이고 지혜로운 수식어)
const ADJECTIVES = [
  '지혜로운', '당당한', '따뜻한', '용감한', '친절한',
  '빛나는', '차분한', '성실한', '창의적인', '정의로운',
  '열정적인', '다정한', '호기심많은', '씩씩하고', '솔직한',
  '사려깊은', '재치있는', '맑고밝은', '차근차근한', '배려하는',
  '슬기로운', '든든한', '꿈꾸는', '기운찬', '활기찬',
  '정성어린', '유쾌한', '눈부신', '포근한', '신중한',
  '상냥한', '평화로운', '끈기있는', '반짝이는', '자유로운'
];

// Korean Animal / Mascot items with corresponding emoji
const ANIMALS: { name: string; emoji: string }[] = [
  { name: '사자', emoji: '🦁' },
  { name: '독수리', emoji: '🦅' },
  { name: '돌고래', emoji: '🐬' },
  { name: '호랑이', emoji: '🐯' },
  { name: '판다', emoji: '🐼' },
  { name: '부엉이', emoji: '🦉' },
  { name: '북극곰', emoji: '🐻‍❄️' },
  { name: '수달', emoji: '🦦' },
  { name: '바다거북', emoji: '🐢' },
  { name: '고래', emoji: '🐳' },
  { name: '여우', emoji: '🦊' },
  { name: '다람쥐', emoji: '🐿️' },
  { name: '치타', emoji: '🐆' },
  { name: '펭귄', emoji: '🐧' },
  { name: '사슴', emoji: '🦌' },
  { name: '토끼', emoji: '🐰' },
  { name: '코알라', emoji: '🐨' },
  { name: '해달', emoji: '🌊' },
  { name: '알파카', emoji: '🦙' },
  { name: '물범', emoji: '🦭' },
  { name: '앵무새', emoji: '🦜' },
  { name: '기린', emoji: '🦒' },
  { name: '코끼리', emoji: '🐘' },
  { name: '나비', emoji: '🦋' },
  { name: '별빛', emoji: '✨' },
];

/**
 * Deterministically generates an anonymous nickname based on grade, class, and number
 * to keep it consistent within the class, or with an optional seed.
 */
export function generateAnonymousIdentity(grade: number, classNum: number, studentNum: number): {
  anonymousName: string;
  avatar: string;
} {
  const seed = (grade * 1000) + (classNum * 50) + studentNum;
  const adjIndex = Math.abs(seed * 7 + 13) % ADJECTIVES.length;
  const animalIndex = Math.abs(seed * 11 + 29) % ANIMALS.length;

  const adjective = ADJECTIVES[adjIndex];
  const animal = ANIMALS[animalIndex];

  return {
    anonymousName: `${adjective} ${animal.name}`,
    avatar: animal.emoji,
  };
}

/**
 * Random anonymous name generator for guests or tests
 */
export function getRandomAnonymousIdentity(): {
  anonymousName: string;
  avatar: string;
} {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return {
    anonymousName: `${adj} ${animal.name}`,
    avatar: animal.emoji,
  };
}
