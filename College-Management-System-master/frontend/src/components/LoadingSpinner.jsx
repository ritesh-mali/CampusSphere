import React from "react";

const LoadingSpinner = ({ label = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-slate-400">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
