import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMic, FiMicOff } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../../components/Navbar";
import axiosWrapper from "../../utils/AxiosWrapper";
import InterviewResultCard from "../../components/interview/InterviewResultCard";

const MockInterviewPage = () => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewId, setInterviewId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [result, setResult] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const answers = useMemo(
    () =>
      questions.map((question, index) => ({
        question,
        answer: (answersMap[index] || "").trim(),
      })),
    [questions, answersMap]
  );

  const handleStartInterview = async () => {
    try {
      const userToken = localStorage.getItem("userToken");
      if (!userToken) return navigate("/");

      setIsStarting(true);
      setResult(null);
      setAnswersMap({});
      setActiveIndex(0);

      const response = await axiosWrapper.post(
        "/interview/start",
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const data = response?.data?.data;
      setInterviewId(data?.interviewId || "");
      setQuestions(data?.questions || []);
      toast.success("Interview started");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start interview");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerChange = (value) => {
    setAnswersMap((prev) => ({ ...prev, [activeIndex]: value }));
  };

  const handleNext = () => {
    if (!answersMap[activeIndex]?.trim()) {
      toast.error("Please write an answer before moving next");
      return;
    }
    setActiveIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitInterview = async () => {
    try {
      const userToken = localStorage.getItem("userToken");
      if (!userToken) return navigate("/");

      const emptyAnswer = answers.find((item) => !item.answer);
      if (emptyAnswer) {
        toast.error("Please answer all questions before submit");
        return;
      }

      setIsSubmitting(true);
      const response = await axiosWrapper.post(
        "/interview/submit",
        { interviewId, answers },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      setResult(response?.data?.data || null);
      toast.success("Interview submitted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVoiceInput = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      setAnswersMap((prev) => ({
        ...prev,
        [activeIndex]: `${(prev[activeIndex] || "").trim()} ${transcript}`.trim(),
      }));
    };

    recognition.onerror = () => {
      toast.error("Voice input failed. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const hasInterviewStarted = questions.length > 0 && interviewId;

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
        <div className="flex items-center justify-between gap-3 mt-2 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            AI Mock Interview
          </h1>
          <button
            onClick={() => navigate("/student")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiArrowLeft />
            Back
          </button>
        </div>

        {!hasInterviewStarted && (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm">
            <p className="text-gray-600 mb-6">
              Start a personalized interview. You will get technical + HR
              questions, answer them, and receive AI-based score and feedback.
            </p>
            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {isStarting ? "Starting..." : "Start Interview"}
            </button>
          </div>
        )}

        {hasInterviewStarted && !result && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-blue-700">
                Question {activeIndex + 1} of {questions.length}
              </p>
              <button
                onClick={toggleVoiceInput}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isListening
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isListening ? <FiMicOff /> : <FiMic />}
                {isListening ? "Stop Voice" : "Voice Input"}
              </button>
            </div>

            <p className="text-lg font-semibold text-gray-800">
              {questions[activeIndex]}
            </p>

            <textarea
              rows={6}
              value={answersMap[activeIndex] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write your answer..."
              className="w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrevious}
                disabled={activeIndex === 0}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              {activeIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitInterview}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit Interview"}
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">
                Overall Score: {result.score}/100
              </h2>
              <p className="mt-2 text-gray-700">{result.feedback}</p>
              {result.improvementTips?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {result.improvementTips.map((tip, index) => (
                    <li key={`overall-tip-${index}`} className="text-sm text-gray-600">
                      - {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {result.answers?.map((item, index) => (
              <InterviewResultCard
                key={`result-item-${index}`}
                item={item}
                index={index}
              />
            ))}

            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {isStarting ? "Preparing..." : "Start New Interview"}
            </button>
          </div>
        )}
      </div>
      <Toaster position="bottom-center" />
    </>
  );
};

export default MockInterviewPage;
