import React, { useState, useEffect, useRef } from "react";
import { type ConversationItem, formatConversationTime } from "../services/firebase";
import type { User } from "firebase/auth";
import { 
  Plus, 
  MessageSquare, 
  LogOut, 
  User as UserIcon, 
  X,
  Pencil,
  Trash2,
  Check,
  Clock
} from "lucide-react";

interface Props {
  conversations: ConversationItem[];
  activeConvId: string | null;
  onSelectConv: (id: string) => void;
  onNewChat: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onRenameConv: (convId: string, newTitle: string) => Promise<void>;
  onHideConv: (convId: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  conversations,
  activeConvId,
  onSelectConv,
  onNewChat,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  onRenameConv,
  onHideConv,
  isOpenMobile,
  onCloseMobile
}) => {
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const clickTimeoutRef = useRef<any>(null);

  // Cơ chế mở Admin ẩn: Nhấn phím tắt Ctrl + Shift + A (hoặc Cmd + Shift + A trên Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        onOpenAdmin();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenAdmin]);

  // Cơ chế mở Admin ẩn: Nhấp chuột 3 lần liên tiếp vào logo LactaMed AI
  const handleLogoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const currentCount = (Number(sessionStorage.getItem("lactamed_logo_clicks") || "0")) + 1;
    if (currentCount >= 3) {
      sessionStorage.removeItem("lactamed_logo_clicks");
      onOpenAdmin();
      return;
    }

    sessionStorage.setItem("lactamed_logo_clicks", currentCount.toString());
    clickTimeoutRef.current = setTimeout(() => {
      sessionStorage.removeItem("lactamed_logo_clicks");
    }, 1500);
  };

  const startRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const confirmRename = async (convId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      await onRenameConv(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  const handleHide = async (convId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa hoặc ẩn cuộc trò chuyện "${title}" khỏi danh sách?`)) {
      await onHideConv(convId);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
        />
      )}

      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 border-r border-slate-800 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        {/* Header với nút New Chat */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer select-none group"
              title="LactaMed AI (Mẹo: Nhấp 3 lần liên tiếp để mở Cổng Quản trị)"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">👶</span>
              <h1 className="font-bold text-sm text-white tracking-wide">LactaMed AI</h1>
            </div>
            <button
              onClick={onCloseMobile}
              className="sm:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Đoạn chat mới
          </button>
        </div>

        {/* Danh sách các cuộc trò chuyện cũ */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
            <span>Lịch sử trò chuyện</span>
            {currentUser && conversations.length > 0 && (
              <span className="text-[10px] text-slate-500 font-normal">({conversations.length})</span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="text-xs text-slate-500 px-3 py-6 text-center leading-relaxed">
              {currentUser 
                ? "Chưa có cuộc trò chuyện nào. Hãy gõ câu hỏi để bắt đầu!" 
                : "Đăng nhập để tự động lưu và đổi tên các cuộc trò chuyện của bạn."}
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeConvId === c.id;
              const formattedTime = formatConversationTime(c.updatedAt || c.createdAt);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConv(c.id);
                    onCloseMobile();
                  }}
                  className={`group relative w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-1 border ${
                    isActive
                      ? "bg-slate-800/90 text-teal-300 border-slate-700/80 shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/50 border-transparent"
                  }`}
                >
                  {editingConvId === c.id ? (
                    /* Form đổi tên */
                    <form 
                      onSubmit={(e) => confirmRename(c.id, e)} 
                      className="flex items-center gap-1.5 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-slate-950 border border-teal-500/70 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => confirmRename(c.id, e)}
                        className="p-1 hover:text-emerald-400 text-slate-300"
                        title="Lưu tên mới"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        className="p-1 hover:text-red-400 text-slate-300"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    /* Hiển thị tiêu đề bình thường */
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 truncate pr-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate text-xs font-medium">{c.title}</span>
                      </div>

                      {/* Các nút Thao tác Hover: Đổi tên & Ẩn */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition">
                        <button
                          type="button"
                          onClick={(e) => startRename(c, e)}
                          className="p-1 hover:text-teal-300 text-slate-400 hover:bg-slate-700/70 rounded transition"
                          title="Đổi tên cuộc trò chuyện"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleHide(c.id, c.title, e)}
                          className="p-1 hover:text-red-400 text-slate-400 hover:bg-slate-700/70 rounded transition"
                          title="Ẩn cuộc trò chuyện này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hiển thị thời gian lần cuối trò chuyện */}
                  {formattedTime && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pl-5 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formattedTime}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 relative">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName || "Người dùng"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 transition"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Đăng nhập để lưu chat
            </button>
          )}

          {/* Nút chấm ẩn kín đáo ở góc chân trang cho Admin */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-800/80 hover:bg-teal-500/80 transition cursor-default"
            title="LactaMed System"
          />
        </div>
      </aside>
    </>
  );
};
