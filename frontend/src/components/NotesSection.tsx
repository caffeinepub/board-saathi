import { useState, useRef } from 'react';
import { Plus, Trash2, Image, Eye, EyeOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGetNotes, useAddNote, useDeleteNote } from '../hooks/useQueries';
import type { Note } from '../backend';

interface NotesSectionProps {
  chapterId: bigint;
}

export default function NotesSection({ chapterId }: NotesSectionProps) {
  const { data: notes = [], isLoading } = useGetNotes(chapterId);
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();

  const [content, setContent] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [showImageFor, setShowImageFor] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!content.trim() && !imageData) return;
    await addNote.mutateAsync({
      chapterId,
      content: content.trim(),
      imageData: imageData ?? null,
    });
    setContent('');
    setImageData(null);
  };

  const handleDelete = async (noteId: bigint) => {
    await deleteNote.mutateAsync({ noteId, chapterId });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleImageVisibility = (noteId: string) => {
    setShowImageFor((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <Textarea
          placeholder="Write a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none bg-white"
        />
        {imageData && (
          <div className="relative">
            <img src={imageData} alt="Preview" className="max-h-32 rounded-lg object-cover" />
            <button
              onClick={() => setImageData(null)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-600"
          >
            <Image size={14} className="mr-1" />
            Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={addNote.isPending || (!content.trim() && !imageData)}
            className="bg-teal-600 hover:bg-teal-700 text-white ml-auto"
          >
            <Plus size={14} className="mr-1" />
            {addNote.isPending ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No notes yet. Add your first note above.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note: Note) => (
            <div key={String(note.id)} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {note.content && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  )}
                  {note.imageData && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleImageVisibility(String(note.id))}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
                      >
                        {showImageFor.has(String(note.id)) ? (
                          <><EyeOff size={12} /> Hide image</>
                        ) : (
                          <><Eye size={12} /> Show image</>
                        )}
                      </button>
                      {showImageFor.has(String(note.id)) && (
                        <img
                          src={note.imageData}
                          alt="Note"
                          className="mt-2 max-h-48 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(Number(note.createdAt) / 1_000_000).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
