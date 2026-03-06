import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  type LocalNote,
  useAddNote,
  useDeleteNote,
  useGetNotesForChapter,
} from "../hooks/useQueries";
import { compressImage } from "../utils/imageCompression";

function NoteCard({
  note,
  onDelete,
}: { note: LocalNote; onDelete: () => void }) {
  const [showImage, setShowImage] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-background space-y-2">
      {note.content && (
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
      )}
      {note.imageData && (
        <div>
          <button
            type="button"
            onClick={() => setShowImage(!showImage)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Image className="w-3 h-3" />
            {showImage ? "Hide Image" : "Show Image"}
            {showImage ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showImage && (
            <img
              src={note.imageData}
              alt="Note attachment"
              className="mt-2 rounded-md max-w-full max-h-48 object-contain"
            />
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(note.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface NotesSectionProps {
  chapterId: number;
}

export default function NotesSection({ chapterId }: NotesSectionProps) {
  const { data: notes = [], isLoading } = useGetNotesForChapter(chapterId);
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();

  const [content, setContent] = useState("");
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    undefined,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Set a local preview immediately for UX
    const previewUrl = URL.createObjectURL(rawFile);
    setImagePreview(previewUrl);
    setImageData(undefined);
    setUploadingImage(true);

    try {
      // Compress before uploading — large photos become ~150 KB
      const file = await compressImage(rawFile);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await blob.getBytes(); // triggers upload
      const url = blob.getDirectURL();
      setImageData(url);
      URL.revokeObjectURL(previewUrl);
      setImagePreview(undefined);
    } catch {
      toast.error("Failed to upload image. Please try again.");
      URL.revokeObjectURL(previewUrl);
      setImagePreview(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = async () => {
    if (!content.trim() && !imageData) {
      toast.error("Please enter some content or attach an image");
      return;
    }
    try {
      await addNote.mutateAsync({
        chapterId,
        content: content.trim(),
        imageData,
      });
      toast.success("Note added!");
      setContent("");
      setImageData(undefined);
      setImagePreview(undefined);
      setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Note
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="gap-1"
            >
              {uploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Image className="w-3.5 h-3.5" />
              )}
              {uploadingImage
                ? "Uploading…"
                : imageData
                  ? "Change Image"
                  : "Attach Image"}
            </Button>
            {(imageData || imagePreview) && !uploadingImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageData(undefined);
                  setImagePreview(undefined);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-destructive"
              >
                Remove
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          {(imagePreview || imageData) && (
            <img
              src={imagePreview ?? imageData}
              alt="Preview"
              className="rounded-md max-h-32 object-contain"
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addNote.isPending || uploadingImage}
              className="flex-1"
            >
              {addNote.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Save Note
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setContent("");
                setImageData(undefined);
                setImagePreview(undefined);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showForm ? (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No notes yet. Add your first note!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
