import React, { useState } from "react";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import CustomButton from "../../components/CustomButton";
import "../../styles/sections/section-admin-profile.css";

const Profile = ({ profileData }) => {
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  if (!profileData) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="section-admin-profile max-w-6xl mx-auto p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-8 mb-12 border-b pb-8">
        <div className="flex items-center gap-8">
          <img
            src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
            alt="Profile"
            className="w-40 h-40 rounded-full object-cover ring-4 ring-blue-500 ring-offset-4"
          />
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 dark:text-white">
              {`${profileData.firstName} ${profileData.lastName}`}
            </h1>
            <p className="text-lg text-gray-600 mb-1 dark:text-slate-400">
              Employee ID: {profileData.employeeId}
            </p>
            <p className="text-lg text-blue-600 font-medium">
              {profileData.designation}
              {profileData.isSuperAdmin && " (Super Admin)"}
            </p>
          </div>
        </div>
        <CustomButton onClick={() => setShowUpdatePasswordModal(true)}>
          Update Password
        </CustomButton>
        {showUpdatePasswordModal && (
          <UpdatePasswordLoggedIn
            onClose={() => setShowUpdatePasswordModal(false)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Personal Information */}
        <div className="bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-md dark:border dark:border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200 dark:text-white dark:border-slate-800">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Email</label>
              <p className="text-gray-900 dark:text-white">{profileData.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Phone</label>
              <p className="text-gray-900 dark:text-white">{profileData.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Gender
              </label>
              <p className="text-gray-900 capitalize dark:text-white">{profileData.gender}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Blood Group
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.bloodGroup}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Date of Birth
              </label>
              <p className="text-gray-900 dark:text-white">{formatDate(profileData.dob)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Joining Date
              </label>
              <p className="text-gray-900 dark:text-white">
                {formatDate(profileData.joiningDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Salary
              </label>
              <p className="text-gray-900 dark:text-white">
                ₹{profileData.salary.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Status
              </label>
              <p className="text-gray-900 capitalize dark:text-white">{profileData.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Role</label>
              <p className="text-gray-900 capitalize dark:text-white">
                {profileData.isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-md dark:border dark:border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200 dark:text-white dark:border-slate-800">
            Address Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Address
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">City</label>
              <p className="text-gray-900 dark:text-white">{profileData.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">State</label>
              <p className="text-gray-900 dark:text-white">{profileData.state}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Pincode
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.pincode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Country
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.country}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-md dark:border dark:border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200 dark:text-white dark:border-slate-800">
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Name</label>
              <p className="text-gray-900 dark:text-white">
                {profileData.emergencyContact.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Relationship
              </label>
              <p className="text-gray-900 dark:text-white">
                {profileData.emergencyContact.relationship}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Phone</label>
              <p className="text-gray-900 dark:text-white">
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
