export type MarkerBlock = {
  name: string;
  startMarker: string;
  endMarker: string;
  content: string;
};

const markerPattern = /^[ \t]*%[ \t]*===[ \t]*([A-Z0-9_]+)_(START|END)[ \t]*===[ \t]*$/gm;
export const defaultAllowedTailoringBlocks = ["SUMMARY", "EXPERIENCE_ETON"];

type IndexedMarkerBlock = MarkerBlock & {
  startIndex: number;
  startEndIndex: number;
  endIndex: number;
  endEndIndex: number;
};

export function extractMarkerBlocks(latex: string): MarkerBlock[] {
  return extractIndexedMarkerBlocks(latex).map(({ name, startMarker, endMarker, content }) => ({
    name,
    startMarker,
    endMarker,
    content,
  }));
}

function extractIndexedMarkerBlocks(latex: string): IndexedMarkerBlock[] {
  const markers = [...latex.matchAll(markerPattern)].map((match) => ({
    full: match[0],
    name: match[1],
    type: match[2],
    index: match.index ?? 0,
  }));

  const blocks: IndexedMarkerBlock[] = [];
  const starts = new Map<string, (typeof markers)[number]>();

  for (const marker of markers) {
    if (marker.type === "START") {
      starts.set(marker.name, marker);
      continue;
    }

    const start = starts.get(marker.name);
    if (!start || marker.index <= start.index) {
      continue;
    }

    const contentStart = start.index + start.full.length;
    const contentEnd = marker.index;
    blocks.push({
      name: marker.name,
      startMarker: start.full,
      endMarker: marker.full,
      content: latex.slice(contentStart, contentEnd),
      startIndex: start.index,
      startEndIndex: contentStart,
      endIndex: marker.index,
      endEndIndex: marker.index + marker.full.length,
    });
  }

  return blocks;
}

export function applyMarkerBlockUpdates(latex: string, updates: Record<string, string>) {
  let nextLatex = latex;

  for (const [name, content] of Object.entries(updates)) {
    const blockRegex = new RegExp(
      `([ \\t]*%[ \\t]*===[ \\t]*${escapeRegExp(name)}_START[ \\t]*===[ \\t]*\\r?\\n?)([\\s\\S]*?)(\\r?\\n?[ \\t]*%[ \\t]*===[ \\t]*${escapeRegExp(name)}_END[ \\t]*===[ \\t]*)`,
      "m",
    );

    nextLatex = nextLatex.replace(blockRegex, (_match, start, _oldContent, end) => {
      const normalized = normalizeBlockContent(content);
      return `${start}${normalized}${end}`;
    });
  }

  return nextLatex;
}

export function validateTemplatePreserved(originalLatex: string, tailoredLatex: string) {
  const originalBlocks = extractIndexedMarkerBlocks(originalLatex);
  const tailoredBlocks = extractIndexedMarkerBlocks(tailoredLatex);
  const warnings: string[] = [];

  const originalShell = getTemplateShell(originalLatex, originalBlocks);
  const tailoredShell = getTemplateShell(tailoredLatex, tailoredBlocks);

  if (originalShell !== tailoredShell) {
    warnings.push("Content outside approved editable markers changed.");
  }

  const originalNames = originalBlocks.map((block) => block.name).sort().join(",");
  const tailoredNames = tailoredBlocks.map((block) => block.name).sort().join(",");
  if (originalNames !== tailoredNames) {
    warnings.push("Editable marker set changed.");
  }

  return { valid: warnings.length === 0, warnings };
}

export function prepareResumeLatex(latex: string) {
  if (extractMarkerBlocks(latex).length > 0) {
    return {
      latex,
      insertedMarkers: false,
      warnings: [] as string[],
    };
  }

  let nextLatex = latex;
  const warnings: string[] = [];

  nextLatex = wrapSectionBody(nextLatex, "Professional Summary", "SUMMARY");
  nextLatex = wrapSectionBody(nextLatex, "Skills \\& Certifications", "SKILLS");
  nextLatex = wrapExperienceList(nextLatex, "Eton Solutions", "EXPERIENCE_ETON");
  nextLatex = wrapExperienceList(nextLatex, "Ekathva Innovations", "EXPERIENCE_EKATHVA");
  nextLatex = wrapProjectItems(nextLatex);

  const insertedMarkers = extractMarkerBlocks(nextLatex).length > 0;
  if (!insertedMarkers) {
    warnings.push("No common resume sections were detected for automatic marker insertion.");
  }

  return { latex: nextLatex, insertedMarkers, warnings };
}

export function restrictEditableMarkers(latex: string, allowedBlocks = defaultAllowedTailoringBlocks) {
  const allowed = new Set(allowedBlocks);

  return latex.replace(markerPattern, (markerLine, blockName: string) => {
    if (allowed.has(blockName)) {
      return markerLine;
    }

    return `% ApplyPilot locked ${blockName}; not editable for tailoring`;
  });
}

function getTemplateShell(latex: string, blocks: IndexedMarkerBlock[]) {
  let cursor = 0;
  let output = "";

  for (const block of blocks) {
    output += latex.slice(cursor, block.startEndIndex);
    output += `__EDITABLE_BLOCK_${block.name}__`;
    cursor = block.endIndex;
  }

  output += latex.slice(cursor);
  return output;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBlockContent(content: string) {
  return content
    .replace(/^[ \t]*%[ \t]*===[ \t]*[A-Z0-9_]+_START[ \t]*===[ \t]*$/gm, "")
    .replace(/^[ \t]*%[ \t]*===[ \t]*[A-Z0-9_]+_END[ \t]*===[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/g, "");
}

function wrapSectionBody(latex: string, sectionName: string, markerName: string) {
  const pattern = new RegExp(
    `(\\\\sectionline\\s*\\n\\\\section\\*\\{${escapeRegExp(sectionName)}\\}\\s*\\n)([\\s\\S]*?)(?=\\n%[-\\s]*\\n|\\n\\\\sectionline\\s*\\n\\\\section\\*\\{|\\n\\\\end\\{document\\})`,
    "m",
  );

  return latex.replace(pattern, (_match, heading: string, body: string) => {
    if (body.includes(`${markerName}_START`)) return `${heading}${body}`;
    return `${heading}% === ${markerName}_START ===\n${body.trimEnd()}\n% === ${markerName}_END ===`;
  });
}

function wrapExperienceList(latex: string, companyName: string, markerName: string) {
  const pattern = new RegExp(
    `(\\\\noindent\\\\textbf\\{${escapeRegExp(companyName)}\\}[\\s\\S]*?\\n)(\\\\begin\\{itemize\\}[\\s\\S]*?\\\\end\\{itemize\\})`,
    "m",
  );

  return latex.replace(pattern, (_match, heading: string, list: string) => {
    if (list.includes(`${markerName}_START`)) return `${heading}${list}`;
    return `${heading}% === ${markerName}_START ===\n${list}\n% === ${markerName}_END ===`;
  });
}

function wrapProjectItems(latex: string) {
  const projectMarkers: Array<[RegExp, string]> = [
    [/\\item\s+\\textbf\{FixRoute AI\}[\s\S]*?(?=\n\s*\n\s*\\item\s+\\textbf\{|\n\\end\{itemize\})/m, "PROJECT_FIXROUTE"],
    [
      /\\item\s+\\textbf\{Semantic Transaction Classifier\}[\s\S]*?(?=\n\s*\n\s*\\item\s+\\textbf\{|\n\\end\{itemize\})/m,
      "PROJECT_SEMANTIC_CLASSIFIER",
    ],
    [
      /\\item\s+\\textbf\{AI-Driven Adaptive Load Orchestrator\}[\s\S]*?(?=\n\s*\n\s*\\item\s+\\textbf\{|\n\\end\{itemize\})/m,
      "PROJECT_LOAD_BALANCER",
    ],
    [/\\item\s+\\textbf\{Stock Price Prediction Model\}[\s\S]*?(?=\n\s*\n\s*\\item\s+\\textbf\{|\n\\end\{itemize\})/m, "PROJECT_STOCK_PREDICTION"],
  ];

  return projectMarkers.reduce((currentLatex, [pattern, markerName]) => {
    return currentLatex.replace(pattern, (item: string) => {
      if (item.includes(`${markerName}_START`)) return item;
      return `% === ${markerName}_START ===\n${item.trimEnd()}\n% === ${markerName}_END ===`;
    });
  }, latex);
}
