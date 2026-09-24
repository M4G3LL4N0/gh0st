import React, { useState } from "react";
import { cn } from "@gh0st/ui";
import { useStore } from "../store";
import { Conversation } from "@gh0st/core";
import { Plus, MessageSquare, Bot, Settings, ChevronLeft, ChevronRight, Archive, Pin, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@gh0st/ui";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from "@gh0st/ui";
import { Tooltip } from "@gh0st/ui";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { conversations, currentConversationId, setCurrentConversation, deleteConversation, archiveConversation, theme } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const activeConversations = conversations.filter((c) => !c.archived);
  const archivedConversations = conversations.filter((c) => c.archived);

  const handleEditStart = (conversation: typeof conversations[0]) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleEditSave = (id: string) => {
    if (editTitle.trim()) {
      useStore.getState().updateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-200",
        open ? "w-72" : "w-16"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {open && (
          <h2 className="font-semibold text-lg">gh0st</h2>
        )}
        <button
          onClick={onClose}
          className={cn(
            "p-1.5 rounded-md hover:bg-accent transition-colors",
            open ? "ml-auto" : "mx-auto"
          )}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Main navigation">
        <NavItem icon={Plus} label="New Chat" onClick={() => useStore.getState().newChat()} />
        <NavItem icon={MessageSquare} label="Conversations" />
        <NavItem icon={Bot} label="Agents" />
        <NavItem icon={Settings} label="Settings" />
      </nav>

      {open && (
        <div className="border-t p-2">
          <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conversations
          </h3>
          <ConversationList
            conversations={activeConversations}
            currentId={currentConversationId}
            onSelect={setCurrentConversation}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
            editingId={editingId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
          />

          {archivedConversations.length > 0 && (
            <>
              <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Archived
              </h3>
              <ConversationList
                conversations={archivedConversations}
                currentId={currentConversationId}
                onSelect={setCurrentConversation}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                editingId={editingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                isArchived
              />
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function NavItem({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      aria-label={label}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ConversationList({
  conversations,
  currentId,
  onSelect,
  onEditStart,
  onEditSave,
  editingId,
  editTitle,
  setEditTitle,
  isArchived
}: {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onEditStart: (conv: Conversation) => void;
  onEditSave: (id: string) => void;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  isArchived?: boolean;
}) {
  return (
    <ul className="space-y-1" role="list">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={currentId === conv.id}
          isEditing={editingId === conv.id}
          onSelect={onSelect}
          onEditStart={onEditStart}
          onEditSave={onEditSave}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          isArchived={isArchived}
        />
      ))}
    </ul>
  );
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  onSelect,
  onEditStart,
  onEditSave,
  editTitle,
  setEditTitle,
  isArchived
}: {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onEditStart: (conv: Conversation) => void;
  onEditSave: (id: string) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  isArchived?: boolean;
}) {
  const { deleteConversation, archiveConversation } = useStore();

  return (
    <li>
      <div className="relative">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => onEditSave(conversation.id)}
            onKeyDown={(e) => e.key === "Enter" && onEditSave(conversation.id)}
            className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        ) : (
          <button
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{conversation.title}</span>
            {conversation.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
          </button>
        )}

        <Dropdown>
          <DropdownTrigger
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Conversation options"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </DropdownTrigger>
          <DropdownContent align="end" className="w-40">
            <DropdownItem onClick={() => onEditStart(conversation)}>Rename</DropdownItem>
            <DropdownItem onClick={() => archiveConversation(conversation.id)}>
              {isArchived ? "Unarchive" : "Archive"}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => deleteConversation(conversation.id)} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </li>
  );
}