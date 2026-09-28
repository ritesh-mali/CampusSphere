import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Notice from "../Notice";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import Timetable from "./Timetable";
import Material from "./Material";
import Profile from "./Profile";
import Exam from "../Exam";
import ViewMarks from "./ViewMarks";
import ChatbotWidget from "../../components/chatbot/ChatbotWidget";
import StudentFeedbackPanel from "../../components/feedback/StudentFeedbackPanel";
import StudentAttendancePanel from "../../components/attendance/StudentAttendancePanel";
import BonafidePanel from "../../components/bonafide/BonafidePanel";
import CodingCompilerPanel from "../../components/compiler/CodingCompilerPanel";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useNavigate, useLocation } from "react-router-dom";
import ResumeAnalyzerPanel from "../../campussphere/ResumeAnalyzerPanel";
import PlacementHubPanel from "../../campussphere/placement/PlacementHubPanel";
import EventsPanel from "../../campussphere/EventsPanel";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import "../../styles/sections/dash-theme-student.css";

// 👇 1. Import the new Automated Interview component here
// (Make sure the path matches where you saved the file!)
import AutomatedInterview from "../../pages/student/AutomatedInterviewPage";

const BASE_MENU_ITEMS = [
  { id: "home", label: "Home", component: null },
  { id: "timetable", label: "Timetable", component: Timetable },
  { id: "material", label: "Material", component: Material },
  { id: "notice", label: "Notice", component: Notice },
  { id: "exam", label: "Exam", component: Exam },
  { id: "marks", label: "Marks", component: ViewMarks },
  { id: "attendance", label: "Attendance", component: StudentAttendancePanel },
  { id: "bonafide", label: "Bonafide", component: BonafidePanel },
  { id: "feedback", label: "Feedback", component: StudentFeedbackPanel },
  { id: "resume", label: "Resume analyzer", component: ResumeAnalyzerPanel },
  { id: "placement", label: "Placement hub", component: PlacementHubPanel },
  { id: "events", label: "Events", component: () => <EventsPanel mode="student" /> },
  
  // 👇 2. Added it to the main menu array so it appears in the sidebar list!
  {
    id: "interview",
    label: "AI Mock Interview",
    component: AutomatedInterview,
  },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userToken = localStorage.getItem("userToken");
  const location = useLocation();
  const navigate = useNavigate();
  
  const branchName = String(profileData?.branchId?.name || "").toLowerCase();
  const isComputerScience = branchName.includes("computer") || branchName.includes("cse");
  
  const MENU_ITEMS = isComputerScience
    ? [
        ...BASE_MENU_ITEMS,
        { id: "compiler", label: "Compiler", component: CodingCompilerPanel },
      ]
    : BASE_MENU_ITEMS;

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      toast.loading("Loading user details...");
      const response = await axiosWrapper.get(`/student/my-details`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setProfileData(response.data.data);
        dispatch(setUserData(response.data.data));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Error fetching user details"
      );
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [dispatch, userToken]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner label="Loading student dashboard..." />;
    }

    if (selectedMenu === "home" && profileData) {
      return <Profile profileData={profileData} />;
    }

    const MenuItem = MENU_ITEMS.find(
      (item) => item.id.toLowerCase() === selectedMenu.toLowerCase()
    )?.component;

    return MenuItem && <MenuItem />;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pathMenuId = urlParams.get("page") || "home";
    const validMenu = MENU_ITEMS.find((item) => item.id === pathMenuId);
    setSelectedMenu(validMenu ? validMenu.id : "home");
  }, [location.search, MENU_ITEMS]); // fixed dependency array

  const handleMenuClick = (menuId) => {
    setSelectedMenu(menuId);
    navigate(`/student?page=${menuId}`);
  };

  return (
    <>
      <DashboardLayout
        title="Student Dashboard"
        themeVariant="student"
        menuItems={MENU_ITEMS}
        selectedId={selectedMenu}
        onSelect={handleMenuClick}
        // 👇 3. Updated footer button so it uses your ?page= logic instead of a hard route
        sidebarFooter={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => handleMenuClick("interview")}
          >
            Start AI Mock Interview
          </Button>
        }
      >
        {renderContent()}
      </DashboardLayout>
      <ChatbotWidget />
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;