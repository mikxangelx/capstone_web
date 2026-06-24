"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Megaphone, Send, Trash2, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  addAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  getServerAnnouncements,
  subscribe,
} from "@/lib/announcements";
import { fileToResizedDataURL } from "@/lib/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function useAnnouncements() {
  // useSyncExternalStore keeps the list in sync with localStorage writes
  // from this component, other components, and other tabs.
  return useSyncExternalStore(
    subscribe,
    getAnnouncements,
    getServerAnnouncements
  );
}

function formatDate(ms) {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Announcements({ user }) {
  const announcements = useAnnouncements();
  const canPost = user.role === "admin";
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: localStorage is only available on the client.
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6">
      {canPost && <AnnouncementForm user={user} />}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Announcements
          </h2>
          {mounted && announcements.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {announcements.length}
            </span>
          )}
        </div>

        {!mounted ? null : announcements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Megaphone className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No announcements yet.
                {canPost
                  ? " Post one above to get started."
                  : " Check back later."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id}>
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        {a.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {a.authorName} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    {canPost && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete announcement"
                        onClick={() => {
                          deleteAnnouncement(a.id);
                          toast.success("Announcement deleted.");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap text-foreground/90">
                      {a.body}
                    </p>
                    {a.image && (
                      // Data URL from localStorage — plain img (not next/image).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image}
                        alt=""
                        className="max-h-80 w-full rounded-xl object-cover ring-1 ring-black/5"
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AnnouncementForm({ user }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null); // resized data URL
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataURL(file);
      setImage(dataUrl);
    } catch (err) {
      toast.error(err?.message ?? "Could not load that image.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearImage = () => setImage(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please add a title and a message.");
      return;
    }
    setSubmitting(true);
    try {
      addAnnouncement({ title, body, image, authorName: user.name });
      setTitle("");
      setBody("");
      setImage(null);
      toast.success("Announcement posted!");
    } catch {
      // localStorage quota is the usual culprit when an image is attached.
      toast.error("Couldn't save — the image may be too large. Try a smaller one.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold text-foreground">
          Post an Announcement
        </h2>
        <p className="text-sm text-muted-foreground">
          Visible to all teachers and guidance counselors.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              placeholder="e.g. Faculty meeting this Friday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              placeholder="Write the details of your announcement..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              rows={4}
            />
          </div>

          {/* Image attachment */}
          <div className="space-y-1.5">
            <Label>Image (optional)</Label>
            {image ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Announcement preview"
                  className="max-h-48 rounded-xl object-cover ring-1 ring-black/5"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-black/5 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-slate-50 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <ImagePlus className="size-4" />
                Click to add a picture
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Post Announcement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
