import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import Heading from "../components/Heading";
import CustomButton from "../components/CustomButton";
import DeleteConfirm from "../components/DeleteConfirm";
import Loading from "../components/Loading";
import { IoMdAdd } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import { useSelector } from "react-redux";
import "../styles/sections/section-exam.css";

const Exam = () => {
  const loginType = localStorage.getItem("userType"); // "Student" | "Faculty" | "Admin"
  const userToken = localStorage.getItem("userToken");
  const userData = useSelector((state) => state.userData);

  const [dataLoading, setDataLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);

  // Faculty exam list
  const [facultyExams, setFacultyExams] = useState([]);
  // Student assigned exams list
  const [assignedExams, setAssignedExams] = useState([]);

  // Create weekly exam (faculty)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: "",
    weekStartDate: "",
    branchId: "",
    semester: "",
    durationMinutes: 30,
  });
  const [branches, setBranches] = useState([]);

  // Add question (faculty)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionExam, setQuestionExam] = useState(null);
  const [questionData, setQuestionData] = useState({
    questionText: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctOptionIndex: 0,
    marks: 1,
  });

  // Results (faculty)
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsData, setResultsData] = useState(null);

  // Student take exam
  const [activeExamId, setActiveExamId] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [submitResult, setSubmitResult] = useState(null);
  const [violations, setViolations] = useState({
    tabSwitchCount: 0,
    blurCount: 0,
    fullscreenExitCount: 0,
    copyCount: 0,
    pasteCount: 0,
    rightClickCount: 0,
  });
  const [hasStarted, setHasStarted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Delete confirm (faculty)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${userToken}`,
    }),
    [userToken]
  );

  const resetCreateForm = () => {
    setCreateData({
      title: "",
      weekStartDate: "",
      branchId: "",
      semester: "",
      durationMinutes: 30,
    });
    setShowCreateModal(false);
  };

  const resetQuestionForm = () => {
    setQuestionData({
      questionText: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correctOptionIndex: 0,
      marks: 1,
    });
    setShowQuestionModal(false);
    setQuestionExam(null);
  };

  const loadFacultyExams = async () => {
    setDataLoading(true);
    try {
      const res = await axiosWrapper.get("/exam", { headers: authHeaders });
      if (res.data.success) setFacultyExams(res.data.data || []);
      else toast.error(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load weekly exams");
    } finally {
      setDataLoading(false);
    }
  };

  const loadAssignedExams = async () => {
    setDataLoading(true);
    try {
      const params = new URLSearchParams();
      const branchId = userData?.branchId?._id;
      const semester = userData?.semester;
      if (branchId) params.set("branchId", branchId);
      if (semester) params.set("semester", String(semester));
      const url = params.toString() ? `/exam/assigned?${params}` : "/exam/assigned";
      const res = await axiosWrapper.get(url, { headers: authHeaders });
      if (res.data.success) setAssignedExams(res.data.data || []);
      else toast.error(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load assigned exams");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!userToken) return;
    if (loginType === "Faculty") loadFacultyExams();
    if (loginType === "Student") loadAssignedExams();
    // Admin: no weekly-exam dashboard
  }, [loginType, userToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadBranches = async () => {
      if (loginType !== "Faculty" || !userToken) return;
      try {
        const res = await axiosWrapper.get("/branch", { headers: authHeaders });
        if (res.data.success) setBranches(res.data.data || []);
      } catch {
        // ignore; create form will still render
      }
    };
    loadBranches();
  }, [loginType, userToken, authHeaders]);

  const createWeeklyExam = async () => {
    if (
      !createData.title ||
      !createData.weekStartDate ||
      !createData.branchId ||
      !createData.semester
    ) {
      toast.error("Please fill all fields");
      return;
    }
    setProcessLoading(true);
    try {
      toast.loading("Creating weekly exam...");
      const fd = new FormData();
      fd.append("title", createData.title);
      fd.append("weekStartDate", createData.weekStartDate);
      fd.append("branchId", createData.branchId);
      fd.append("semester", createData.semester);
      fd.append("durationMinutes", String(createData.durationMinutes || 30));

      const res = await axiosWrapper.post("/exam", fd, {
        headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success("Weekly exam created");
        resetCreateForm();
        loadFacultyExams();
      } else toast.error(res.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Failed to create weekly exam");
    } finally {
      setProcessLoading(false);
    }
  };

  const openAddQuestion = (exam) => {
    setQuestionExam(exam);
    setShowQuestionModal(true);
  };

  const addQuestion = async () => {
    if (!questionExam?._id) return;
    if (!questionData.questionText || !questionData.option1 || !questionData.option2) {
      toast.error("Question, option 1 and option 2 are required");
      return;
    }
    const options = [
      questionData.option1,
      questionData.option2,
      questionData.option3,
      questionData.option4,
    ].filter(Boolean);
    if (Number(questionData.correctOptionIndex) < 0 || Number(questionData.correctOptionIndex) >= options.length) {
      toast.error("Correct option index is invalid");
      return;
    }

    setProcessLoading(true);
    try {
      toast.loading("Adding question...");
      const fd = new FormData();
      fd.append("questionText", questionData.questionText);
      fd.append("options", JSON.stringify(options));
      fd.append("correctOptionIndex", String(questionData.correctOptionIndex));
      fd.append("marks", String(questionData.marks || 1));

      const res = await axiosWrapper.post(`/exam/${questionExam._id}/questions`, fd, {
        headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success("Question added");
        resetQuestionForm();
        loadFacultyExams();
      } else toast.error(res.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Failed to add question");
    } finally {
      setProcessLoading(false);
    }
  };

  const publishExam = async (examId) => {
    setProcessLoading(true);
    try {
      toast.loading("Publishing...");
      const res = await axiosWrapper.patch(`/exam/${examId}/publish`, null, {
        headers: authHeaders,
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success("Published");
        loadFacultyExams();
      } else toast.error(res.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Failed to publish");
    } finally {
      setProcessLoading(false);
    }
  };

  const openResults = async (examId) => {
    setProcessLoading(true);
    try {
      toast.loading("Loading results...");
      const res = await axiosWrapper.get(`/exam/${examId}/results`, {
        headers: authHeaders,
      });
      toast.dismiss();
      if (res.data.success) {
        setResultsData(res.data.data);
        setShowResultsModal(true);
      } else toast.error(res.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Failed to load results");
    } finally {
      setProcessLoading(false);
    }
  };

  const askDelete = (examId) => {
    setSelectedExamId(examId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedExamId) return;
    setProcessLoading(true);
    try {
      toast.loading("Deleting...");
      const res = await axiosWrapper.delete(`/exam/${selectedExamId}`, {
        headers: authHeaders,
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success("Deleted");
        setIsDeleteConfirmOpen(false);
        setSelectedExamId(null);
        loadFacultyExams();
      } else toast.error(res.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Failed to delete");
    } finally {
      setProcessLoading(false);
    }
  };

  const startStudentExam = async (examId) => {
    setActiveExamId(examId);
    setActiveExam(null);
    setStudentAnswers({});
    setSubmitResult(null);
    setViolations({
      tabSwitchCount: 0,
      blurCount: 0,
      fullscreenExitCount: 0,
      copyCount: 0,
      pasteCount: 0,
      rightClickCount: 0,
    });
    setHasStarted(false);
    setIsLocked(false);
    setProcessLoading(true);
    try {
      toast.loading("Loading exam...");
      const res = await axiosWrapper.get(`/exam/${examId}`, { headers: authHeaders });
      toast.dismiss();
      if (res.data.success) {
        setActiveExam(res.data.data);
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Failed to load exam");
    } finally {
      setProcessLoading(false);
    }
  };

  const submitStudentExam = async ({ isAutoSubmitted = false } = {}) => {
    if (!activeExamId || !activeExam) return;
    if (isLocked) return;
    const answers = (activeExam.questions || [])
      .map((q) => {
        const selectedOptionIndex = studentAnswers[q._id];
        if (selectedOptionIndex === undefined) return null;
        return {
          questionId: q._id,
          selectedOptionIndex: Number(selectedOptionIndex),
        };
      })
      .filter(Boolean);

    setProcessLoading(true);
    try {
      toast.loading("Submitting...");
      const res = await axiosWrapper.post(
        `/exam/${activeExamId}/submit`,
        { answers, violations, isAutoSubmitted },
        { headers: { ...authHeaders, "Content-Type": "application/json" } }
      );
      toast.dismiss();
      if (res.data.success) {
        setSubmitResult(res.data.data);
        setIsLocked(true);
        toast.success("Exam submitted successfully");
      } else toast.error(res.data.message);
    } catch (e) {
      toast.dismiss();
      const msg = e.response?.data?.message || "Failed to submit exam";
      toast.error(msg);
      if (e.response?.status === 409) {
        // already submitted => lock UI
        setIsLocked(true);
      }
    } finally {
      setProcessLoading(false);
    }
  };

  // Anti-cheat (client-side): detect tab switch / blur / fullscreen exit / copy-paste / right-click
  useEffect(() => {
    if (loginType !== "Student") return;
    if (!activeExamId || !activeExam) return;
    if (!hasStarted) return;
    if (isLocked) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        setViolations((v) => ({ ...v, tabSwitchCount: v.tabSwitchCount + 1 }));
        toast.error("Tab switching detected. Exam will be auto-submitted on repeated attempts.");
      }
    };

    const onBlur = () => {
      setViolations((v) => ({ ...v, blurCount: v.blurCount + 1 }));
      toast.error("Window focus lost. Stay on the exam page.");
    };

    const onFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      if (!isFs) {
        setViolations((v) => ({
          ...v,
          fullscreenExitCount: v.fullscreenExitCount + 1,
        }));
        toast.error("Fullscreen exited. This will be recorded.");
      }
    };

    const onCopy = (e) => {
      e.preventDefault();
      setViolations((v) => ({ ...v, copyCount: v.copyCount + 1 }));
      toast.error("Copy is blocked during exam.");
    };

    const onPaste = (e) => {
      e.preventDefault();
      setViolations((v) => ({ ...v, pasteCount: v.pasteCount + 1 }));
      toast.error("Paste is blocked during exam.");
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      setViolations((v) => ({ ...v, rightClickCount: v.rightClickCount + 1 }));
      toast.error("Right-click is blocked during exam.");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [activeExamId, activeExam, hasStarted, isLocked, loginType]);

  // Auto-submit if violations exceed threshold
  useEffect(() => {
    if (loginType !== "Student") return;
    if (!hasStarted || isLocked || !activeExamId) return;
    const totalSwitch = violations.tabSwitchCount + violations.blurCount + violations.fullscreenExitCount;
    if (totalSwitch >= 3) {
      toast.error("Multiple violations detected. Auto-submitting exam.");
      submitStudentExam({ isAutoSubmitted: true });
    }
  }, [violations, hasStarted, isLocked, activeExamId, loginType]); // eslint-disable-line react-hooks/exhaustive-deps

  if (dataLoading) return <Loading />;

  // Student UI
  if (loginType === "Student") {
    return (
      <div className="section-exam w-full mx-auto mt-6 flex flex-col mb-10">
        <div className="flex justify-between items-center w-full">
          <Heading title="Weekly Exams" />
          <CustomButton variant="secondary" onClick={loadAssignedExams}>
            Refresh
          </CustomButton>
        </div>

        {!activeExam ? (
          <div className="mt-6 w-full">
            <table className="text-sm min-w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="py-3 px-4 text-left font-semibold">Title</th>
                  <th className="py-3 px-4 text-left font-semibold">Week Start</th>
                  <th className="py-3 px-4 text-left font-semibold">Semester</th>
                  <th className="py-3 px-4 text-left font-semibold">Duration</th>
                  <th className="py-3 px-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedExams && assignedExams.length > 0 ? (
                  assignedExams.map((e) => (
                    <tr key={e._id} className="border-b hover:bg-blue-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">{e.title}</td>
                      <td className="py-3 px-4">{new Date(e.weekStartDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{e.semester}</td>
                      <td className="py-3 px-4">{e.durationMinutes} min</td>
                      <td className="py-3 px-4 text-center">
                        <CustomButton onClick={() => startStudentExam(e._id)} disabled={processLoading}>
                          Take Exam
                        </CustomButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-base py-10">
                      No weekly exams assigned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 w-full">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-semibold">{activeExam.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Duration: {activeExam.durationMinutes} minutes • Semester: {activeExam.semester}
                </p>
              </div>
              <CustomButton variant="secondary" onClick={() => setActiveExam(null)}>
                Back
              </CustomButton>
            </div>

            {!hasStarted ? (
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-4">
                <p className="font-medium">Start exam in fullscreen</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Tab switching, copy/paste and right-click are restricted. Violations may auto-submit the exam.
                </p>
                <div className="mt-4 flex gap-3">
                  <CustomButton
                    onClick={async () => {
                      try {
                        await document.documentElement.requestFullscreen?.();
                      } catch {
                        // ignore (browser may block)
                      } finally {
                        setHasStarted(true);
                      }
                    }}
                    disabled={processLoading}
                  >
                    Start
                  </CustomButton>
                  <CustomButton
                    variant="secondary"
                    onClick={() => setActiveExam(null)}
                    disabled={processLoading}
                  >
                    Cancel
                  </CustomButton>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {(activeExam.questions || []).map((q, idx) => (
                <div key={q._id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <p className="font-medium">
                    {idx + 1}. {q.questionText}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`q_${q._id}`}
                          value={optIdx}
                          checked={Number(studentAnswers[q._id]) === optIdx}
                          onChange={() =>
                            setStudentAnswers((prev) => ({ ...prev, [q._id]: optIdx }))
                          }
                          disabled={!hasStarted || isLocked}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <CustomButton
                onClick={() => submitStudentExam({ isAutoSubmitted: false })}
                disabled={processLoading || !hasStarted || isLocked}
              >
                Submit
              </CustomButton>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Faculty UI
  if (loginType === "Faculty") {
    return (
      <div className="section-exam w-full mx-auto mt-6 flex flex-col mb-10">
        <div className="flex justify-between items-center w-full">
          <Heading title="Weekly MCQ Exams" />
          <div className="flex gap-2">
            <CustomButton variant="secondary" onClick={loadFacultyExams}>
              Refresh
            </CustomButton>
            <CustomButton onClick={() => setShowCreateModal(true)}>
              <IoMdAdd className="text-2xl" />
            </CustomButton>
          </div>
        </div>

        <div className="mt-6 w-full">
          <table className="text-sm min-w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="py-3 px-4 text-left font-semibold">Title</th>
                <th className="py-3 px-4 text-left font-semibold">Week Start</th>
                <th className="py-3 px-4 text-left font-semibold">Branch</th>
                <th className="py-3 px-4 text-left font-semibold">Semester</th>
                <th className="py-3 px-4 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-left font-semibold">Questions</th>
                <th className="py-3 px-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyExams && facultyExams.length > 0 ? (
                facultyExams.map((e) => (
                  <tr key={e._id} className="border-b hover:bg-blue-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">{e.title}</td>
                    <td className="py-3 px-4">{new Date(e.weekStartDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{e.branchId?.name || "-"}</td>
                    <td className="py-3 px-4">{e.semester}</td>
                    <td className="py-3 px-4">{e.status}</td>
                    <td className="py-3 px-4">{(e.questions || []).length}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <CustomButton
                          variant="secondary"
                          onClick={() => openAddQuestion(e)}
                          disabled={processLoading || e.status !== "draft"}
                        >
                          Add MCQ
                        </CustomButton>
                        <CustomButton
                          onClick={() => publishExam(e._id)}
                          disabled={processLoading || e.status !== "draft"}
                        >
                          Publish
                        </CustomButton>
                        <CustomButton
                          variant="secondary"
                          onClick={() => openResults(e._id)}
                          disabled={processLoading}
                        >
                          Results
                        </CustomButton>
                        <CustomButton
                          variant="danger"
                          onClick={() => askDelete(e._id)}
                          disabled={processLoading}
                        >
                          Delete
                        </CustomButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-base py-10">
                    No weekly exams created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create Weekly Exam</h2>
                <CustomButton onClick={resetCreateForm} variant="secondary">
                  <AiOutlineClose size={24} />
                </CustomButton>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={createData.title}
                    onChange={(e) => setCreateData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Week Start Date</label>
                    <input
                      type="date"
                      value={createData.weekStartDate}
                      onChange={(e) =>
                        setCreateData((p) => ({ ...p, weekStartDate: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={createData.durationMinutes}
                      onChange={(e) =>
                        setCreateData((p) => ({ ...p, durationMinutes: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                      min={1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch (Batch)</label>
                    <select
                      value={createData.branchId}
                      onChange={(e) => setCreateData((p) => ({ ...p, branchId: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <select
                      value={createData.semester}
                      onChange={(e) => setCreateData((p) => ({ ...p, semester: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <CustomButton onClick={resetCreateForm} variant="secondary">
                    Cancel
                  </CustomButton>
                  <CustomButton onClick={createWeeklyExam} disabled={processLoading}>
                    Create
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {showQuestionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add MCQ Question</h2>
                <CustomButton onClick={resetQuestionForm} variant="secondary">
                  <AiOutlineClose size={24} />
                </CustomButton>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question</label>
                  <textarea
                    value={questionData.questionText}
                    onChange={(e) => setQuestionData((p) => ({ ...p, questionText: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Option 1</label>
                    <input
                      type="text"
                      value={questionData.option1}
                      onChange={(e) => setQuestionData((p) => ({ ...p, option1: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Option 2</label>
                    <input
                      type="text"
                      value={questionData.option2}
                      onChange={(e) => setQuestionData((p) => ({ ...p, option2: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Option 3 (optional)</label>
                    <input
                      type="text"
                      value={questionData.option3}
                      onChange={(e) => setQuestionData((p) => ({ ...p, option3: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Option 4 (optional)</label>
                    <input
                      type="text"
                      value={questionData.option4}
                      onChange={(e) => setQuestionData((p) => ({ ...p, option4: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Correct Option</label>
                    <select
                      value={questionData.correctOptionIndex}
                      onChange={(e) =>
                        setQuestionData((p) => ({ ...p, correctOptionIndex: Number(e.target.value) }))
                      }
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <option key={i} value={i}>
                          Option {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Marks</label>
                    <input
                      type="number"
                      value={questionData.marks}
                      onChange={(e) => setQuestionData((p) => ({ ...p, marks: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                      min={1}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <CustomButton onClick={resetQuestionForm} variant="secondary">
                    Cancel
                  </CustomButton>
                  <CustomButton onClick={addQuestion} disabled={processLoading}>
                    Add
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {showResultsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Results</h2>
                <CustomButton
                  onClick={() => {
                    setShowResultsModal(false);
                    setResultsData(null);
                  }}
                  variant="secondary"
                >
                  <AiOutlineClose size={24} />
                </CustomButton>
              </div>

              <div className="mb-4">
                <p className="font-medium">{resultsData?.exam?.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Week Start:{" "}
                  {resultsData?.exam?.weekStartDate
                    ? new Date(resultsData.exam.weekStartDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="w-full overflow-auto">
                <table className="text-sm min-w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-blue-500 text-white">
                      <th className="py-3 px-4 text-left font-semibold">Enrollment</th>
                      <th className="py-3 px-4 text-left font-semibold">Student</th>
                      <th className="py-3 px-4 text-left font-semibold">Email</th>
                      <th className="py-3 px-4 text-left font-semibold">Score</th>
                      <th className="py-3 px-4 text-left font-semibold">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(resultsData?.attempts || []).length ? (
                      resultsData.attempts.map((a) => {
                        const s = a.studentId || {};
                        const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
                        return (
                          <tr key={a._id} className="border-b hover:bg-blue-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">{s.enrollmentNo || "-"}</td>
                            <td className="py-3 px-4">{fullName || "-"}</td>
                            <td className="py-3 px-4">{s.email || "-"}</td>
                            <td className="py-3 px-4">
                              {a.score}/{a.totalMarks}
                            </td>
                            <td className="py-3 px-4">
                              {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-base py-10">
                          No submissions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirm
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          message="Are you sure you want to delete this weekly exam?"
        />
      </div>
    );
  }

  return (
    <div className="section-exam w-full mx-auto mt-6">
      <Heading title="Weekly Exams" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        This section is available for Faculty and Students.
      </p>
    </div>
  );
};

export default Exam;
