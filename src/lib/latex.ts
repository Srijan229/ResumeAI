import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile, copyFile } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const maxLatexBytes = 350_000;

export type CompileResult = {
  success: boolean;
  pdfPath: string;
  log: string;
  pageCount: number;
  warnings: string[];
};

export async function compileLatexToPdf(userId: string, latex: string): Promise<CompileResult> {
  if (Buffer.byteLength(latex, "utf8") > maxLatexBytes) {
    return {
      success: false,
      pdfPath: "",
      log: "LaTeX input exceeds the local compile size limit.",
      pageCount: 0,
      warnings: ["LaTeX input exceeds 350 KB."],
    };
  }

  const id = randomUUID();
  const tempDir = path.join(process.cwd(), ".tmp", "latex", id);
  const outputDir = path.join(process.cwd(), "public", "generated", userId);
  const outputFile = `${id}.pdf`;
  const outputPath = path.join(outputDir, outputFile);

  await mkdir(tempDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(tempDir, "resume.tex"), latex, "utf8");

  try {
    const { stdout, stderr } = await execFileAsync(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        `${tempDir}:/work`,
        "-w",
        "/work",
        "texlive/texlive",
        "latexmk",
        "-pdf",
        "-interaction=nonstopmode",
        "-halt-on-error",
        "resume.tex",
      ],
      { timeout: 60_000, maxBuffer: 2_000_000 },
    );

    const pdfBuffer = await readFile(path.join(tempDir, "resume.pdf"));
    await copyFile(path.join(tempDir, "resume.pdf"), outputPath);
    const pageCount = countPdfPages(pdfBuffer);

    return {
      success: true,
      pdfPath: `/generated/${userId}/${outputFile}`,
      log: `${stdout}\n${stderr}`.trim(),
      pageCount,
      warnings: pageCount > 1 ? ["Compiled PDF is more than one page."] : [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LaTeX compile error";
    return {
      success: false,
      pdfPath: "",
      log: message,
      pageCount: 0,
      warnings: ["LaTeX compile failed. Review the log and editable block changes."],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function countPdfPages(pdf: Buffer) {
  const text = pdf.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return Math.max(matches?.length ?? 1, 1);
}
