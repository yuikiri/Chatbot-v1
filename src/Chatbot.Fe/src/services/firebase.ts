import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  collectionGroup,
  serverTimestamp,
  deleteDoc,
  increment
} from "firebase/firestore";

// ==============================================================================
// CẤU HÌNH FIREBASE
// ==============================================================================
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyANEr5-dwCp6LaISvOngnB0awztnDmQP6E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chatbot-v1-c7709.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chatbot-v1-c7709",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chatbot-v1-c7709.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "554444337586",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:554444337586:web:928a339eb833d0ce62b4ab",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KFJ2DPV32R"
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY");

const app = isConfigured && getApps().length === 0 ? initializeApp(firebaseConfig) : (getApps()[0] || null);
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const isFirebaseReady = () => isConfigured && auth !== null && db !== null;

// Auth Helpers
export async function loginWithGoogle() {
  if (!auth) throw new Error("Firebase chưa được cấu hình. Vui lòng nhập API key trong .env");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  if (cred.user) {
    await syncUserProfile(cred.user);
  }
  return cred;
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    await syncUserProfile(cred.user);
  }
  return cred;
}

export async function registerWithEmail(email: string, pass: string) {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    await syncUserProfile(cred.user);
  }
  return cred;
}

export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Bảng giải mã lỗi Firebase thân thiện bằng tiếng Việt
export function mapFirebaseAuthError(err: any): string {
  const code = err?.code || "";
  const msg = err?.message || "";

  switch (code) {
    case "auth/operation-not-allowed":
      return "Chưa kích hoạt phương thức đăng nhập trong Firebase Console! Bạn vui lòng vào Firebase Console > Authentication > tab 'Sign-in method' và bật công tắc 'Email/Password' hoặc 'Google'.";
    case "auth/unauthorized-domain":
      return "Tên miền hiện tại chưa được cấp phép trong Firebase! Nếu đang mở bằng 127.0.0.1, hãy đổi sang http://localhost:10000 trên trình duyệt (hoặc thêm 127.0.0.1 vào Firebase Console > Authentication > Settings > Authorized domains).";
    case "auth/weak-password":
      return "Mật khẩu quá yếu! Firebase yêu cầu mật khẩu phải có ít nhất 6 ký tự.";
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký trước đó. Vui lòng chuyển sang tab Đăng nhập hoặc dùng email khác.";
    case "auth/invalid-email":
      return "Địa chỉ email không đúng định dạng.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email hoặc mật khẩu không chính xác.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập Google. Vui lòng cho phép popup trên thanh địa chỉ.";
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng tới máy chủ Firebase. Vui lòng kiểm tra lại đường truyền Internet.";
    default:
      if (msg.includes("400") || msg.includes("Bad Request")) {
        return "Lỗi 400 Bad Request từ Firebase: Phương thức đăng nhập có thể chưa được bật trong Firebase Console (Sign-in method) hoặc mật khẩu dưới 6 ký tự.";
      }
      return msg || "Thao tác xác thực thất bại.";
  }
}

// Firestore Chat History Helpers
export interface ConversationItem {
  id: string;
  title: string;
  createdAt: any;
  updatedAt?: any;
  isHidden?: boolean;
  rating?: number;
  tags?: string[];
  adminNotes?: string;
  evaluatedAt?: any;
}

export async function saveConversationSession(userId: string, conversationId: string, title: string) {
  if (!db) return;
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await setDoc(convRef, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isHidden: false
  }, { merge: true });

  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      conversationCount: increment(1)
    }, { merge: true });
  } catch (e) {
    console.warn("Lỗi tăng conversationCount:", e);
  }
}

export async function renameConversation(userId: string, conversationId: string, newTitle: string) {
  if (!db) return;
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await updateDoc(convRef, {
    title: newTitle.trim(),
    updatedAt: serverTimestamp()
  });
}

export async function hideConversation(userId: string, conversationId: string) {
  if (!db) return;
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await updateDoc(convRef, {
    isHidden: true,
    updatedAt: serverTimestamp()
  });
}

export async function saveChatMessage(userId: string, conversationId: string, msg: any) {
  if (!db) return;
  const messagesRef = collection(db, "users", userId, "conversations", conversationId, "messages");
  
  const textLen = (msg.content || "").length;
  const estTokens = Math.max(1, Math.round(textLen / 4));

  await addDoc(messagesRef, {
    ...msg,
    estimatedTokens: estTokens,
    timestamp: serverTimestamp()
  });

  // Cập nhật lại thời gian tương tác mới nhất của cuộc hội thoại
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await setDoc(convRef, {
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Tăng thống kê token và số tin nhắn cho user
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      totalTokensEstimated: increment(estTokens),
      totalMessagesCount: increment(1)
    }, { merge: true });
  } catch (e) {
    console.warn("Lỗi cập nhật token user:", e);
  }
}

export function subscribeConversations(userId: string, callback: (list: ConversationItem[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const convCol = collection(db, "users", userId, "conversations");
  const q = query(convCol, orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: ConversationItem[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.isHidden) {
        list.push({
          id: docSnap.id,
          title: data.title || "Cuộc trò chuyện",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || data.createdAt,
          isHidden: data.isHidden
        });
      }
    });
    callback(list);
  }, () => {
    // Fallback nếu chưa có index updatedAt
    const fallbackQ = query(convCol, orderBy("createdAt", "desc"));
    return onSnapshot(fallbackQ, (snapshot) => {
      const list: ConversationItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.isHidden) {
          list.push({
            id: docSnap.id,
            title: data.title || "Cuộc trò chuyện",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || data.createdAt,
            isHidden: data.isHidden
          });
        }
      });
      callback(list);
    }, () => callback([]));
  });
}

export async function getConversationMessages(userId: string, conversationId: string) {
  if (!db) return [];
  const messagesRef = collection(db, "users", userId, "conversations", conversationId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);
  const msgs: any[] = [];
  snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
  return msgs;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  providerId?: string; // 'google.com' | 'password' | 'anonymous'
  emailVerified?: boolean;
  creationTime?: string | null;
  lastSignInTime?: string | null;
  lastLoginAt: any;
  createdAt?: any;
  conversationCount?: number;
  totalMessagesCount?: number;
  totalTokensEstimated?: number;
  totalCostUsd?: number;
  totalCostVnd?: number;
}

export async function syncUserProfile(user: User) {
  if (!db || !user) return;
  const userRef = doc(db, "users", user.uid);
  const prov = user.providerData?.[0]?.providerId || (user.isAnonymous ? "anonymous" : "password");
  try {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || user.email?.split("@")[0] || "Người dùng",
      photoURL: user.photoURL || null,
      providerId: prov,
      emailVerified: user.emailVerified ?? false,
      creationTime: user.metadata.creationTime || null,
      lastSignInTime: user.metadata.lastSignInTime || null,
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Lỗi đồng bộ hồ sơ user:", err);
  }
}

export async function getAllUsersForAdmin(): Promise<{ users: UserProfile[]; error?: string }> {
  if (!db) return { users: [] };
  try {
    const usersCol = collection(db, "users");
    const snap = await getDocs(usersCol);
    const users: UserProfile[] = [];
    for (const d of snap.docs) {
      const data = d.data();
      const tokens = data.totalTokensEstimated || 0;
      // Chi phí ước tính chuẩn Gemini Flash ($0.15 / 1M tokens) quy đổi ra USD và VNĐ (1$ ~ 25.400đ)
      const costUsd = (tokens / 1_000_000) * 0.15;
      const costVnd = costUsd * 25400;

      users.push({
        uid: d.id,
        email: data.email || null,
        displayName: data.displayName || data.email?.split("@")[0] || "Người dùng",
        photoURL: data.photoURL || null,
        providerId: data.providerId || "password",
        emailVerified: data.emailVerified ?? false,
        creationTime: data.creationTime || null,
        lastSignInTime: data.lastSignInTime || null,
        lastLoginAt: data.lastLoginAt,
        createdAt: data.createdAt || data.lastLoginAt,
        conversationCount: data.conversationCount || 0,
        totalMessagesCount: data.totalMessagesCount || 0,
        totalTokensEstimated: tokens,
        totalCostUsd: Number(costUsd.toFixed(4)),
        totalCostVnd: Math.round(costVnd)
      });
    }

    // Nếu auth.currentUser đăng nhập mà chưa có trong collection (do đăng nhập trước đây), chèn vào
    if (auth?.currentUser && !users.some(u => u.uid === auth.currentUser?.uid)) {
      const u = auth.currentUser;
      const prov = u.providerData?.[0]?.providerId || (u.isAnonymous ? "anonymous" : "password");
      users.unshift({
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || u.email?.split("@")[0] || "Người dùng (Phiên hiện tại)",
        photoURL: u.photoURL || null,
        providerId: prov,
        emailVerified: u.emailVerified ?? false,
        creationTime: u.metadata.creationTime || null,
        lastSignInTime: u.metadata.lastSignInTime || null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        conversationCount: 0,
        totalMessagesCount: 0,
        totalTokensEstimated: 0,
        totalCostUsd: 0,
        totalCostVnd: 0
      });
    }

    // Quét bổ sung từ subcollection conversations nếu có người dùng từng chat nhưng chưa đồng bộ hồ sơ
    try {
      const convsSnap = await getDocs(collectionGroup(db, "conversations"));
      const foundUids = new Set<string>();
      for (const convDoc of convsSnap.docs) {
        const pathSegments = convDoc.ref.path.split("/");
        if (pathSegments.length >= 2 && pathSegments[0] === "users") {
          const discoveredUid = pathSegments[1];
          if (!users.some(u => u.uid === discoveredUid)) {
            foundUids.add(discoveredUid);
          }
        }
      }

      for (const discoveredUid of foundUids) {
        users.push({
          uid: discoveredUid,
          email: null,
          displayName: `Tài khoản (${discoveredUid.slice(0, 8)}...)`,
          photoURL: null,
          providerId: "discovered",
          emailVerified: false,
          creationTime: null,
          lastSignInTime: null,
          lastLoginAt: new Date(),
          createdAt: new Date(),
          conversationCount: 1,
          totalMessagesCount: 0,
          totalTokensEstimated: 0,
          totalCostUsd: 0,
          totalCostVnd: 0
        });
      }
    } catch {
      // Bỏ qua nếu rules không cho phép collectionGroup
    }

    users.sort((a, b) => {
      const timeA = a.lastLoginAt?.seconds || (a.lastLoginAt instanceof Date ? Math.floor(a.lastLoginAt.getTime() / 1000) : 0);
      const timeB = b.lastLoginAt?.seconds || (b.lastLoginAt instanceof Date ? Math.floor(b.lastLoginAt.getTime() / 1000) : 0);
      return timeB - timeA;
    });

    return { users };
  } catch (err: any) {
    console.error("Lỗi lấy danh sách user từ Firestore:", err);
    let errMsg = err.message || "Lỗi truy vấn Firestore";
    if (err.code === "permission-denied" || errMsg.includes("permission-denied") || errMsg.includes("insufficient permissions")) {
      errMsg = "Firestore Security Rules đang chặn đọc danh sách users (permission-denied). Vui lòng cấu hình Security Rules trong Firebase Console để cấp quyền đọc collection /users cho Admin.";
    }

    // Fallback: nếu có auth.currentUser, trả về ít nhất tài khoản hiện tại
    const fallbackUsers: UserProfile[] = [];
    if (auth?.currentUser) {
      const u = auth.currentUser;
      const prov = u.providerData?.[0]?.providerId || (u.isAnonymous ? "anonymous" : "password");
      fallbackUsers.push({
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || u.email?.split("@")[0] || "Người dùng (Phiên hiện tại)",
        photoURL: u.photoURL || null,
        providerId: prov,
        emailVerified: u.emailVerified ?? false,
        creationTime: u.metadata.creationTime || null,
        lastSignInTime: u.metadata.lastSignInTime || null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        conversationCount: 0,
        totalMessagesCount: 0,
        totalTokensEstimated: 0,
        totalCostUsd: 0,
        totalCostVnd: 0
      });
    }

    return { users: fallbackUsers, error: errMsg };
  }
}

export async function searchUserMessages(userId: string, keyword: string): Promise<{ conversationId: string; conversationTitle: string; message: any }[]> {
  if (!db || !keyword.trim()) return [];
  const convs = await getUserConversationsForAdmin(userId);
  const results: { conversationId: string; conversationTitle: string; message: any }[] = [];
  const qLower = keyword.trim().toLowerCase();

  for (const conv of convs) {
    const msgs = await getConversationMessages(userId, conv.id);
    for (const m of msgs) {
      if (m.content && m.content.toLowerCase().includes(qLower)) {
        results.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          message: m
        });
      }
    }
  }
  return results;
}

export async function getUserConversationsForAdmin(userId: string): Promise<ConversationItem[]> {
  if (!db) return [];
  try {
    const convCol = collection(db, "users", userId, "conversations");
    const q = query(convCol, orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    const list: ConversationItem[] = [];
    snap.forEach(d => {
      const data = d.data();
      list.push({
        id: d.id,
        title: data.title || "Cuộc trò chuyện",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
        isHidden: data.isHidden,
        rating: data.rating,
        tags: data.tags,
        adminNotes: data.adminNotes
      });
    });
    return list;
  } catch {
    // Fallback nếu không có index updatedAt
    const convCol = collection(db, "users", userId, "conversations");
    const snap = await getDocs(convCol);
    const list: ConversationItem[] = [];
    snap.forEach(d => {
      const data = d.data();
      list.push({
        id: d.id,
        title: data.title || "Cuộc trò chuyện",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
        isHidden: data.isHidden,
        rating: data.rating,
        tags: data.tags,
        adminNotes: data.adminNotes
      });
    });
    return list;
  }
}

export async function saveConversationEvaluation(
  userId: string,
  conversationId: string,
  evaluation: { rating?: number; tags?: string[]; adminNotes?: string }
) {
  if (!db) return;
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await updateDoc(convRef, {
    ...evaluation,
    evaluatedAt: serverTimestamp()
  });
}

// ==============================================================================
// INCIDENT LOGS & MODEL EVALUATION (Tab 2: Sự cố & Đánh giá)
// ==============================================================================
export interface IncidentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  conversationId: string;
  userQuery: string;
  botResponse?: string;
  errorType: 'model_timeout' | 'quota_exceeded' | 'refusal' | 'contraindicated_flag' | 'user_reported';
  errorMessage?: string;
  status: 'pending' | 'in_review' | 'resolved';
  adminNotes?: string;
  correctedResponse?: string;
  createdAt: any;
  resolvedAt?: any;
}

export async function reportIncident(
  incident: Omit<IncidentRecord, "id" | "createdAt" | "status">
): Promise<string | null> {
  if (!db) return null;
  try {
    const colRef = collection(db, "incidents");
    const docRef = await addDoc(colRef, {
      ...incident,
      status: "pending",
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error("Lỗi ghi nhận incident:", err);
    return null;
  }
}

export function subscribeIncidents(callback: (list: IncidentRecord[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, "incidents");
  const q = query(colRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: IncidentRecord[] = [];
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: d.userId || "",
        userEmail: d.userEmail,
        conversationId: d.conversationId || "",
        userQuery: d.userQuery || "",
        botResponse: d.botResponse,
        errorType: d.errorType || "user_reported",
        errorMessage: d.errorMessage,
        status: d.status || "pending",
        adminNotes: d.adminNotes,
        correctedResponse: d.correctedResponse,
        createdAt: d.createdAt,
        resolvedAt: d.resolvedAt
      });
    });
    callback(list);
  }, (err) => {
    console.error("Lỗi lắng nghe incidents:", err);
    callback([]);
  });
}

export async function updateIncident(incidentId: string, updates: Partial<IncidentRecord>) {
  if (!db) return;
  const docRef = doc(db, "incidents", incidentId);
  const dataToUpdate: any = { ...updates };
  if (updates.status === "resolved") {
    dataToUpdate.resolvedAt = serverTimestamp();
  }
  await updateDoc(docRef, dataToUpdate);
}

export async function deleteIncident(incidentId: string) {
  if (!db) return;
  const docRef = doc(db, "incidents", incidentId);
  await deleteDoc(docRef);
}

// Định dạng thời gian thân thiện (Ví dụ: 09:15 Hôm nay, Hôm qua, 17/11/2026)
export function formatConversationTime(ts: any): string {
  if (!ts) return "";
  let date: Date;
  if (ts.toDate && typeof ts.toDate === "function") {
    date = ts.toDate();
  } else if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (typeof ts === "string" || typeof ts === "number") {
    date = new Date(ts);
  } else {
    return "";
  }

  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (isToday) {
    return `${hours}:${minutes} Hôm nay`;
  }
  if (isYesterday) {
    return `${hours}:${minutes} Hôm qua`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
