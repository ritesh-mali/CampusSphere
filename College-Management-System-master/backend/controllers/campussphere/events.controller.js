const mongoose = require("mongoose");
const ApiResponse = require("../../utils/ApiResponse");
const CampusEvent = require("../../models/campus-event.model");
const CampusEventRegistration = require("../../models/campus-event-registration.model");
const { createNotification } = require("../../campussphere/notificationService");

function eventStatus(ev) {
  const t = new Date(ev.eventDatetime).getTime();
  const now = Date.now();
  if (now < t) return "upcoming";
  if (now < t + 3 * 60 * 60 * 1000) return "ongoing";
  return "completed";
}

function toEventDto(ev, registrationCount) {
  return {
    id: ev._id.toString(),
    title: ev.title,
    description: ev.description,
    event_datetime: new Date(ev.eventDatetime).toISOString(),
    location: ev.location,
    created_by: ev.createdBy,
    creator_role: ev.creatorRole,
    registration_count: registrationCount,
    status: eventStatus(ev),
  };
}

async function listEvents(req, res) {
  const events = await CampusEvent.find().sort({ eventDatetime: 1 }).lean();
  const rows = await Promise.all(
    events.map(async (ev) => {
      const registrationCount = await CampusEventRegistration.countDocuments({
        eventId: ev._id,
      });
      return toEventDto(ev, registrationCount);
    })
  );
  return ApiResponse.success(rows, "Events loaded").send(res);
}

async function getEvent(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return ApiResponse.badRequest("Invalid event id").send(res);
  }
  const ev = await CampusEvent.findById(req.params.id).lean();
  if (!ev) return ApiResponse.notFound("Event not found").send(res);
  const registrationCount = await CampusEventRegistration.countDocuments({
    eventId: ev._id,
  });
  return ApiResponse.success(toEventDto(ev, registrationCount), "Event loaded").send(res);
}

async function createEvent(req, res) {
  const { title, description, event_datetime, location } = req.body;
  if (!title || !event_datetime || !location) {
    return ApiResponse.badRequest("title, event_datetime, location required").send(res);
  }
  const dt = new Date(event_datetime);
  if (Number.isNaN(dt.getTime())) {
    return ApiResponse.badRequest("Invalid event_datetime").send(res);
  }
  const doc = await CampusEvent.create({
    title,
    description: description || "",
    eventDatetime: dt,
    location,
    createdBy: String(req.userId),
    creatorRole: req.campusCreatorRole || "faculty",
  });
  return ApiResponse.created({ id: doc._id.toString() }, "Event created").send(res);
}

async function updateEvent(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return ApiResponse.badRequest("Invalid event id").send(res);
  }
  const id = req.params.id;
  const { title, description, event_datetime, location } = req.body;
  const existing = await CampusEvent.findById(id);
  if (!existing) return ApiResponse.notFound("Event not found").send(res);
  if (String(existing.createdBy) !== String(req.userId)) {
    return ApiResponse.forbidden("You can only edit your own events").send(res);
  }
  const update = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (event_datetime !== undefined) {
    const dt = new Date(event_datetime);
    if (Number.isNaN(dt.getTime())) {
      return ApiResponse.badRequest("Invalid event_datetime").send(res);
    }
    update.eventDatetime = dt;
  }
  if (location !== undefined) update.location = location;
  if (!Object.keys(update).length) {
    return ApiResponse.badRequest("No fields to update").send(res);
  }
  await CampusEvent.findByIdAndUpdate(id, update);
  return ApiResponse.success({ id }, "Event updated").send(res);
}

async function registerStudent(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return ApiResponse.badRequest("Invalid event id").send(res);
  }
  const eventId = req.params.id;
  const studentId = String(req.userId);
  const ev = await CampusEvent.findById(eventId).select("title");
  if (!ev) return ApiResponse.notFound("Event not found").send(res);
  try {
    await CampusEventRegistration.create({ studentId, eventId });
  } catch (e) {
    if (e.code === 11000) {
      return ApiResponse.conflict("Already registered").send(res);
    }
    throw e;
  }
  await createNotification(
    studentId,
    `You registered for: ${ev.title}`,
    "event_registration",
    { sendEmail: false }
  );
  return ApiResponse.created(null, "Registered successfully").send(res);
}

async function listRegistrations(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return ApiResponse.badRequest("Invalid event id").send(res);
  }
  const regs = await CampusEventRegistration.find({ eventId: req.params.id })
    .sort({ createdAt: 1 })
    .lean();
  const rows = regs.map((r) => ({
    student_id: r.studentId,
    registered_at: r.createdAt,
  }));
  return ApiResponse.success(rows, "Registrations loaded").send(res);
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  registerStudent,
  listRegistrations,
};
