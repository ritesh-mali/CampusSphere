import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-bonafide.css";
const BonafidePanel = () => {
  const [form, setForm] = useState({
    fullName: "",
    rollNumber: "",
    year: "",
    semester: "",
    reason: "",
  });
  const [config, setConfig] = useState({ keyId: "rzp_test_dummy", amount: 10 });
  const [requests, setRequests] = useState([]);
  const [isPaying, setIsPaying] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axiosWrapper.get("/bonafide/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching bonafide config", error);
    }
  };

  const fetchProfileAndRequests = async () => {
    let currentRollNumber = "";
    try {
      const token = localStorage.getItem("userToken");
      const response = await axiosWrapper.get("/student/my-details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const profile = response.data.data;
        setStudentProfile(profile);
        setForm((prev) => ({
          ...prev,
          fullName: `${profile.firstName} ${profile.lastName}`,
          rollNumber: profile.enrollmentNo || "",
        }));
        currentRollNumber = profile.enrollmentNo || "";
      }
    } catch (error) {
      console.log("Not logged in as student or profile API failed. Using manual input.");
    }

    try {
      const token = localStorage.getItem("userToken");
      const requestsRes = await axiosWrapper.get("/bonafide/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (requestsRes.data.success) {
        setRequests(requestsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching my requests", error);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchProfileAndRequests();
    
    // Listen to storage events to auto-refresh when admin modifies status
    const handleStorageChange = (e) => {
      if (e.key === "cms_bonafide_sync") {
        fetchProfileAndRequests();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [studentProfile?.enrollmentNo]);

  const submitRequest = async () => {
    if (
      !form.fullName.trim() ||
      !form.rollNumber.trim() ||
      !form.year.trim() ||
      !form.semester ||
      !form.reason.trim()
    ) {
      toast.error("Please fill all bonafide form fields");
      return;
    }

    try {
      setIsPaying(true);
      toast.loading("Submitting request...");

      const token = localStorage.getItem("userToken");
      const res = await axiosWrapper.post(
        "/bonafide/verify-payment",
        {
          fullName: form.fullName.trim(),
          rollNumber: form.rollNumber.trim(),
          year: form.year.trim(),
          semester: Number(form.semester),
          reason: form.reason.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Request Submitted Successfully!");
        setForm((prev) => ({
          ...prev,
          year: "",
          semester: "",
          reason: "",
        }));
        fetchProfileAndRequests();
        
        // Notify other tabs/views for cross-tab sync
        localStorage.setItem("cms_bonafide_sync", Date.now().toString());
        window.dispatchEvent(new Event("storage"));
      } else {
        toast.error(res.data.message || "Failed to submit request");
      }
    } catch (error) {
      toast.error(error.message || "Submission failed. Please try again.");
    } finally {
      setIsPaying(false);
      toast.dismiss();
    }
  };

  return (
    <div className="section-bonafide rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm dark:border-slate-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 dark:text-white">
        Bonafide Certificate
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 dark:text-slate-400">
        Fill out the details below to submit a new bonafide certificate request.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="Full Name"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm dark:border-slate-700 dark:text-white"
          />
          <input
            value={form.rollNumber}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, rollNumber: e.target.value }))
            }
            placeholder="Roll Number"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm dark:border-slate-700 dark:text-white"
          />
          <input
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
            placeholder="Year (e.g. 2nd Year)"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm dark:border-slate-700 dark:text-white"
          />
          <select
            value={form.semester}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, semester: e.target.value }))
            }
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm dark:border-slate-700 dark:text-white"
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={3}
          value={form.reason}
          onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Reason for bonafide"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm dark:border-slate-700 dark:text-white"
        />
        <button
          onClick={submitRequest}
          disabled={isPaying}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPaying ? "Submitting..." : "Submit Bonafide Request"}
        </button>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 dark:text-white">
          My Requests
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700 dark:border-slate-800">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Roll No</th>
                <th className="py-2 pr-3">Year</th>
                <th className="py-2 pr-3">Sem</th>
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      {item.fullName}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      {item.rollNumber}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      {item.year}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      {item.semester}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      {item.reason}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 dark:text-slate-300">
                      INR {item.amount}
                    </td>
                    <td className="py-2 pr-3">
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-gray-600 dark:text-gray-300 dark:text-slate-400">
                    No bonafide requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BonafidePanel;
