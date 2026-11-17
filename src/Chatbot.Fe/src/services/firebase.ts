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
  serverTimestamp 
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
  return await signInWithPopup(auth, provider);
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string) {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return await createUserWithEmailAndPassword(auth, email, pass);
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
  await addDoc(messagesRef, {
    ...msg,
    timestamp: serverTimestamp()
  });

  // Cập nhật lại thời gian tương tác mới nhất của cuộc hội thoại
  const convRef = doc(db, "users", userId, "conversations", conversationId);
  await setDoc(convRef, {
    updatedAt: serverTimestamp()
  }, { merge: true });
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
