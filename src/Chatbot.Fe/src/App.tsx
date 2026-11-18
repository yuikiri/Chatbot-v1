import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { CitationModal } from "./components/CitationModal";
import { AdminPortal } from "./components/AdminPortal";
import { AuthModal } from "./components/AuthModal";
import { 
  type ChatMessage, 
  type CitationItem, 
  streamChat, 
  type ChatMetadata,
  type RagMode
} from "./services/api";
import { 
  subscribeAuth, 
  logoutUser, 
  subscribeConversations, 
  getConversationMessages,
  saveConversationSession,
  saveChatMessage,
  renameConversation,
  hideConversation,
  syncUserProfile,
  type ConversationItem
} from "./services/firebase";
import type { User } from "firebase/auth";

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentView, setCurrentView] = useState<"chat" | "admin">("chat");

  // 3 Chế độ co giãn (Nghiêm ngặt, Cân bằng, Mở rộng)
  const [ragMode, setRagMode] = useState<RagMode>(() => {
    const saved = localStorage.getItem("lactamed_rag_mode");
    return (saved as RagMode) || "strict";
  });

  const handleModeChange = (newMode: RagMode) => {
    setRagMode(newMode);
    localStorage.setItem("lactamed_rag_mode", newMode);
  };

  // Modals state
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Theo dõi đăng nhập Firebase
  useEffect(() => {
    const unsubAuth = subscribeAuth((user) => {
      setCurrentUser(user);
      if (user) {
        syncUserProfile(user);
      } else {
        // LẬP TỨC DỌN SẠCH KHUNG CHAT KHI ĐĂNG XUẤT
        setActiveConvId(null);
        setMessages([]);
        setConversations([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // Lắng nghe danh sách cuộc trò chuyện từ Firestore
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      return;
    }
    const unsubConv = subscribeConversations(currentUser.uid, (list) => {
      setConversations(list);
    });
    return () => unsubConv();
  }, [currentUser]);

  // Xử lý đăng xuất sạch sẽ ngay lập tức (không cần F5)
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setActiveConvId(null);
    setMessages([]);
    setConversations([]);
  };

  // Chọn cuộc trò chuyện cũ
  const handleSelectConv = async (convId: string) => {
    if (!currentUser) return;
    setActiveConvId(convId);
    try {
      const msgs = await getConversationMessages(currentUser.uid, convId);
      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        safetyLevel: m.safetyLevel,
        citations: m.citations,
        isRefusal: m.isRefusal,
        mode: m.mode || "strict"
      })));
    } catch (e) {
      console.error("Lỗi tải tin nhắn:", e);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  // Đổi tên cuộc trò chuyện
  const handleRenameConv = async (convId: string, newTitle: string) => {
    if (!currentUser) return;
    try {
      await renameConversation(currentUser.uid, convId, newTitle);
    } catch (err) {
      console.error("Lỗi đổi tên cuộc trò chuyện:", err);
    }
  };

  // Ẩn/Xóa cuộc trò chuyện khỏi sidebar
  const handleHideConv = async (convId: string) => {
    if (!currentUser) return;
    try {
      await hideConversation(currentUser.uid, convId);
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Lỗi ẩn cuộc trò chuyện:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsgId = "usr_" + Date.now();
    const assistantMsgId = "bot_" + Date.now();

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text
    };

    // Tạo tin nhắn trợ lý đang đợi
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      citations: [],
      mode: ragMode
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    let accumulatedContent = "";
    let finalCitations: CitationItem[] = [];
    let finalSafetyLevel = "None";
    let finalIsRefusal = false;
    let finalMode: RagMode = ragMode;

    await streamChat(
      text,
      ragMode,
      (meta: ChatMetadata) => {
        finalCitations = meta.citations;
        finalSafetyLevel = meta.safetyLevel;
        finalIsRefusal = meta.isRefusal;
        if (meta.mode) finalMode = meta.mode;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { 
                  ...m, 
                  citations: meta.citations, 
                  safetyLevel: meta.safetyLevel, 
                  isRefusal: meta.isRefusal,
                  mode: finalMode 
                }
              : m
          )
        );
      },
      (token: string) => {
        accumulatedContent += token;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
          )
        );
      },
      async () => {
        setIsStreaming(false);

        // Lưu vào Firestore nếu đã đăng nhập
        if (currentUser) {
          try {
            let convId = activeConvId;
            if (!convId) {
              convId = "conv_" + Date.now();
              setActiveConvId(convId);
              const title = text.length > 30 ? text.substring(0, 30) + "..." : text;
              await saveConversationSession(currentUser.uid, convId, title);
            }

            await saveChatMessage(currentUser.uid, convId, {
              role: "user",
              content: text
            });

            await saveChatMessage(currentUser.uid, convId, {
              role: "assistant",
              content: accumulatedContent,
              safetyLevel: finalSafetyLevel,
              citations: finalCitations,
              isRefusal: finalIsRefusal,
              mode: finalMode
            });
          } catch (err) {
            console.error("Lỗi lưu Firestore:", err);
          }
        }
      },
      (err: any) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    "⚠️ Máy chủ đang khởi động hoặc chưa cấu hình API Key. Vui lòng kiểm tra lại file `.env` hoặc thử lại sau 30 giây."
                }
              : m
          )
        );
        console.error(err);
      }
    );
  };

  if (currentView === "admin") {
    return <AdminPortal onBack={() => setCurrentView("chat")} />;
  }

  return (
    <div className="flex h-[100dvh] h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={handleSelectConv}
        onNewChat={handleNewChat}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setCurrentView("admin")}
        onLogout={handleLogout}
        onRenameConv={handleRenameConv}
        onHideConv={handleHideConv}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        onOpenCitation={(c) => setActiveCitation(c)}
        onToggleMobileMenu={() => setIsOpenMobile(!isOpenMobile)}
        currentMode={ragMode}
        onModeChange={handleModeChange}
        currentUser={currentUser}
        conversationId={activeConvId || undefined}
        onOpenAdmin={() => setCurrentView("admin")}
      />

      {/* Modal Bôi đậm Đoạn Trích Dẫn Gốc hoặc Nguồn Kiểm Chứng Trực Tuyến */}
      <CitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      {/* Modal Đăng nhập / Đăng ký Firebase */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default App;
