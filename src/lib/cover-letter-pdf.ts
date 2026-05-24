export type CoverLetterContact = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  github?: string | null;
};

export function coverLetterToLatex(
  content: string,
  title = "Cover Letter",
  contact: CoverLetterContact = {},
) {
  return String.raw`\documentclass[11pt]{article}
\usepackage[margin=0.8in]{geometry}
\usepackage{xcolor}
\usepackage{parskip}
\usepackage{charter}
\usepackage{hyperref}
\pagestyle{empty}
\definecolor{bordergray}{HTML}{D4D4D4}
\definecolor{textgray}{HTML}{262626}
\definecolor{linkblue}{HTML}{1D4ED8}
\hypersetup{colorlinks=true,urlcolor=linkblue}
\begin{document}
\color{textgray}
\setlength{\fboxsep}{18pt}
\setlength{\fboxrule}{0.7pt}
\noindent\fcolorbox{bordergray}{white}{%
\begin{minipage}{0.91\linewidth}
{\Large\bfseries ${escapeLatex(title)}}\\[6pt]
\rule{\linewidth}{0.4pt}\\[12pt]
${paragraphsToLatex(content)}

\vspace{1.1em}
\rule{\linewidth}{0.4pt}\\[8pt]
${contactBlockToLatex(contact)}
\end{minipage}}
\end{document}
`;
}

export function extractContactFromLatex(latex: string): CoverLetterContact {
  const firstCenter = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/)?.[1] ?? latex.slice(0, 1500);
  const hrefs = [...firstCenter.matchAll(/\\href\{([^}]+)\}\{(?:\\textcolor\{[^}]+\}\{)?([^{}]+)(?:\})?\}/g)];

  return {
    name: firstCenter.match(/\\textbf\{\\LARGE\s+([^}]+)\}/)?.[1]?.trim(),
    phone: firstCenter.match(/(\+?\d[\d\s().-]{8,}\d)/)?.[1]?.trim(),
    email: firstCenter.match(/mailto:([^}]+)}/)?.[1]?.trim(),
    github: hrefs.find((match) => /github/i.test(match[1] + match[2]))?.[1],
    portfolio: hrefs.find((match) => /portfolio|vercel/i.test(match[1] + match[2]))?.[1],
    linkedin: hrefs.find((match) => /linkedin/i.test(match[1] + match[2]))?.[1],
  };
}

function paragraphsToLatex(content: string) {
  return content
    .trim()
    .split(/\n\s*\n/g)
    .map((paragraph) => escapeLatex(paragraph.replace(/\s*\n\s*/g, " ")))
    .join("\n\n\\vspace{0.7em}\n\n");
}

function contactBlockToLatex(contact: CoverLetterContact) {
  const name = contact.name ? escapeLatex(contact.name) : "Applicant";
  const details = [
    contact.phone ? escapeLatex(contact.phone) : null,
    contact.email ? `\\href{mailto:${escapeHref(contact.email)}}{${escapeLatex(contact.email)}}` : null,
    contact.linkedin ? `\\href{${escapeHref(contact.linkedin)}}{LinkedIn}` : null,
    contact.github ? `\\href{${escapeHref(contact.github)}}{GitHub}` : null,
    contact.portfolio ? `\\href{${escapeHref(contact.portfolio)}}{Portfolio}` : null,
  ].filter(Boolean);

  return String.raw`{\bfseries ${name}}\\[-1pt]
{\small ${details.join(" $\\mid$ ")}}`;
}

function escapeLatex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function escapeHref(value: string) {
  return value.replace(/\\/g, "").replace(/[{}]/g, "");
}
