import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-feedback-student.css";

const StudentFeedbackPanel = () => {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("userToken")}` }),
    []
  );

  const fetchForms = async () => {
    try {
      const response = await axiosWrapper.get("/feedback/forms", {
        headers: tokenHeader,
      });
      setForms(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load feedback forms");
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const selectedForm = forms.find((form) => String(form._id) === selectedFormId);

  const setAnswer = (idx, payload) => {
    setAnswers((prev) => ({ ...prev, [idx]: { ...(prev[idx] || {}), ...payload } }));
  };

  const submitFeedback = async () => {
    if (!selectedForm) return;
    const payload = selectedForm.questions.map((question, idx) => {
      if (question.type === "rating") {
        return {
          questionText: question.text,
          rating: Number(answers[idx]?.rating) || 1,
        };
      }
      return {
        questionText: question.text,
        text: String(answers[idx]?.text || "").trim(),
      };
    });

    try {
      setIsSubmitting(true);
      await axiosWrapper.post(
        "/feedback/submit",
        { formId: selectedForm._id, responses: payload },
        { headers: tokenHeader }
      );
      toast.success("Feedback submitted");
      setSelectedFormId("");
      setAnswers({});
      fetchForms();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-feedback-student rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Submit Feedback</h3>

      <select
        value={selectedFormId}
        onChange={(e) => {
          setSelectedFormId(e.target.value);
          setAnswers({});
        }}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm mb-4"
      >
        <option value="">Select feedback form</option>
        {forms.map((form) => (
          <option key={form._id} value={form._id}>
            {form.title} - {form?.facultyId?.firstName || "Faculty"}{" "}
            {form?.facultyId?.lastName || ""}
          </option>
        ))}
      </select>

      {forms.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          No pending feedback forms for your branch/semester.
        </p>
      )}

      {selectedForm && (
        <div className="space-y-3">
          {selectedForm.questions.map((question, idx) => (
            <div key={`question-${idx}`} className="rounded-md bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {idx + 1}. {question.text}
              </p>
              {question.type === "rating" ? (
                <select
                  value={answers[idx]?.rating || 5}
                  onChange={(e) => setAnswer(idx, { rating: Number(e.target.value) })}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              ) : (
                <textarea
                  rows={3}
                  value={answers[idx]?.text || ""}
                  onChange={(e) => setAnswer(idx, { text: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  placeholder="Write your feedback..."
                />
              )}
            </div>
          ))}

          <button
            onClick={submitFeedback}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentFeedbackPanel;
