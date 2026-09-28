import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-bonafide.css";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const BonafidePanel = () => {
  const [form, setForm] = useState({
    fullName: "",
    rollNumber: "",
    year: "",
    semester: "",
    reason: "",
  });
  const [config, setConfig] = useState({ keyId: "", amount: 10 });
  const [requests, setRequests] = useState([]);
  const [isPaying, setIsPaying] = useState(false);

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("userToken")}` }),
    []
  );

  const fetchData = async () => {
    try {
      const [configRes, requestRes] = await Promise.all([
        axiosWrapper.get("/bonafide/config", { headers: tokenHeader }),
        axiosWrapper.get("/bonafide/my", { headers: tokenHeader }),
      ]);
      setConfig(configRes?.data?.data || { keyId: "", amount: 10 });
      setRequests(requestRes?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load bonafide details");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const payAndRequest = async () => {
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

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error("Razorpay SDK failed to load");
      return;
    }

    try {
      setIsPaying(true);
      const orderResponse = await axiosWrapper.post(
        "/bonafide/create-order",
        {},
        { headers: tokenHeader }
      );
      const { orderId, amountPaise, currency } = orderResponse?.data?.data || {};

      const options = {
        key: config.keyId,
        amount: amountPaise,
        currency: currency || "INR",
        name: "College Management System",
        description: "Bonafide Certificate Fee",
        order_id: orderId,
        handler: async function (response) {
          try {
            await axiosWrapper.post(
              "/bonafide/verify-payment",
              {
                fullName: form.fullName,
                rollNumber: form.rollNumber,
                year: form.year,
                semester: Number(form.semester),
                reason: form.reason,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: tokenHeader }
            );
            toast.success("Bonafide request submitted successfully");
            setForm({
              fullName: "",
              rollNumber: "",
              year: "",
              semester: "",
              reason: "",
            });
            fetchData();
          } catch (error) {
            toast.error(
              error?.response?.data?.message || "Payment verification failed"
            );
          }
        },
        theme: { color: "#2563eb" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create order");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="section-bonafide rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Bonafide Certificate
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Bonafide fee: INR {config.amount}. Payment is required per request.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="Full Name"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm"
          />
          <input
            value={form.rollNumber}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, rollNumber: e.target.value }))
            }
            placeholder="Roll Number"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm"
          />
          <input
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
            placeholder="Year (e.g. 2nd Year)"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm"
          />
          <select
            value={form.semester}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, semester: e.target.value }))
            }
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm"
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
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm"
        />
        <button
          onClick={payAndRequest}
          disabled={isPaying}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPaying ? "Processing..." : "Pay INR 10 and Request Bonafide"}
        </button>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          My Requests
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
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
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {item.fullName}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {item.rollNumber}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {item.year}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {item.semester}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {item.reason}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      INR {item.amount}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
                        {item.requestStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-gray-600 dark:text-gray-300">
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
