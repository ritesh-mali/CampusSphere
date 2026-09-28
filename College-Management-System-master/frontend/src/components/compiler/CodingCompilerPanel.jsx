import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import "../../styles/sections/section-compiler.css";

const starterCodeByLanguage = {
  javascript: `console.log("Hello from JavaScript");`,
  python: `print("Hello from Python")`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello from C++" << endl;
  return 0;
}`,
  c: `#include <stdio.h>

int main() {
  printf("Hello from C\\n");
  return 0;
}`,
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java");
  }
}`,
};

const CodingCompilerPanel = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCodeByLanguage.javascript);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("Run your code to see output.");
  const [isRunning, setIsRunning] = useState(false);

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("userToken")}` }),
    []
  );

  const handleLanguageChange = (value) => {
    setLanguage(value);
    setCode(starterCodeByLanguage[value] || "");
    setOutput("Run your code to see output.");
  };

  const runCode = async () => {
    if (!code.trim()) {
      toast.error("Please write code first");
      return;
    }
    try {
      setIsRunning(true);
      const response = await axiosWrapper.post(
        "/compiler/run",
        { language, code, stdin },
        { headers: tokenHeader }
      );
      setOutput(response?.data?.data?.output || "No output");
      toast.success("Code executed");
    } catch (error) {
      setOutput(error?.response?.data?.message || "Execution failed");
      toast.error(error?.response?.data?.message || "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="section-compiler rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white">
          Coding Compiler
        </h3>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm dark:border-slate-700 dark:text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-slate-300">
            Source Code
          </label>
          <textarea
            rows={14}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 font-mono text-sm dark:border-slate-700 dark:text-white"
          />
          <button
            onClick={runCode}
            disabled={isRunning}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-slate-300">
            Console (Input + Output)
          </label>
          <div className="h-[430px] overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-950 flex flex-col dark:border-slate-700 dark:bg-slate-900/50">
            <div className="flex-1 overflow-auto px-3 py-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 dark:text-slate-400">
                Output
              </p>
              <pre className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100 dark:text-white">
                {output}
              </pre>
            </div>
            <div className="px-3 py-2 border-t border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 dark:border-slate-700">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-slate-400">
                stdin (type here)
              </label>
              <input
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Provide input and click Run Code"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingCompilerPanel;
