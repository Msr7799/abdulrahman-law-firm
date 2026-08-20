import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type PdfCompressionReport = {
  name: string;
  originalBytes: number;
  finalBytes: number;
  dpi: number;
  compressed: boolean;
  reductionPercent: number;
  reason?: "small" | "signed" | "engine-unavailable" | "not-smaller";
};

type CompressOptions = {
  name: string;
  dpi: number;
  thresholdBytes: number;
  signal?: AbortSignal;
};

type CompressResult = {
  bytes: Uint8Array;
  report: PdfCompressionReport;
};

let ghostscriptCommandPromise: Promise<string | null> | null = null;

function clampDpi(value: number) {
  const allowed = [72, 96, 100, 120, 130, 150, 170, 200];
  return allowed.reduce((best, candidate) => Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best, 150);
}

async function canRun(command: string) {
  try {
    await execFileAsync(command, ["--version"], { timeout: 4_000, windowsHide: true, maxBuffer: 256 * 1024 });
    return true;
  } catch {
    return false;
  }
}

async function resolveGhostscriptCommand() {
  if (ghostscriptCommandPromise) return ghostscriptCommandPromise;
  ghostscriptCommandPromise = (async () => {
    const configured = process.env.PDF_GHOSTSCRIPT_PATH?.trim();
    const candidates = configured
      ? [configured]
      : process.platform === "win32"
        ? ["gswin64c.exe", "gswin32c.exe", "gs.exe"]
        : ["gs", "ghostscript"];

    for (const candidate of candidates) if (await canRun(candidate)) return candidate;
    return null;
  })();
  return ghostscriptCommandPromise;
}

function likelyDigitallySigned(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return buffer.indexOf(Buffer.from("/ByteRange")) >= 0 && (buffer.indexOf(Buffer.from("/Type /Sig")) >= 0 || buffer.indexOf(Buffer.from("/SubFilter")) >= 0);
}

function reductionPercent(before: number, after: number) {
  if (!before || after >= before) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - after / before) * 10_000) / 100));
}

export async function compressPdfForAi(input: Uint8Array, options: CompressOptions): Promise<CompressResult> {
  const dpi = clampDpi(options.dpi);
  const originalBytes = input.byteLength;
  const baseReport = { name: options.name, originalBytes, finalBytes: originalBytes, dpi, compressed: false, reductionPercent: 0 } satisfies PdfCompressionReport;

  if (originalBytes <= options.thresholdBytes) return { bytes: input, report: { ...baseReport, reason: "small" } };
  if (likelyDigitallySigned(input)) return { bytes: input, report: { ...baseReport, reason: "signed" } };

  const command = await resolveGhostscriptCommand();
  if (!command) return { bytes: input, report: { ...baseReport, reason: "engine-unavailable" } };
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const workDir = await mkdtemp(path.join(tmpdir(), "law-pdf-"));
  const inputPath = path.join(workDir, "input.pdf");
  const outputPath = path.join(workDir, "compressed.pdf");

  try {
    await writeFile(inputPath, input);
    const args = [
      "-q",
      "-dNOPAUSE",
      "-dBATCH",
      "-dSAFER",
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.7",
      "-dDetectDuplicateImages=true",
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-dDownsampleColorImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      `-dColorImageResolution=${dpi}`,
      "-dAutoFilterColorImages=false",
      "-dColorImageFilter=/DCTEncode",
      "-dDownsampleGrayImages=true",
      "-dGrayImageDownsampleType=/Bicubic",
      `-dGrayImageResolution=${dpi}`,
      "-dAutoFilterGrayImages=false",
      "-dGrayImageFilter=/DCTEncode",
      "-dDownsampleMonoImages=true",
      "-dMonoImageDownsampleType=/Bicubic",
      `-dMonoImageResolution=${Math.max(200, dpi)}`,
      "-dJPEGQ=82",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    await execFileAsync(command, args, { timeout: 75_000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const output = await readFile(outputPath);
    const finalBytes = output.byteLength;
    const saved = reductionPercent(originalBytes, finalBytes);
    if (finalBytes >= originalBytes * 0.98) {
      return { bytes: input, report: { ...baseReport, finalBytes: originalBytes, reason: "not-smaller" } };
    }

    return {
      bytes: output,
      report: { name: options.name, originalBytes, finalBytes, dpi, compressed: true, reductionPercent: saved },
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
