import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  increment,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, connectionStatus as firebaseConnectionStatus } from './firebase';
import { supabase, connectionStatus as supabaseConnectionStatus } from './supabase';
import type { Discussion, Post, Comment, DiscussionMode, ThreeStepStage } from '../types';

const STORAGE_KEY_DISCUSSION = 'school_debate_current_discussion';
const STORAGE_KEY_POSTS = 'school_debate_posts';
const STORAGE_KEY_COMMENTS = 'school_debate_comments';

// Default initial debate topic for classroom
const DEFAULT_DISCUSSION: Discussion = {
  id: 'current-topic',
  title: '초·중·고등학교 내 스마트폰 자율 사용을 전면 허용해야 하는가?',
  description: '수업 시간 및 쉬는 시간 학생들의 스마트폰 소지와 자율적 디지털 학습 도구 활용에 대한 여러분의 진솔한 생각과 구체적인 근거를 나눠주세요.',
  mode: 'pro_con',
  currentStage: 1,
  isActive: true,
  allowSubmissions: true,
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now(),
};

const DEFAULT_POSTS: Post[] = [
  {
    id: 'sample-p1',
    discussionId: 'current-topic',
    mode: 'pro_con',
    authorId: 'student-demo-1',
    anonymousName: '지혜로운 사자',
    avatar: '🦁',
    content: '정보 검색과 디지털 사전, 시간 관리 앱 등 스스로 조절하며 올바른 디지털 시민 의식을 기를 수 있는 좋은 기회입니다.',
    stance: 'agree',
    likes: 5,
    likedBy: ['demo-like-1', 'demo-like-2'],
    commentsCount: 2,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 14,
      realName: '김민수',
    },
    createdAt: Date.now() - 2400000,
  },
  {
    id: 'sample-p2',
    discussionId: 'current-topic',
    mode: 'pro_con',
    authorId: 'student-demo-2',
    anonymousName: '당당한 독수리',
    avatar: '🦅',
    content: '수업 집중도가 떨어지고 SNS나 게임의 유혹을 참기 어려워 학습권 침해 및 친구 간 대면 소통 단절 문제가 발생할 수 있습니다.',
    stance: 'disagree',
    likes: 8,
    likedBy: ['demo-like-3', 'demo-like-4', 'demo-like-5'],
    commentsCount: 1,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 7,
      realName: '이서연',
    },
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'sample-p3',
    discussionId: 'current-topic',
    mode: 'pro_con',
    authorId: 'student-demo-3',
    anonymousName: '다정한 돌고래',
    avatar: '🐬',
    content: '무조건적인 전면 허용이나 일괄 수거보다는, 수업 시간에는 교사 재량으로 보관하고 쉬는 시간이나 점심 시간에만 자율적으로 허용하는 절충안이 합리적입니다.',
    stance: 'neutral',
    likes: 12,
    likedBy: ['demo-like-1', 'demo-like-6'],
    commentsCount: 0,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 21,
      realName: '박준혁',
    },
    createdAt: Date.now() - 900000,
  },
  {
    id: 'sample-f1',
    discussionId: 'current-topic',
    mode: 'free_notes',
    authorId: 'student-demo-4',
    anonymousName: '용감한 호랑이',
    avatar: '🐯',
    content: '스마트폰 카메라로 칠판 필기를 기록하거나 과제 제출할 때 훨씬 편리해요! 규칙을 정해서 쓰면 충분합니다.',
    color: 'yellow',
    likes: 6,
    likedBy: [],
    commentsCount: 1,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 3,
      realName: '최유진',
    },
    createdAt: Date.now() - 1500000,
  },
  {
    id: 'sample-f2',
    discussionId: 'current-topic',
    mode: 'free_notes',
    authorId: 'student-demo-5',
    anonymousName: '차분한 부엉이',
    avatar: '🦉',
    content: '쉬는 시간마다 다들 화면만 쳐다보고 대화가 사라질까 봐 걱정돼요. 친구들과 운동장에서 놀 시간이 필요해요.',
    color: 'mint',
    likes: 9,
    likedBy: [],
    commentsCount: 0,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 18,
      realName: '정하늘',
    },
    createdAt: Date.now() - 1200000,
  },
  {
    id: 'sample-t1',
    discussionId: 'current-topic',
    mode: 'three_step',
    stage: 1,
    authorId: 'student-demo-6',
    anonymousName: '빛나는 별빛',
    avatar: '✨',
    content: '[입론 - 찬성] 21세기 디지털 역량 교육을 위해 기기를 제한하기보다 책임감 있는 사용 습관을 학교에서 지도해야 합니다.',
    likes: 4,
    likedBy: [],
    commentsCount: 0,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 29,
      realName: '윤도현',
    },
    createdAt: Date.now() - 800000,
  },
  {
    id: 'sample-t2',
    discussionId: 'current-topic',
    mode: 'three_step',
    stage: 1,
    authorId: 'student-demo-7',
    anonymousName: '정의로운 코알라',
    avatar: '🐨',
    content: '[입론 - 반대] 청소년기 뇌 발달과 집중력 유지를 위해 수업 환경만큼은 디지털 디톡스 공간으로 보호되어야 합니다.',
    likes: 5,
    likedBy: [],
    commentsCount: 0,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 11,
      realName: '강예은',
    },
    createdAt: Date.now() - 600000,
  },
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'sample-c1',
    postId: 'sample-p1',
    authorId: 'student-demo-2',
    anonymousName: '당당한 독수리',
    avatar: '🦅',
    content: '자율적인 조절이 아직 어려운 학생들은 수업 중 알림에 쉽게 주의가 흐트러질 수 있지 않을까요?',
    createdAt: Date.now() - 2000000,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 7,
      realName: '이서연',
    },
  },
  {
    id: 'sample-c2',
    postId: 'sample-p1',
    authorId: 'student-demo-1',
    anonymousName: '지혜로운 사자',
    avatar: '🦁',
    content: '방해 금지 모드나 비행기 탑승 모드 규정을 학급 자치회에서 만들면 해결할 수 있다고 생각해요!',
    createdAt: Date.now() - 1700000,
    studentInfo: {
      grade: 2,
      classNum: 3,
      studentNum: 14,
      realName: '김민수',
    },
  },
];

// In-memory active subscriber sets for the current document context
const localDiscussionSubscribers = new Set<(discussion: Discussion) => void>();
const localPostsSubscribers = new Set<(posts: Post[]) => void>();
const localCommentsSubscribers = new Map<string, Set<(comments: Comment[]) => void>>();

// Broadcast channel for instantaneous cross-tab live synchronization
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('school_anonymous_debate_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'DISCUSSION_UPDATED') {
        const disc = event.data.data;
        localDiscussionSubscribers.forEach((cb) => cb(disc));
      } else if (event.data?.type === 'POSTS_UPDATED') {
        const posts = event.data.data;
        localPostsSubscribers.forEach((cb) => cb(posts));
      } else if (event.data?.type === 'COMMENTS_UPDATED') {
        const comments = event.data.data as Comment[];
        localCommentsSubscribers.forEach((set, postId) => {
          const filtered = comments.filter((c) => c.postId === postId);
          set.forEach((cb) => cb(filtered));
        });
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

// Local storage helpers
function getLocalDiscussion(): Discussion {
  const data = localStorage.getItem(STORAGE_KEY_DISCUSSION);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_DISCUSSION, JSON.stringify(DEFAULT_DISCUSSION));
    return DEFAULT_DISCUSSION;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_DISCUSSION;
  }
}

function setLocalDiscussion(disc: Discussion): void {
  localStorage.setItem(STORAGE_KEY_DISCUSSION, JSON.stringify(disc));
  localDiscussionSubscribers.forEach((cb) => cb(disc));
  broadcastChannel?.postMessage({ type: 'DISCUSSION_UPDATED', data: disc });
}

function getLocalPosts(): Post[] {
  const data = localStorage.getItem(STORAGE_KEY_POSTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(DEFAULT_POSTS));
    return DEFAULT_POSTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_POSTS;
  }
}

function setLocalPosts(posts: Post[]): void {
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
  localPostsSubscribers.forEach((cb) => cb(posts));
  broadcastChannel?.postMessage({ type: 'POSTS_UPDATED', data: posts });
}

function getLocalComments(): Comment[] {
  const data = localStorage.getItem(STORAGE_KEY_COMMENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(DEFAULT_COMMENTS));
    return DEFAULT_COMMENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_COMMENTS;
  }
}

function setLocalComments(comments: Comment[]): void {
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
  localCommentsSubscribers.forEach((set, postId) => {
    const filtered = comments.filter((c) => c.postId === postId);
    set.forEach((cb) => cb(filtered));
  });
  broadcastChannel?.postMessage({ type: 'COMMENTS_UPDATED', data: comments });
}

// Supabase row adapters
function toSupabasePost(p: Post) {
  return {
    id: p.id,
    discussion_id: p.discussionId,
    mode: p.mode,
    author_id: p.authorId,
    anonymous_name: p.anonymousName,
    avatar: p.avatar,
    content: p.content,
    stance: p.stance || null,
    color: p.color || null,
    stage: p.stage || null,
    reply_to_post_id: p.replyToPostId || null,
    reply_to_summary: p.replyToSummary || null,
    likes: p.likes,
    liked_by: p.likedBy || [],
    comments_count: p.commentsCount,
    is_blinded: !!p.isBlinded,
    is_pinned: !!p.isPinned,
    student_info: p.studentInfo || null,
    created_at: p.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabasePost(row: any): Post {
  return {
    id: row.id,
    discussionId: row.discussion_id || 'current-topic',
    mode: row.mode,
    authorId: row.author_id,
    anonymousName: row.anonymous_name,
    avatar: row.avatar,
    content: row.content,
    stance: row.stance || undefined,
    color: row.color || undefined,
    stage: row.stage || undefined,
    replyToPostId: row.reply_to_post_id || undefined,
    replyToSummary: row.reply_to_summary || undefined,
    likes: Number(row.likes) || 0,
    likedBy: Array.isArray(row.liked_by) ? row.liked_by : [],
    commentsCount: Number(row.comments_count) || 0,
    isBlinded: !!row.is_blinded,
    isPinned: !!row.is_pinned,
    studentInfo: row.student_info || undefined,
    createdAt: Number(row.created_at) || Date.now(),
  };
}

function toSupabaseDiscussion(d: Discussion) {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    mode: d.mode,
    current_stage: d.currentStage,
    is_active: d.isActive,
    allow_submissions: d.allowSubmissions,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseDiscussion(row: any): Discussion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    mode: row.mode,
    currentStage: Number(row.current_stage) as ThreeStepStage,
    isActive: row.is_active,
    allowSubmissions: row.allow_submissions,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function toSupabaseComment(c: Comment) {
  return {
    id: c.id,
    post_id: c.postId,
    author_id: c.authorId,
    anonymous_name: c.anonymousName,
    avatar: c.avatar,
    content: c.content,
    student_info: c.studentInfo || null,
    created_at: c.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseComment(row: any): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    anonymousName: row.anonymous_name,
    avatar: row.avatar,
    content: row.content,
    studentInfo: row.student_info || undefined,
    createdAt: Number(row.created_at),
  };
}

// Global Supabase Realtime Channel setup
let isSupabaseSubscribed = false;
if (supabase && !supabaseConnectionStatus.isUsingFallback) {
  try {
    // Initial fetch from Supabase
    supabase.from('discussions').select('*').eq('id', 'current-topic').maybeSingle().then(({ data }) => {
      if (data) {
        setLocalDiscussion(fromSupabaseDiscussion(data));
      } else {
        // Seed default discussion
        void supabase?.from('discussions').upsert(toSupabaseDiscussion(DEFAULT_DISCUSSION)).then(({ error }) => {
          if (error) console.warn('Supabase default discussion seed note:', error);
        });
      }
    });

    supabase.from('posts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setLocalPosts(data.map(fromSupabasePost));
      }
    });

    supabase.from('comments').select('*').order('created_at', { ascending: true }).then(({ data }) => {
      if (data && data.length > 0) {
        setLocalComments(data.map(fromSupabaseComment));
      }
    });

    // Realtime channel
    if (!isSupabaseSubscribed) {
      supabase
        .channel('school_debate_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = fromSupabasePost(payload.new);
            const current = getLocalPosts();
            if (!current.some((p) => p.id === newPost.id)) {
              setLocalPosts([newPost, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = fromSupabasePost(payload.new);
            const current = getLocalPosts();
            setLocalPosts(current.map((p) => (p.id === updated.id ? updated : p)));
          } else if (payload.eventType === 'DELETE') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              const current = getLocalPosts();
              setLocalPosts(current.filter((p) => p.id !== deletedId));
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'discussions' }, (payload) => {
          if (payload.new) {
            setLocalDiscussion(fromSupabaseDiscussion(payload.new));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = fromSupabaseComment(payload.new);
            const current = getLocalComments();
            if (!current.some((c) => c.id === newComment.id)) {
              setLocalComments([...current, newComment]);
            }
          }
        })
        .subscribe();
      isSupabaseSubscribed = true;
    }
  } catch (e) {
    console.warn('Supabase realtime subscription failed', e);
  }
}

/* =========================================================
   PUBLIC API: DISCUSSIONS, POSTS, COMMENTS
   ========================================================= */

export function subscribeDiscussion(
  callback: (discussion: Discussion) => void
): Unsubscribe {
  callback(getLocalDiscussion());
  localDiscussionSubscribers.add(callback);

  let firestoreUnsub: Unsubscribe | null = null;
  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      const docRef = doc(db, 'discussions', 'current-topic');
      firestoreUnsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          setLocalDiscussion(snapshot.data() as Discussion);
        }
      });
    } catch (err) {
      console.warn('Firestore subscription note:', err);
    }
  }

  return () => {
    localDiscussionSubscribers.delete(callback);
    firestoreUnsub?.();
  };
}

export async function updateDiscussion(updates: Partial<Discussion>): Promise<void> {
  const current = getLocalDiscussion();
  const updated: Discussion = {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  };

  // 1. Immediately apply locally
  setLocalDiscussion(updated);

  // 2. Persist to Supabase if available
  if (supabase && !supabaseConnectionStatus.isUsingFallback) {
    void supabase
      .from('discussions')
      .upsert(toSupabaseDiscussion(updated))
      .then(({ error }) => {
        if (error) console.warn('Supabase update discussion note:', error);
      });
  }

  // 3. Persist to Firestore if available
  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      const docRef = doc(db, 'discussions', 'current-topic');
      setDoc(docRef, updated, { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Firestore update discussion note:', err);
    }
  }
}

export function subscribePosts(
  callback: (posts: Post[]) => void
): Unsubscribe {
  callback(getLocalPosts());
  localPostsSubscribers.add(callback);

  let firestoreUnsub: Unsubscribe | null = null;
  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      firestoreUnsub = onSnapshot(q, (snapshot) => {
        const postsList: Post[] = [];
        snapshot.forEach((docSnap) => {
          postsList.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });
        if (postsList.length > 0) {
          setLocalPosts(postsList);
        }
      });
    } catch (err) {
      console.warn('Firestore posts subscription note:', err);
    }
  }

  return () => {
    localPostsSubscribers.delete(callback);
    firestoreUnsub?.();
  };
}

export async function addPost(
  postInput: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'commentsCount'>
): Promise<Post> {
  const trimmed = postInput.content.trim();
  if (!trimmed) {
    throw new Error('내용을 입력해 주세요.');
  }
  if (trimmed.length > 300) {
    throw new Error('의견은 300자 이하로 작성해 주세요.');
  }

  const newPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newPost: Post = {
    ...postInput,
    id: newPostId,
    content: trimmed,
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: Date.now(),
  };

  // 1. Immediately apply locally
  const posts = getLocalPosts();
  setLocalPosts([newPost, ...posts]);

  // 2. Persist to Supabase if available
  if (supabase && !supabaseConnectionStatus.isUsingFallback) {
    void supabase
      .from('posts')
      .insert(toSupabasePost(newPost))
      .then(({ error }) => {
        if (error) console.warn('Supabase add post note:', error);
      });
  }

  // 3. Persist to Firestore if available
  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      const docRef = doc(db, 'posts', newPostId);
      setDoc(docRef, newPost).catch(() => {});
    } catch (err) {
      console.warn('Firestore add post note:', err);
    }
  }

  return newPost;
}

export async function toggleLikePost(postId: string, userId: string): Promise<void> {
  const posts = getLocalPosts();
  let updatedLikedBy: string[] = [];
  const updated = posts.map((post) => {
    if (post.id === postId) {
      const isLiked = post.likedBy?.includes(userId);
      const newLikedBy = isLiked
        ? post.likedBy.filter((id) => id !== userId)
        : [...(post.likedBy || []), userId];
      updatedLikedBy = newLikedBy;
      return {
        ...post,
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      };
    }
    return post;
  });

  setLocalPosts(updated);

  if (supabase && !supabaseConnectionStatus.isUsingFallback) {
    void supabase
      .from('posts')
      .update({ likes: updatedLikedBy.length, liked_by: updatedLikedBy })
      .eq('id', postId)
      .then(({ error }) => {
        if (error) console.warn('Supabase like update note:', error);
      });
  }

  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      const postRef = doc(db, 'posts', postId);
      const target = posts.find((p) => p.id === postId);
      const isAlreadyLiked = target?.likedBy?.includes(userId);
      updateDoc(postRef, {
        likes: increment(isAlreadyLiked ? -1 : 1),
        likedBy: isAlreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
      }).catch(() => {});
    } catch (err) {
      console.warn('Firestore like update note:', err);
    }
  }
}

export async function deletePost(postId: string): Promise<void> {
  const posts = getLocalPosts();
  setLocalPosts(posts.filter((p) => p.id !== postId));

  const comments = getLocalComments();
  setLocalComments(comments.filter((c) => c.postId !== postId));

  if (supabase && !supabaseConnectionStatus.isUsingFallback) {
    void supabase.from('posts').delete().eq('id', postId).then(({ error }) => {
      if (error) console.warn('Supabase delete post note:', error);
    });
    void supabase.from('comments').delete().eq('post_id', postId).then(({ error }) => {
      if (error) console.warn('Supabase delete comments note:', error);
    });
  }

  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      deleteDoc(doc(db, 'posts', postId)).catch(() => {});
    } catch (err) {
      console.warn('Firestore delete note:', err);
    }
  }
}

export async function toggleBlindPost(postId: string): Promise<void> {
  const posts = getLocalPosts();
  const target = posts.find((p) => p.id === postId);
  if (!target) return;

  const newBlindState = !target.isBlinded;
  setLocalPosts(posts.map((p) => (p.id === postId ? { ...p, isBlinded: newBlindState } : p)));

  if (supabase && !supabaseConnectionStatus.isUsingFallback) {
    void supabase.from('posts').update({ is_blinded: newBlindState }).eq('id', postId).then(({ error }) => {
      if (error) console.warn('Supabase blind update note:', error);
    });
  }

  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      updateDoc(doc(db, 'posts', postId), { isBlinded: newBlindState }).catch(() => {});
    } catch (err) {
      console.warn('Firestore blind update note:', err);
    }
  }
}

export function subscribeComments(
  postId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const initial = getLocalComments().filter((c) => c.postId === postId);
  callback(initial);

  if (!localCommentsSubscribers.has(postId)) {
    localCommentsSubscribers.set(postId, new Set());
  }
  localCommentsSubscribers.get(postId)!.add(callback);

  let firestoreUnsub: Unsubscribe | null = null;
  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
      firestoreUnsub = onSnapshot(q, (snapshot) => {
        const commentsList: Comment[] = [];
        snapshot.forEach((docSnap) => {
          commentsList.push({ id: docSnap.id, ...docSnap.data() } as Comment);
        });
        if (commentsList.length > 0) {
          const allComments = getLocalComments().filter((c) => c.postId !== postId);
          setLocalComments([...allComments, ...commentsList]);
        }
      });
    } catch (err) {
      console.warn('Firestore comments subscription note:', err);
    }
  }

  return () => {
    localCommentsSubscribers.get(postId)?.delete(callback);
    firestoreUnsub?.();
  };
}

export async function addComment(commentInput: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
  const trimmed = commentInput.content.trim();
  if (!trimmed) {
    throw new Error('댓글 내용을 입력해 주세요.');
  }
  if (trimmed.length > 150) {
    throw new Error('댓글은 150자 이하로 작성해 주세요.');
  }

  const newCommentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newComment: Comment = {
    ...commentInput,
    id: newCommentId,
    content: trimmed,
    createdAt: Date.now(),
  };

  const comments = getLocalComments();
  setLocalComments([...comments, newComment]);

  const posts = getLocalPosts();
  const updatedPosts = posts.map((p) =>
    p.id === commentInput.postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
  );
  setLocalPosts(updatedPosts);

  if (supabase && !supabaseConnectionStatus.isUsingFallback) {
    void supabase.from('comments').insert(toSupabaseComment(newComment)).then(({ error }) => {
      if (error) console.warn('Supabase add comment note:', error);
    });
    const targetPost = updatedPosts.find((p) => p.id === commentInput.postId);
    if (targetPost) {
      void supabase.from('posts').update({ comments_count: targetPost.commentsCount }).eq('id', commentInput.postId).then(({ error }) => {
        if (error) console.warn('Supabase post comment count note:', error);
      });
    }
  }

  if (db && !firebaseConnectionStatus.isUsingFallback) {
    try {
      setDoc(doc(db, 'comments', newCommentId), newComment).catch(() => {});
      updateDoc(doc(db, 'posts', commentInput.postId), {
        commentsCount: increment(1),
      }).catch(() => {});
    } catch (err) {
      console.warn('Firestore comment note:', err);
    }
  }

  return newComment;
}

export function resetClassroomData(): void {
  localStorage.setItem(STORAGE_KEY_DISCUSSION, JSON.stringify(DEFAULT_DISCUSSION));
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(DEFAULT_POSTS));
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(DEFAULT_COMMENTS));
  setLocalDiscussion(DEFAULT_DISCUSSION);
  setLocalPosts(DEFAULT_POSTS);
  setLocalComments(DEFAULT_COMMENTS);
}
