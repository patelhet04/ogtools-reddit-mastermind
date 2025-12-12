"use client";

import { useState, useEffect } from "react";
import type { UICalendarItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PersonaAvatar } from "@/components/ui/persona-avatar";
import { SubredditBadge } from "@/components/ui/subreddit-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Clock,
  ExternalLink,
  FileText,
  MessageSquare,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface CalendarItemDetailProps {
  item: UICalendarItem | null;
  allItems?: UICalendarItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (item: UICalendarItem) => void;
  onDelete?: (itemId: string) => void;
}

export function CalendarItemDetail({
  item,
  allItems = [],
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CalendarItemDetailProps) {
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [mentionsProduct, setMentionsProduct] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showThread, setShowThread] = useState(false);

  // Find the thread context for this item
  const getThreadContext = () => {
    if (!item || allItems.length === 0) return null;

    // Get items in same subreddit, sorted by time
    const sameSubItems = allItems
      .filter((i) => i.subreddit === item.subreddit)
      .sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime()
      );

    if (sameSubItems.length <= 1) return null;

    // Find the post this item belongs to
    const itemTime = new Date(item.scheduledTime).getTime();
    const itemDate = new Date(item.scheduledTime).toDateString();

    // Find items on the same day
    const sameDayItems = sameSubItems.filter(
      (i) => new Date(i.scheduledTime).toDateString() === itemDate
    );

    if (sameDayItems.length <= 1) return null;

    // Find the post (first item or the item with type "post")
    const post = sameDayItems.find((i) => i.type === "post");
    if (!post) return null;

    // Get all comments after this post on the same day
    const postTime = new Date(post.scheduledTime).getTime();
    const comments = sameDayItems.filter(
      (i) =>
        i.type === "comment" && new Date(i.scheduledTime).getTime() > postTime
    );

    return { post, comments };
  };

  const threadContext = getThreadContext();

  useEffect(() => {
    if (item) {
      setEditedContent(item.content);
      setEditedTitle(item.title || "");
      setMentionsProduct(item.mentionsProduct);
      setScheduledTime(new Date(item.scheduledTime).toISOString().slice(0, 16));
      setShowThread(false); // Reset thread view when item changes
    }
  }, [item]);

  const handleSave = () => {
    if (item && onUpdate) {
      onUpdate({
        ...item,
        content: editedContent,
        title: editedTitle || undefined,
        mentionsProduct,
        scheduledTime: new Date(scheduledTime).toISOString(),
      });
      toast.success("Item updated successfully");
    }
    onClose();
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id);
      toast.success("Item deleted successfully");
    }
    setShowDeleteDialog(false);
    onClose();
  };

  if (!item) return null;

  const isPost = item.type === "post";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
            <SheetHeader>
              <div className="flex items-center gap-3">
                {isPost ? (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <SheetTitle className="text-left text-base">
                    {isPost ? "Edit Post" : "Edit Comment"}
                  </SheetTitle>
                  <StatusBadge status={item.status} className="mt-1" />
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Persona Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <PersonaAvatar persona={item.persona} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-sm">
                  {item.persona.username}
                </p>
                {(item.persona.personality || item.persona.writingStyle) && (
                  <p className="text-xs text-muted-foreground capitalize truncate">
                    {[item.persona.personality, item.persona.writingStyle]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
              </div>
            </div>

            {/* Thread Context */}
            {threadContext && (
              <div className="border-2 border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowThread(!showThread)}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Thread Context ({threadContext.comments.length + 1} items)
                  </span>
                  {showThread ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {showThread && (
                  <div className="p-3 space-y-2.5 bg-background">
                    {/* Post */}
                    <div
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm",
                        threadContext.post.id === item.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-xs">
                          @{threadContext.post.persona.username}
                        </span>
                        {threadContext.post.id === item.id && (
                          <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {threadContext.post.title}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {threadContext.post.content}
                      </p>
                    </div>

                    {/* Comments */}
                    {threadContext.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm ml-4",
                          comment.id === item.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-semibold text-xs">
                            @{comment.persona.username}
                          </span>
                          {comment.id === item.id && (
                            <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Target Subreddit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target Subreddit
              </Label>
              <div className="flex items-center gap-3">
                <SubredditBadge subreddit={item.subreddit} />
                <a
                  href={`https://reddit.com/r/${item.subreddit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium transition-colors"
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Scheduled Time */}
            <div className="space-y-1.5">
              <Label
                htmlFor="scheduledTime"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Scheduled Time
              </Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            {/* Mentions Product Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label
                  htmlFor="mentionsProduct"
                  className="font-medium text-sm cursor-pointer"
                >
                  Mentions Product
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Does this content reference your product?
                </p>
              </div>
              <Switch
                id="mentionsProduct"
                checked={mentionsProduct}
                onCheckedChange={setMentionsProduct}
              />
            </div>

            {/* Title (for posts only) */}
            {isPost && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Post Title
                </Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Enter post title..."
                />
              </div>
            )}

            {/* Content */}
            <div className="space-y-1.5">
              <Label
                htmlFor="content"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Content
              </Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="resize-none"
                placeholder="Enter content..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>

            {/* Delete Button */}
            <div className="flex justify-center pt-3 mt-3 border-t border-border">
              <button
                type="button"
                className="text-sm text-destructive border border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 flex items-center gap-1.5 py-2 px-4 rounded-lg transition-colors"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Item
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              {isPost ? " post" : " comment"} from your calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
