import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../components/Navbar";
import GlassCard from "./components/GlassCard";
import Button from "../components/ui/Button";
import { mockInterviewAdminApi } from "./api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MockInterviewAdminPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/");
      return;
    }

    Promise.all([
      mockInterviewAdminApi.getAnalytics(),
      mockInterviewAdminApi.getUsers(),
      mockInterviewAdminApi.getReports(),
      mockInterviewAdminApi.getCategories(),
    ])
      .then(([a, u, r, c]) => {
        setAnalytics(a.data?.data);
        setUsers(u.data?.data?.users || []);
        setReports(r.data?.data?.reports || []);
        setCategories(c.data?.data?.categories || []);
      })
      .catch(() => {
        toast.error("Admin access required or failed to load data");
        navigate("/admin");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const roleChartData =
    analytics?.analytics?.roleBreakdown?.map((r) => ({
      role: r._id || "unknown",
      count: r.count,
    })) || [];

  if (loading) {
    return (
      <>
        <Navbar />
        <p className="text-center py-20 text-slate-500">Loading admin dashboard...</p>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mock Interview Admin
          </h1>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            Back to admin
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Sessions", analytics?.analytics?.totalSessions],
            ["Completed", analytics?.analytics?.completedSessions],
            ["Reports", analytics?.analytics?.totalResults],
            ["Avg Score", `${analytics?.analytics?.averageOverallScore}%`],
          ].map(([label, val]) => (
            <GlassCard key={label} className="p-4 text-center">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-brand-600">{val ?? 0}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-5">
          <h2 className="font-semibold mb-3">Interviews by role</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="role" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Estimated AI API calls: {analytics?.analytics?.aiUsageEstimate}
          </p>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-5 max-h-96 overflow-auto">
            <h2 className="font-semibold mb-3">Users</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Student</th>
                  <th>Interviews</th>
                  <th>Avg</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.interviewCount}</td>
                    <td>{u.averageScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <GlassCard className="p-5 max-h-96 overflow-auto">
            <h2 className="font-semibold mb-3">Recent reports</h2>
            <ul className="space-y-2 text-sm">
              {reports.slice(0, 15).map((r) => (
                <li
                  key={r._id}
                  className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2"
                >
                  <span>
                    {r.userId?.firstName} {r.userId?.lastName} — {r.role}
                  </span>
                  <span className="font-semibold text-brand-600">
                    {r.scores?.overall}%
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <h2 className="font-semibold mb-3">Interview categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.key}
                className={`px-3 py-1 rounded-full text-xs ${
                  cat.isActive
                    ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {cat.label}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>
      <Toaster position="bottom-center" />
    </>
  );
};

export default MockInterviewAdminPage;
