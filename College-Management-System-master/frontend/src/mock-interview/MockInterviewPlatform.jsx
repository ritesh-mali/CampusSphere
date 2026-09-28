import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Upload,
  Mic,
  MicOff,
  SkipForward,
  RotateCcw,
  History,
  Sparkles,
  Video,
  FileText,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import GlassCard from "./components/GlassCard";
import ReportDashboard from "./components/ReportDashboard";
import AIInterviewerPanel from "./components/AIInterviewerPanel";
import StepWizard from "./components/StepWizard";
import AnalyzingOverlay from "./components/AnalyzingOverlay";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { mockInterviewApi } from "./api";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { useWebcamAnalysis } from "./hooks/useWebcamAnalysis";
import axiosWrapper from "../utils/AxiosWrapper";
import "../styles/mock-interview.css";

const WIZARD_STEPS = [
  { id: "resume", label: "Upload Resume" },
  { id: "configure", label: "Role & Setup" },
  { id: "interview", label: "Live Interview" },
  { id: "report", label: "AI Feedback" },
];

const MockInterviewInner = ({ embedded = false }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const questionStartRef = useRef(Date.now());
  const answerRef = useRef("");
  const answerBeforeMicRef = useRef("");

  const [step, setStep] = useState("resume");
  const [roles, setRoles] = useState([]);
  const [experienceLevels, setExperienceLevels] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("fresher");
  const [resumeProfile, setResumeProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [questionTimeSec, setQuestionTimeSec] = useState(120);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState(120);
  const [retried, setRetried] = useState(false);
  const [followUp, setFollowUp] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [speechSegments, setSpeechSegments] = useState(0);
  const [durations, setDurations] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);

  const interviewActive = step === "interview" && sessionId;

  const { metrics: emotionMetrics, getSnapshot } = useWebcamAnalysis(
    videoRef,
    interviewActive
  );
  const { speak, cancel: cancelSpeech, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const onTranscript = useCallback((sessionText) => {
    const base = answerBeforeMicRef.current;
    setAnswer(base ? `${base} ${sessionText}`.trim() : sessionText);
  }, []);

  const {
    start: startMicRaw,
    stop: stopMic,
    isListening,
    resetSession: resetSpeechSession,
  } = useSpeechRecognition({ onTranscript });

  const startMic = useCallback(() => {
    answerBeforeMicRef.current = answerRef.current;
    resetSpeechSession();
    setSpeechSegments((n) => n + 1);
    startMicRaw();
  }, [startMicRaw, resetSpeechSession]);

  const speakQuestion = useCallback(
    (text) => {
      if (!text) return;
      const intro =
        currentIndex === 0
          ? `Hello! I'm Alex, your AI interviewer. Let's begin. Question 1. `
          : `Question ${currentIndex + 1}. `;
      speak(`${intro}${text}`, {
        onEnd: () => {
          if (step === "interview") startMic();
        },
      });
    },
    [currentIndex, speak, step, startMic]
  );

  const behaviorMetrics = useMemo(
    () => ({
      faceDetectedRatio:
        emotionMetrics.frames?.total > 0
          ? emotionMetrics.frames.face / emotionMetrics.frames.total
          : 0,
      tabSwitchCount,
      speechSegments,
      avgAnswerDurationSec: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      warnings,
    }),
    [emotionMetrics, tabSwitchCount, speechSegments, durations, warnings]
  );

  const wizardIndex = useMemo(() => {
    if (generatingQuestions) return 1;
    if (analyzing) return 2;
    if (step === "resume") return 0;
    if (step === "configure") return 1;
    if (step === "interview") return 2;
    if (step === "report") return 3;
    return 0;
  }, [step, generatingQuestions, analyzing]);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch {
      setCameraReady(false);
      toast.error("Allow camera & microphone for the interview");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!localStorage.getItem("userToken") && !embedded) {
      navigate("/");
      return;
    }

    mockInterviewApi
      .getRoles()
      .then((res) => {
        const data = res.data?.data;
        setRoles(data?.roles || []);
        setExperienceLevels(data?.experienceLevels || []);
        setTotalQuestions(data?.totalQuestions || 20);
        setQuestionTimeSec(data?.questionTimeSec || 120);
        setTimer(data?.questionTimeSec || 120);
      })
      .catch(() => toast.error("Failed to load interview config"));

    mockInterviewApi
      .getLatestResume()
      .then((res) => {
        const data = res.data?.data;
        if (data?.resumeId) {
          setResumeProfile(data);
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, [embedded, navigate]);

  useEffect(() => {
    if (step === "configure" || step === "interview") {
      setupCamera();
    }
    const onVis = () => {
      if (document.hidden && step === "interview") {
        setTabSwitchCount((n) => n + 1);
        setWarnings((w) =>
          w.includes("Tab switch detected") ? w : [...w, "Tab switch detected"]
        );
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stopMic();
      cancelSpeech();
    };
  }, [step]);

  useEffect(() => {
    if (step !== "interview" || !sessionId) return undefined;
    if (timer <= 0) {
      handleNext(true);
      return undefined;
    }
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, step, sessionId]);

  useEffect(() => {
    if (currentQuestion?.text && step === "interview") {
      stopMic();
      cancelSpeech();
      const t = setTimeout(() => speakQuestion(currentQuestion.text), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [currentIndex, currentQuestion?.text, step]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await mockInterviewApi.uploadResume(file);
      setResumeProfile(res.data?.data);
      toast.success("Resume analyzed — skills & projects extracted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const goToConfigure = () => {
    if (!resumeProfile?.resumeId) {
      toast.error("Upload your resume first (PDF or DOCX)");
      return;
    }
    setStep("configure");
  };

  const handleStart = async () => {
    if (!resumeProfile?.resumeId) {
      toast.error("Upload your resume first");
      return;
    }
    if (!selectedRole) {
      toast.error("Select an interview role");
      return;
    }
    if (!cameraReady) {
      await setupCamera();
      if (!cameraReady) return;
    }

    setGeneratingQuestions(true);
    setLoading(true);
    try {
      const res = await mockInterviewApi.startInterview({
        role: selectedRole,
        experienceLevel,
        resumeId: resumeProfile.resumeId,
      });
      const data = res.data?.data;
      setSessionId(data.sessionId);
      setCurrentIndex(0);
      setCurrentQuestion(data.question);
      setTotalQuestions(data.totalQuestions || 20);
      setQuestionTimeSec(data.questionTimeSec || 120);
      setTimer(data.questionTimeSec || 120);
      setProgressPercent(0);
      setAnswer("");
      answerBeforeMicRef.current = "";
      setRetried(false);
      questionStartRef.current = Date.now();
      setStep("interview");
      toast.success(`Generated ${data.totalQuestions || 20} personalized questions from your resume`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not generate questions");
    } finally {
      setLoading(false);
      setGeneratingQuestions(false);
    }
  };

  const handleNext = async (force = false) => {
    const elapsed = Math.max(
      1,
      Math.round((Date.now() - questionStartRef.current) / 1000)
    );
    setDurations((d) => [...d, elapsed]);

    if (!answer.trim() && !force) {
      toast.error("Answer verbally or type, then continue");
      return;
    }

    stopMic();
    cancelSpeech();
    setLoading(true);
    try {
      const res = await mockInterviewApi.submitAnswer({
        sessionId,
        answer: answer.trim(),
        durationSec: elapsed,
        skipped: force && !answer.trim(),
        retried,
        emotionSnapshot: getSnapshot(),
      });
      const data = res.data?.data;

      if (data.completed) {
        await finishInterview();
        return;
      }

      setCurrentIndex(data.currentIndex);
      setCurrentQuestion(data.question);
      setProgressPercent(data.progressPercent);
      setAnswer("");
      answerBeforeMicRef.current = "";
      setRetried(false);
      setFollowUp(data.followUp);
      setTimer(questionTimeSec);
      questionStartRef.current = Date.now();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    setAnalyzing(true);
    stopMic();
    cancelSpeech();
    try {
      const res = await mockInterviewApi.completeInterview({
        sessionId,
        behaviorMetrics,
        emotionMetrics: getSnapshot(),
      });
      setResult(res.data?.data);
      setStep("report");
      stopCamera();
      toast.success("Your interview feedback report is ready");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await mockInterviewApi.getHistory();
      setHistory(res.data?.data?.history || []);
      setShowHistory(true);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!result?.resultId) return;
    setDownloading(true);
    try {
      const response = await axiosWrapper.get(
        `/mock-interview/result/${result.resultId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-report-${result.resultId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  const resetSession = () => {
    setSessionId("");
    setResult(null);
    setAnswer("");
    answerBeforeMicRef.current = "";
    setCurrentIndex(0);
    setShowHistory(false);
    setStep("resume");
    setupCamera();
  };

  const content = (
    <motion.div
      className={`mock-interview-root ${embedded ? "embedded" : "min-h-screen pb-12"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={embedded ? "px-1 sm:px-2" : "max-w-6xl mx-auto px-4 pt-4"}>
        <motion.div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-indigo-500" />
            AI Mock Interview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload resume → AI generates 20 unique questions → Voice interview → Detailed feedback
          </p>
        </motion.div>

        {!showHistory && (
          <StepWizard steps={WIZARD_STEPS} current={wizardIndex} />
        )}

        <AnimatePresence mode="wait">
          {generatingQuestions && (
            <AnalyzingOverlay
              title="Generating 20 Interview Questions"
              subtitle="Reading your resume skills, projects, and tech stack to build a personalized interview…"
            />
          )}

          {analyzing && (
            <AnalyzingOverlay
              title="Analyzing Your Interview"
              subtitle="Evaluating communication, technical accuracy, confidence, grammar, and webcam behavior…"
            />
          )}

          {!generatingQuestions && !analyzing && step === "resume" && !showHistory && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="p-6 sm:p-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <FileText className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Step 1: Upload Your Resume
                    </h2>
                    <p className="text-sm text-slate-500">
                      Required — AI uses this to create 20 tailored questions
                    </p>
                  </div>
                </div>

                <label
                  className={`mock-interview-resume-drop flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition ${
                    resumeProfile
                      ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50/40"
                  }`}
                >
                  <Upload className="text-indigo-500 mb-3" size={40} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {resumeProfile ? "Replace resume (PDF / DOCX)" : "Drop resume here or click to upload"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Max 10MB</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>

                {uploading && (
                  <p className="text-center text-sm text-indigo-600 mt-4 animate-pulse">
                    AI extracting name, skills, projects, experience…
                  </p>
                )}

                {resumeProfile && (
                  <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-sm space-y-2">
                    <p>
                      <span className="font-semibold text-emerald-600">ATS Score:</span>{" "}
                      {resumeProfile.atsScore}%
                    </p>
                    <div>
                      <p className="font-semibold mb-1">
                        Skills ({(resumeProfile.parsed?.skills || []).length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(resumeProfile.parsed?.skills || []).slice(0, 15).map((s, i) => (
                          <span
                            key={`skill-${i}`}
                            className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs"
                          >
                            {s}
                          </span>
                        ))}
                        {!(resumeProfile.parsed?.skills || []).length && (
                          <span className="text-slate-500 text-xs">No skills detected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">
                        Projects ({(resumeProfile.parsed?.projects || []).length})
                      </p>
                      {(resumeProfile.parsed?.projects || []).length ? (
                        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          {resumeProfile.parsed.projects.slice(0, 6).map((p, i) => (
                            <li key={`proj-${i}`} className="text-xs sm:text-sm">
                              {p}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          No projects found — add a Projects section
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      {resumeProfile.aiSummary}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full mt-6"
                  onClick={goToConfigure}
                  disabled={!resumeProfile || uploading}
                >
                  Continue to role selection
                  <ChevronRight size={18} />
                </Button>
              </GlassCard>
            </motion.div>
          )}

          {!generatingQuestions && !analyzing && step === "configure" && !showHistory && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto"
            >
              <GlassCard className="p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-indigo-500" />
                  Step 2: Interview Role
                </h2>
                <label className="block text-sm font-medium mb-1">Target role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 mb-4"
                >
                  <option value="">Select role (e.g. React Developer)</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5"
                >
                  {experienceLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </GlassCard>

              <GlassCard className="p-6 flex flex-col">
                <h2 className="font-bold text-lg mb-2">What happens next?</h2>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 flex-1">
                  <li>• AI reads your resume and generates <strong>20 unique questions</strong></li>
                  <li>• Mix of technical, HR, behavioral, project & scenario questions</li>
                  <li>• <strong>AI voice</strong> asks each question — you answer by voice or text</li>
                  <li>• Webcam tracks confidence & eye contact</li>
                  <li>• Full feedback report with scores & improvement roadmap</li>
                </ul>
                <div className="flex items-center gap-2 text-xs text-slate-500 my-4">
                  <Video size={14} />
                  Camera {cameraReady ? "ready" : "— allow access"}
                </div>
                <Button
                  className="w-full"
                  onClick={handleStart}
                  loading={loading}
                  disabled={!selectedRole || !resumeProfile}
                >
                  Generate 20 Questions & Start Interview
                </Button>
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setStep("resume")}
                >
                  Back to resume
                </Button>
              </GlassCard>
            </motion.div>
          )}

          {!generatingQuestions && !analyzing && step === "interview" && !showHistory && (
            <motion.div
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <AIInterviewerPanel
                isSpeaking={isSpeaking}
                questionText={currentQuestion?.text}
                onReplay={() => speakQuestion(currentQuestion?.text)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GlassCard className="p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">YOUR WEBCAM</p>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-xl aspect-video object-cover bg-black"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                      Confidence {emotionMetrics.confidence}%
                    </span>
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                      Eye contact {emotionMetrics.eyeContact}%
                    </span>
                  </div>
                </GlassCard>

                <GlassCard className="p-5 lg:col-span-2">
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <span className="text-sm font-bold text-indigo-600">
                      Question {currentIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40">
                      ⏱ {timer}s
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 mb-4 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {currentQuestion && (
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">
                      {currentQuestion.type} • level {currentQuestion.difficulty}
                    </span>
                  )}
                  {followUp && (
                    <p className="text-sm text-indigo-600 mt-2 italic">Follow-up: {followUp}</p>
                  )}
                  <textarea
                    rows={5}
                    value={answer}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAnswer(value);
                      if (isListening) {
                        answerBeforeMicRef.current = value;
                        resetSpeechSession();
                      }
                    }}
                    placeholder="Speak your answer (mic) or type here…"
                    className="w-full mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-3 text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant={isListening ? "danger" : "outline"}
                      onClick={isListening ? stopMic : startMic}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      {isListening ? "Stop recording" : "Record answer"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAnswer("");
                        answerBeforeMicRef.current = "";
                        resetSpeechSession();
                        setRetried(true);
                        setTimer(questionTimeSec);
                        speakQuestion(currentQuestion?.text);
                      }}
                    >
                      <RotateCcw size={16} /> Retry
                    </Button>
                    <Button variant="ghost" onClick={() => handleNext(true)} disabled={loading}>
                      <SkipForward size={16} /> Skip
                    </Button>
                    <Button onClick={() => handleNext(false)} loading={loading}>
                      {currentIndex + 1 >= totalQuestions
                        ? "Finish & get feedback"
                        : "Next question"}
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {!generatingQuestions && !analyzing && step === "report" && result && !showHistory && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ReportDashboard
                result={result}
                onDownloadPdf={downloadPdf}
                downloading={downloading}
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={resetSession}>New interview</Button>
                <Button variant="outline" onClick={loadHistory}>
                  <History size={16} /> Past sessions
                </Button>
              </div>
            </motion.div>
          )}

          {showHistory && (
            <motion.div key="history" className="space-y-3">
              <Button variant="ghost" onClick={() => setShowHistory(false)}>
                ← Back
              </Button>
              {history.length === 0 ? (
                <GlassCard className="p-8 text-center text-slate-500">
                  No past interviews yet.
                </GlassCard>
              ) : (
                history.map((item) => (
                  <GlassCard
                    key={item._id}
                    className="p-4 flex flex-wrap justify-between items-center gap-3"
                  >
                    <div>
                      <p className="font-semibold">{item.role}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-indigo-600">
                        {item.scores?.overall}%
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const res = await mockInterviewApi.getResult(item._id);
                          setResult(res.data?.data?.result);
                          setStep("report");
                          setShowHistory(false);
                        }}
                      >
                        View report
                      </Button>
                    </div>
                  </GlassCard>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <Navbar />
      {content}
    </>
  );
};

const MockInterviewPlatform = ({ embedded = false }) => (
  <ThemeProvider>
    <MockInterviewInner embedded={embedded} />
  </ThemeProvider>
);

export default MockInterviewPlatform;
