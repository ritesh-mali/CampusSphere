import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-attendance-faculty.css";

const FacultyAttendancePanel = () => {
  const [semester, setSemester] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [summaryMap, setSummaryMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("userToken")}` }),
    []
  );

  const fetchSubjects = async (selectedSemester) => {
    if (!selectedSemester) return;
    try {
      const facultyResponse = await axiosWrapper.get("/faculty/my-details", {
        headers: tokenHeader,
      });
      const facultyData = facultyResponse?.data?.data;
      const response = await axiosWrapper.get(
        `/subject?semester=${selectedSemester}&branch=${facultyData.branchId}`,
        { headers: tokenHeader }
      );
      setSubjects(response?.data?.data || []);
      if (response?.data?.data?.length) {
        setSubjectId(response.data.data[0]._id);
      } else {
        setSubjectId("");
      }
    } catch (error) {
      toast.error("Failed to load subjects");
    }
  };

  const fetchStudents = async () => {
    if (!semester || !subjectId || !date) return;
    try {
      const response = await axiosWrapper.get(
        `/attendance/students?semester=${semester}&subjectId=${subjectId}&date=${date}`,
        { headers: tokenHeader }
      );
      const fetchedStudents = response?.data?.data?.students || [];
      const existing = response?.data?.data?.existingAttendance || [];
      const summary = response?.data?.data?.summaryByStudent || [];
      const initialStatusMap = {};
      fetchedStudents.forEach((student) => {
        const record = existing.find(
          (entry) => String(entry.studentId) === String(student._id)
        );
        initialStatusMap[student._id] = record?.status || "present";
      });
      const nextSummaryMap = {};
      summary.forEach((item) => {
        nextSummaryMap[item.studentId] = item;
      });
      setStudents(fetchedStudents);
      setStatusMap(initialStatusMap);
      setSummaryMap(nextSummaryMap);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load students");
    }
  };

  useEffect(() => {
    if (semester) fetchSubjects(semester);
  }, [semester]);

  useEffect(() => {
    fetchStudents();
  }, [semester, subjectId, date]);

  const saveAttendance = async () => {
    if (!subjectId || !date || students.length === 0) {
      toast.error("Select semester/subject and load students first");
      return;
    }

    const records = students.map((student) => ({
      studentId: student._id,
      status: statusMap[student._id] || "present",
    }));

    try {
      setIsSaving(true);
      await axiosWrapper.post(
        "/attendance/mark",
        { subjectId, date, records },
        { headers: tokenHeader }
      );
      toast.success("Attendance saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="section-attendance-faculty rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm dark:border-slate-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 dark:text-white">
        Mark Attendance
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
        >
          <option value="">Select Semester</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 dark:border-slate-800">
              <th className="py-2 pr-3">Enrollment</th>
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Attendance %</th>
              <th className="py-2 pr-3">Present/Total</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr
                  key={student._id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                    {student.enrollmentNo}
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                    {student.firstName} {student.middleName} {student.lastName}
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                    {summaryMap[student._id]?.percentage ?? 0}%
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                    {(summaryMap[student._id]?.presentClasses ?? 0) +
                      "/" +
                      (summaryMap[student._id]?.totalClasses ?? 0)}
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={statusMap[student._id] || "present"}
                      onChange={(e) =>
                        setStatusMap((prev) => ({
                          ...prev,
                          [student._id]: e.target.value,
                        }))
                      }
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs dark:border-slate-700 dark:text-white"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-gray-600 dark:text-gray-300 dark:text-slate-400">
                  No students loaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={saveAttendance}
        disabled={isSaving}
        className="mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Attendance"}
      </button>
    </div>
  );
};

export default FacultyAttendancePanel;
