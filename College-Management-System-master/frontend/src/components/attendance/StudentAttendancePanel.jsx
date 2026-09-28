import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-attendance-student.css";

const StudentAttendancePanel = () => {
  const [data, setData] = useState({
    percentage: 0,
    totalClasses: 0,
    presentClasses: 0,
    records: [],
  });

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("userToken")}` }),
    []
  );

  const fetchAttendance = async () => {
    try {
      const response = await axiosWrapper.get("/attendance/my", {
        headers: tokenHeader,
      });
      setData(response?.data?.data || data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch attendance");
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div className="section-attendance-student rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Attendance
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">Percentage</p>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
            {data.percentage}%
          </p>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3">
          <p className="text-xs text-green-700 dark:text-green-300">Present</p>
          <p className="text-xl font-bold text-green-800 dark:text-green-200">
            {data.presentClasses}
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 dark:bg-purple-900/30 p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-purple-700 dark:text-purple-300">Total</p>
          <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
            {data.totalClasses}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.records.length > 0 ? (
              data.records.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                    {item.subjectId?.name || "-"}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.status === "present"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-gray-600 dark:text-gray-300">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentAttendancePanel;
