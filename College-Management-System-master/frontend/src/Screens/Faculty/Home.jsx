import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Notice from "../Notice";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import Timetable from "./Timetable";
import Material from "./Material";
import StudentFinder from "./StudentFinder";
import Profile from "./Profile";
import Marks from "./AddMarks";
import Exam from "../Exam";
import FacultyFeedbackPanel from "../../components/feedback/FacultyFeedbackPanel";
import FacultyAttendancePanel from "../../components/attendance/FacultyAttendancePanel";
import LoadingSpinner from "../../components/LoadingSpinner";
import EventsPanel from "../../campussphere/EventsPanel";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/sections/dash-theme-faculty.css";

const MENU_ITEMS = [
  { id: "home", label: "Home", component: null },
  { id: "timetable", label: "Timetable", component: Timetable },
  { id: "material", label: "Material", component: Material },
  { id: "notice", label: "Notice", component: Notice },
  { id: "student info", label: "Student Info", component: StudentFinder },
  { id: "marks", label: "Marks", component: Marks },
  { id: "attendance", label: "Attendance", component: FacultyAttendancePanel },
  { id: "exam", label: "Exam", component: Exam },
  { id: "feedback", label: "Feedback", component: FacultyFeedbackPanel },
  { id: "events", label: "Events", component: () => <EventsPanel mode="faculty" /> },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userToken = localStorage.getItem("userToken");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axiosWrapper.get("/faculty/my-details", {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (response.data.success) {
          setProfileData(response.data.data);
          dispatch(setUserData(response.data.data));
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [dispatch, userToken]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner label="Loading faculty dashboard..." />;
    }

    if (selectedMenu === "home" && profileData) {
      return <Profile profileData={profileData} />;
    }

    const menuItem = MENU_ITEMS.find((item) => item.id === selectedMenu);

    if (menuItem && menuItem.component) {
      const Component = menuItem.component;
      return <Component />;
    }

    return null;
  };

  return (
    <>
      <DashboardLayout
        title="Faculty Dashboard"
        themeVariant="faculty"
        menuItems={MENU_ITEMS}
        selectedId={selectedMenu}
        onSelect={setSelectedMenu}
      >
        {renderContent()}
      </DashboardLayout>
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
