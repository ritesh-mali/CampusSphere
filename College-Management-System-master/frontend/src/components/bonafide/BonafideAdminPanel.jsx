import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CustomButton from "../CustomButton";
import Heading from "../Heading";
import { Check, X, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosWrapper from "../../utils/AxiosWrapper";

const BonafideAdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "pending", "approved", "rejected"

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axiosWrapper.get("/bonafide/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching all bonafide requests", error);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Set up a listener for storage updates to keep panels synced in real-time
    const handleStorageChange = (e) => {
      if (e.key === "cms_bonafide_sync") {
        fetchRequests();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axiosWrapper.patch(
        `/bonafide/${id}/status`,
        { requestStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Request successfully ${newStatus.toLowerCase()}`);
        fetchRequests();
        // Notify other tabs/views for cross-tab sync
        localStorage.setItem("cms_bonafide_sync", Date.now().toString());
        window.dispatchEvent(new Event("storage"));
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status", error);
      toast.error("Failed to update status");
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    const status = req.requestStatus || "Pending";
    return status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <div className="flex justify-between items-center w-full mb-6">
        <Heading title="Bonafide Certificate Requests" />
        
        {/* Filters */}
        <div className="flex items-center gap-2 bg-white/40 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          {["all", "pending", "approved", "rejected"].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                filter === opt
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-white/40 dark:bg-white/5 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <ClipboardList className="h-12 w-12 text-slate-400 mb-3" strokeWidth={1.5} />
            <p className="text-lg font-medium">No requests found</p>
            <p className="text-sm text-slate-400 mt-1">There are no {filter !== "all" ? filter : ""} requests at the moment.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Year/Sem</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredRequests.map((item) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                  >
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-950 dark:text-white">
                      {item.fullName}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {item.rollNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                      {item.year} (Sem {item.semester})
                    </td>
                    <td className="py-4 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (item.requestStatus || "").toLowerCase() === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                            : (item.requestStatus || "").toLowerCase() === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200"
                        }`}
                      >
                        {item.requestStatus || "Pending"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center items-center gap-2">
                        {(item.requestStatus || "").toLowerCase() === "pending" ? (
                          <>
                            <CustomButton
                              variant="primary"
                              className="!py-1.5 !px-3 !rounded-lg text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 border-none"
                              onClick={() => handleUpdateStatus(item._id, "Approved")}
                            >
                              <Check size={14} /> Approve
                            </CustomButton>
                            <CustomButton
                              variant="danger"
                              className="!py-1.5 !px-3 !rounded-lg text-xs flex items-center gap-1"
                              onClick={() => handleUpdateStatus(item._id, "Rejected")}
                            >
                              <X size={14} /> Reject
                            </CustomButton>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">No action required</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BonafideAdminPanel;
