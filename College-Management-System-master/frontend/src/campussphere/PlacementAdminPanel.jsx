import React, { useEffect, useState, useCallback } from "react";
import Heading from "../components/Heading";
import CustomButton from "../components/CustomButton";
import toast from "react-hot-toast";
import {
  fetchPlacementCompanies,
  adminSaveCompany,
  adminSaveQuestion,
  adminListQuestions,
} from "./api";
import "../styles/sections/section-placement-admin.css";

const SECTIONS = [
  { id: "aptitude", label: "Aptitude" },
  { id: "technical", label: "Technical" },
  { id: "hr", label: "HR" },
];

const PlacementAdminPanel = () => {
  const [companies, setCompanies] = useState([]);
  const [companyForm, setCompanyForm] = useState({
    id: "",
    name: "",
    slug: "",
    description: "",
  });
  const [qForm, setQForm] = useState({
    id: "",
    company_id: "",
    section: "aptitude",
    question_text: "",
    optionsText: "Option A\nOption B\nOption C\nOption D",
    correct_index: 0,
  });
  const [questions, setQuestions] = useState([]);

  const loadCompanies = useCallback(async () => {
    try {
      const { data } = await fetchPlacementCompanies();
      if (data.success) setCompanies(data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Load failed");
    }
  }, []);

  const loadQuestions = useCallback(async (companyId) => {
    try {
      const { data } = await adminListQuestions(companyId || undefined);
      if (data.success) setQuestions(data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Questions load failed");
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadQuestions();
  }, [loadCompanies, loadQuestions]);

  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      const body = {
        id: companyForm.id?.trim() || undefined,
        name: companyForm.name,
        slug: companyForm.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: companyForm.description,
      };
      const { data } = await adminSaveCompany(body);
      if (data.success) {
        toast.success(data.message);
        setCompanyForm({ id: "", name: "", slug: "", description: "" });
        loadCompanies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    const options = qForm.optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) {
      toast.error("Enter at least 2 options (one per line)");
      return;
    }
    try {
      const body = {
        id: qForm.id?.trim() || undefined,
        company_id: qForm.company_id,
        section: qForm.section,
        question_text: qForm.question_text,
        options,
        correct_index: Number(qForm.correct_index) || 0,
      };
      const { data } = await adminSaveQuestion(body);
      if (data.success) {
        toast.success(data.message);
        setQForm({
          id: "",
          company_id: qForm.company_id,
          section: qForm.section,
          question_text: "",
          optionsText: "A\nB\nC\nD",
          correct_index: 0,
        });
        loadQuestions(qForm.company_id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  return (
    <div className="section-placement-admin w-full py-4 px-2 max-w-4xl">
      <Heading title="Placement hub — admin" />
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-6 dark:text-slate-400">
        Add companies and MCQs. Slug should be unique (e.g. tcs, infosys).
      </p>

      <form
        onSubmit={saveCompany}
        className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white dark:bg-gray-900 dark:border-slate-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">Company</h3>
        <input
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 text-sm dark:border-slate-800 dark:text-slate-200"
          placeholder="Existing ID (leave empty to create)"
          value={companyForm.id}
          onChange={(e) => setCompanyForm((f) => ({ ...f, id: e.target.value }))}
        />
        <input
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
          placeholder="Name"
          value={companyForm.name}
          onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
          placeholder="slug"
          value={companyForm.slug}
          onChange={(e) => setCompanyForm((f) => ({ ...f, slug: e.target.value }))}
          required
        />
        <textarea
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
          placeholder="Description"
          rows={2}
          value={companyForm.description}
          onChange={(e) => setCompanyForm((f) => ({ ...f, description: e.target.value }))}
        />
        <CustomButton type="submit">Save company</CustomButton>
      </form>

      <form
        onSubmit={saveQuestion}
        className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white dark:bg-gray-900 dark:border-slate-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">Question (MCQ)</h3>
        <input
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 text-sm dark:border-slate-800 dark:text-slate-200"
          placeholder="Question ID (for edit only)"
          value={qForm.id}
          onChange={(e) => setQForm((f) => ({ ...f, id: e.target.value }))}
        />
        <select
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
          value={qForm.company_id}
          onChange={(e) => setQForm((f) => ({ ...f, company_id: e.target.value }))}
          required
        >
          <option value="">Select company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
          value={qForm.section}
          onChange={(e) => setQForm((f) => ({ ...f, section: e.target.value }))}
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <textarea
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
          placeholder="Question text"
          rows={2}
          value={qForm.question_text}
          onChange={(e) => setQForm((f) => ({ ...f, question_text: e.target.value }))}
          required
        />
        <textarea
          className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 font-mono text-sm dark:border-slate-800 dark:text-slate-200"
          placeholder="Options, one per line"
          rows={4}
          value={qForm.optionsText}
          onChange={(e) => setQForm((f) => ({ ...f, optionsText: e.target.value }))}
          required
        />
        <label className="text-sm text-gray-700 dark:text-gray-300 dark:text-slate-300">
          Correct option index (0 = first line)
          <input
            type="number"
            min={0}
            className="ml-2 w-20 border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-slate-800 dark:text-slate-200"
            value={qForm.correct_index}
            onChange={(e) => setQForm((f) => ({ ...f, correct_index: e.target.value }))}
          />
        </label>
        <CustomButton type="submit">Save question</CustomButton>
      </form>

      <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Recent questions</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 text-xs dark:border-slate-800">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 dark:bg-slate-900/40">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Company</th>
              <th className="text-left p-2">Section</th>
              <th className="text-left p-2">Question</th>
            </tr>
          </thead>
          <tbody>
            {questions.slice(0, 40).map((q) => (
              <tr key={q.id} className="border-t border-gray-200 dark:border-gray-700 dark:border-slate-800">
                <td className="p-2">{q.id}</td>
                <td className="p-2">{q.company_name}</td>
                <td className="p-2">{q.section}</td>
                <td className="p-2 max-w-md truncate">{q.question_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlacementAdminPanel;
