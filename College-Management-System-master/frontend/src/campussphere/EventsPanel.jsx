import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Heading from "../components/Heading";
import CustomButton from "../components/CustomButton";
import toast from "react-hot-toast";
import {
  fetchEvents,
  fetchEvent,
  registerForEvent,
  createEvent,
  updateEvent,
  fetchEventRegistrations,
} from "./api";
import "../styles/sections/section-events.css";

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function localInputToMysql(local) {
  if (!local) return null;
  // datetime-local: "YYYY-MM-DDTHH:mm" → MySQL "YYYY-MM-DD HH:mm:00"
  return `${local.replace("T", " ")}:00`;
}

function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = new Date(target).getTime() - now;
  if (t <= 0) return <span className="text-gray-500">Started or past</span>;
  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return (
    <span className="font-mono text-blue-600 dark:text-blue-400">
      {d}d {h}h {m}m {s}s
    </span>
  );
}

/**
 * @param {'student' | 'faculty' | 'admin'} mode
 */
const EventsPanel = ({ mode }) => {
  const userData = useSelector((s) => s.userData);
  const myId = userData?._id ? String(userData._id) : "";
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [regs, setRegs] = useState([]);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    event_datetime: "",
    location: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    event_datetime: "",
    location: "",
  });

  const load = useCallback(async () => {
    try {
      const { data } = await fetchEvents();
      if (data.success) setEvents(data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load events");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id) => {
    try {
      const { data } = await fetchEvent(id);
      if (data.success) {
        const ev = data.data;
        setSelected(ev);
        setEditForm({
          title: ev.title,
          description: ev.description || "",
          event_datetime: toLocalInput(ev.event_datetime),
          location: ev.location,
        });
        if (mode === "admin") {
          const r = await fetchEventRegistrations(id);
          if (r.data.success) setRegs(r.data.data || []);
        } else {
          setRegs([]);
        }
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load event");
    }
  };

  const onRegister = async () => {
    if (!selected) return;
    try {
      const { data } = await registerForEvent(selected.id);
      if (data.success) toast.success(data.message || "Registered");
    } catch (e) {
      toast.error(e.response?.data?.message || "Registration failed");
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createEvent({
        ...createForm,
        event_datetime: localInputToMysql(createForm.event_datetime),
      });
      if (data.success) {
        toast.success("Event created");
        setCreateForm({
          title: "",
          description: "",
          event_datetime: "",
          location: "",
        });
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Create failed");
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const { data } = await updateEvent(selected.id, {
        title: editForm.title,
        description: editForm.description,
        event_datetime: localInputToMysql(editForm.event_datetime),
        location: editForm.location,
      });
      if (data.success) {
        toast.success("Updated");
        openDetail(selected.id);
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const canEdit = selected && String(selected.created_by) === myId;

  return (
    <div className="section-events w-full py-4 px-2">
      <Heading title="Campus events" />
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-6">
        {mode === "student"
          ? "Browse hackathons, workshops, and seminars. Register in one click."
          : "Create and manage events. Students see them on their dashboard."}
      </p>

      {(mode === "faculty" || mode === "admin") && (
        <form
          onSubmit={onCreate}
          className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-3 max-w-xl"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">New event</h3>
          <input
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            placeholder="Title"
            value={createForm.title}
            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            placeholder="Description"
            rows={2}
            value={createForm.description}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <input
            type="datetime-local"
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            value={createForm.event_datetime}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, event_datetime: e.target.value }))
            }
            required
          />
          <input
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            placeholder="Location"
            value={createForm.location}
            onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
            required
          />
          <CustomButton type="submit">Create event</CustomButton>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {events.map((ev) => (
          <button
            type="button"
            key={ev.id}
            onClick={() => openDetail(ev.id)}
            className="text-left rounded-2xl border border-blue-100 dark:border-gray-700 p-5 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white">{ev.title}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  ev.status === "upcoming"
                    ? "bg-green-100 text-green-800"
                    : ev.status === "ongoing"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-gray-200 text-gray-700"
                }`}
              >
                {ev.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(ev.event_datetime).toLocaleString()} · {ev.location}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Countdown: <Countdown target={ev.event_datetime} />
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 max-w-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {selected.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
            {selected.description}
          </p>
          <p className="text-sm mt-2">
            <strong>When:</strong> {new Date(selected.event_datetime).toLocaleString()}
          </p>
          <p className="text-sm">
            <strong>Where:</strong> {selected.location}
          </p>
          <p className="text-sm mt-2">
            <strong>Countdown:</strong> <Countdown target={selected.event_datetime} />
          </p>

          {mode === "student" && (
            <CustomButton className="mt-4" onClick={onRegister}>
              Register
            </CustomButton>
          )}

          {(mode === "faculty" || mode === "admin") && canEdit && (
            <form onSubmit={onUpdate} className="mt-6 space-y-2 border-t pt-4 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">Edit your event</h4>
              <input
                className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
                rows={2}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <input
                type="datetime-local"
                className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
                value={editForm.event_datetime}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, event_datetime: e.target.value }))
                }
              />
              <input
                className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
              />
              <CustomButton type="submit">Save changes</CustomButton>
            </form>
          )}

          {mode === "admin" && (
            <div className="mt-6 border-t pt-4 dark:border-gray-700">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                Registered students (IDs)
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
                {regs.map((r) => (
                  <li key={`${r.student_id}-${r.registered_at}`}>
                    {r.student_id} — {new Date(r.registered_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <CustomButton variant="secondary" className="mt-4" onClick={() => setSelected(null)}>
            Close detail
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default EventsPanel;
