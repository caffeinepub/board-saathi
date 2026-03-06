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
  Download,
  Edit2,
  Eye,
  GitBranch,
  LogOut,
  Palette,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Orange", value: "#ea580c" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Red", value: "#dc2626" },
  { label: "Teal", value: "#0d9488" },
  { label: "Pink", value: "#db2777" },
  { label: "Yellow", value: "#ca8a04" },
];

const DEFAULT_COLORS: Record<number, string> = {
  0: "#2563eb",
  1: "#16a34a",
  2: "#ea580c",
  3: "#7c3aed",
  4: "#dc2626",
  5: "#0d9488",
};

// ── Paper sizes (in pixels at 96dpi) ─────────────────────────────────────────
const PAPER_SIZES = [
  { label: "A4 Portrait", key: "a4p", w: 794, h: 1123 },
  { label: "A4 Landscape", key: "a4l", w: 1123, h: 794 },
  { label: "A3 Portrait", key: "a3p", w: 1123, h: 1587 },
  { label: "A3 Landscape", key: "a3l", w: 1587, h: 1123 },
  { label: "HD (1920×1080)", key: "hd", w: 1920, h: 1080 },
  { label: "Square (1080×1080)", key: "sq", w: 1080, h: 1080 },
];

// ── Node dimension helpers ────────────────────────────────────────────────────
const FONT_SIZE = 13;
const H_PAD = 20;
const V_PAD = 14;
const LINE_H = FONT_SIZE * 1.4;
const MAX_LINE_CHARS = 22;
const MIN_NODE_W = 100;
const MIN_NODE_H = 40;

/** Split text into lines respecting MAX_LINE_CHARS */
function splitLines(text: string): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if ((cur + (cur ? " " : "") + word).length <= MAX_LINE_CHARS) {
      cur = cur ? `${cur} ${word}` : word;
    } else {
      if (cur) lines.push(cur);
      // if single word is too long, hard-break it
      if (word.length > MAX_LINE_CHARS) {
        for (let i = 0; i < word.length; i += MAX_LINE_CHARS) {
          lines.push(word.slice(i, i + MAX_LINE_CHARS));
        }
        cur = "";
      } else {
        cur = word;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function getNodeDims(text: string): { w: number; h: number; lines: string[] } {
  const lines = splitLines(text);
  const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), "");
  const w = Math.max(
    MIN_NODE_W,
    longestLine.length * FONT_SIZE * 0.6 + H_PAD * 2,
  );
  const h = Math.max(MIN_NODE_H, lines.length * LINE_H + V_PAD * 2);
  return { w, h, lines };
}

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

type View = "list" | "editor" | "viewer" | "create";

function makeRootNode(title: string): MindMapNode {
  return {
    id: "root",
    text: title,
    x: 160,
    y: 300,
    color: "#2563eb",
    parentId: null,
  };
}

// ── Render a node as SVG <g> ──────────────────────────────────────────────────
function NodeShape({
  n,
  isSelected,
  onPointerDown,
  onClick,
  onKeyDown,
  interactive = true,
}: {
  n: MindMapNode;
  isSelected?: boolean;
  onPointerDown?: (
    e: React.MouseEvent<SVGGElement> | React.TouchEvent<SVGGElement>,
  ) => void;
  onClick?: (e: React.MouseEvent<SVGGElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<SVGGElement>) => void;
  interactive?: boolean;
}) {
  const { w, h, lines } = getNodeDims(n.text);
  const fg = getFgColor(n.color);
  const firstLineY = h / 2 - ((lines.length - 1) * LINE_H) / 2;

  return (
    <g
      transform={`translate(${n.x},${n.y})`}
      onMouseDown={
        interactive
          ? (onPointerDown as React.MouseEventHandler<SVGGElement>)
          : undefined
      }
      onTouchStart={
        interactive
          ? (onPointerDown as React.TouchEventHandler<SVGGElement>)
          : undefined
      }
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Node: ${n.text}`}
      style={{ cursor: interactive ? "grab" : "default" }}
      data-ocid={`mindmap.node.item.${n.id}`}
    >
      <rect
        width={w}
        height={h}
        rx={12}
        fill={n.color}
        stroke={isSelected ? "#facc15" : "rgba(255,255,255,0.15)"}
        strokeWidth={isSelected ? 3 : 1.5}
        filter={
          isSelected
            ? "drop-shadow(0 0 10px rgba(250,204,21,0.8))"
            : "drop-shadow(0 3px 6px rgba(0,0,0,0.4))"
        }
      />
      {lines.map((line, li) => (
        <text
          key={`${li}-${line}`}
          x={w / 2}
          y={firstLineY + li * LINE_H}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={fg}
          fontSize={FONT_SIZE}
          fontWeight={n.parentId === null ? "bold" : "normal"}
          fontFamily="sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** Draw connector between two nodes (bezier curve) */
function EdgePath({ from, to }: { from: MindMapNode; to: MindMapNode }) {
  const { w: fw, h: fh } = getNodeDims(from.text);
  const { w: tw, h: th } = getNodeDims(to.text);
  const x1 = from.x + fw / 2;
  const y1 = from.y + fh / 2;
  const x2 = to.x + tw / 2;
  const y2 = to.y + th / 2;
  const mx = (x1 + x2) / 2;
  return (
    <path
      d={`M${x1},${y1} Q${mx},${y1} ${x2},${y2}`}
      stroke={to.color}
      strokeWidth={2.5}
      fill="none"
      opacity={0.8}
    />
  );
}

// ── Export mindmap to image ───────────────────────────────────────────────────
function exportMindMapToImage(
  nodes: MindMapNode[],
  paperKey: string,
  mapTitle: string,
) {
  const paper = PAPER_SIZES.find((p) => p.key === paperKey) ?? PAPER_SIZES[0];
  const PADDING = 60;

  // Compute bounding box of all nodes
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const n of nodes) {
    const { w, h } = getNodeDims(n.text);
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + w);
    maxY = Math.max(maxY, n.y + h);
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const availW = paper.w - PADDING * 2;
  const availH = paper.h - PADDING * 2;
  const scale = Math.min(availW / contentW, availH / contentH, 2);

  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const offsetX = PADDING + (availW - scaledW) / 2 - minX * scale;
  const offsetY = PADDING + (availH - scaledH) / 2 - minY * scale;

  // Build SVG string
  let svgParts: string[] = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${paper.w}" height="${paper.h}">`,
    `<rect width="${paper.w}" height="${paper.h}" fill="#0f172a"/>`,
    // grid dots
    `<defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.08)"/></pattern></defs>`,
    `<rect width="${paper.w}" height="${paper.h}" fill="url(#g)"/>`,
    // title
    `<text x="${paper.w / 2}" y="32" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="18" font-family="sans-serif" font-weight="bold">${mapTitle}</text>`,
    `<g transform="translate(${offsetX},${offsetY}) scale(${scale})">`,
  );

  // Edges
  for (const n of nodes) {
    if (!n.parentId) continue;
    const parent = nodes.find((p) => p.id === n.parentId);
    if (!parent) continue;
    const { w: fw, h: fh } = getNodeDims(parent.text);
    const { w: tw, h: th } = getNodeDims(n.text);
    const x1 = parent.x + fw / 2;
    const y1 = parent.y + fh / 2;
    const x2 = n.x + tw / 2;
    const y2 = n.y + th / 2;
    const mx = (x1 + x2) / 2;
    svgParts.push(
      `<path d="M${x1},${y1} Q${mx},${y1} ${x2},${y2}" stroke="${n.color}" stroke-width="2.5" fill="none" opacity="0.8"/>`,
    );
  }

  // Nodes
  for (const n of nodes) {
    const { w, h, lines } = getNodeDims(n.text);
    const fg = getFgColor(n.color);
    const firstLineY = h / 2 - ((lines.length - 1) * LINE_H) / 2;
    const fontWeight = n.parentId === null ? "bold" : "normal";
    const textLines = lines
      .map(
        (line, li) =>
          `<text x="${w / 2}" y="${firstLineY + li * LINE_H}" text-anchor="middle" dominant-baseline="middle" fill="${fg}" font-size="${FONT_SIZE}" font-weight="${fontWeight}" font-family="sans-serif">${line}</text>`,
      )
      .join("");
    svgParts.push(
      `<g transform="translate(${n.x},${n.y})">`,
      `<rect width="${w}" height="${h}" rx="12" fill="${n.color}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>`,
      textLines,
      "</g>",
    );
  }

  svgParts.push("</g></svg>");
  const svgString = svgParts.join("");

  // Render to canvas and download
  const img = new Image();
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = paper.w;
    canvas.height = paper.h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((b) => {
      if (!b) {
        toast.error("Failed to generate image.");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `mindmap_${mapTitle.replace(/\s+/g, "_")}_${paper.label.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Saved as ${paper.label} image!`);
    }, "image/png");
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    toast.error("Failed to render image.");
  };
  img.src = url;
}

// ─── Save in Device Modal ─────────────────────────────────────────────────────
function SaveInDeviceModal({
  map,
  onClose,
}: {
  map: LocalMindMap;
  onClose: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState(PAPER_SIZES[0].key);

  const handleSave = () => {
    exportMindMapToImage(map.nodes, selectedSize, map.title);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      data-ocid="mindmap.save_device.modal"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Save in Device
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-ocid="mindmap.save_device.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Choose a size. Nodes will auto-adjust to fit the selected paper size.
        </p>

        <div className="space-y-2 mb-6">
          {PAPER_SIZES.map((ps) => (
            <button
              key={ps.key}
              type="button"
              onClick={() => setSelectedSize(ps.key)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium ${
                selectedSize === ps.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              }`}
              data-ocid={`mindmap.save_device.size.${ps.key}`}
            >
              <span>{ps.label}</span>
              <span className="text-xs text-muted-foreground">
                {ps.w}×{ps.h}px
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="mindmap.save_device.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSave}
            data-ocid="mindmap.save_device.save_button"
          >
            <Download className="w-4 h-4" />
            Save Image
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Fullscreen Mind Map Editor ───────────────────────────────────────────────
interface FullscreenEditorProps {
  map: LocalMindMap;
  onSaveAndExit: (nodes: MindMapNode[]) => void;
}

function FullscreenEditor({ map, onSaveAndExit }: FullscreenEditorProps) {
  const [nodes, setNodes] = useState<MindMapNode[]>(() =>
    map.nodes.map((n) => ({ ...n })),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("root");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Canvas pan + zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.0);

  const zoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.15).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.15).toFixed(2)));

  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<MindMapNode[]>(nodes);
  const dragStateRef = useRef<{
    type: "node" | "pan";
    nodeId?: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX?: number;
    startNodeY?: number;
    startOffsetX?: number;
    startOffsetY?: number;
  } | null>(null);

  // Keep nodesRef in sync
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // ── Global pointer/touch event listeners ────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      if (ds.type === "node" && ds.nodeId !== undefined) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const cx = (sx - offset.x) / scale;
        const cy = (sy - offset.y) / scale;
        const dx = cx - ds.startMouseX;
        const dy = cy - ds.startMouseY;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === ds.nodeId
              ? {
                  ...n,
                  x: (ds.startNodeX ?? 0) + dx,
                  y: (ds.startNodeY ?? 0) + dy,
                }
              : n,
          ),
        );
      } else if (ds.type === "pan") {
        const dx = e.clientX - ds.startMouseX;
        const dy = e.clientY - ds.startMouseY;
        setOffset({
          x: (ds.startOffsetX ?? 0) + dx,
          y: (ds.startOffsetY ?? 0) + dy,
        });
      }
    };

    const onMouseUp = () => {
      dragStateRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      e.preventDefault();
      const touch = e.touches[0];

      if (ds.type === "node" && ds.nodeId !== undefined) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const sx = touch.clientX - rect.left;
        const sy = touch.clientY - rect.top;
        const cx = (sx - offset.x) / scale;
        const cy = (sy - offset.y) / scale;
        const dx = cx - ds.startMouseX;
        const dy = cy - ds.startMouseY;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === ds.nodeId
              ? {
                  ...n,
                  x: (ds.startNodeX ?? 0) + dx,
                  y: (ds.startNodeY ?? 0) + dy,
                }
              : n,
          ),
        );
      } else if (ds.type === "pan") {
        const dx = touch.clientX - ds.startMouseX;
        const dy = touch.clientY - ds.startMouseY;
        setOffset({
          x: (ds.startOffsetX ?? 0) + dx,
          y: (ds.startOffsetY ?? 0) + dy,
        });
      }
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
  }, [offset, scale]);

  // ── Node pointer down — start drag ──────────────────────────────────────
  const handleNodePointerDown = (
    e: React.MouseEvent<SVGGElement> | React.TouchEvent<SVGGElement>,
    nodeId: string,
  ) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setShowColorPicker(false);

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

    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cx = (sx - offset.x) / scale;
    const cy = (sy - offset.y) / scale;

    dragStateRef.current = {
      type: "node",
      nodeId,
      startMouseX: cx,
      startMouseY: cy,
      startNodeX: node.x,
      startNodeY: node.y,
    };
  };

  // ── Canvas background pointer down — start pan ───────────────────────────
  const handleCanvasPointerDown = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
  ) => {
    setSelectedNodeId(null);
    setShowColorPicker(false);

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
      type: "pan",
      startMouseX: clientX,
      startMouseY: clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  };

  // ── Add Node ────────────────────────────────────────────────────────────
  const handleAddNode = () => {
    const targetId = selectedNodeId ?? "root";
    const currentNodes = nodesRef.current;
    const parent = currentNodes.find((n) => n.id === targetId);
    if (!parent) {
      toast.error("Select a node to add a branch to.");
      return;
    }

    const text = window.prompt("Enter node text (any length):", "New Topic");
    if (text === null) return;
    const trimmed = text.trim() || "New Topic";

    const depth = nodeDepth(currentNodes, targetId);
    const colorIdx = depth % NODE_COLORS.length;
    const siblings = currentNodes.filter((n) => n.parentId === targetId);
    const spreadOffset =
      (siblings.length - Math.floor(siblings.length / 2)) * 100;

    const { w: parentW } = getNodeDims(parent.text);
    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      x: parent.x + parentW + 60,
      y: parent.y + spreadOffset,
      color: DEFAULT_COLORS[colorIdx] ?? "#2563eb",
      parentId: targetId,
    };

    setNodes((prev) => {
      const next = [...prev, newNode];
      nodesRef.current = next;
      return next;
    });
    setSelectedNodeId(newNode.id);

    // Auto-scroll so new node is visible
    setTimeout(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const { w: nw, h: nh } = getNodeDims(newNode.text);
      const screenX = newNode.x * scale + offset.x;
      const screenY = newNode.y * scale + offset.y;
      const margin = 80;
      let newOffX = offset.x;
      let newOffY = offset.y;
      if (screenX > rect.width - margin) {
        newOffX -= screenX - (rect.width - margin - nw * scale);
      } else if (screenX < margin) {
        newOffX += margin - screenX;
      }
      if (screenY > rect.height - margin) {
        newOffY -= screenY - (rect.height - margin - nh * scale);
      } else if (screenY < margin) {
        newOffY += margin - screenY;
      }
      setOffset({ x: newOffX, y: newOffY });
    }, 50);

    toast.success("Node added! Tap it to select, then drag to move.");
  };

  // ── Rename Node ──────────────────────────────────────────────────────────
  const handleRenameNode = () => {
    if (!selectedNodeId) {
      toast.error("Select a node to rename.");
      return;
    }
    const node = nodesRef.current.find((n) => n.id === selectedNodeId);
    if (!node) return;
    const newText = window.prompt("Enter new name for node:", node.text);
    if (newText === null) return;
    const trimmed = newText.trim();
    if (!trimmed) {
      toast.error("Node name cannot be empty.");
      return;
    }
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, text: trimmed } : n)),
    );
    toast.success("Node renamed!");
  };

  // ── Delete Node ──────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!selectedNodeId || selectedNodeId === "root") {
      toast.error("Select a non-root node to delete.");
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
    toast.success("Node deleted.");
  };

  // ── Change Color ──────────────────────────────────────────────────────────
  const handleChangeColor = (color: string) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, color } : n)),
    );
    setShowColorPicker(false);
  };

  // ── Save & Exit ───────────────────────────────────────────────────────────
  const handleSaveAndExit = () => {
    onSaveAndExit(nodesRef.current);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-950 flex"
      style={{ touchAction: "none" } as CSSProperties}
      data-ocid="mindmap.fullscreen.editor"
    >
      {/* ── Canvas area ───────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        className="flex-1 w-full h-full"
        onMouseDown={handleCanvasPointerDown}
        onTouchStart={handleCanvasPointerDown}
        style={{ cursor: "grab", userSelect: "none", display: "block" }}
        role="img"
        aria-label="Mind map canvas — drag to pan, tap nodes to select"
        data-ocid="mindmap.canvas_target"
      >
        {/* Dotted grid background */}
        <defs>
          <pattern
            id="grid"
            width={40 * scale}
            height={40 * scale}
            patternUnits="userSpaceOnUse"
            x={offset.x % (40 * scale)}
            y={offset.y % (40 * scale)}
          >
            <circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Canvas group — apply pan + scale transform */}
        <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
          {/* Connections */}
          {nodes
            .filter((n) => n.parentId !== null)
            .map((n) => {
              const parent = nodes.find((p) => p.id === n.parentId);
              if (!parent) return null;
              return <EdgePath key={`edge-${n.id}`} from={parent} to={n} />;
            })}

          {/* Nodes */}
          {nodes.map((n) => (
            <NodeShape
              key={n.id}
              n={n}
              isSelected={n.id === selectedNodeId}
              onPointerDown={(e) => handleNodePointerDown(e, n.id)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(n.id);
                setShowColorPicker(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setSelectedNodeId(n.id);
                }
              }}
            />
          ))}
        </g>
      </svg>

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-2 w-16 bg-gray-900 border-l border-white/10 py-6 relative z-10 overflow-y-auto">
        {/* Map title at top */}
        <div className="absolute top-3 left-0 right-0 flex justify-center">
          <span
            className="text-[10px] text-white/50 font-semibold text-center px-1 leading-tight"
            style={{ writingMode: "horizontal-tb" }}
          >
            {map.title.length > 8 ? `${map.title.slice(0, 7)}…` : map.title}
          </span>
        </div>

        {/* Selected node indicator */}
        {selectedNode && (
          <div className="absolute top-10 left-0 right-0 px-1">
            <div
              className="w-3 h-3 rounded-full mx-auto border-2 border-yellow-300"
              style={{ backgroundColor: selectedNode.color }}
            />
          </div>
        )}

        {/* Spacer for title */}
        <div className="h-8" />

        {/* 1. Add Node */}
        <button
          type="button"
          onClick={handleAddNode}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors w-12"
          title="Add Node"
          data-ocid="mindmap.add_node.button"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Add</span>
        </button>

        {/* 2. Rename Node */}
        <button
          type="button"
          onClick={handleRenameNode}
          disabled={!selectedNodeId}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors w-12"
          title="Rename selected node"
          data-ocid="mindmap.rename_node.button"
        >
          <Pencil className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Rename</span>
        </button>

        {/* 3. Delete */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={!selectedNodeId || selectedNodeId === "root"}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-700 hover:bg-red-600 active:bg-red-800 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors w-12"
          title="Delete selected node"
          data-ocid="mindmap.delete_node.button"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Delete</span>
        </button>

        {/* 4. Zoom In */}
        <button
          type="button"
          onClick={zoomIn}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white transition-colors w-12"
          title={`Zoom In (${Math.round(scale * 100)}%)`}
          data-ocid="mindmap.zoom_in.button"
        >
          <ZoomIn className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Zoom+</span>
        </button>

        {/* 5. Zoom Out */}
        <button
          type="button"
          onClick={zoomOut}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white transition-colors w-12"
          title={`Zoom Out (${Math.round(scale * 100)}%)`}
          data-ocid="mindmap.zoom_out.button"
        >
          <ZoomOut className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Zoom-</span>
        </button>

        {/* 6. Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker((v) => !v)}
            disabled={!selectedNodeId}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors w-12"
            title="Change node colour"
            data-ocid="mindmap.color.button"
          >
            <Palette className="w-5 h-5" />
            <span className="text-[9px] font-bold leading-none">Colour</span>
          </button>

          {/* Color picker popup — appears to the left */}
          {showColorPicker && selectedNodeId && (
            <div className="absolute right-14 top-0 bg-gray-800 border border-white/20 rounded-xl p-3 shadow-xl flex flex-col gap-2 z-20 w-36">
              <p className="text-white text-[11px] font-semibold mb-1">
                Pick colour
              </p>
              <div className="grid grid-cols-4 gap-2">
                {NODE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      selectedNode?.color === c.value
                        ? "border-yellow-300 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => handleChangeColor(c.value)}
                    data-ocid="mindmap.color.toggle"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="mt-1 text-white/50 hover:text-white text-[10px] flex items-center gap-1 justify-center"
              >
                <X className="w-3 h-3" /> close
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-white/10 my-1" />

        {/* 5. Save & Exit */}
        <button
          type="button"
          onClick={handleSaveAndExit}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-green-700 hover:bg-green-600 active:bg-green-800 text-white transition-colors w-12"
          title="Save and exit"
          data-ocid="mindmap.save_exit.button"
        >
          <Save className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Save</span>
        </button>

        {/* Bottom instructions */}
        <div className="absolute bottom-3 left-0 right-0 px-1 text-center">
          <p className="text-[8px] text-white/30 leading-tight">
            Drag canvas to pan
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Read-only Fullscreen Viewer ──────────────────────────────────────────────
interface FullscreenViewerProps {
  map: LocalMindMap;
  onEdit: () => void;
  onExit: () => void;
}

function FullscreenViewer({ map, onEdit, onExit }: FullscreenViewerProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.0);
  const zoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.15).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.15).toFixed(2)));
  const svgRef = useRef<SVGSVGElement>(null);
  const panStateRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ps = panStateRef.current;
      if (!ps) return;
      setOffset({
        x: ps.startOffsetX + (e.clientX - ps.startMouseX),
        y: ps.startOffsetY + (e.clientY - ps.startMouseY),
      });
    };
    const onMouseUp = () => {
      panStateRef.current = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const ps = panStateRef.current;
      if (!ps) return;
      e.preventDefault();
      const t = e.touches[0];
      setOffset({
        x: ps.startOffsetX + (t.clientX - ps.startMouseX),
        y: ps.startOffsetY + (t.clientY - ps.startMouseY),
      });
    };
    const onTouchEnd = () => {
      panStateRef.current = null;
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

  const handlePanStart = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
  ) => {
    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    panStateRef.current = {
      startMouseX: clientX,
      startMouseY: clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  };

  const nodes = map.nodes;

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-950 flex"
      style={{ touchAction: "none" } as CSSProperties}
      data-ocid="mindmap.fullscreen.viewer"
    >
      {/* Canvas */}
      <svg
        ref={svgRef}
        className="flex-1 w-full h-full"
        onMouseDown={handlePanStart}
        onTouchStart={handlePanStart}
        style={{ cursor: "grab", userSelect: "none", display: "block" }}
        role="img"
        aria-label="Mind map viewer — drag to pan"
        data-ocid="mindmap.viewer.canvas_target"
      >
        <defs>
          <pattern
            id="grid-viewer"
            width={40 * scale}
            height={40 * scale}
            patternUnits="userSpaceOnUse"
            x={offset.x % (40 * scale)}
            y={offset.y % (40 * scale)}
          >
            <circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-viewer)" />

        <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
          {/* Connections */}
          {nodes
            .filter((n) => n.parentId !== null)
            .map((n) => {
              const parent = nodes.find((p) => p.id === n.parentId);
              if (!parent) return null;
              return <EdgePath key={`edge-${n.id}`} from={parent} to={n} />;
            })}

          {/* Nodes (read-only, no drag) */}
          {nodes.map((n) => (
            <NodeShape key={n.id} n={n} interactive={false} />
          ))}
        </g>
      </svg>

      {/* Right sidebar — Edit + Exit */}
      <div className="flex flex-col items-center justify-center gap-3 w-16 bg-gray-900 border-l border-white/10 py-6 relative z-10">
        {/* Map title */}
        <div className="absolute top-3 left-0 right-0 flex justify-center">
          <span className="text-[10px] text-white/50 font-semibold text-center px-1 leading-tight">
            {map.title.length > 8 ? `${map.title.slice(0, 7)}…` : map.title}
          </span>
        </div>

        {/* View-only badge */}
        <div className="absolute top-10 left-0 right-0 flex justify-center">
          <span className="text-[8px] text-white/30 font-medium">
            View only
          </span>
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors w-12"
          title="Switch to Edit mode"
          data-ocid="mindmap.viewer.edit.button"
        >
          <Edit2 className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Edit</span>
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={zoomIn}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white transition-colors w-12"
          title={`Zoom In (${Math.round(scale * 100)}%)`}
          data-ocid="mindmap.viewer.zoom_in.button"
        >
          <ZoomIn className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Zoom+</span>
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={zoomOut}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white transition-colors w-12"
          title={`Zoom Out (${Math.round(scale * 100)}%)`}
          data-ocid="mindmap.viewer.zoom_out.button"
        >
          <ZoomOut className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Zoom-</span>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-white/10 my-1" />

        {/* Exit button */}
        <button
          type="button"
          onClick={onExit}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white transition-colors w-12"
          title="Exit viewer"
          data-ocid="mindmap.viewer.exit.button"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none">Exit</span>
        </button>

        {/* Bottom instructions */}
        <div className="absolute bottom-3 left-0 right-0 px-1 text-center">
          <p className="text-[8px] text-white/30 leading-tight">Drag to pan</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main MindMapPage ─────────────────────────────────────────────────────────
export default function MindMapPage() {
  const userId = getCurrentUserId() ?? "guest";
  const subjects = getSubjects(userId);
  const chapters = getChapters(userId);

  const [view, setView] = useState<View>("list");
  const [maps, setMaps] = useState<LocalMindMap[]>(() => getMindMaps(userId));
  const [editingMap, setEditingMap] = useState<LocalMindMap | null>(null);
  const [saveDeviceMap, setSaveDeviceMap] = useState<LocalMindMap | null>(null);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newChapterId, setNewChapterId] = useState<number | null>(null);

  // ── Open editor ─────────────────────────────────────────────────────────
  const openEditor = (map: LocalMindMap) => {
    setEditingMap(map);
    setView("editor");
  };

  // ── Open viewer ─────────────────────────────────────────────────────────
  const openViewer = (map: LocalMindMap) => {
    setEditingMap(map);
    setView("viewer");
  };

  // ── Save (from fullscreen editor) ───────────────────────────────────────
  const handleSaveAndExit = useCallback(
    (updatedNodes: MindMapNode[]) => {
      if (!editingMap) return;
      const updated = maps.map((m) =>
        m.id === editingMap.id
          ? { ...editingMap, nodes: updatedNodes, updatedAt: Date.now() }
          : m,
      );
      setMaps(updated);
      saveMindMaps(userId, updated);
      toast.success("Mind map saved!");
      setView("list");
      setEditingMap(null);
    },
    [editingMap, maps, userId],
  );

  // ── Create new map ──────────────────────────────────────────────────────
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

  // ── Delete map ──────────────────────────────────────────────────────────
  const handleDeleteMap = (id: string) => {
    const updated = maps.filter((m) => m.id !== id);
    setMaps(updated);
    saveMindMaps(userId, updated);
    toast.success("Mind map deleted.");
  };

  const chaptersForSubject = newSubjectId
    ? chapters.filter((c) => c.subjectId === newSubjectId)
    : [];

  // ─── Fullscreen editor overlay ────────────────────────────────────────────
  if (view === "editor" && editingMap) {
    return (
      <FullscreenEditor map={editingMap} onSaveAndExit={handleSaveAndExit} />
    );
  }

  // ─── Fullscreen viewer overlay ────────────────────────────────────────────
  if (view === "viewer" && editingMap) {
    return (
      <FullscreenViewer
        map={editingMap}
        onEdit={() => setView("editor")}
        onExit={() => {
          setView("list");
          setEditingMap(null);
        }}
      />
    );
  }

  // ─── List / Create view ───────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24">
      {/* Save in Device modal */}
      {saveDeviceMap && (
        <SaveInDeviceModal
          map={saveDeviceMap}
          onClose={() => setSaveDeviceMap(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-primary" />
          Mind Map Builder
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tap "New Mind Map" to open the fullscreen canvas
        </p>
      </div>

      {/* How to use */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold mb-2 text-primary">
            How to use Mind Map
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1.</span> Create a
              new mind map — give it a title.
            </li>
            <li>
              <span className="font-medium text-foreground">2.</span> The canvas
              opens fullscreen. Tap any node to select it (yellow glow).
            </li>
            <li>
              <span className="font-medium text-foreground">3.</span> Use the 5
              buttons on the right: <strong>Add</strong>,{" "}
              <strong>Rename</strong>, <strong>Delete</strong>,{" "}
              <strong>Colour</strong>, <strong>Save</strong>.
            </li>
            <li>
              <span className="font-medium text-foreground">4.</span> Nodes
              auto-expand to fit any length of text — no truncation.
            </li>
            <li>
              <span className="font-medium text-foreground">5.</span> After
              saving, tap <strong>Save in Device</strong> to export as an image
              in A4, A3, HD, or other sizes.
            </li>
          </ul>
        </CardContent>
      </Card>

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
                    className="hover:border-primary/40 transition-colors"
                    data-ocid={`mindmap.map.item.${i + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
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
                        <div className="flex gap-1 items-center flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs px-2 h-8"
                            onClick={() => openEditor(m)}
                            data-ocid={`mindmap.map.edit_button.${i + 1}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1 text-xs px-2 h-8"
                            onClick={() => openViewer(m)}
                            data-ocid={`mindmap.map.view_button.${i + 1}`}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1 text-xs px-2 h-8"
                            onClick={() => setSaveDeviceMap(m)}
                            data-ocid={`mindmap.map.save_device_button.${i + 1}`}
                          >
                            <Download className="w-3 h-3" />
                            Save in Device
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 w-8 h-8"
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
                autoFocus
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
                Create & Open
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
