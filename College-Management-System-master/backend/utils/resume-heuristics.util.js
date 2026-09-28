const SKILL_KEYWORDS = [
  "c++",
  "c#",
  "java",
  "python",
  "javascript",
  "typescript",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "react",
  "react.js",
  "next.js",
  "nextjs",
  "node",
  "node.js",
  "express",
  "html",
  "css",
  "tailwind",
  "git",
  "github",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "dsa",
  "data structures",
  "algorithms",
  "rest",
  "restful",
  "api",
  "graphql",
  "linux",
  "spring",
  "spring boot",
  "django",
  "flask",
  "fastapi",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "pandas",
  "numpy",
  "selenium",
  "cypress",
  "jest",
  "junit",
  "agile",
  "scrum",
  "figma",
  "redux",
  "vue",
  "angular",
  "bootstrap",
  "firebase",
  "redis",
  "kafka",
  "microservices",
  "ci/cd",
  "jenkins",
  "terraform",
  "ansible",
  "devops",
  "tableau",
  "power bi",
  "excel",
  "r language",
  "matlab",
  "opencv",
  "nlp",
  "computer vision",
];

const SECTION_HEADERS =
  /^(skills|technical skills|core competencies|technologies|tech stack|projects|academic projects|personal projects|key projects|project experience|experience|work experience|professional experience|internship|internships|education|certifications|achievements|summary|profile|objective)\s*:?\s*$/i;

const NEXT_SECTION =
  /^(skills|technical|projects|experience|work experience|education|certifications|achievements|summary|references|contact|hobbies)\b/i;

const normalizeText = (text) =>
  String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u2022/g, "•")
    .replace(/\t/g, " ");

const toStringList = (items, max = 25) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const out = [];

  for (const item of items) {
    let value = "";
    if (typeof item === "string") value = item.trim();
    else if (item && typeof item === "object") {
      value = [
        item.name,
        item.title,
        item.project,
        item.role,
        item.description,
        item.summary,
        Array.isArray(item.technologies)
          ? item.technologies.join(", ")
          : item.tech,
      ]
        .filter(Boolean)
        .join(" — ")
        .trim();
    } else if (item != null) value = String(item).trim();

    if (value.length < 2) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
};

const mergeLists = (...lists) => {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of toStringList(list, 50)) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
};

const extractSectionLines = (text, headerPatterns) => {
  const lines = normalizeText(text).split("\n");
  const patterns = Array.isArray(headerPatterns)
    ? headerPatterns
    : [headerPatterns];

  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (patterns.some((p) => p.test(line))) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return [];

  const sectionLines = [];
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (SECTION_HEADERS.test(line) || NEXT_SECTION.test(line)) break;
    sectionLines.push(line);
  }
  return sectionLines;
};

const linesToBullets = (lines) => {
  const bullets = [];
  let buffer = "";

  const flush = () => {
    const value = buffer.replace(/\s+/g, " ").trim();
    if (value.length >= 8) bullets.push(value);
    buffer = "";
  };

  const looksLikeNewItem = (line) =>
    /^[A-Z0-9]/.test(line) &&
    (line.length < 80 || /[-–—:|]/.test(line)) &&
    !/^and\b/i.test(line);

  for (const raw of lines) {
    const line = raw.trim();
    const isBullet = /^([•\-*–—]|\d+[.)])\s+/.test(line);

    if (isBullet) {
      flush();
      buffer = line.replace(/^([•\-*–—]|\d+[.)])\s+/, "");
    } else if (buffer && looksLikeNewItem(line)) {
      flush();
      buffer = line;
    } else if (buffer) {
      buffer += ` ${line}`;
    } else {
      buffer = line;
    }
  }
  flush();
  return bullets;
};

const extractProjectsFromText = (text) => {
  const sectionLines = extractSectionLines(text, [
    /^projects?\b/i,
    /^academic projects?\b/i,
    /^personal projects?\b/i,
    /^key projects?\b/i,
    /^project experience\b/i,
  ]);

  let projects = linesToBullets(sectionLines);

  if (projects.length === 0) {
    const lines = normalizeText(text).split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (/^project\s*[:–-]/i.test(line) || /^project title\s*[:–-]/i.test(line)) {
        const chunk = line.replace(/^project(\s*title)?\s*[:–-]\s*/i, "");
        if (chunk.length >= 6) projects.push(chunk);
        let j = i + 1;
        while (j < lines.length && lines[j].trim() && !SECTION_HEADERS.test(lines[j])) {
          const next = lines[j].trim();
          if (/^([•\-*]|\d+[.)])/.test(next)) {
            projects.push(next.replace(/^([•\-*–—]|\d+[.)])\s+/, ""));
          }
          j += 1;
        }
      }
    }
  }

  return projects.filter((p) => p.length >= 10 && p.length <= 500).slice(0, 15);
};

const extractSkillsFromText = (text) => {
  const norm = normalizeText(text).toLowerCase();
  const fromKeywords = SKILL_KEYWORDS.filter((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(norm);
  });

  const sectionLines = extractSectionLines(text, [
    /^skills?\b/i,
    /^technical skills?\b/i,
    /^core competencies\b/i,
    /^technologies\b/i,
    /^tech stack\b/i,
  ]);

  const fromSection = [];
  for (const line of sectionLines) {
    const parts = line
      .split(/[,|;/•]/)
      .map((p) => p.replace(/^([•\-*–—]|\d+[.)])\s*/, "").trim())
      .filter((p) => p.length >= 2 && p.length <= 40);
    fromSection.push(...parts);
  }

  return mergeLists(
    fromKeywords.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())),
    fromSection
  ).slice(0, 40);
};

const extractExperienceFromText = (text) => {
  const sectionLines = extractSectionLines(text, [
    /^experience\b/i,
    /^work experience\b/i,
    /^professional experience\b/i,
    /^internships?\b/i,
  ]);
  return linesToBullets(sectionLines).slice(0, 12);
};

const extractEducationFromText = (text) => {
  const sectionLines = extractSectionLines(text, [/^education\b/i]);
  return linesToBullets(sectionLines).slice(0, 8);
};

const extractCertificationsFromText = (text) => {
  const sectionLines = extractSectionLines(text, [
    /^certifications?\b/i,
    /^licenses?\b/i,
  ]);
  return linesToBullets(sectionLines).slice(0, 10);
};

const extractNameFromText = (text) => {
  const lines = normalizeText(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < Math.min(6, lines.length); i += 1) {
    const line = lines[i];
    if (line.length < 3 || line.length > 50) continue;
    if (/@|https?:|linkedin|github|phone|\d{10}/i.test(line)) continue;
    if (SECTION_HEADERS.test(line) || /^(resume|curriculum vitae|cv)\b/i.test(line))
      continue;
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(line)) return line;
    if (/^[A-Z][A-Z\s]{2,40}$/.test(line) && line.split(" ").length <= 4)
      return line
        .split(" ")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");
  }
  return "";
};

const heuristicParseResume = (rawText) => {
  const text = normalizeText(rawText);
  const skills = extractSkillsFromText(text);
  const technologies = skills.filter((s) =>
    /react|node|java|python|sql|aws|docker|angular|vue|spring|django|flask|mongodb|typescript|javascript|c\+\+|\.net|kubernetes|tensorflow|pytorch/i.test(
      s
    )
  );

  return {
    name: extractNameFromText(text),
    skills,
    technologies: technologies.length ? technologies : skills.slice(0, 20),
    projects: extractProjectsFromText(text),
    experience: extractExperienceFromText(text),
    education: extractEducationFromText(text),
    certifications: extractCertificationsFromText(text),
  };
};

const mergeParsedResume = (aiParsed, heuristicParsed) => ({
  name: String(aiParsed?.name || heuristicParsed.name || "").trim(),
  skills: mergeLists(aiParsed?.skills, heuristicParsed.skills).slice(0, 40),
  technologies: mergeLists(
    aiParsed?.technologies,
    heuristicParsed.technologies,
    heuristicParsed.skills
  ).slice(0, 30),
  projects: mergeLists(aiParsed?.projects, heuristicParsed.projects).slice(0, 15),
  experience: mergeLists(aiParsed?.experience, heuristicParsed.experience).slice(
    0,
    12
  ),
  education: mergeLists(aiParsed?.education, heuristicParsed.education).slice(
    0,
    8
  ),
  certifications: mergeLists(
    aiParsed?.certifications,
    heuristicParsed.certifications
  ).slice(0, 10),
});

module.exports = {
  heuristicParseResume,
  mergeParsedResume,
  toStringList,
  SKILL_KEYWORDS,
};
