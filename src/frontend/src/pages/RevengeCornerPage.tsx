import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Image,
  Lock,
  Mic,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  type RevengeCornerEntry,
  type RevengeCornerPerson,
  getRevengeCornerEntries,
  getRevengeCornerPassword,
  getRevengeCornerPersons,
  saveRevengeCornerEntries,
  saveRevengeCornerPersons,
  setRevengeCornerPassword,
  verifyRevengeCornerPassword,
} from "../utils/localStorageService";

type View = "lock" | "list" | "person";

export default function RevengeCornerPage() {
  const [view, setView] = useState<View>("lock");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(
    !getRevengeCornerPassword(),
  );

  const [persons, setPersons] = useState<RevengeCornerPerson[]>([]);
  const [selectedPerson, setSelectedPerson] =
    useState<RevengeCornerPerson | null>(null);
  const [entries, setEntries] = useState<RevengeCornerEntry[]>([]);

  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [entryType, setEntryType] =
    useState<RevengeCornerEntry["type"]>("text");
  const [entryText, setEntryText] = useState("");
  const [entryCaption, setEntryCaption] = useState("");
  const [entryMediaData, setEntryMediaData] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPassword = !!getRevengeCornerPassword();

  const handleSetPassword = () => {
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setRevengeCornerPassword(newPassword);
    setIsSettingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password set! Your Revenge Corner is now protected.");
  };

  const handleUnlock = () => {
    if (!verifyRevengeCornerPassword(passwordInput)) {
      toast.error("Wrong password. Try again.");
      setPasswordInput("");
      return;
    }
    const p = getRevengeCornerPersons();
    const e = getRevengeCornerEntries();
    setPersons(p);
    setEntries(e);
    setPasswordInput("");
    setView("list");
  };

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      toast.error("Enter a name");
      return;
    }
    const newPerson: RevengeCornerPerson = {
      id: `rc_person_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: newPersonName.trim(),
      createdAt: Date.now(),
    };
    const updated = [...persons, newPerson];
    saveRevengeCornerPersons(updated);
    setPersons(updated);
    setNewPersonName("");
    setAddPersonOpen(false);
    toast.success(`"${newPerson.name}" added to Revenge Corner`);
  };

  const handleDeletePerson = (personId: string) => {
    const updatedPersons = persons.filter((p) => p.id !== personId);
    const updatedEntries = entries.filter((e) => e.personId !== personId);
    saveRevengeCornerPersons(updatedPersons);
    saveRevengeCornerEntries(updatedEntries);
    setPersons(updatedPersons);
    setEntries(updatedEntries);
    if (selectedPerson?.id === personId) {
      setSelectedPerson(null);
      setView("list");
    }
    toast.success("Removed");
  };

  const handleOpenPerson = (person: RevengeCornerPerson) => {
    setSelectedPerson(person);
    setView("person");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEntryMediaData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => setEntryMediaData(ev.target?.result as string);
        reader.readAsDataURL(blob);
        for (const t of stream.getTracks()) t.stop();
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleAddEntry = () => {
    if (!selectedPerson) return;
    const content = entryType === "text" ? entryText.trim() : entryMediaData;
    if (!content) {
      toast.error(
        entryType === "text" ? "Write something" : "Select or record a file",
      );
      return;
    }
    const newEntry: RevengeCornerEntry = {
      id: `rc_entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      personId: selectedPerson.id,
      type: entryType,
      content,
      caption: entryCaption.trim(),
      createdAt: Date.now(),
    };
    const updated = [...entries, newEntry];
    saveRevengeCornerEntries(updated);
    setEntries(updated);
    setEntryText("");
    setEntryCaption("");
    setEntryMediaData("");
    setAddEntryOpen(false);
    toast.success("Added");
  };

  const handleDeleteEntry = (entryId: string) => {
    const updated = entries.filter((e) => e.id !== entryId);
    saveRevengeCornerEntries(updated);
    setEntries(updated);
  };

  const personEntries = selectedPerson
    ? entries.filter((e) => e.personId === selectedPerson.id)
    : [];

  // ── Lock screen ────────────────────────────────────────────────────────────
  if (view === "lock") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Revenge Corner
            </h1>
            <p className="text-red-300/70 text-sm">Private vault. Protected.</p>
          </div>

          {isSettingPassword ? (
            <Card className="bg-slate-800/80 border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">
                  Set Your Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Min. 4 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button
                  onClick={handleSetPassword}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Set Password & Enter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/80 border-red-500/20">
              <CardContent className="pt-6 space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={handleUnlock}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Unlock
                </Button>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-slate-500 text-xs mt-6">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Data is stored only on this device.
          </p>
        </div>
      </div>
    );
  }

  // ── Person list ────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Revenge Corner</h1>
              <p className="text-xs text-muted-foreground">
                Your private vault
              </p>
            </div>
          </div>
          <Button
            onClick={() => setAddPersonOpen(true)}
            size="sm"
            className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Person
          </Button>
        </div>

        {persons.length === 0 ? (
          <div className="text-center py-16">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add a person or thing you want to remember.
            </p>
            <Button
              onClick={() => setAddPersonOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {persons.map((person) => {
              const count = entries.filter(
                (e) => e.personId === person.id,
              ).length;
              return (
                <Card
                  key={person.id}
                  className="cursor-pointer hover:shadow-md transition-all border-red-100 dark:border-red-950"
                  onClick={() => handleOpenPerson(person)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? "entry" : "entries"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePerson(person.id);
                        }}
                        className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Lock button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setView("lock");
              setIsSettingPassword(!hasPassword);
              setPersons([]);
              setEntries([]);
              setSelectedPerson(null);
            }}
            className="gap-2 text-muted-foreground"
          >
            <Lock className="w-4 h-4" />
            Lock & Exit
          </Button>
        </div>

        {/* Add Person Dialog */}
        <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Person / Thing</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., John, That Teacher..."
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddPersonOpen(false);
                  setNewPersonName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPerson}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Person detail ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setView("list");
            setSelectedPerson(null);
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{selectedPerson?.name}</h1>
          <p className="text-xs text-muted-foreground">
            {personEntries.length} entries
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddEntryOpen(true)}
          className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Entry
        </Button>
      </div>

      {personEntries.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No entries yet. Add text, images, videos, or recordings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {personEntries
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {entry.type === "text" && (
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {entry.type === "image" && (
                        <Image className="w-3.5 h-3.5 text-green-500" />
                      )}
                      {entry.type === "video" && (
                        <Video className="w-3.5 h-3.5 text-purple-500" />
                      )}
                      {entry.type === "recording" && (
                        <Mic className="w-3.5 h-3.5 text-orange-500" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {entry.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {entry.type === "text" && (
                    <p className="text-sm whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  )}
                  {entry.type === "image" && (
                    <img
                      src={entry.content}
                      alt={entry.caption || "image"}
                      className="rounded-lg max-h-64 object-contain w-full"
                    />
                  )}
                  {entry.type === "video" && (
                    // biome-ignore lint/a11y/useMediaCaption: user content
                    <video
                      src={entry.content}
                      controls
                      className="rounded-lg max-h-64 w-full"
                    />
                  )}
                  {entry.type === "recording" && (
                    // biome-ignore lint/a11y/useMediaCaption: user content
                    <audio src={entry.content} controls className="w-full" />
                  )}
                  {entry.caption && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {entry.caption}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { type: "text", icon: FileText, label: "Text" },
                  { type: "image", icon: Image, label: "Image" },
                  { type: "video", icon: Video, label: "Video" },
                  { type: "recording", icon: Mic, label: "Audio" },
                ] as const
              ).map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEntryType(type);
                    setEntryMediaData("");
                    setEntryText("");
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                    entryType === type
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Content input */}
            {entryType === "text" && (
              <div className="space-y-2">
                <Label>Your words</Label>
                <Textarea
                  placeholder="Write what you want to remember..."
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
            )}
            {(entryType === "image" || entryType === "video") && (
              <div className="space-y-2">
                <Label>
                  {entryType === "image" ? "Select Image" : "Select Video"}
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={entryType === "image" ? "image/*" : "video/*"}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {entryMediaData ? "File selected ✓" : `Choose ${entryType}`}
                </Button>
                {entryMediaData && entryType === "image" && (
                  <img
                    src={entryMediaData}
                    alt="preview"
                    className="rounded max-h-32 object-contain mx-auto"
                  />
                )}
              </div>
            )}
            {entryType === "recording" && (
              <div className="space-y-2">
                <Label>Record Audio</Label>
                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      variant="outline"
                      onClick={handleStartRecording}
                      className="flex-1 gap-2"
                    >
                      <Mic className="w-4 h-4 text-red-500" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopRecording}
                      className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white animate-pulse"
                    >
                      <Mic className="w-4 h-4" />
                      Stop Recording
                    </Button>
                  )}
                </div>
                {entryMediaData && !isRecording && (
                  <p className="text-xs text-green-600">Recording ready ✓</p>
                )}
              </div>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Input
                placeholder="Short note about this..."
                value={entryCaption}
                onChange={(e) => setEntryCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddEntryOpen(false);
                setEntryText("");
                setEntryCaption("");
                setEntryMediaData("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEntry}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
