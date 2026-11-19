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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-40 w-72 bg-[#F6F5F4] text-black/80 flex flex-col transition-transform duration-200 ease-out border-r border-black/10 shadow-xl sm:shadow-none ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-black/8">
          <div className="flex items-center justify-between mb-3">
            <div 
              onClick={handleLogoTap}
              className="flex items-center gap-2 cursor-pointer select-none group active:scale-95 transition-transform"
              title="LactaMed AI - Chạm 3 lần để mở Cổng Quản Trị"
            >
              <div className="w-7 h-7 rounded-md bg-[#1A1A1A] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-xs text-black tracking-tight flex items-center gap-1.5">
                  <span>LactaMed AI</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded-xs bg-black/5 text-black/70 border border-black/10">
                    Pro
                  </span>
                </h1>
                <p className="text-[10px] text-black/50 font-medium">Dược học Lâm sàng & Cho con bú</p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="sm:hidden p-1.5 text-black/50 hover:text-black hover:bg-black/5 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full py-2 px-3.5 bg-[#0075DE] hover:bg-[#0062BD] active:bg-[#005BAB] active:scale-[0.98] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        {/* Danh sách các cuộc trò chuyện cũ */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          <div className="text-[10.5px] font-semibold text-black/45 uppercase tracking-wider px-2 py-1.5 flex items-center justify-between">
            <span>Lịch sử hội thoại</span>
            {currentUser && conversations.length > 0 && (
              <span className="text-[10px] font-mono text-black/60 bg-black/5 px-1.5 py-0.2 rounded-xs border border-black/8">
                {conversations.length}
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="text-xs text-black/50 px-3 py-8 text-center leading-relaxed">
              {currentUser ? (
                <div className="space-y-1.5">
                  <MessageSquare className="w-5 h-5 text-black/30 mx-auto mb-2 opacity-60" />
                  <p className="text-black/60 font-medium text-xs">Chưa có lịch sử</p>
                  <p className="text-[11px] text-black/45">Nhập tên thuốc để bắt đầu tra cứu y khoa.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Sparkles className="w-5 h-5 text-[#0075DE] mx-auto mb-1 opacity-80" />
                  <p className="text-black/70 font-semibold text-xs">Đăng nhập tài khoản</p>
                  <p className="text-[11px] text-black/45">Đồng bộ và lưu trữ lịch sử tư vấn y tế trên các thiết bị.</p>
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
                  className={`group relative w-full text-left p-2 rounded-lg transition-all cursor-pointer flex flex-col gap-0.5 border ${
                    isActive
                      ? "bg-white text-black font-medium border-black/10 shadow-2xs"
                      : "text-black/75 hover:bg-black/5 hover:text-black border-transparent"
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
                        className="flex-1 bg-white border border-[#0075DE] rounded-md px-2 py-0.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#0075DE]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => confirmRename(c.id, e)}
                        className="p-1 hover:text-[#0075DE] text-black/50 hover:bg-black/5 rounded-md transition cursor-pointer"
                        title="Lưu tên mới"
                      >
                        <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        className="p-1 hover:text-[#F64932] text-black/50 hover:bg-black/5 rounded-md transition cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    /* Hiển thị tiêu đề bình thường */
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 truncate pr-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 transition-opacity ${isActive ? "text-[#0075DE] opacity-100" : "text-black/40 opacity-70"}`} />
                        <span className="truncate text-xs tracking-tight">{c.title}</span>
                      </div>

                      {/* Các nút Thao tác Hover: Đổi tên & Ẩn */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => startRename(c, e)}
                          className="p-1 text-black/40 hover:text-black hover:bg-black/5 rounded-md transition cursor-pointer"
                          title="Đổi tên cuộc trò chuyện"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleHide(c.id, c.title, e)}
                          className="p-1 text-black/40 hover:text-[#F64932] hover:bg-black/5 rounded-md transition cursor-pointer"
                          title="Ẩn cuộc trò chuyện này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hiển thị thời gian lần cuối trò chuyện */}
                  {formattedTime && (
                    <div className="flex items-center gap-1 text-[10px] text-black/40 pl-5 font-mono">
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
        <div className="p-3 border-t border-black/8 bg-[#F6F5F4]">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/8 shadow-2xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-md bg-[#0075DE] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : "U")}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-black truncate tracking-tight leading-tight">
                    {currentUser.displayName || "Người dùng"}
                  </p>
                  <p className="text-[10px] text-black/50 truncate font-mono leading-tight">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-black/40 hover:text-[#F64932] hover:bg-rose-50 rounded-md transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 px-3 bg-white hover:bg-black/5 text-black rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-black/10 transition shadow-2xs cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#0075DE]" />
              <span>Đăng nhập để lưu chat</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
