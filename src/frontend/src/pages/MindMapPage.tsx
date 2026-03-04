import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  GitBranch,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type LocalMindMap,
  type MindMapNode,
  getChapters,
  getCurrentUserId,
  getMindMaps,
  getSubjects,
  saveMindMaps,
} from "../utils/localStorageService";

// ── Color palette ─────────────────────────────────────────────────────────────
const NODE_COLORS = [
  { label: "Blue", value: "#2563eb", fg: "#fff" },
  { label: "Green", value: "#16a34a", fg: "#fff" },
  { label: "Orange", value: "#ea580c", fg: "#fff" },
  { label: "Purple", value: "#7c3aed", fg: "#fff" },
  { label: "Red", value: "#dc2626", fg: "#fff" },
  { label: "Teal", value: "#0d9488", fg: "#fff" },
];

const DEFAULT_COLORS: Record<number, string> = {
  0: "#2563eb",
  1: "#16a34a",
  2: "#ea580c",
  3: "#7c3aed",
  4: "#dc2626",
  5: "#0d9488",
};

function nodeDepth(nodes: MindMapNode[], id: string): number {
  const node = nodes.find((n) => n.id === id);
  if (!node || node.parentId === null) return 0;
  return 1 + nodeDepth(nodes, node.parentId);
}

function getFgColor(bg: string): string {
  const hex = bg.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 140 ? "#1a1a1a" : "#ffffff";
}

const NODE_W = 140;
const NODE_H = 44;
const GUIDE_STEPS = [
  "Click 'New Mind Map' to create a map. Give it a title and optionally link it to a subject/chapter.",
  "Click any node to select it (highlighted with yellow border).",
  "Use 'Add Branch' to add a child node to the selected node.",
  "Use 'Edit Text' to rename the selected node.",
  "Use 'Change Color' to pick a color for the selected node.",
  "Drag any node to reposition it on the canvas.",
  "Click 'Save' when done. Your map is stored in your profile.",
];

type View = "list" | "editor" | "create";

function makeRootNode(title: string): MindMapNode {
  return {
    id: "root",
    text: title,
    x: 300,
    y: 200,
    color: "#2563eb",
    parentId: null,
  };
}

export default function MindMapPage() {
  const userId = getCurrentUserId() ?? "guest";
  const subjects = getSubjects(userId);
  const chapters = getChapters(userId);

  const [view, setView] = useState<View>("list");
  const [maps, setMaps] = useState<LocalMindMap[]>(() => getMindMaps(userId));
  const [guideOpen, setGuideOpen] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newChapterId, setNewChapterId] = useState<number | null>(null);

  // Editor state
  const [editingMap, setEditingMap] = useState<LocalMindMap | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Drag state — stored in refs to avoid stale closure issues
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<{
    nodeId: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);
  const nodesRef = useRef<MindMapNode[]>([]);
  const setNodesRef = useRef(setNodes);
  // keep nodesRef in sync
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // ── Global mouse event listeners for drag (attached to window) ───────────
  useEffect(() => {
    const getSVGPos = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: clientX, y: clientY };
      const rect = svg.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const { x: mx, y: my } = getSVGPos(e.clientX, e.clientY);
      const dx = mx - ds.startMouseX;
      const dy = my - ds.startMouseY;
      const newX = ds.startNodeX + dx;
      const newY = ds.startNodeY + dy;
      setNodesRef.current((prev) =>
        prev.map((n) => (n.id === ds.nodeId ? { ...n, x: newX, y: newY } : n)),
      );
    };

    const onMouseUp = () => {
      dragStateRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x: mx, y: my } = getSVGPos(touch.clientX, touch.clientY);
      const dx = mx - ds.startMouseX;
      const dy = my - ds.startMouseY;
      setNodesRef.current((prev) =>
        prev.map((n) =>
          n.id === ds.nodeId
            ? { ...n, x: ds.startNodeX + dx, y: ds.startNodeY + dy }
            : n,
        ),
      );
    };

    const onTouchEnd = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // ── Create new map ─────────────────────────────────────────────────────────
  const handleCreateMap = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    const root = makeRootNode(newTitle.trim());
    const newMap: LocalMindMap = {
      id: `mm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: newTitle.trim(),
      subjectId: newSubjectId,
      chapterId: newChapterId,
      nodes: [root],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newMap, ...maps];
    setMaps(updated);
    saveMindMaps(userId, updated);
    openEditor(newMap);
  };

  // ── Open editor ───────────────────────────────────────────────────────────
  const openEditor = (map: LocalMindMap) => {
    setEditingMap(map);
    const freshNodes = map.nodes.map((n) => ({ ...n }));
    setNodes(freshNodes);
    setSelectedNodeId("root");
    setView("editor");
  };

  // ── Save map ──────────────────────────────────────────────────────────────
  const saveCurrentMap = useCallback(() => {
    if (!editingMap) return;
    const currentNodes = nodesRef.current;
    const updated = maps.map((m) =>
      m.id === editingMap.id
        ? { ...editingMap, nodes: [...currentNodes], updatedAt: Date.now() }
        : m,
    );
    setMaps(updated);
    saveMindMaps(userId, updated);
    toast.success("Mind map saved!");
  }, [editingMap, maps, userId]);

  // ── Add branch ────────────────────────────────────────────────────────────
  const handleAddBranch = () => {
    if (!selectedNodeId) {
      toast.error("Select a node first.");
      return;
    }
    const currentNodes = nodesRef.current;
    const parent = currentNodes.find((n) => n.id === selectedNodeId);
    if (!parent) {
      toast.error("Selected node not found.");
      return;
    }
    const depth = nodeDepth(currentNodes, selectedNodeId);
    const colorIdx = depth % NODE_COLORS.length;
    const siblings = currentNodes.filter((n) => n.parentId === selectedNodeId);
    const spreadOffset =
      (siblings.length - Math.floor(siblings.length / 2)) * 80;
    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: "New Topic",
      x: parent.x + 200,
      y: parent.y + spreadOffset,
      color: DEFAULT_COLORS[colorIdx] ?? "#2563eb",
      parentId: selectedNodeId,
    };
    setNodes((prev) => {
      const next = [...prev, newNode];
      nodesRef.current = next;
      return next;
    });
    setSelectedNodeId(newNode.id);
    toast.success("Branch added! Click 'Edit Text' to rename it.");
  };

  // ── Delete node ───────────────────────────────────────────────────────────
  const handleDeleteNode = () => {
    if (!selectedNodeId || selectedNodeId === "root") {
      toast.error("Cannot delete root node.");
      return;
    }
    const toDelete = new Set<string>();
    const collect = (id: string) => {
      toDelete.add(id);
      for (const n of nodesRef.current.filter((nd) => nd.parentId === id)) {
        collect(n.id);
      }
    };
    collect(selectedNodeId);
    setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    setSelectedNodeId("root");
  };

  // ── Edit text ─────────────────────────────────────────────────────────────
  const handleEditText = () => {
    const node = nodesRef.current.find((n) => n.id === selectedNodeId);
    if (!node) return;
    const text = window.prompt("Edit node text:", node.text);
    if (text === null) return;
    if (!text.trim()) {
      toast.error("Text cannot be empty.");
      return;
    }
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId ? { ...n, text: text.trim() } : n,
      ),
    );
  };

  // ── Change color ──────────────────────────────────────────────────────────
  const handleChangeColor = (color: string) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, color } : n)),
    );
  };

  // ── Delete map ────────────────────────────────────────────────────────────
  const handleDeleteMap = (id: string) => {
    const updated = maps.filter((m) => m.id !== id);
    setMaps(updated);
    saveMindMaps(userId, updated);
    toast.success("Mind map deleted.");
  };

  // ── Node mouse/touch down — start drag ───────────────────────────────────
  const handleNodePointerDown = (
    e: React.MouseEvent<SVGGElement> | React.TouchEvent<SVGGElement>,
    nodeId: string,
  ) => {
    e.stopPropagation();

    // Select the node
    setSelectedNodeId(nodeId);

    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();

    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    dragStateRef.current = {
      nodeId,
      startMouseX: clientX - rect.left,
      startMouseY: clientY - rect.top,
      startNodeX: node.x,
      startNodeY: node.y,
    };
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const chaptersForSubject = newSubjectId
    ? chapters.filter((c) => c.subjectId === newSubjectId)
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            Mind Map Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visual mind maps for every chapter — connect ideas with branches
          </p>
        </div>
        <div className="flex gap-2">
          {view !== "list" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setView("list");
                setEditingMap(null);
              }}
              data-ocid="mindmap.back.button"
            >
              ← All Maps
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGuideOpen((v) => !v)}
            data-ocid="mindmap.guide.toggle"
          >
            {guideOpen ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            How to Use
          </Button>
        </div>
      </div>

      {/* Guide */}
      {guideOpen && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <ul className="space-y-2">
              {GUIDE_STEPS.map((s) => (
                <li key={s} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <div>
          <Button
            className="mb-5"
            onClick={() => {
              setNewTitle("");
              setNewSubjectId(null);
              setNewChapterId(null);
              setView("create");
            }}
            data-ocid="mindmap.create.button"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Mind Map
          </Button>

          {maps.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="mindmap.list.empty_state"
            >
              <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No mind maps yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first mind map to visualize chapter topics.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {maps.map((m, i) => {
                const subj = subjects.find((s) => s.id === m.subjectId);
                const chap = chapters.find((c) => c.id === m.chapterId);
                return (
                  <Card
                    key={m.id}
                    className="hover:border-primary/40 transition-colors cursor-pointer"
                    data-ocid={`mindmap.map.item.${i + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="flex-1 min-w-0 text-left"
                          onClick={() => openEditor(m)}
                        >
                          <p className="font-semibold text-sm truncate">
                            {m.title}
                          </p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {subj && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {subj.name}
                              </Badge>
                            )}
                            {chap && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {chap.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.nodes.length} nodes ·{" "}
                            {new Date(m.updatedAt).toLocaleDateString()}
                          </p>
                        </button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditor(m)}
                            data-ocid={`mindmap.map.edit_button.${i + 1}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteMap(m.id)}
                            data-ocid={`mindmap.map.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE VIEW ─── */}
      {view === "create" && (
        <Card className="max-w-md" data-ocid="mindmap.create.card">
          <CardHeader>
            <CardTitle className="text-base">New Mind Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Chapter 1 — Chemical Reactions"
                data-ocid="mindmap.title.input"
                onKeyDown={(e) => e.key === "Enter" && handleCreateMap()}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">
                Subject (optional)
              </Label>
              <Select
                value={newSubjectId ? String(newSubjectId) : "none"}
                onValueChange={(v) => {
                  setNewSubjectId(v === "none" ? null : Number(v));
                  setNewChapterId(null);
                }}
              >
                <SelectTrigger data-ocid="mindmap.subject.select">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newSubjectId && chaptersForSubject.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Chapter (optional)
                </Label>
                <Select
                  value={newChapterId ? String(newChapterId) : "none"}
                  onValueChange={(v) =>
                    setNewChapterId(v === "none" ? null : Number(v))
                  }
                >
                  <SelectTrigger data-ocid="mindmap.chapter.select">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {chaptersForSubject.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setView("list")}
                data-ocid="mindmap.cancel.button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateMap}
                data-ocid="mindmap.create.submit_button"
              >
                Create Mind Map
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── EDITOR VIEW ─── */}
      {view === "editor" && editingMap && (
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-card border border-border rounded-xl">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddBranch}
              disabled={!selectedNodeId}
              data-ocid="mindmap.add_branch.button"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Branch
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditText}
              disabled={!selectedNodeId}
              data-ocid="mindmap.edit_text.button"
            >
              Edit Text
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteNode}
              disabled={!selectedNodeId || selectedNodeId === "root"}
              className="text-destructive hover:bg-destructive/10"
              data-ocid="mindmap.delete_node.button"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Node
            </Button>

            {/* Color picker */}
            <div className="flex items-center gap-1.5 border-l border-border pl-2 ml-1">
              <span className="text-xs text-muted-foreground">Color:</span>
              {NODE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedNode?.color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => handleChangeColor(c.value)}
                  data-ocid="mindmap.color.toggle"
                />
              ))}
            </div>

            <Button
              size="sm"
              className="ml-auto"
              onClick={saveCurrentMap}
              data-ocid="mindmap.save.button"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save
            </Button>
          </div>

          {selectedNode && (
            <p className="text-xs text-muted-foreground mb-2 px-1">
              Selected:{" "}
              <span className="font-semibold">{selectedNode.text}</span> · Drag
              to move · Click another node to switch selection
            </p>
          )}

          {/* SVG Canvas */}
          <div
            className="border border-border rounded-xl overflow-hidden bg-gradient-to-br from-background to-muted/30"
            style={{ height: "calc(100vh - 320px)", minHeight: "420px" }}
          >
            {/* biome-ignore lint/a11y/noSvgWithoutTitle: aria-label provided */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: canvas interaction handled via pointer events */}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              // Clicking the canvas background deselects
              onClick={() => setSelectedNodeId(null)}
              style={{ userSelect: "none", display: "block" }}
              data-ocid="mindmap.canvas_target"
              role="img"
              aria-label="Mind map canvas"
            >
              {/* Connections */}
              {nodes
                .filter((n) => n.parentId !== null)
                .map((n) => {
                  const parent = nodes.find((p) => p.id === n.parentId);
                  if (!parent) return null;
                  const x1 = parent.x + NODE_W / 2;
                  const y1 = parent.y + NODE_H / 2;
                  const x2 = n.x + NODE_W / 2;
                  const y2 = n.y + NODE_H / 2;
                  const mx = (x1 + x2) / 2;
                  const d = `M${x1},${y1} Q${mx},${y1} ${x2},${y2}`;
                  return (
                    <path
                      key={`edge-${n.id}`}
                      d={d}
                      stroke={n.color}
                      strokeWidth={2}
                      fill="none"
                      opacity={0.7}
                    />
                  );
                })}

              {/* Nodes */}
              {nodes.map((n) => {
                const isSelected = n.id === selectedNodeId;
                const fg = getFgColor(n.color);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    onMouseDown={(e) => handleNodePointerDown(e, n.id)}
                    onTouchStart={(e) => handleNodePointerDown(e, n.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(n.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setSelectedNodeId(n.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Select node: ${n.text}`}
                    style={{ cursor: "grab" }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={n.color}
                      stroke={isSelected ? "#facc15" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isSelected ? 3 : 1.5}
                      filter={
                        isSelected
                          ? "drop-shadow(0 0 6px rgba(250,204,21,0.6))"
                          : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                      }
                    />
                    <text
                      x={NODE_W / 2}
                      y={NODE_H / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={fg}
                      fontSize={11}
                      fontWeight={n.parentId === null ? "bold" : "normal"}
                      fontFamily="sans-serif"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.text.length > 18 ? `${n.text.slice(0, 16)}…` : n.text}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Click to select a node · Drag to move · Add Branch to expand the map
          </p>
        </div>
      )}
    </div>
  );
}
