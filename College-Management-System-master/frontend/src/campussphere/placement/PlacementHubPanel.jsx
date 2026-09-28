import React, { useEffect, useState, useCallback, useRef } from "react";
import Heading from "../../components/Heading";
import CustomButton from "../../components/CustomButton";
import toast from "react-hot-toast";
import {
  fetchPlacementCompanies,
  fetchPlacementQuestions,
  submitPlacementQuiz,
  fetchMyPlacementAttempts,
} from "../api";
import "../../styles/sections/section-placement-hub.css";

const SECTIONS = [
  { id: "aptitude", label: "Aptitude" },
  { id: "technical", label: "Technical interview" },
  { id: "hr", label: "HR interview" },
];

const DEFAULT_MINUTES = 10;

const PlacementHubPanel = () => {
  const [companies, setCompanies] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [view, setView] = useState("dashboard"); // dashboard | quiz | result
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [section, setSection] = useState("aptitude");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resultPayload, setResultPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const submitRef = useRef(async () => {});
  const [quizKey, setQuizKey] = useState(0);

  const loadCompanies = useCallback(async () => {
    try {
      const { data } = await fetchPlacementCompanies();
      if (data.success) setCompanies(data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load companies");
    }
  }, []);

  const loadAttempts = useCallback(async () => {
    try {
      const { data } = await fetchMyPlacementAttempts();
      if (data.success) setAttempts(data.data || []);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadAttempts();
  }, [loadCompanies, loadAttempts]);

  const startQuiz = async (company, sec) => {
    setLoading(true);
    try {
      const { data } = await fetchPlacementQuestions(company.id, sec, 10);
      if (!data.success || !data.data?.questions?.length) {
        toast.error("No questions for this section yet");
        return;
      }
      setSelectedCompany(company);
      setSection(sec);
      setQuestions(data.data.questions);
      setAnswers({});
      setResultPayload(null);
      setSecondsLeft(DEFAULT_MINUTES * 60);
      setQuizKey((k) => k + 1);
      setView("quiz");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async (fromTimer = false) => {
    if (!selectedCompany) return;
    const elapsed = DEFAULT_MINUTES * 60 - secondsLeft;
    const payload = {
      section,
      durationSeconds: Math.max(0, elapsed),
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1,
      })),
    };
    setLoading(true);
    try {
      const { data } = await submitPlacementQuiz(selectedCompany.id, payload);
      if (data.success) {
        setResultPayload(data.data);
        setView("result");
        if (fromTimer) toast("Time is up — quiz submitted", { icon: "⏱" });
        loadAttempts();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  submitRef.current = handleSubmitQuiz;

  useEffect(() => {
    if (view !== "quiz") return undefined;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          submitRef.current(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view, quizKey]);

  if (view === "quiz") {
    return (
      <div className="section-placement-hub w-full max-w-3xl mx-auto py-4 px-2">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedCompany?.name} — {SECTIONS.find((s) => s.id === section)?.label}
          </h2>
          <div
            className={`text-lg font-mono font-bold ${
              secondsLeft < 60 ? "text-red-600" : "text-blue-600"
            }`}
          >
            {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </div>
        </div>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                {idx + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 text-sm cursor-pointer text-gray-800 dark:text-gray-200"
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === i}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <CustomButton onClick={() => handleSubmitQuiz(false)} disabled={loading}>
            Submit quiz
          </CustomButton>
          <CustomButton
            variant="secondary"
            onClick={() => {
              setView("dashboard");
              setQuestions([]);
            }}
          >
            Cancel
          </CustomButton>
        </div>
      </div>
    );
  }

  if (view === "result" && resultPayload) {
    const pct = resultPayload.percentage ?? 0;
    return (
      <div className="section-placement-hub w-full max-w-3xl mx-auto py-4 px-2">
        <Heading title="Quiz result" />
        <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Score: {resultPayload.score} / {resultPayload.total} ({pct}%)
          </p>
          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 mb-6">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Review answers
          </h3>
          <ul className="space-y-3 text-sm">
            {resultPayload.results?.map((r, i) => (
              <li
                key={i}
                className={`rounded-lg p-3 border ${
                  r.isCorrect
                    ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                    : "border-red-200 bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <p className="font-medium">{r.question}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Your answer: {r.options[r.selectedIndex] ?? "—"} | Correct:{" "}
                  {r.options[r.correctIndex]}
                </p>
              </li>
            ))}
          </ul>
          <CustomButton className="mt-4" onClick={() => setView("dashboard")}>
            Back to companies
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="section-placement-hub w-full py-4 px-2">
      <Heading title="Placement preparation hub" />
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-6">
        Company-wise practice: aptitude, technical, and HR MCQs with a timer. Admins can add
        companies and questions from the admin dashboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {companies.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.name}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              Aptitude: {c.aptitude_count} · Technical: {c.technical_count} · HR: {c.hr_count}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {SECTIONS.map((s) => (
                <CustomButton
                  key={s.id}
                  variant="secondary"
                  className="text-sm py-1"
                  disabled={loading}
                  onClick={() => startQuiz(c, s.id)}
                >
                  Start {s.label} ({DEFAULT_MINUTES} min)
                </CustomButton>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
        Your recent attempts
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left p-2">Company</th>
              <th className="text-left p-2">Section</th>
              <th className="text-left p-2">Score</th>
              <th className="text-left p-2">When</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-gray-500">
                  No attempts yet.
                </td>
              </tr>
            ) : (
              attempts.map((a) => (
                <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2">{a.company_name}</td>
                  <td className="p-2 capitalize">{a.section}</td>
                  <td className="p-2">
                    {a.score}/{a.total}
                  </td>
                  <td className="p-2">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlacementHubPanel;
