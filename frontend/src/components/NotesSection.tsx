import { useState, useRef } from 'react';
import { Plus, Trash2, Image, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGetNotesForChapter, useAddNote, useDeleteNote, LocalNote } from '../hooks/useQueries';

function NoteCard({ note, onDelete }: { note: LocalNote; onDelete: () => void }) {
  const [showImage, setShowImage] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-background space-y-2">
      {note.content && <p className="text-sm whitespace-pre-wrap">{note.content}</p>}
      {note.imageData && (
        <div>
          <button
            onClick={() => setShowImage(!showImage)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Image className="w-3 h-3" />
            {showImage ? 'Hide Image' : 'Show Image'}
            {showImage ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
          {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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

  const [content, setContent] = useState('');
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!content.trim() && !imageData) {
      toast.error('Please enter some content or attach an image');
      return;
    }
    try {
      await addNote.mutateAsync({ chapterId, content: content.trim(), imageData });
      toast.success('Note added!');
      setContent('');
      setImageData(undefined);
      setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
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
        <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="w-3.5 h-3.5" />Add Note
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={e => setContent(e.target.value)}
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
              className="gap-1"
            >
              <Image className="w-3.5 h-3.5" />
              {imageData ? 'Change Image' : 'Attach Image'}
            </Button>
            {imageData && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setImageData(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }}
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
          {imageData && (
            <img src={imageData} alt="Preview" className="rounded-md max-h-32 object-contain" />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={addNote.isPending} className="flex-1">
              {addNote.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save Note
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setContent(''); setImageData(undefined); }}>
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
          {notes.map(note => (
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
