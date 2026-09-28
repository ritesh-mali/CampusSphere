import React, { useMemo, useState, useEffect } from "react";
import axiosWrapper from "../../utils/AxiosWrapper";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  Bookmark,
  BookOpen,
  Brain,
  CalendarClock,
  ChevronRight,
  Compass,
  FileArchive,
  FileText,
  Filter,
  Flame,
  FolderHeart,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Moon,
  PlayCircle,
  Search,
  Share2,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  Users,
  Video,
  X,
  Eye,
  ThumbsUp,
} from "lucide-react";

const RESOURCE_TYPES = ["Notes", "PDF", "Video", "Paper", "Assignment", "Lab Manual"];
const SORT_OPTIONS = ["Latest", "Most Viewed", "Most Downloaded", "Favorites"];

const DUMMY_RESOURCES = [
  {
    id: "r1",
    title: "Deadlock Prevention and Avoidance",
    subject: "Operating Systems",
    semester: "5",
    department: "CSE",
    faculty: "Dr. Kavita Rao",
    topic: "Deadlocks",
    type: "PDF",
    description: "Detailed notes with Banker’s algorithm examples and diagrams.",
    date: "2026-04-19",
    downloads: 1640,
    views: 2960,
    likes: 242,
    size: "3.4 MB",
    thumbnail: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80",
    isVideo: false,
    isPdf: true,
    tags: ["important", "exam"],
    uploaderRole: "Faculty",
  },
  {
    id: "r2",
    title: "CPU Scheduling Visual Walkthrough",
    subject: "Operating Systems",
    semester: "5",
    department: "CSE",
    faculty: "Prof. Neha Bhat",
    topic: "CPU Scheduling",
    type: "Video",
    description: "Recorded lecture with real timeline simulations.",
    date: "2026-05-04",
    downloads: 900,
    views: 3640,
    likes: 510,
    size: "42 min",
    thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&q=80",
    isVideo: true,
    isPdf: false,
    tags: ["recommended", "visual"],
    uploaderRole: "Faculty",
  },
  {
    id: "r3",
    title: "DBMS Transactions Quick Notes",
    subject: "DBMS",
    semester: "4",
    department: "CSE",
    faculty: "Dr. Sameer Patil",
    topic: "Transactions",
    type: "Notes",
    description: "ACID properties and serializability in concise format.",
    date: "2026-03-28",
    downloads: 1245,
    views: 1988,
    likes: 310,
    size: "1.2 MB",
    thumbnail: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&q=80",
    isVideo: false,
    isPdf: true,
    tags: ["quick-revision"],
    uploaderRole: "Faculty",
  },
  {
    id: "r4",
    title: "CN Previous Year Paper Set (2020-2025)",
    subject: "Computer Networks",
    semester: "5",
    department: "CSE",
    faculty: "Prof. Arun Menon",
    topic: "Exam Prep",
    type: "Paper",
    description: "University papers with answer-pattern hints.",
    date: "2026-04-11",
    downloads: 2740,
    views: 3200,
    likes: 600,
    size: "5.1 MB",
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
    isVideo: false,
    isPdf: true,
    tags: ["highly-downloaded"],
    uploaderRole: "Faculty",
  },
  {
    id: "r5",
    title: "DSA Lab Manual Semester 3",
    subject: "Data Structures",
    semester: "3",
    department: "CSE",
    faculty: "Ms. Priyanka Shah",
    topic: "Lab Programs",
    type: "Lab Manual",
    description: "Practical questions and expected output snapshots.",
    date: "2026-02-21",
    downloads: 760,
    views: 1010,
    likes: 130,
    size: "2.9 MB",
    thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
    isVideo: false,
    isPdf: true,
    tags: ["lab"],
    uploaderRole: "Faculty",
  },
  {
    id: "r6",
    title: "AI Assignment Set - Unit 2",
    subject: "Artificial Intelligence",
    semester: "6",
    department: "CSE",
    faculty: "Dr. Aditi Kulkarni",
    topic: "Search Strategies",
    type: "Assignment",
    description: "Assignment pack with rubric and sample submissions.",
    date: "2026-05-05",
    downloads: 650,
    views: 1433,
    likes: 224,
    size: "780 KB",
    thumbnail: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1200&q=80",
    isVideo: false,
    isPdf: true,
    tags: ["new"],
    uploaderRole: "Faculty",
  },
];

const getTypeIcon = (type) => {
  if (type === "Video") return Video;
  if (type === "Paper") return FileArchive;
  if (type === "Assignment") return BookOpen;
  if (type === "Lab Manual") return FileText;
  return FileText;
};

const Material = () => {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    subject: "",
    semester: "",
    department: "",
    type: "",
    faculty: "",
    topic: "",
    sortBy: "Latest",
  });
  const [favorites, setFavorites] = useState([]);
  const [liked, setLiked] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await axiosWrapper.get("/material", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (res.data.success) {
        const fetched = res.data.data.map((m) => ({
          id: m._id,
          title: m.title,
          subject: m.subject?.name || "Unknown",
          semester: String(m.semester),
          department: m.branch?.name || "Unknown",
          faculty: m.faculty ? `${m.faculty.firstName} ${m.faculty.lastName}` : "Unknown",
          topic: m.title,
          type: m.type === 'lab-manual' ? 'Lab Manual' : m.type === 'pdf' ? 'PDF' : m.type.charAt(0).toUpperCase() + m.type.slice(1),
          description: "",
          date: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : "N/A",
          downloads: Math.floor(Math.random() * 500),
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 200),
          size: "Unknown",
          thumbnail: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80",
          isVideo: m.type === 'video',
          isPdf: m.type === 'pdf',
          file: m.file
        }));
        setResources(fetched);
      }
    } catch (err) {
      if(err.response?.status !== 404) {
        toast.error("Failed to load resources");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const options = useMemo(() => {
    const subjects = [...new Set(resources.map((item) => item.subject))];
    const semesters = [...new Set(resources.map((item) => item.semester))];
    const departments = [...new Set(resources.map((item) => item.department))];
    const faculties = [...new Set(resources.map((item) => item.faculty))];
    const topics = [...new Set(resources.map((item) => item.topic))];
    return { subjects, semesters, departments, faculties, topics };
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let list = resources.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.title, item.subject, item.topic, item.faculty, item.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesSubject = !filters.subject || item.subject === filters.subject;
      const matchesSemester = !filters.semester || item.semester === filters.semester;
      const matchesDepartment = !filters.department || item.department === filters.department;
      const matchesType = !filters.type || item.type === filters.type;
      const matchesFaculty = !filters.faculty || item.faculty === filters.faculty;
      const matchesTopic = !filters.topic || item.topic === filters.topic;
      const matchesTab = activeTab === "all" || item.type === activeTab;
      return (
        matchesSearch &&
        matchesSubject &&
        matchesSemester &&
        matchesDepartment &&
        matchesType &&
        matchesFaculty &&
        matchesTopic &&
        matchesTab
      );
    });

    if (filters.sortBy === "Most Viewed") list = [...list].sort((a, b) => b.views - a.views);
    if (filters.sortBy === "Most Downloaded")
      list = [...list].sort((a, b) => b.downloads - a.downloads);
    if (filters.sortBy === "Favorites")
      list = [...list].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
    if (filters.sortBy === "Latest") {
      list = [...list].sort((a, b) => {
        const dateA = a.date !== "N/A" ? new Date(a.date).getTime() : 0;
        const dateB = b.date !== "N/A" ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
    return list;
  }, [resources, search, filters, activeTab, favorites]);

  const stats = useMemo(() => {
    const total = resources.length;
    const pdfs = resources.filter((item) => item.isPdf).length;
    const videos = resources.filter((item) => item.isVideo).length;
    const papers = resources.filter((item) => item.type === "Paper").length;
    return [
      { label: "Total Resources", value: total, icon: LayoutDashboard },
      { label: "PDFs & Notes", value: pdfs, icon: FileText },
      { label: "Recorded Lectures", value: videos, icon: Video },
      { label: "Previous Papers", value: papers, icon: FileArchive },
      { label: "Saved Resources", value: favorites.length, icon: FolderHeart },
    ];
  }, [resources, favorites.length]);

  const groupedByTopic = useMemo(() => {
    return filteredResources.reduce((acc, item) => {
      const key = `${item.subject}::${item.topic}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredResources]);

  const groupedEntries = Object.entries(groupedByTopic);

  const categoryMeta = [
    { title: "Notes", icon: BookOpen },
    { title: "PDF", icon: FileText },
    { title: "Video", icon: PlayCircle },
    { title: "Paper", icon: FileArchive },
    { title: "Assignment", icon: GraduationCap },
    { title: "Lab Manual", icon: Compass },
  ];

  const triggerUploadAnimation = () => {
    setUploadProgress(1);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 14) + 7;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 180);
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleLike = (id) => {
    setLiked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div
      className={`w-full min-h-screen rounded-3xl p-4 md:p-6 lg:p-8 ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900"
      }`}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Digital Notes & Resource Hub</h1>
          <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Discover, preview, bookmark, and upload learning resources in one modern workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
              darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
            }`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -6 }}
            className={`rounded-2xl border p-4 backdrop-blur-xl ${
              darkMode
                ? "border-slate-700/60 bg-slate-900/60"
                : "border-white/70 bg-white/70 shadow-xl shadow-slate-200/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{item.label}</p>
                <h3 className="text-2xl font-bold">{item.value}</h3>
              </div>
              <item.icon className="text-cyan-400" />
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className={`sticky top-0 z-30 mt-6 rounded-2xl border p-3 backdrop-blur-xl ${
          darkMode ? "border-slate-700/60 bg-slate-900/80" : "border-white/70 bg-white/80"
        }`}
      >
        <div className="grid gap-3 lg:grid-cols-4">
          <div className={`col-span-2 flex items-center gap-2 rounded-xl px-3 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
            <Search size={16} className="text-cyan-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, topic, faculty or subject..."
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
          {[
            { key: "subject", label: "Subject", values: options.subjects },
            { key: "semester", label: "Semester", values: options.semesters },
            { key: "department", label: "Department", values: options.departments },
            { key: "type", label: "Resource Type", values: RESOURCE_TYPES },
            { key: "faculty", label: "Faculty", values: options.faculties },
            { key: "topic", label: "Topic", values: options.topics },
            { key: "sortBy", label: "Sort", values: SORT_OPTIONS },
          ].map((item) => (
            <select
              key={item.key}
              value={filters[item.key]}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  [item.key]: event.target.value,
                }))
              }
              className={`rounded-xl px-3 py-2 text-sm outline-none ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <option value="">{item.label === "Sort" ? "Sort by" : `All ${item.label}`}</option>
              {item.values.map((value) => (
                <option key={value} value={value}>
                  {item.key === "semester" ? `Semester ${value}` : value}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-3 py-1.5 text-sm transition ${activeTab === "all" ? "bg-cyan-500 text-white" : darkMode ? "bg-slate-800" : "bg-white"}`}
            >
              All
            </button>
            {categoryMeta.map((item) => (
              <button
                key={item.title}
                onClick={() => setActiveTab(item.title)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm transition ${
                  activeTab === item.title ? "bg-cyan-500 text-white" : darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                <item.icon size={14} />
                {item.title}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categoryMeta.map((item) => {
              const count = resources.filter((resource) => resource.type === item.title).length;
              return (
                <motion.div
                  key={item.title}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-2xl border p-4 ${
                    darkMode
                      ? "border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800"
                      : "border-slate-200 bg-gradient-to-br from-white to-cyan-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <item.icon className="text-cyan-500" />
                    <ChevronRight size={16} />
                  </div>
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{count} resources</p>
                </motion.div>
              );
            })}
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx + 1}`}
                  className={`h-40 animate-pulse rounded-2xl ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}
                />
              ))}
            </div>
          ) : groupedEntries.length === 0 ? (
            <div
              className={`rounded-2xl border border-dashed p-10 text-center ${
                darkMode ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"
              }`}
            >
              <Sparkles className="mx-auto mb-2 text-cyan-500" />
              No resources match these filters yet.
            </div>
          ) : (
            groupedEntries.map(([groupKey, items]) => {
              const [subject, topic] = groupKey.split("::");
              return (
                <div key={groupKey} className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    {subject} <span className="text-cyan-500">- {topic}</span>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => {
                      const TypeIcon = getTypeIcon(item.type);
                      const favorite = favorites.includes(item.id);
                      const isLiked = liked.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ y: -5 }}
                          className={`overflow-hidden rounded-2xl border ${
                            darkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                          }`}
                        >
                          <img src={item.thumbnail} alt={item.title} className="h-32 w-full object-cover" />
                          <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-1 text-xs text-cyan-400">
                                <TypeIcon size={12} />
                                {item.type}
                              </span>
                              <span className="text-xs text-slate-400">{item.size}</span>
                            </div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className={`line-clamp-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                              {item.description}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                              <span>{item.subject}</span>
                              <span>•</span>
                              <span>{item.faculty}</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Eye size={12} /> {item.views}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <ArrowDownToLine size={12} /> {item.downloads}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setSelectedResource(item)}
                                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Preview
                              </button>
                              <button onClick={() => window.open(`${process.env.REACT_APP_MEDIA_LINK}/${item.file}`)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                                Download
                              </button>
                              <button
                                onClick={() => toggleFavorite(item.id)}
                                className={`rounded-lg px-2 py-1.5 ${favorite ? "bg-pink-500 text-white" : darkMode ? "bg-slate-800" : "bg-slate-100"}`}
                              >
                                <Bookmark size={14} />
                              </button>
                              <button
                                onClick={() => toggleLike(item.id)}
                                className={`rounded-lg px-2 py-1.5 ${isLiked ? "bg-rose-500 text-white" : darkMode ? "bg-slate-800" : "bg-slate-100"}`}
                              >
                                <Heart size={14} />
                              </button>
                              <button className={`rounded-lg px-2 py-1.5 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                <Share2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Brain size={16} className="text-cyan-400" /> AI Recommendations
            </h3>
            <div className="space-y-3 text-sm">
              <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
                Continue Learning: <span className="font-semibold">CPU Scheduling</span>
              </p>
              <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
                Smart Suggestion: Review deadlock solved examples before assignment.
              </p>
              <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
                AI Summary: Top paper topics are network layers and congestion control.
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Flame size={16} className="text-orange-400" /> Trending Resources
            </h3>
            <ul className="space-y-2 text-sm">
              {resources
                .slice()
                .sort((a, b) => b.views - a.views)
                .slice(0, 4)
                .map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.title}</span>
                    <span className="text-xs text-cyan-400">{item.views}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className={`rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <TrendingUp size={16} className="text-emerald-400" /> Top Faculty Uploaders
            </h3>
            <ul className="space-y-2 text-sm">
              {[...new Set(resources.map((item) => item.faculty))]
                .slice(0, 4)
                .map((faculty) => (
                  <li key={faculty} className="flex items-center justify-between">
                    <span>{faculty}</span>
                    <Users size={14} className="text-cyan-400" />
                  </li>
                ))}
            </ul>
          </div>

          <div className={`rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <CalendarClock size={16} className="text-violet-400" /> Recently Viewed
            </h3>
            <ul className="space-y-2 text-sm">
              {favorites.length === 0 ? (
                <li className={darkMode ? "text-slate-400" : "text-slate-500"}>No saved resources yet.</li>
              ) : (
                resources
                  .filter((item) => favorites.includes(item.id))
                  .slice(0, 3)
                  .map((item) => <li key={item.id}>{item.title}</li>)
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 p-4 text-white shadow-xl">
          <Filter size={20} />
        </button>
      </div>

      <AnimatePresence>
        {selectedResource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={`w-full max-w-4xl rounded-2xl border p-4 ${
                darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedResource.title}</h3>
                <button onClick={() => setSelectedResource(null)} className="rounded-lg p-1">
                  <X />
                </button>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  {selectedResource.isVideo ? (
                    <video controls className="h-[340px] w-full rounded-xl bg-black">
                      <source src={`${process.env.REACT_APP_MEDIA_LINK}/${selectedResource.file}`} type="video/mp4" />
                    </video>
                  ) : (
                    <iframe
                      title="pdf-preview"
                      src={`${process.env.REACT_APP_MEDIA_LINK}/${selectedResource.file}`}
                      className="h-[340px] w-full rounded-xl"
                    />
                  )}
                </div>
                <div className={`rounded-xl p-3 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  <h4 className="mb-2 font-semibold">Lecture Notes Sidebar</h4>
                  <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    Add quick notes, bookmarks and important timestamps while watching.
                  </p>
                  <button onClick={() => window.open(`${process.env.REACT_APP_MEDIA_LINK}/${selectedResource.file}`)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white">
                    <ArrowDownToLine size={14} /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl border p-5 ${
                darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Faculty Upload Studio</h3>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setUploadProgress(0);
                  }}
                >
                  <X />
                </button>
              </div>
              <div
                onClick={triggerUploadAnimation}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center ${
                  darkMode ? "border-slate-600 bg-slate-800/70" : "border-slate-300 bg-slate-100"
                }`}
              >
                <Upload className="mx-auto mb-2 text-cyan-500" />
                <p className="font-medium">Drag and drop files or click to upload</p>
                <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Supports PDFs, notes, recorded lectures, thumbnails and tags.
                </p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input className={`rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} placeholder="Title" />
                <input className={`rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} placeholder="Subject" />
                <input className={`rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} placeholder="Semester" />
                <input className={`rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} placeholder="Department" />
                <input className={`rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} placeholder="Topic / Tags" />
                <input className={`rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} placeholder="Resource Type" />
              </div>
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className={`h-2 w-full rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-cyan-400">Upload Progress: {uploadProgress}%</p>
                </div>
              )}
              <button className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Publish Resource
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Material;
