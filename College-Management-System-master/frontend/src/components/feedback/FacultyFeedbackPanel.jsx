import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-feedback-faculty.css";

const FacultyFeedbackPanel = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("rating");
  const [questions, setQuestions] = useState([]);
  const [targetSemesters, setTargetSemesters] = useState([]);
  const [forms, setForms] = useState([]);
  const [analytics, setAnalytics] = useState({
    averageRating: 0,
    totalResponses: 0,
    responsesByForm: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("userToken")}` }),
    []
  );

  const fetchData = async () => {
    try {
      const [formsRes, analyticsRes] = await Promise.all([
        axiosWrapper.get("/feedback/forms", { headers: tokenHeader }),
        axiosWrapper.get("/feedback/analytics", { headers: tokenHeader }),
      ]);
      setForms(formsRes?.data?.data || []);
      setAnalytics(
        analyticsRes?.data?.data || {
          averageRating: 0,
          totalResponses: 0,
          responsesByForm: [],
        }
      );
    } catch (error) {
      toast.error("Failed to load feedback data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addQuestion = () => {
    const text = questionText.trim();
    if (!text) return;
    setQuestions((prev) => [...prev, { text, type: questionType }]);
    setQuestionText("");
    setQuestionType("rating");
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleSemester = (semester) => {
    setTargetSemesters((prev) =>
      prev.includes(semester)
        ? prev.filter((item) => item !== semester)
        : [...prev, semester]
    );
  };

  const createForm = async () => {
    if (!title.trim() || questions.length === 0) {
      toast.error("Form title and questions are required");
      return;
    }
    try {
      setIsSubmitting(true);
      await axiosWrapper.post(
        "/feedback/create",
        { title, description, questions, targetSemesters },
        { headers: tokenHeader }
      );
      setTitle("");
      setDescription("");
      setQuestions([]);
      setTargetSemesters([]);
      toast.success("Feedback form created");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-feedback-faculty space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm dark:border-slate-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 dark:text-slate-100">
          Create Feedback Form
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Form title"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
          />
        </div>

        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 dark:text-slate-300">
            Target Semesters (leave empty for all)
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => {
              const selected = targetSemesters.includes(semester);
              return (
                <button
                  key={`sem-${semester}`}
                  type="button"
                  onClick={() => toggleSemester(semester)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Sem {semester}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Add question"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
          />
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
          >
            <option value="rating">Rating (1-5)</option>
            <option value="text">Text</option>
          </select>
          <button
            onClick={addQuestion}
            className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>

        {questions.length > 0 && (
          <div className="mt-3 space-y-2">
            {questions.map((q, idx) => (
              <div
                key={`q-${idx}`}
                className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-800 px-3 py-2 dark:bg-slate-900/50"
              >
                <p className="text-sm text-gray-700 dark:text-gray-200 dark:text-slate-300">
                  {q.text} ({q.type})
                </p>
                <button
                  onClick={() => removeQuestion(idx)}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={createForm}
          disabled={isSubmitting}
          className="mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Form"}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm dark:border-slate-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 dark:text-slate-100">Analytics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">Average Rating</p>
            <p className="text-xl font-bold text-blue-800">
              {analytics.averageRating}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs text-green-700">Total Responses</p>
            <p className="text-xl font-bold text-green-800">
              {analytics.totalResponses}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-3 col-span-2 sm:col-span-1">
            <p className="text-xs text-purple-700">Forms Created</p>
            <p className="text-xl font-bold text-purple-800">{forms.length}</p>
          </div>
        </div>

        <div className="space-y-2">
          {(analytics.responsesByForm || []).map((item) => {
            const width = Math.min(100, item.responses * 10);
            return (
              <div key={item.formId} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 dark:text-slate-400">
                  <span>{item.title}</span>
                  <span>{item.responses} responses</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden dark:bg-slate-900/40">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FacultyFeedbackPanel;
