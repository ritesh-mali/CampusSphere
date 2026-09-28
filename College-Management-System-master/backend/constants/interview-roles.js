const INTERVIEW_ROLES = [
  { id: "frontend", label: "Frontend Developer", category: "engineering" },
  { id: "backend", label: "Backend Developer", category: "engineering" },
  { id: "fullstack", label: "Full Stack Developer", category: "engineering" },
  { id: "qa-manual", label: "QA / Manual Testing", category: "qa" },
  { id: "automation-testing", label: "Automation Testing", category: "qa" },
  { id: "data-analyst", label: "Data Analyst", category: "data" },
  { id: "ai-ml", label: "AI / ML", category: "data" },
  { id: "devops", label: "DevOps", category: "engineering" },
  { id: "java", label: "Java Developer", category: "engineering" },
  { id: "cpp", label: "C++ Developer", category: "engineering" },
  { id: "react", label: "React Developer", category: "engineering" },
  { id: "nodejs", label: "Node.js Developer", category: "engineering" },
  { id: "hr-general", label: "General HR Interview", category: "hr" },
];

const EXPERIENCE_LEVELS = ["fresher", "junior", "mid", "senior"];

const QUESTION_TYPES = [
  "technical",
  "hr",
  "project",
  "problem-solving",
  "behavioral",
  "scenario",
];

module.exports = {
  INTERVIEW_ROLES,
  EXPERIENCE_LEVELS,
  QUESTION_TYPES,
};
