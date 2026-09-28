const PlacementCompany = require("../models/placement-company.model");
const PlacementQuestion = require("../models/placement-question.model");

const SEED = [
  {
    name: "TCS",
    slug: "tcs",
    description: "Tata Consultancy Services — aptitude, technical & HR prep.",
    questions: [
      {
        section: "aptitude",
        questionText:
          "A train 120 m long crosses a pole in 8 seconds. What is its speed in km/h?",
        options: ["36 km/h", "54 km/h", "72 km/h", "45 km/h"],
        correctIndex: 1,
      },
      {
        section: "aptitude",
        questionText: "If 20% of a number is 50, what is the number?",
        options: ["200", "250", "300", "350"],
        correctIndex: 1,
      },
      {
        section: "technical",
        questionText: "In C++, which is used to achieve runtime polymorphism?",
        options: ["Templates", "Virtual functions", "Operator overloading", "Namespaces"],
        correctIndex: 1,
      },
      {
        section: "technical",
        questionText: "What does ACID stand for in databases?",
        options: [
          "Atomicity, Consistency, Isolation, Durability",
          "Access, Control, Index, Data",
          "Array, Class, Interface, Delegate",
          "None",
        ],
        correctIndex: 0,
      },
      {
        section: "hr",
        questionText: "Why do you want to join TCS?",
        options: [
          "Higher salary only",
          "Brand, learning opportunities & alignment with career goals",
          "No reason",
          "Because my friend joined",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    name: "Infosys",
    slug: "infosys",
    description: "Infosys placement pattern and interview focus.",
    questions: [
      {
        section: "aptitude",
        questionText:
          "The ratio of ages of A and B is 3:5. After 10 years it becomes 5:8. Find A's present age.",
        options: ["6", "9", "12", "15"],
        correctIndex: 1,
      },
      {
        section: "technical",
        questionText: "Which SQL clause filters rows before grouping?",
        options: ["HAVING", "WHERE", "ORDER BY", "GROUP BY"],
        correctIndex: 1,
      },
      {
        section: "hr",
        questionText: "How do you handle tight deadlines?",
        options: [
          "Ignore quality",
          "Prioritize, communicate early, break work into milestones",
          "Work randomly",
          "Blame the team",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    name: "Wipro",
    slug: "wipro",
    description: "Wipro recruitment and assessment overview.",
    questions: [
      {
        section: "aptitude",
        questionText:
          "A shopkeeper marks goods 40% above cost and gives 20% discount. Profit %?",
        options: ["8%", "10%", "12%", "15%"],
        correctIndex: 2,
      },
      {
        section: "technical",
        questionText: 'HTTP status code for "Not Found"?',
        options: ["200", "301", "404", "500"],
        correctIndex: 2,
      },
      {
        section: "hr",
        questionText: "Describe a time you worked in a team.",
        options: [
          "I avoid teams",
          "I explain situation, my role, actions, and outcome (STAR)",
          "I only lead",
          "Never worked in team",
        ],
        correctIndex: 1,
      },
    ],
  },
];

async function ensurePlacementSeed() {
  const count = await PlacementCompany.countDocuments();
  if (count > 0) return;

  for (const pack of SEED) {
    const { questions, ...companyFields } = pack;
    const company = await PlacementCompany.create(companyFields);
    await PlacementQuestion.insertMany(
      questions.map((q) => ({
        companyId: company._id,
        section: q.section,
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
      }))
    );
  }
}

module.exports = { ensurePlacementSeed };
