import axios from "axios";
import React, { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import axiosWrapper from "../../utils/AxiosWrapper";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";
import "../../styles/sections/section-student-timetable.css";

const Timetable = () => {
  const [timetable, setTimetable] = useState("");
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const getTimetable = async () => {
      try {
        setDataLoading(true);
        const response = await axiosWrapper.get(
          `/timetable?semester=${userData.semester}&branch=${userData.branchId?._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }
        );
        if (response.data.success && response.data.data.length > 0) {
          setTimetable(response.data.data[0].link);
        } else {
          setTimetable("");
        }
      } catch (error) {
        if (error && error.response && error.response.status === 404) {
          setTimetable("");
          return;
        }
        toast.error(
          error.response?.data?.message || "Error fetching timetable"
        );
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    userData && getTimetable();
  }, [userData, userData.branchId, userData.semester]);

  return (
    <div className="section-student-timetable w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 text-gray-900 dark:text-gray-100 dark:text-white">
      <div className="flex justify-between items-center w-full">
        <Heading title={`Timetable of Semester ${userData.semester}`} />
        {!dataLoading && timetable && (
          <p
            className="flex justify-center items-center text-lg font-medium cursor-pointer text-gray-800 dark:text-gray-100 hover:text-red-500 hover:scale-110 ease-linear transition-all duration-200 hover:duration-200 hover:ease-linear hover:transition-all dark:text-slate-100"
            onClick={() =>
              window.open(process.env.REACT_APP_MEDIA_LINK + "/" + timetable)
            }
          >
            Download
            <span className="ml-2">
              <FiDownload />
            </span>
          </p>
        )}
      </div>
      {dataLoading && <Loading />}
      {!dataLoading && timetable && (
        <img
          className="mt-8 rounded-lg shadow-md w-[90%] md:w-[70%] mx-auto border border-gray-200 dark:border-gray-700 dark:border-slate-800"
          src={process.env.REACT_APP_MEDIA_LINK + "/" + timetable}
          alt="timetable"
        />
      )}
      {!dataLoading && !timetable && (
        <p className="mt-10 text-gray-700 dark:text-gray-300 dark:text-slate-300">
          No Timetable Available At The Moment!
        </p>
      )}
    </div>
  );
};

export default Timetable;
