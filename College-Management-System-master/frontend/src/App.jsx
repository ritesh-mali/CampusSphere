import React from "react";
import Login from "./Screens/Login";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import mystore from "./redux/store";
import StudentHome from "./Screens/Student/Home";
import AutomatedInterviewPage from "./pages/student/AutomatedInterviewPage";
import MockInterviewPlatform from "./mock-interview/MockInterviewPlatform";
import MockInterviewAdminPage from "./mock-interview/MockInterviewAdminPage";
import FacultyHome from "./Screens/Faculty/Home";
import AdminHome from "./Screens/Admin/Home";
import ForgetPassword from "./Screens/ForgetPassword";
import UpdatePassword from "./Screens/UpdatePassword";
import { AnimatePresence, motion } from "framer-motion";

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/forget-password"
          element={
            <PageTransition>
              <ForgetPassword />
            </PageTransition>
          }
        />
        <Route
          path="/:type/update-password/:resetId"
          element={
            <PageTransition>
              <UpdatePassword />
            </PageTransition>
          }
        />
        <Route
          path="student"
          element={
            <PageTransition>
              <StudentHome />
            </PageTransition>
          }
        />
        <Route
          path="/student/automated-interview"
          element={
            <PageTransition>
              <AutomatedInterviewPage />
            </PageTransition>
          }
        />
        <Route
          path="/student/mock-interview"
          element={
            <PageTransition>
              <MockInterviewPlatform />
            </PageTransition>
          }
        />
        <Route
          path="/admin/mock-interview"
          element={
            <PageTransition>
              <MockInterviewAdminPage />
            </PageTransition>
          }
        />
        <Route
          path="faculty"
          element={
            <PageTransition>
              <FacultyHome />
            </PageTransition>
          }
        />
        <Route
          path="admin"
          element={
            <PageTransition>
              <AdminHome />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <>
      <Provider store={mystore}>
        <Router>
          <AnimatedRoutes />
        </Router>
      </Provider>
    </>
  );
};

export default App;
