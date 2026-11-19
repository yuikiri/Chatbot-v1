import React, { useState, useEffect } from "react";
import { type ConversationItem, formatConversationTime } from "../services/firebase";
import { useSecretAdmin } from "../hooks/useSecretAdmin";
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
  Clock,
  ShieldCheck,
  Sparkles
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

  // Cơ chế mở Admin ẩn: Chạm 3 lần liên tiếp vào logo LactaMed AI trong 1.5 giây
  const handleLogoTap = useSecretAdmin(onOpenAdmin, 3, 1500);

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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 sm:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-950 text-slate-200 flex flex-col transition-transform duration-200 ease-out border-r border-slate-800/80 shadow-xl sm:shadow-none ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-3.5">
            <div 
              onClick={handleLogoTap}
              className="flex items-center gap-2.5 cursor-pointer select-none group active:scale-95 transition-transform"
              title="LactaMed AI - Chạm 3 lần để mở Cổng Quản Trị"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform ring-1 ring-teal-400/30">
                <ShieldCheck className="w-4 h-4 text-teal-100" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                  <span>LactaMed AI</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    Pro
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Dược học Lâm sàng & Cho con bú</p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm shadow-teal-900/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        {/* Danh sách các cuộc trò chuyện cũ */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
            <span>Lịch sử hội thoại</span>
            {currentUser && conversations.length > 0 && (
              <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/60 px-1.5 py-0.2 rounded border border-teal-900/50">
                {conversations.length}
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="text-xs text-slate-400/80 px-4 py-8 text-center leading-relaxed">
              {currentUser ? (
                <div className="space-y-1.5">
                  <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-60" />
                  <p className="text-slate-400 font-medium">Chưa có lịch sử</p>
                  <p className="text-[11px] text-slate-400">Nhập tên thuốc để bắt đầu tra cứu an toàn.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Sparkles className="w-5 h-5 text-teal-500/80 mx-auto mb-1" />
                  <p className="text-slate-300 font-medium text-xs">Đăng nhập tài khoản</p>
                  <p className="text-[11px] text-slate-400">Tự động đồng bộ và lưu trữ lịch sử tư vấn y tế trên các thiết bị.</p>
                </div>
              )}
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
                  className={`group relative w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1 border ${
                    isActive
                      ? "bg-slate-900/95 text-teal-200 border-slate-700/80 shadow-xs ring-1 ring-teal-500/30"
                      : "text-slate-300 hover:bg-slate-900/60 hover:text-slate-100 border-transparent"
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
                        className="flex-1 bg-slate-950 border border-teal-500/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => confirmRename(c.id, e)}
                        className="p-1 hover:text-teal-300 text-slate-400 hover:bg-slate-800 rounded transition"
                        title="Lưu tên mới"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        className="p-1 hover:text-rose-400 text-slate-400 hover:bg-slate-800 rounded transition"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    /* Hiển thị tiêu đề bình thường */
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 truncate pr-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 transition-opacity ${isActive ? "text-teal-400 opacity-100" : "opacity-60"}`} />
                        <span className="truncate text-xs font-medium tracking-tight">{c.title}</span>
                      </div>

                      {/* Các nút Thao tác Hover: Đổi tên & Ẩn */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => startRename(c, e)}
                          className="p-1 hover:text-teal-300 text-slate-400 hover:bg-slate-800 rounded-md transition"
                          title="Đổi tên cuộc trò chuyện"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleHide(c.id, c.title, e)}
                          className="p-1 hover:text-rose-400 text-slate-400 hover:bg-slate-800 rounded-md transition"
                          title="Ẩn cuộc trò chuyện này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hiển thị thời gian lần cuối trò chuyện */}
                  {formattedTime && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-5 font-mono">
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
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/70 relative">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-teal-600/80 border border-teal-500/40 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate tracking-tight">
                    {currentUser.displayName || "Người dùng"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/70 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800/90 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 transition shadow-sm cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Đăng nhập để lưu chat</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
