import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Lightbulb,
  PenLine,
  Trash2,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { compressImage } from "../utils/imageCompression";
import {
  type LocalHandwritingAnalysis,
  getCurrentUserId,
  getHandwritingAnalyses,
  saveHandwritingAnalyses,
} from "../utils/localStorageService";

// ─── Accurate Handwriting Analysis Engine ────────────────────────────────────

/** Compute Otsu's threshold for adaptive binarization */
function otsuThreshold(gray: Uint8Array): number {
  const hist = new Float64Array(256);
  for (const v of gray) hist[v]++;
  const total = gray.length;
  let sumB = 0;
  let wB = 0;
  let maximum = 0;
  let threshold = 128;
  let sum1 = 0;
  for (let i = 0; i < 256; i++) sum1 += i * hist[i];
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum1 - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maximum) {
      maximum = between;
      threshold = i;
    }
  }
  return threshold;
}

/** Normalize contrast: stretch histogram to [0, 255] */
function normalizeContrast(gray: Uint8Array): Uint8Array {
  let min = 255;
  let max = 0;
  for (const v of gray) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (max === min) return gray;
  const range = max - min;
  const normalized = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    normalized[i] = Math.round(((gray[i] - min) / range) * 255);
  }
  return normalized;
}

function analyzeHandwriting(
  imageElement: HTMLImageElement,
): Omit<LocalHandwritingAnalysis, "id" | "imageData" | "analyzedAt"> {
  const canvas = document.createElement("canvas");
  // Use higher resolution for better accuracy
  const MAX_SIZE = 800;
  const scale = Math.min(
    MAX_SIZE / imageElement.width,
    MAX_SIZE / imageElement.height,
    1,
  );
  canvas.width = Math.round(imageElement.width * scale);
  canvas.height = Math.round(imageElement.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  // Step 1: Convert to grayscale (perceptual luminance)
  const rawGray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    rawGray[i] = Math.round(
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2],
    );
  }

  // Step 2: Normalize contrast to handle dim/overexposed photos
  const gray = normalizeContrast(rawGray);

  // Step 3: Compute adaptive Otsu threshold
  const THRESHOLD = otsuThreshold(gray);

  const isDark = (x: number, y: number): boolean =>
    x >= 0 && x < width && y >= 0 && y < height
      ? gray[y * width + x] < THRESHOLD
      : false;

  // ── 1. NEATNESS: Laplacian edge sharpness ────────────────────────────────
  // Sharp, clean strokes produce well-defined edges.
  // Messy writing has many soft/blurry transitions.
  let sharpEdges = 0;
  let softEdges = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = gray[y * width + x];
      const l = gray[y * width + x - 1];
      const r = gray[y * width + x + 1];
      const t = gray[(y - 1) * width + x];
      const b = gray[(y + 1) * width + x];
      // Laplacian magnitude
      const lap = Math.abs(4 * c - l - r - t - b);
      if (lap > 80) sharpEdges++;
      else if (lap > 20) softEdges++;
    }
  }
  const totalEdges = sharpEdges + softEdges || 1;
  const sharpRatio = sharpEdges / totalEdges;
  // Ideal sharpRatio 0.55–0.85 (very high = noisy, very low = blurry/messy)
  const neatnessPct =
    sharpRatio > 0.85
      ? 1 - (sharpRatio - 0.85) * 4 // penalize noisy
      : sharpRatio / 0.75;
  const neatnessScore = Math.round(Math.max(5, Math.min(25, neatnessPct * 25)));

  // ── 2. LETTER CONSISTENCY: Coefficient of variation in ink density per column ──
  // Consistent letters → uniform ink distribution column to column.
  const STRIP_W = 6;
  const numStrips = Math.floor(width / STRIP_W);
  const stripDensities: number[] = [];
  for (let s = 0; s < numStrips; s++) {
    let darkPx = 0;
    const area = STRIP_W * height;
    for (let y = 0; y < height; y++) {
      for (let x = s * STRIP_W; x < Math.min((s + 1) * STRIP_W, width); x++) {
        if (isDark(x, y)) darkPx++;
      }
    }
    stripDensities.push(darkPx / area);
  }
  // Only include non-trivial strips (ignore pure-white margins)
  const activeDensities = stripDensities.filter((d) => d > 0.02);
  const densityMean =
    activeDensities.reduce((a, b) => a + b, 0) / (activeDensities.length || 1);
  const densityVar =
    activeDensities.reduce((sum, v) => sum + (v - densityMean) ** 2, 0) /
    (activeDensities.length || 1);
  const densityCV = Math.sqrt(densityVar) / (densityMean || 0.01);
  // Lower CV = more consistent. CV < 0.5 is good; CV > 1.5 is inconsistent.
  const consistencyPct = Math.max(0, 1 - densityCV / 1.5);
  const consistencyScore = Math.round(
    Math.max(4, Math.min(25, consistencyPct * 25)),
  );

  // ── 3. SPACING: Row-level white-space analysis ────────────────────────────
  // Detect line rows vs. white-space rows. Good spacing has regular alternation.
  const rowInkDensity: number[] = [];
  for (let y = 0; y < height; y++) {
    let dark = 0;
    for (let x = 0; x < width; x++) {
      if (isDark(x, y)) dark++;
    }
    rowInkDensity.push(dark / width);
  }

  // Count line-rows (>4% ink) and space-rows (<2% ink)
  const lineRows = rowInkDensity.filter((d) => d > 0.04).length;
  const spaceRows = rowInkDensity.filter((d) => d < 0.02).length;
  const totalRows = height;

  // Count transitions between line-regions and space-regions (= num lines × 2)
  let transitions = 0;
  let prev = rowInkDensity[0] > 0.03;
  for (let y = 1; y < height; y++) {
    const cur = rowInkDensity[y] > 0.03;
    if (cur !== prev) transitions++;
    prev = cur;
  }
  const estimatedLines = Math.ceil(transitions / 2);

  // Good spacing: ~25–50% of rows are ink, rest are gaps; at least 2 lines
  const inkRatio = lineRows / totalRows;
  const spaceRatio = spaceRows / totalRows;
  const goodInkRatio =
    inkRatio >= 0.15 && inkRatio <= 0.55
      ? 1
      : Math.max(0, 1 - Math.abs(inkRatio - 0.35) * 3);
  const goodSpaceRatio = spaceRatio >= 0.2 ? 1 : spaceRatio / 0.2;
  const linesBonus = estimatedLines >= 3 ? 1 : estimatedLines / 3;
  const spacingPct =
    goodInkRatio * 0.45 + goodSpaceRatio * 0.35 + linesBonus * 0.2;
  const spacingScore = Math.round(Math.max(5, Math.min(25, spacingPct * 25)));

  // ── 4. ALIGNMENT: Baseline straightness ──────────────────────────────────
  // Detect text line bands and measure their vertical center consistency.
  const rowBands: { top: number; bottom: number; center: number }[] = [];
  let inBand = false;
  let bandStart = 0;
  for (let y = 0; y < height; y++) {
    const isText = rowInkDensity[y] > 0.04;
    if (isText && !inBand) {
      inBand = true;
      bandStart = y;
    } else if (!isText && inBand) {
      inBand = false;
      const bandH = y - bandStart;
      if (bandH > 4) {
        rowBands.push({
          top: bandStart,
          bottom: y,
          center: bandStart + bandH / 2,
        });
      }
    }
  }

  let alignmentScore: number;
  if (rowBands.length >= 2) {
    // Measure: (a) uniform band heights, (b) uniform gaps between bands
    const bandHeights = rowBands.map((b) => b.bottom - b.top);
    const gaps: number[] = [];
    for (let i = 1; i < rowBands.length; i++) {
      gaps.push(rowBands[i].top - rowBands[i - 1].bottom);
    }

    const heightMean =
      bandHeights.reduce((a, b) => a + b, 0) / bandHeights.length;
    const heightCV =
      Math.sqrt(
        bandHeights.reduce((s, h) => s + (h - heightMean) ** 2, 0) /
          bandHeights.length,
      ) / (heightMean || 1);

    let gapCV = 0;
    if (gaps.length > 0) {
      const gapMean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      gapCV =
        Math.sqrt(
          gaps.reduce((s, g) => s + (g - gapMean) ** 2, 0) / gaps.length,
        ) / (gapMean || 1);
    }

    // Lower CV = more aligned
    const alignmentPct = Math.max(0, 1 - (heightCV * 0.6 + gapCV * 0.4) / 1.2);
    alignmentScore = Math.round(Math.max(5, Math.min(25, alignmentPct * 25)));
  } else {
    // Single line or unclear — moderate score
    alignmentScore = Math.round(10 + (spacingScore / 25) * 8);
  }

  return computeResult(
    neatnessScore,
    consistencyScore,
    spacingScore,
    alignmentScore,
  );
}

function computeResult(
  neatnessScore: number,
  consistencyScore: number,
  spacingScore: number,
  alignmentScore: number,
): Omit<LocalHandwritingAnalysis, "id" | "imageData" | "analyzedAt"> {
  const totalScore =
    neatnessScore + consistencyScore + spacingScore + alignmentScore;

  let grade: LocalHandwritingAnalysis["grade"];
  if (totalScore >= 80) grade = "Excellent";
  else if (totalScore >= 60) grade = "Good";
  else if (totalScore >= 40) grade = "Average";
  else grade = "Needs Practice";

  const tips: string[] = [];

  if (neatnessScore < 13) {
    tips.push(
      "Pen strokes look blurry or overlapping — slow down and apply consistent, firm pressure.",
    );
  } else if (neatnessScore < 18) {
    tips.push(
      "Neatness can improve — trace each letter deliberately without retracing strokes.",
    );
  } else {
    tips.push("Excellent stroke clarity! Your pen control is strong.");
  }

  if (consistencyScore < 13) {
    tips.push(
      "Letter sizes vary a lot — practice on 4-line ruled paper to standardize letter height.",
    );
  } else if (consistencyScore < 18) {
    tips.push(
      "Letter consistency is moderate — focus on matching ascender heights (t, h, k, l).",
    );
  } else {
    tips.push("Very consistent letter sizing — your hand is well trained.");
  }

  if (spacingScore < 13) {
    tips.push(
      "Word spacing looks uneven — use the 'one finger gap' rule between words.",
    );
  } else if (spacingScore < 18) {
    tips.push(
      "Line spacing is slightly irregular — aim for even 1.5× line height gaps.",
    );
  } else {
    tips.push("Well-balanced word and line spacing.");
  }

  if (alignmentScore < 13) {
    tips.push(
      "Lines look slanted or wavy — practice with lined paper and train your eye to stay horizontal.",
    );
  } else if (alignmentScore < 18) {
    tips.push(
      "Alignment is decent but could be straighter — lightly rule blank paper with pencil to guide practice.",
    );
  } else {
    tips.push("Very straight and consistent baseline alignment.");
  }

  return {
    neatnessScore,
    consistencyScore,
    spacingScore,
    alignmentScore,
    totalScore,
    grade,
    tips,
  };
}

// ─── Score color helper ───────────────────────────────────────────────────────

function scoreColor(score: number, max = 25): string {
  const pct = score / max;
  if (pct >= 0.8) return "text-green-600";
  if (pct >= 0.6) return "text-yellow-600";
  if (pct >= 0.4) return "text-orange-500";
  return "text-red-500";
}

function scoreBarColor(score: number, max = 25): string {
  const pct = score / max;
  if (pct >= 0.8) return "bg-green-500";
  if (pct >= 0.6) return "bg-yellow-500";
  if (pct >= 0.4) return "bg-orange-400";
  return "bg-red-500";
}

function gradeBadgeVariant(grade: LocalHandwritingAnalysis["grade"]) {
  if (grade === "Excellent")
    return "bg-green-100 text-green-700 border-green-200";
  if (grade === "Good") return "bg-blue-100 text-blue-700 border-blue-200";
  if (grade === "Average")
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

// ─── Score Bar Component ──────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  max = 25,
  delay = 0,
}: {
  label: string;
  score: number;
  max?: number;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setWidth((score / max) * 100), 100 + delay);
    return () => clearTimeout(t);
  }, [score, max, delay]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={`text-sm font-bold ${scoreColor(score, max)}`}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${scoreBarColor(score, max)}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function ScoreLineChart({
  analyses,
}: { analyses: LocalHandwritingAnalysis[] }) {
  const last10 = [...analyses].slice(-10);
  if (last10.length < 2) return null;

  const W = 280;
  const H = 80;
  const pad = 10;
  const scores = last10.map((a) => a.totalScore);
  const minS = Math.min(...scores);
  const maxS = Math.max(...scores);
  const range = maxS - minS || 1;

  const toX = (i: number) => pad + (i / (last10.length - 1)) * (W - 2 * pad);
  const toY = (s: number) => H - pad - ((s - minS) / range) * (H - 2 * pad);

  const points = last10
    .map((a, i) => `${toX(i)},${toY(a.totalScore)}`)
    .join(" ");

  return (
    <div className="mt-4">
      <p className="text-xs text-muted-foreground mb-1 font-medium">
        Score trend (last {last10.length} analyses)
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-20 overflow-visible"
        role="img"
        aria-label="Score trend chart"
      >
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {last10.map((a, i) => (
          <circle
            key={a.id}
            cx={toX(i)}
            cy={toY(a.totalScore)}
            r="3"
            fill="hsl(var(--primary))"
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Guide Section ────────────────────────────────────────────────────────────

const GUIDE_ITEMS = [
  {
    title: "📝 Neatness",
    body: "Neatness measures edge clarity — how sharply your strokes begin and end. Practice: trace letters repeatedly on paper, focusing on clean start/end strokes. Use a medium-point pen with consistent pressure.",
  },
  {
    title: "🔤 Letter Consistency",
    body: "Consistency scores how uniform your letter sizes are. Practice: write the same word 10 times, comparing the 1st and 10th — they should look identical. Four-line ruled paper helps enormously.",
  },
  {
    title: "⬜ Spacing",
    body: "Spacing evaluates word and line gaps. Use the 'one finger gap' rule between words, and ensure line spacing is roughly 1.5× letter height. Newspaper printing exercises improve spacing awareness.",
  },
  {
    title: "📏 Alignment",
    body: "Alignment tracks baseline straightness. Practice writing on ruled paper first, then try blank paper maintaining the same straight line. Look at your paper from the side — words should sit on a straight baseline.",
  },
];

function GuideSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {GUIDE_ITEMS.map((item, i) => (
        <div
          key={item.title}
          className="border border-border rounded-lg overflow-hidden"
        >
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            data-ocid="handwriting.guide.toggle"
          >
            <span className="text-sm font-semibold">{item.title}</span>
            {openIdx === i ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {openIdx === i && (
            <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
              {item.body}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HandwritingAnalyzerPage() {
  const userId = getCurrentUserId() ?? "guest";

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Omit<
    LocalHandwritingAnalysis,
    "id" | "imageData" | "analyzedAt"
  > | null>(null);
  const [analyses, setAnalyses] = useState<LocalHandwritingAnalysis[]>(() =>
    getHandwritingAnalyses(userId),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (rawFile: File) => {
    // Compress first — large camera photos become ~150 KB
    const file = await compressImage(rawFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) handleImageFile(file);
    },
    [handleImageFile],
  );

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    try {
      await new Promise((res) => setTimeout(res, 400)); // UX delay

      const img = new Image();
      img.src = imagePreview;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Image load failed"));
      });

      const analysis = analyzeHandwriting(img);

      // Create thumbnail (max 400px wide) and upload to blob storage
      const thumbCanvas = document.createElement("canvas");
      const THUMB_MAX = 400;
      const scale = Math.min(THUMB_MAX / img.width, 1);
      thumbCanvas.width = Math.round(img.width * scale);
      thumbCanvas.height = Math.round(img.height * scale);
      thumbCanvas
        .getContext("2d")!
        .drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);

      // Convert canvas to blob, upload to external blob storage, get permanent URL
      const thumbBlob = await new Promise<Blob>((res) =>
        thumbCanvas.toBlob((b) => res(b!), "image/jpeg", 0.7),
      );
      const thumbBytes = new Uint8Array(await thumbBlob.arrayBuffer());
      const externalBlob = ExternalBlob.fromBytes(thumbBytes);
      await externalBlob.getBytes(); // triggers upload
      const thumbUrl = externalBlob.getDirectURL();

      const entry: LocalHandwritingAnalysis = {
        id: `hw_${Date.now()}`,
        imageData: thumbUrl,
        ...analysis,
        analyzedAt: Date.now(),
      };

      const updated = [entry, ...analyses].slice(0, 50);
      saveHandwritingAnalyses(userId, updated);
      setAnalyses(updated);
      setResult(analysis);
      toast.success("Handwriting analyzed!");
    } catch {
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearHistory = () => {
    saveHandwritingAnalyses(userId, []);
    setAnalyses([]);
    toast.success("History cleared");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <PenLine className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Handwriting Analyzer</h1>
          <p className="text-xs text-muted-foreground">
            Upload your handwriting to get a score and improvement tips
          </p>
        </div>
      </div>

      <Tabs defaultValue="analyze">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="analyze" data-ocid="handwriting.analyze.tab">
            Analyze
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="handwriting.history.tab">
            History
          </TabsTrigger>
          <TabsTrigger value="guide" data-ocid="handwriting.guide.tab">
            Guide
          </TabsTrigger>
        </TabsList>

        {/* ── Analyze Tab ── */}
        <TabsContent value="analyze" className="space-y-4 mt-4">
          {/* Upload area */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Dropzone */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: dropzone is complemented by a keyboard-accessible button */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                data-ocid="handwriting.dropzone"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Uploaded handwriting"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">
                      Drop image here or tap to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP supported
                    </p>
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  data-ocid="handwriting.upload_button"
                >
                  <Upload className="w-4 h-4" />
                  Gallery
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                  data-ocid="handwriting.camera.button"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!imagePreview || analyzing}
                  onClick={handleAnalyze}
                  data-ocid="handwriting.analyze.primary_button"
                >
                  {analyzing ? (
                    <>
                      <Zap className="w-4 h-4 animate-pulse" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Analysis Result</CardTitle>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${gradeBadgeVariant(result.grade)}`}
                  >
                    {result.grade}
                  </span>
                </div>
                <p className="text-3xl font-black text-primary">
                  {result.totalScore}
                  <span className="text-lg font-semibold text-muted-foreground">
                    /100
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="space-y-3"
                  data-ocid="handwriting.scores.section"
                >
                  <ScoreBar
                    label="Neatness"
                    score={result.neatnessScore}
                    delay={0}
                  />
                  <ScoreBar
                    label="Letter Consistency"
                    score={result.consistencyScore}
                    delay={100}
                  />
                  <ScoreBar
                    label="Word Spacing"
                    score={result.spacingScore}
                    delay={200}
                  />
                  <ScoreBar
                    label="Alignment"
                    score={result.alignmentScore}
                    delay={300}
                  />
                </div>

                {result.tips.length > 0 && (
                  <div className="bg-card rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                      Improvement Tips
                    </p>
                    {result.tips.map((tip) => (
                      <p
                        key={tip}
                        className="text-xs text-muted-foreground leading-relaxed"
                      >
                        • {tip}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!imagePreview && !result && (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="handwriting.analyze.empty_state"
            >
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                Upload a handwriting image to get started
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {analyses.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="handwriting.history.empty_state"
            >
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No analyses yet</p>
              <p className="text-xs mt-1">
                Analyze your handwriting to build your history
              </p>
            </div>
          ) : (
            <>
              <ScoreLineChart analyses={analyses} />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {analyses.length} analysis{analyses.length !== 1 ? "es" : ""}{" "}
                  saved
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={handleClearHistory}
                  data-ocid="handwriting.history.delete_button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </Button>
              </div>
              <div className="space-y-3" data-ocid="handwriting.history.list">
                {analyses.slice(0, 20).map((a, idx) => (
                  <Card
                    key={a.id}
                    data-ocid={`handwriting.history.item.${idx + 1}`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <img
                        src={a.imageData}
                        alt="Handwriting"
                        className="w-16 h-12 object-cover rounded-md flex-shrink-0 bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-primary text-sm">
                            {a.totalScore}/100
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${gradeBadgeVariant(a.grade)}`}
                          >
                            {a.grade}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(a.analyzedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {(
                            [
                              ["N", a.neatnessScore],
                              ["C", a.consistencyScore],
                              ["S", a.spacingScore],
                              ["A", a.alignmentScore],
                            ] as [string, number][]
                          ).map(([label, score]) => (
                            <span
                              key={label}
                              className={`text-[9px] font-bold ${scoreColor(score)}`}
                            >
                              {label}:{score}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Guide Tab ── */}
        <TabsContent value="guide" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                This analyzer uses computer vision to score four key dimensions
                of your handwriting. Each dimension is scored out of 25, giving
                a total of 100. Upload a clear, well-lit photo of your
                handwriting for best results.
              </p>
              <GuideSection />
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Daily Practice Tips
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>
                  • Write one page daily — consistency matters more than
                  duration
                </li>
                <li>• Use a 4-line notebook for structured practice</li>
                <li>
                  • Warm up with cursive loops and ovals before writing
                  sentences
                </li>
                <li>• Photograph your writing weekly to track improvement</li>
                <li>
                  • Slow down — speed comes naturally after neatness is mastered
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
