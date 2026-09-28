import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import "../../styles/sections/section-student-marks.css";

const ViewMarks = () => {
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(
    userData?.semester || 1
  );
  const [marks, setMarks] = useState([]);
  const userToken = localStorage.getItem("userToken");

  const fetchMarks = async (semester) => {
    setDataLoading(true);
    toast.loading("Loading marks...");
    try {
      const response = await axiosWrapper.get(
        `/marks/student?semester=${semester}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      if (response.data.success) {
        setMarks(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching marks");
    } finally {
      setDataLoading(false);
      toast.dismiss();
    }
  };

  useEffect(() => {
    fetchMarks(userData?.semester || 1);
  }, []);

  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setSelectedSemester(semester);
    fetchMarks(semester);
  };

  const midTermMarks = marks.filter((mark) => mark.examId.examType === "mid");
  const endTermMarks = marks.filter((mark) => mark.examId.examType === "end");

  return (
    <div className="section-student-marks w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 text-gray-900 dark:text-gray-100 dark:text-white">
      <div className="flex justify-between items-center w-full mb-6">
        <Heading title="View Marks" />
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-slate-300">
            Semester:
          </label>
          <select
            value={selectedSemester || ""}
            onChange={handleSemesterChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-white dark:focus:ring-blue-600"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 dark:text-white">
            Mid Term Marks
          </h2>
          {dataLoading ? (
            <p className="text-gray-500 dark:text-gray-300 dark:text-slate-400">Loading...</p>
          ) : midTermMarks.length > 0 ? (
            <div className="space-y-4">
              {midTermMarks.map((mark) => (
                <div
                  key={mark._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:border-slate-800"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 dark:text-slate-100">
                        {mark.subjectId.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 dark:text-slate-400">
                        {mark.examId.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600">
                        {mark.marksObtained}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 dark:text-slate-400">
                        out of {mark.examId.totalMarks}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-300 dark:text-slate-400">
              No mid term marks available
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 dark:text-white">
            End Term Marks
          </h2>
          {dataLoading ? (
            <p className="text-gray-500 dark:text-gray-300 dark:text-slate-400">Loading...</p>
          ) : endTermMarks.length > 0 ? (
            <div className="space-y-4">
              {endTermMarks.map((mark) => (
                <div
                  key={mark._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:border-slate-800"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 dark:text-slate-100">
                        {mark.subjectId.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 dark:text-slate-400">
                        {mark.examId.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600">
                        {mark.marksObtained}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 dark:text-slate-400">
                        out of {mark.examId.totalMarks}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-300 dark:text-slate-400">
              No end term marks available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;
