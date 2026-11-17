# Bài 03: Chi Tiết Các Thành Phần Mã Nguồn (Code Toàn Bộ & Cách Ghép)

Bài viết này cung cấp đầy đủ mã nguồn cho từng tệp trong dự án. Tất cả mã nguồn đều được viết theo tiêu chuẩn: **gọn gàng, dễ đọc, có chú thích chi tiết bằng tiếng Việt, và sử dụng 100% công cụ miễn phí**.

---

## 1. Tệp `rag_engine.py` (Lõi Xử Lý RAG Y Văn)

Tệp này đóng vai trò là "Thư viện trưởng": nó đọc các file tài liệu trong thư mục `Data/documents/`, chuyển thành vector bằng Gemini Embedding, tìm kiếm đoạn tài liệu khớp nhất và gọi Gemini 1.5 Flash trả lời.

```python
import os
import glob
import numpy as np
import google.generativeai as genai
from pypdf import PdfReader

class MedicalRAGEngine:
    def __init__(self, api_key: str, docs_dir: str = "Data/documents"):
        genai.configure(api_key=api_key)
        self.docs_dir = docs_dir
        self.chunks = []           # Chứa các đoạn văn bản y tế
        self.chunk_sources = []     # Chứa tên file gốc tương ứng
        self.embeddings = None      # Mảng vector số học của tất cả các đoạn
        self.embedding_model = "models/text-embedding-004"
        self.chat_model = genai.GenerativeModel("models/gemini-1.5-flash")

    def _read_file(self, filepath: str) -> str:
        """Đọc nội dung file .txt, .md hoặc .pdf"""
        if filepath.endswith((".txt", ".md")):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        elif filepath.endswith(".pdf"):
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        return ""

    def load_and_index_documents(self):
        """Quét toàn bộ tài liệu y văn và tạo mảng vector trong RAM"""
        all_files = glob.glob(os.path.join(self.docs_dir, "*.*"))
        if not all_files:
            print(f"⚠️ Chưa có file tài liệu nào trong {self.docs_dir}")
            return

        raw_chunks = []
        raw_sources = []
        for fpath in all_files:
            fname = os.path.basename(fpath)
            content = self._read_file(fpath)
            if not content.strip():
                continue
            
            # Tách tài liệu thành các đoạn khoảng 300 - 500 từ
            paragraphs = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 40]
            for p in paragraphs:
                raw_chunks.append(p)
                raw_sources.append(fname)

        if not raw_chunks:
            return

        self.chunks = raw_chunks
        self.chunk_sources = raw_sources

        # Tạo vector embedding bằng Gemini (Miễn phí)
        print(f"🔄 Đang tạo vector cho {len(self.chunks)} đoạn tài liệu y khoa...")
        vectors = []
        for chunk in self.chunks:
            res = genai.embed_content(
                model=self.embedding_model,
                content=chunk,
                task_type="retrieval_document"
            )
            vectors.append(res["embedding"])

        self.embeddings = np.array(vectors, dtype=np.float32)
        print(f"✅ Đã nạp thành công {len(self.chunks)} đoạn y văn vào RAM!")

    def _cosine_similarity(self, query_vec, doc_vecs):
        """Tính khoảng cách góc giữa câu hỏi và các đoạn tài liệu"""
        dot_product = np.dot(doc_vecs, query_vec)
        norm_query = np.linalg.norm(query_vec)
        norm_docs = np.linalg.norm(doc_vecs, axis=1)
        return dot_product / (norm_docs * norm_query + 1e-10)

    def retrieve(self, query: str, top_k: int = 3):
        """Tìm top 3 đoạn tài liệu sát nghĩa nhất với câu hỏi"""
        if self.embeddings is None or len(self.chunks) == 0:
            return [], []

        query_res = genai.embed_content(
            model=self.embedding_model,
            content=query,
            task_type="retrieval_query"
        )
        query_vec = np.array(query_res["embedding"], dtype=np.float32)

        scores = self._cosine_similarity(query_vec, self.embeddings)
        top_indices = np.argsort(scores)[::-1][:top_k]

        matched_chunks = [self.chunks[i] for i in top_indices if scores[i] > 0.4]
        matched_sources = list(set([self.chunk_sources[i] for i in top_indices if scores[i] > 0.4]))
        return matched_chunks, matched_sources

    def answer_question(self, query: str) -> dict:
        """Sinh câu trả lời y tế khép kín (Không bịa đặt)"""
        matched_chunks, sources = self.retrieve(query, top_k=3)

        if not matched_chunks:
            return {
                "answer": "Hiện tại hệ thống dữ liệu y văn chưa ghi nhận thông tin được kiểm duyệt về loại thuốc này cho phụ nữ đang cho con bú. Để đảm bảo an toàn tuyệt đối cho bé, vui lòng tham khảo ý kiến trực tiếp từ bác sĩ chuyên khoa hoặc dược sĩ trước khi sử dụng.",
                "sources": [],
                "safety_level": "Unknown"
            }

        context = "\n---\n".join(matched_chunks)

        prompt = f"""Bạn là LactaMed AI - Trợ lý tra cứu y văn về an toàn thuốc cho phụ nữ cho con bú.
NHIỆM VỤ: Trả lời câu hỏi của người dùng DỰA DUY NHẤT vào khối [TÀI LIỆU Y VĂN] dưới đây.

QUY TẮC BẮT BUỘC:
1. KHÔNG ĐƯỢC TỰ BỊA ĐẶT: Chỉ dùng dữ kiện có thật trong [TÀI LIỆU Y VĂN]. Không suy đoán ngoài tài liệu.
2. NÊU RÕ MỨC ĐỘ AN TOÀN: Xác định xem thuốc là (Tương thích/An toàn, Thận trọng, Chống chỉ định hay Chưa đủ dữ liệu).
3. ĐƯA RA LỜI KHUYÊN DÙNG: (uống sau khi cho bú, theo dõi biểu hiện gì ở trẻ sơ sinh nếu có trong bài).
4. KHÔNG KÊ ĐƠN: Luôn nhắc nhở thông tin mang tính tham khảo y văn, cần hỏi bác sĩ/dược sĩ.

[TÀI LIỆU Y VĂN]:
{context}

[CÂU HỎI]:
{query}

CÂU TRẢ LỜI CỦA BẠN:"""

        response = self.chat_model.generate_content(prompt)
        answer_text = response.text

        # Xác định mức độ an toàn sơ bộ để hiển thị badge màu
        safety_level = "Compatible"
        text_lower = answer_text.lower()
        if "chống chỉ định" in text_lower or "nguy hiểm" in text_lower or "ngừng cho con bú" in text_lower:
            safety_level = "Contraindicated"
        elif "thận trọng" in text_lower or "cân nhắc" in text_lower:
            safety_level = "Caution"

        return {
            "answer": answer_text,
            "sources": sources,
            "safety_level": safety_level
        }
```

---

## 2. Tệp `main.py` (Máy Chủ Backend FastAPI)

Tệp này khởi tạo ứng dụng web, nạp dữ liệu lúc khởi động, và mở cổng `/api/chat` cho trình duyệt gọi vào:

```python
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from rag_engine import MedicalRAGEngine

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI(title="Chatbot Tư Vấn Thuốc Cho Phụ Nữ Cho Con Bú")

# Cho phép chia sẻ tài nguyên nếu cần
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo RAG Engine
rag_engine = None

@app.on_event("startup")
def startup_event():
    global rag_engine
    if not API_KEY:
        print("⚠️ CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong file .env!")
        return
    print("🚀 Đang khởi động hệ thống RAG Y Khoa...")
    rag_engine = MedicalRAGEngine(api_key=API_KEY)
    rag_engine.load_and_index_documents()

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    if not rag_engine:
        raise HTTPException(status_code=500, detail="RAG Engine chưa sẵn sàng. Hãy kiểm tra lại API Key!")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống.")
    
    result = rag_engine.answer_question(req.message)
    return result

@app.get("/api/health")
def health_check():
    return {"status": "ok", "chunks_loaded": len(rag_engine.chunks) if rag_engine else 0}

# Phục vụ toàn bộ giao diện HTML/CSS/JS trong thư mục static
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
```

---

## 3. Tệp Cấu Hình Firebase `static/firebase-config.js`

Tệp này chứa thông số dự án Firebase bạn đã lấy ở [Bài 01](01_Chuan_Bi_Tai_Khoan_Va_API_Mien_Phi.md):

```javascript
// Dán cấu hình Firebase của bạn vào đây
const firebaseConfig = {
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "chatbot-y-te-me-be.firebaseapp.com",
  projectId: "chatbot-y-te-me-be",
  storageBucket: "chatbot-y-te-me-be.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Khởi tạo Firebase SDK
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
```

---

## 4. Tệp Xử Lý Đăng Nhập `static/auth.js`

Tệp này quản lý trạng thái đăng nhập Google/Email và cập nhật thông tin người dùng lên giao diện:

```javascript
// Đăng nhập bằng Google 1-click
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      console.log("Đăng nhập thành công:", result.user.displayName);
      closeAuthModal();
    })
    .catch((error) => {
      alert("Đăng nhập thất bại: " + error.message);
    });
}

// Đăng nhập bằng Email & Mật khẩu
function loginWithEmail(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then(() => closeAuthModal())
    .catch((error) => alert("Lỗi đăng nhập: " + error.message));
}

// Đăng ký tài khoản Email mới
function registerWithEmail(email, password) {
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => closeAuthModal())
    .catch((error) => alert("Lỗi đăng ký: " + error.message));
}

// Đăng xuất
function logout() {
  auth.signOut().then(() => {
    window.location.reload();
  });
}

// Lắng nghe thay đổi trạng thái đăng nhập
auth.onAuthStateChanged((user) => {
  const userProfileEl = document.getElementById("user-profile");
  const authModalEl = document.getElementById("auth-modal");
  
  if (user) {
    userProfileEl.innerHTML = `
      <div class="user-info">
        <span class="user-name">👤 ${user.displayName || user.email}</span>
        <button onclick="logout()" class="btn-logout">Đăng xuất</button>
      </div>
    `;
    loadConversations(user.uid);
  } else {
    userProfileEl.innerHTML = `
      <button onclick="openAuthModal()" class="btn-login-trigger">Đăng nhập để lưu chat</button>
    `;
  }
});

function openAuthModal() {
  document.getElementById("auth-modal").classList.add("active");
}
function closeAuthModal() {
  document.getElementById("auth-modal").classList.remove("active");
}
```

---

## 5. Tệp Giao Diện HTML `static/index.html`

Trang web ChatGPT-style gồm 2 cột: Sidebar lưu danh sách chat bên trái và Cửa sổ chat bên phải:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LactaMed - Trợ Lý An Toàn Thuốc Cho Mẹ Cho Con Bú</title>
  <link rel="stylesheet" href="style.css">
  
  <!-- Firebase SDK từ CDN (Miễn phí) -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  
  <!-- Thư viện hiển thị Markdown -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="app-layout">
    <!-- CỘT TRÁI: SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <button id="new-chat-btn" class="btn-new-chat">➕ Đoạn chat mới</button>
      </div>
      <div class="history-list" id="conversations-list">
        <!-- Danh sách chat cũ tự động hiện ở đây -->
      </div>
      <div class="sidebar-footer" id="user-profile">
        <!-- Nút đăng nhập hoặc thông tin tài khoản -->
      </div>
    </aside>

    <!-- CỘT PHẢI: KHUNG TRÒ CHUYỆN -->
    <main class="chat-main">
      <header class="chat-header">
        <div class="logo-title">
          <h2>👶 LactaMed AI</h2>
          <span class="badge-sub">Y văn chuẩn LactMed & Dược thư</span>
        </div>
      </header>

      <div class="disclaimer-banner">
        ⚠️ <strong>Lưu ý:</strong> Thông tin tra cứu mang tính chất tham khảo y văn, không thay thế chẩn đoán hay chỉ định của bác sĩ chuyên khoa.
      </div>

      <div class="messages-container" id="messages-container">
        <!-- Lời chào đầu tiên -->
        <div class="message assistant">
          <div class="bubble">
            Xin chào! Tôi là trợ lý tra cứu mức độ an toàn của thuốc đối với phụ nữ đang cho con bú. Bạn cần kiểm tra loại thuốc hoặc triệu chứng nào hôm nay?
            <div class="quick-prompts">
              <button onclick="sendQuickPrompt('Tôi đang sốt uống Hapacol được không?')">Sốt uống Hapacol?</button>
              <button onclick="sendQuickPrompt('Kháng sinh Amoxicillin có an toàn khi cho con bú không?')">Kháng sinh Amoxicillin?</button>
              <button onclick="sendQuickPrompt('Thuốc nhỏ mũi chứa Pseudoephedrine có làm giảm sữa không?')">Pseudoephedrine giảm sữa?</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ô NHẬP TIN NHẮN -->
      <footer class="chat-input-bar">
        <form id="chat-form" onsubmit="handleSendMessage(event)">
          <input type="text" id="user-input" placeholder="Nhập tên thuốc hoặc triệu chứng (ví dụ: Paracetamol, ho, dị ứng...)" autocomplete="off" required>
          <button type="submit" id="send-btn">Gửi</button>
        </form>
      </footer>
    </main>
  </div>

  <!-- POPUP ĐĂNG NHẬP / ĐĂNG KÝ -->
  <div id="auth-modal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeAuthModal()">&times;</span>
      <h3>Đăng nhập / Đăng ký</h3>
      <p class="modal-desc">Đăng nhập để lưu lại các cuộc trò chuyện y tế của bạn.</p>
      <button onclick="loginWithGoogle()" class="btn-google">Đăng nhập với Google</button>
      <div class="divider"><span>Hoặc dùng Email</span></div>
      <input type="email" id="auth-email" placeholder="Email của bạn">
      <input type="password" id="auth-password" placeholder="Mật khẩu">
      <div class="modal-actions">
        <button onclick="loginWithEmail(document.getElementById('auth-email').value, document.getElementById('auth-password').value)" class="btn-primary">Đăng nhập</button>
        <button onclick="registerWithEmail(document.getElementById('auth-email').value, document.getElementById('auth-password').value)" class="btn-secondary">Tạo tài khoản</button>
      </div>
    </div>
  </div>

  <script src="firebase-config.js"></script>
  <script src="auth.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

---

## 6. Tệp Điều Khiển Chat `static/app.js`

Tệp này xử lý gửi câu hỏi đến Backend `/api/chat`, hiển thị câu trả lời có gắn nhãn màu an toàn, và lưu vào Firestore:

```javascript
let currentConversationId = null;

// Gửi câu hỏi nhanh từ các nút gợi ý
function sendQuickPrompt(text) {
  document.getElementById("user-input").value = text;
  document.getElementById("chat-form").dispatchEvent(new Event('submit'));
}

async function handleSendMessage(e) {
  e.preventDefault();
  const inputEl = document.getElementById("user-input");
  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = "";
  appendMessage("user", message);

  // Hiển thị bong bóng chờ
  const loadingId = appendLoadingBubble();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    });

    if (!res.ok) throw new Error("Máy chủ phản hồi lỗi");
    const data = await res.json();

    // Xóa bong bóng chờ và hiển thị câu trả lời thật
    removeMessage(loadingId);
    appendMessage("assistant", data.answer, data.safety_level, data.sources);

    // Nếu người dùng đã đăng nhập, lưu vào Firestore
    const user = auth.currentUser;
    if (user) {
      saveMessageToFirestore(user.uid, message, data);
    }
  } catch (err) {
    removeMessage(loadingId);
    appendMessage("assistant", "⚠️ Máy chủ đang khởi động hoặc gặp sự cố kết nối. Vui lòng thử lại sau 30 giây.");
  }
}

function appendMessage(role, text, safetyLevel = null, sources = []) {
  const container = document.getElementById("messages-container");
  const msgEl = document.createElement("div");
  msgEl.className = `message ${role}`;

  let badgeHtml = "";
  if (safetyLevel === "Compatible") {
    badgeHtml = '<span class="badge-safety safe">✅ TƯƠNG THÍCH (AN TOÀN KHI CHO CON BÚ)</span>';
  } else if (safetyLevel === "Caution") {
    badgeHtml = '<span class="badge-safety caution">⚠️ THẬN TRỌNG (CẦN THEO DÕI TRẺ)</span>';
  } else if (safetyLevel === "Contraindicated") {
    badgeHtml = '<span class="badge-safety danger">⛔ CHỐNG CHỈ ĐỊNH (NGUY HIỂM)</span>';
  }

  let sourcesHtml = "";
  if (sources && sources.length > 0) {
    sourcesHtml = `<div class="sources-box"><strong>📚 Nguồn trích dẫn:</strong> ${sources.join(", ")}</div>`;
  }

  const parsedText = marked.parse(text);

  msgEl.innerHTML = `
    <div class="bubble">
      ${badgeHtml}
      <div class="text-content">${parsedText}</div>
      ${sourcesHtml}
    </div>
  `;

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
  return msgEl;
}

function appendLoadingBubble() {
  const id = "loading-" + Date.now();
  const container = document.getElementById("messages-container");
  const msgEl = document.createElement("div");
  msgEl.className = "message assistant";
  msgEl.id = id;
  msgEl.innerHTML = '<div class="bubble loading-bubble">🔍 Đang tra cứu y văn LactMed & Dược thư...</div>';
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Lưu tin nhắn vào Firestore
async function saveMessageToFirestore(uid, userText, botData) {
  if (!currentConversationId) {
    currentConversationId = "conv_" + Date.now();
    await db.collection("users").doc(uid).collection("conversations").doc(currentConversationId).set({
      title: userText.substring(0, 35) + "...",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    loadConversations(uid);
  }

  const messagesRef = db.collection("users").doc(uid)
    .collection("conversations").doc(currentConversationId)
    .collection("messages");

  await messagesRef.add({
    role: "user",
    content: userText,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  await messagesRef.add({
    role: "assistant",
    content: botData.answer,
    safety_level: botData.safety_level,
    sources: botData.sources,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Tải danh sách cuộc trò chuyện cũ
function loadConversations(uid) {
  db.collection("users").doc(uid).collection("conversations")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const listEl = document.getElementById("conversations-list");
      listEl.innerHTML = "";
      snapshot.forEach((doc) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerText = doc.data().title || "Cuộc trò chuyện";
        item.onclick = () => loadMessages(uid, doc.id);
        listEl.appendChild(item);
      });
    });
}

// Mở lại cuộc trò chuyện cũ
async function loadMessages(uid, convId) {
  currentConversationId = convId;
  const container = document.getElementById("messages-container");
  container.innerHTML = "";

  const snapshot = await db.collection("users").doc(uid)
    .collection("conversations").doc(convId)
    .collection("messages").orderBy("timestamp", "asc").get();

  snapshot.forEach((doc) => {
    const data = doc.data();
    appendMessage(data.role, data.content, data.safety_level, data.sources);
  });
}

document.getElementById("new-chat-btn").onclick = () => {
  currentConversationId = null;
  document.getElementById("messages-container").innerHTML = `
    <div class="message assistant">
      <div class="bubble">Đoạn chat mới đã sẵn sàng. Bạn muốn tra cứu loại thuốc nào?</div>
    </div>
  `;
};
```

---

## 7. Tệp Định Dạng Giao Diện `static/style.css`

Tệp định dạng này mang phong cách hiện đại, thanh thoát, thân thiện với bà mẹ nuôi con nhỏ:

```css
* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { background: #f7f9fa; color: #2d3748; height: 100vh; overflow: hidden; }

.app-layout { display: flex; height: 100vh; }

/* SIDEBAR */
.sidebar { width: 260px; background: #1a202c; color: #edf2f7; display: flex; flex-direction: column; }
.sidebar-header { padding: 15px; border-bottom: 1px solid #2d3748; }
.btn-new-chat { width: 100%; padding: 10px; background: #319795; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-new-chat:hover { background: #285e61; }
.history-list { flex: 1; overflow-y: auto; padding: 10px; }
.history-item { padding: 10px; border-radius: 6px; cursor: pointer; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
.history-item:hover { background: #2d3748; }
.sidebar-footer { padding: 15px; border-top: 1px solid #2d3748; }
.btn-logout { background: transparent; color: #fc8181; border: 1px solid #fc8181; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 6px; }
.btn-login-trigger { width: 100%; padding: 8px; background: #4a5568; color: white; border: none; border-radius: 6px; cursor: pointer; }

/* CHAT MAIN */
.chat-main { flex: 1; display: flex; flex-direction: column; background: #ffffff; }
.chat-header { padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.badge-sub { font-size: 12px; background: #e6fffa; color: #234e52; padding: 3px 8px; border-radius: 12px; font-weight: 500; }
.disclaimer-banner { background: #fffaf0; color: #9c4221; padding: 8px 20px; font-size: 13px; border-bottom: 1px solid #feebc8; }

.messages-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.message { display: flex; max-width: 80%; }
.message.user { align-self: flex-end; }
.message.assistant { align-self: flex-start; }
.bubble { padding: 14px 18px; border-radius: 12px; font-size: 15px; line-height: 1.6; }
.message.user .bubble { background: #319795; color: white; border-bottom-right-radius: 2px; }
.message.assistant .bubble { background: #edf2f7; color: #2d3748; border-bottom-left-radius: 2px; }

/* BADGES AN TOÀN */
.badge-safety { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
.badge-safety.safe { background: #c6f6d5; color: #22543d; }
.badge-safety.caution { background: #fefcbf; color: #744210; }
.badge-safety.danger { background: #fed7d7; color: #742a2a; }

.sources-box { margin-top: 10px; font-size: 12px; color: #718096; border-top: 1px dashed #cbd5e0; padding-top: 6px; }
.quick-prompts { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
.quick-prompts button { background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 12px; }
.quick-prompts button:hover { background: #cbd5e0; }

/* INPUT BAR */
.chat-input-bar { padding: 15px 20px; border-top: 1px solid #e2e8f0; }
.chat-input-bar form { display: flex; gap: 10px; }
.chat-input-bar input { flex: 1; padding: 12px 16px; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 15px; outline: none; }
.chat-input-bar input:focus { border-color: #319795; }
.chat-input-bar button { padding: 0 25px; background: #319795; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }

/* MODAL */
.modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
.modal.active { display: flex; }
.modal-content { background: white; padding: 25px; border-radius: 12px; width: 340px; position: relative; }
.close-btn { position: absolute; right: 15px; top: 12px; font-size: 20px; cursor: pointer; }
.btn-google { width: 100%; padding: 10px; background: #4285f4; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.divider { text-align: center; margin: 15px 0; font-size: 12px; color: #a0aec0; border-bottom: 1px solid #e2e8f0; line-height: 0.1em; }
.divider span { background: white; padding: 0 10px; }
.modal-content input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #cbd5e0; border-radius: 6px; }
.modal-actions { display: flex; gap: 8px; }
.btn-primary { flex: 1; padding: 10px; background: #319795; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-secondary { flex: 1; padding: 10px; background: #edf2f7; color: #4a5568; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
```

---

Như vậy bạn đã có toàn bộ các file code hoàn chỉnh. Giờ hãy chuyển sang **[Bài 04: Nạp Tài Liệu Y Khoa Có Sẵn & Chạy Thử Nghiệm Trên Máy](04_Huong_Dan_Nap_Tai_Lieu_Va_Test_Local.md)** để khởi động hệ thống lần đầu tiên!
