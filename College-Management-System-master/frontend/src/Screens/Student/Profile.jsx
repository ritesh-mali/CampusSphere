import React, { useState } from "react";
import CustomButton from "../../components/CustomButton";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import "../../styles/sections/section-student-profile.css";

const Profile = ({ profileData }) => {
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  if (!profileData) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="section-student-profile max-w-6xl mx-auto p-3 sm:p-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 mb-8 shadow-xl text-white">
        <div className="absolute -top-12 -right-8 h-36 w-36 rounded-full bg-white/20 blur-2xl animate-pulse" />
        <div className="absolute -bottom-8 -left-10 h-28 w-28 rounded-full bg-cyan-300/30 blur-2xl animate-pulse" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img
              src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
              alt="Profile"
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-white/70 ring-offset-4 ring-offset-transparent shadow-xl"
            />
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-1">
                {`${profileData.firstName} ${profileData.middleName} ${profileData.lastName}`}
              </h1>
              <p className="text-sm sm:text-base text-blue-100 mb-1">
                Enrollment No: {profileData.enrollmentNo}
              </p>
              <p className="text-sm sm:text-lg text-cyan-100 font-semibold">
                {profileData.branchId.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CustomButton
              onClick={() => setShowPasswordUpdate(!showPasswordUpdate)}
              variant="primary"
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white border border-white/30"
            >
              {showPasswordUpdate ? "Hide" : "Update Password"}
            </CustomButton>
          </div>
        </div>
      </div>

      {showPasswordUpdate && (
        <UpdatePasswordLoggedIn onClose={() => setShowPasswordUpdate(false)} />
      )}

      <div className="grid grid-cols-1 gap-12">
        {/* Personal Information */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 transition-all duration-300 hover:-translate-y-0.5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gender
              </label>
              <p className="text-gray-900 dark:text-gray-100 capitalize">{profileData.gender}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Blood Group
              </label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.bloodGroup}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date of Birth
              </label>
              <p className="text-gray-900 dark:text-gray-100">{formatDate(profileData.dob)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Semester
              </label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.semester}</p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 transition-all duration-300 hover:-translate-y-0.5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            Address Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Address
              </label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.state}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pincode
              </label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.pincode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Country
              </label>
              <p className="text-gray-900 dark:text-gray-100">{profileData.country}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 transition-all duration-300 hover:-translate-y-0.5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
              <p className="text-gray-900 dark:text-gray-100">
                {profileData.emergencyContact.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Relationship
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {profileData.emergencyContact.relationship}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="text-gray-900 dark:text-gray-100">
                {profileData.emergencyContact.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
