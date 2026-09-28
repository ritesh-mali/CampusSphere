import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import { IoMdClose } from "react-icons/io";
import CustomButton from "./CustomButton";

const UpdatePasswordLoggedIn = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const userToken = localStorage.getItem("userToken");
  const userType = localStorage.getItem("userType");

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosWrapper.post(
        `/${userType.toLowerCase()}/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full h-full flex justify-center items-center bg-black/60 fixed top-0 left-0 z-50 backdrop-blur-sm">
      <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[92%] sm:w-[80%] md:w-[55%] border border-gray-200 dark:border-gray-700 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100 dark:text-white">
            Update Password
          </h2>
          <CustomButton
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 p-2 rounded-full text-white"
          >
            <IoMdClose className="text-2xl" />
          </CustomButton>
        </div>
        <form onSubmit={handlePasswordUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 dark:text-slate-300">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 dark:text-slate-300">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 dark:text-slate-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default UpdatePasswordLoggedIn;
