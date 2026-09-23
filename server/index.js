import "dotenv/config";
import express from "express";
import { db } from "./libs/firebase.js";
import { getAuth } from "firebase-admin/auth";
import cors from "cors";
import { requireAdmin, requireAuth } from "./middleware/authMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "100kb" }));

const safeServerError = (res, message = "An unexpected server error occurred.") =>
  res.status(500).json({ error: message });

const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const validateStudentInput = (data, { requirePassword = true } = {}) => {
  const fields = ["name", "email", "course", "semester", "rollNumber", "phone"];
  const missingField = fields.find(
    (field) => typeof data[field] !== "string" && typeof data[field] !== "number" || String(data[field]).trim() === ""
  );

  if (missingField) return `${missingField} is required`;
  if (!isValidEmail(data.email)) return "A valid email is required";
  if (!Number.isInteger(Number(data.semester)) || Number(data.semester) < 1 || Number(data.semester) > 8) {
    return "Semester must be a number from 1 to 8";
  }
  if (requirePassword && (typeof data.password !== "string" || data.password.length < 8)) {
    return "Password must be at least 8 characters";
  }

  return null;
};

const reserveStudentId = async () => {
  const counterRef = db.collection("metadata").doc("counters");
  let reservedId;

  await db.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef);
    let nextNumber = (counterSnapshot.exists ? counterSnapshot.data().studentIdSequence : 0) + 1;
    let studentRef = db.collection("students").doc(`ST${String(nextNumber).padStart(3, "0")}`);
    let studentSnapshot = await transaction.get(studentRef);

    while (studentSnapshot.exists) {
      nextNumber += 1;
      studentRef = db.collection("students").doc(`ST${String(nextNumber).padStart(3, "0")}`);
      studentSnapshot = await transaction.get(studentRef);
    }

    reservedId = studentRef.id;
    transaction.set(counterRef, { studentIdSequence: nextNumber }, { merge: true });
  });

  return reservedId;
};

// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
  res.send("Progova backend is running successfully!");
});

// =====================================================
// STUDENTS
// =====================================================

// GET all students
app.get("/api/students", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("students").get();

    const students = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ data: students });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to fetch students");
  }
});

// ADD new student
app.post("/api/students", requireAdmin, async (req, res) => {
  const studentData = req.body;
  const validationError = validateStudentInput(studentData);
  if (validationError) return res.status(400).json({ error: validationError });

  const duplicateRoll = await db.collection("students")
    .where("rollNumber", "==", studentData.rollNumber.trim())
    .limit(1)
    .get();
  if (!duplicateRoll.empty) return res.status(409).json({ error: "A student with this roll number already exists." });

  let uid;
  let studentId;
  try {
    const userRecord = await getAuth().createUser({
      email: studentData.email.trim(),
      password: studentData.password,
      displayName: studentData.name.trim(),
    });

    uid = userRecord.uid;
    studentId = await reserveStudentId();
    const joinDate = new Date().toISOString().split("T")[0];

    const userProfile = {
      uid,
      name: studentData.name.trim(),
      email: studentData.email.trim(),
      role: "student",
      studentId,
    };

    const studentProfile = {
      uid,
      id: studentId,
      name: studentData.name.trim(),
      email: studentData.email.trim(),
      role: "student",
      course: studentData.course,
      semester: Number(studentData.semester),
      rollNumber: studentData.rollNumber.trim(),
      phone: studentData.phone.trim(),
      joinDate,
      status: "Active",
    };

    await db.collection("users").doc(uid).set(userProfile);
    await db.collection("students").doc(studentId).set(studentProfile);

    res.status(201).json({
      message: "Student created successfully",
      data: studentProfile,
    });
  } catch (error) {
    console.error("Student creation error:", error);

    if (uid) {
      try {
        await getAuth().deleteUser(uid);
      } catch (cleanupError) {
        console.error("Student Auth cleanup failed:", cleanupError);
      }
      if (studentId) {
        try {
          await db.collection("students").doc(studentId).delete();
          await db.collection("users").doc(uid).delete();
        } catch (cleanupError) {
          console.error("Student Firestore cleanup failed:", cleanupError);
        }
      }
    }

    if (error.code === "auth/email-already-in-use" || error.code === "auth/email-already-exists") {
      return res.status(409).json({
        error: "A student with this email already exists.",
      });
    }

    return safeServerError(res, "Failed to create student");
  }
});


// UPDATE student
app.put("/api/students/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const requestedData = req.body;
    const allowedFields = ["name", "email", "course", "semester", "rollNumber", "phone", "status"];
    const updatedData = Object.fromEntries(
      Object.entries(requestedData).filter(([field]) => allowedFields.includes(field))
    );

    const docRef = db.collection("students").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    const currentStudent = docSnap.data();
    const validationError = validateStudentInput({ ...currentStudent, ...updatedData }, { requirePassword: false });
    if (validationError) return res.status(400).json({ error: validationError });
    if (updatedData.rollNumber && updatedData.rollNumber !== currentStudent.rollNumber) {
      const duplicateRoll = await db.collection("students")
        .where("rollNumber", "==", updatedData.rollNumber.trim())
        .limit(1)
        .get();
      if (!duplicateRoll.empty && duplicateRoll.docs[0].id !== id) {
        return res.status(409).json({ error: "A student with this roll number already exists." });
      }
    }
    const nextData = { ...currentStudent, ...updatedData };

    if (updatedData.name && currentStudent.name !== updatedData.name) {
      await getAuth().updateUser(currentStudent.uid, {
        displayName: updatedData.name,
      });
    }

    if (updatedData.email && currentStudent.email !== updatedData.email) {
      await getAuth().updateUser(currentStudent.uid, { email: updatedData.email.trim() });
    }

    if (updatedData.name || updatedData.email) {
      await db.collection("users").doc(currentStudent.uid).update({
        name: updatedData.name || currentStudent.name,
        email: updatedData.email || currentStudent.email,
      });
    }

    await docRef.update(nextData);

    const updatedDocSnap = await docRef.get();

    res.json({
      message: "Student updated",
      data: {
        id: updatedDocSnap.id,
        ...updatedDocSnap.data(),
      },
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to update student.");
  }
});

// DELETE student
app.delete("/api/students/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection("students").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    const student = docSnap.data();
    const uid = student.uid;

    try {
      await getAuth().deleteUser(uid);
    } catch (authError) {
      if (authError.code !== "auth/user-not-found") {
        console.error("Firebase Auth cleanup failed:", authError);
        return res.status(500).json({
          error: "Student could not be deleted because account cleanup failed.",
        });
      }
    }

    try {
      await docRef.delete();
      await db.collection("users").doc(uid).delete();
    } catch (firestoreError) {
      console.error("Student Firestore cleanup failed:", firestoreError);
      return res.status(500).json({
        error: "Student account was removed, but student records need manual cleanup.",
      });
    }

    res.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to delete student.");
  }
});

// GET attendance for a date
app.get("/api/attendance", requireAdmin, async (req, res) => {
  try {
    const selectedDate = req.query.date;
    const snapshot = selectedDate
      ? await db.collection("attendance").where("date", "==", selectedDate).get()
      : await db.collection("attendance").get();

    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ data: records });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    safeServerError(res, "Failed to fetch attendance.");
  }
});

// GET student attendance by studentId
app.get("/api/attendance/student/:studentId", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentProfile = await db.collection("students").doc(studentId).get();

    if (!studentProfile.exists) {
      return res.status(404).json({ error: "Student not found." });
    }

    const currentUser = req.user;
    const isAdmin = currentUser.role === "admin";
    const ownsRecord = currentUser.studentId === studentId || currentUser.uid === studentProfile.data().uid;

    if (!isAdmin && !ownsRecord) {
      return res.status(403).json({ error: "You can only access your own attendance records." });
    }

    const snapshot = await db.collection("attendance").where("studentId", "==", studentId).get();
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ data: records });
  } catch (error) {
    console.error("Student attendance fetch error:", error);
    safeServerError(res, "Failed to load attendance records.");
  }
});

// UPDATE attendance for a student/date
app.put("/api/attendance/:studentId", requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date, status } = req.body;

    if (!isValidDate(date) || !["Present", "Absent", "Late"].includes(status)) {
      return res.status(400).json({
        error: "A valid date and status (Present, Absent, or Late) are required.",
      });
    }

    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    const attendanceId = `${studentId}_${date}`;
    const attendanceRef = db.collection("attendance").doc(attendanceId);
    const attendanceRecord = {
      studentId,
      uid: studentDoc.data().uid,
      date,
      status,
      checkInTime: status === "Present" || status === "Late" ? new Date().toLocaleTimeString("en-GB", { hour12: false }) : null,
      markedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    };

    await attendanceRef.set(attendanceRecord, { merge: true });

    res.json({
      message: "Attendance updated successfully",
      data: {
        id: attendanceId,
        ...attendanceRecord,
      },
    });
  } catch (error) {
    console.error("Attendance update error:", error);
    safeServerError(res, "Failed to update attendance.");
  }
});

// =====================================================
// FEEDBACKS
// =====================================================

// GET all feedbacks
app.get("/api/feedbacks", requireAuth, async (req, res) => {
  try {
    // OLD WEB SDK:
    // const feedbacksCol = collection(db, "feedbacks");
    // const snapshot = await getDocs(feedbacksCol);

    // NEW FIREBASE ADMIN SDK
    const snapshot = await db.collection("feedbacks").get();

    const feedbacks = snapshot.docs.filter((doc) =>
      req.user.role === "admin" || doc.data().uid === req.user.uid
    ).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      data: feedbacks,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to fetch feedback.");
  }
});

// CREATE feedback
app.post("/api/feedbacks", requireAuth, async (req, res) => {
  try {
    const { type, subject, rating, message } = req.body;
    if (!type || !subject || !message || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Type, subject, message, and a rating from 1 to 5 are required." });
    }
    const docRef = db.collection("feedbacks").doc();
    const feedbackData = {
      id: docRef.id,
      type: String(type).slice(0, 50),
      subject: String(subject).slice(0, 150),
      rating: Number(rating),
      message: String(message).slice(0, 5000),
      uid: req.user.uid,
      studentId: req.user.studentId || null,
      date: new Date().toISOString().split("T")[0],
      status: "New",
      response: null,
    };

    await docRef.set(feedbackData);

    res.status(201).json({
      message: "Feedback saved successfully",
      data: feedbackData,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to save feedback.");
  }
});

// DELETE feedback
app.delete("/api/feedbacks/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    // OLD WEB SDK:
    // const docRef = doc(db, "feedbacks", id.toString());
    // await deleteDoc(docRef);

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("feedbacks")
      .doc(id.toString());

    await docRef.delete();

    res.json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to delete feedback.");
  }
});

// =====================================================
// ANNOUNCEMENTS
// =====================================================

// GET all announcements
app.get("/api/announcements", requireAuth, async (req, res) => {
  try {
    // OLD WEB SDK:
    // const announcementsCol = collection(db, "announcements");
    // const snapshot = await getDocs(announcementsCol);

    // NEW FIREBASE ADMIN SDK
    const snapshot = await db
      .collection("announcements")
      .get();

    const announcements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      data: announcements,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to fetch announcements.");
  }
});

// CREATE announcement
app.post("/api/announcements", requireAdmin, async (req, res) => {
  try {
    const announcement = req.body;

    if (!announcement.title || !announcement.content) {
      return res.status(400).json({
        error: "Title and content are required.",
      });
    }

    // OLD WEB SDK:
    // const announcementsCol = collection(db, "announcements");
    // const docRef = doc(announcementsCol);
    // announcement.id = docRef.id;
    // await setDoc(docRef, announcement);

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("announcements")
      .doc();

    announcement.id = docRef.id;

    await docRef.set(announcement);

    res.status(201).json({
      message: "Announcement created",
      data: announcement,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to create announcement.");
  }
});

// DELETE announcement
app.delete("/api/announcements/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    // OLD WEB SDK:
    // const docRef = doc(db, "announcements", id);
    // const docSnap = await getDoc(docRef);
    // await deleteDoc(docRef);

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("announcements")
      .doc(id);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Announcement not found",
      });
    }

    await docRef.delete();

    res.json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to delete announcement.");
  }
});

// =====================================================
// PLACEMENTS
// =====================================================

// GET all placements
app.get("/api/placements", requireAuth, async (req, res) => {
  try {
    // OLD WEB SDK:
    // const placementsCol = collection(db, "placements");
    // const snapshot = await getDocs(placementsCol);

    // NEW FIREBASE ADMIN SDK
    const snapshot = await db
      .collection("placements")
      .get();

    const placements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      data: placements,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to fetch placements.");
  }
});

// CREATE placement
app.post("/api/placements", requireAdmin, async (req, res) => {
  try {
    const placement = req.body;

    const { company, position, deadline } = placement;
    if (!company || !position || !isValidDate(deadline)) {
      return res.status(400).json({ error: "Company, position, and a valid deadline are required." });
    }
    const docRef = db.collection("placements").doc();
    const createdPlacement = {
      ...placement,
      id: docRef.id,
      company: String(company).slice(0, 150),
      position: String(position).slice(0, 150),
      applicants: 0,
    };

    await docRef.set(createdPlacement);

    res.status(201).json({
      message: "Placement created",
      data: createdPlacement,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to create placement.");
  }
});

// UPDATE placement
app.put("/api/placements/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const allowedFields = ["company", "position", "location", "salary", "deadline", "requirements", "description", "type", "status"];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
    );
    if (updateData.deadline && !isValidDate(updateData.deadline)) {
      return res.status(400).json({ error: "Deadline must be a valid date." });
    }

    // OLD WEB SDK:
    // const docRef = doc(db, "placements", id.toString());
    // const existing = await getDoc(docRef);
    // await updateDoc(docRef, updateData);

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("placements")
      .doc(id.toString());

    const existing = await docRef.get();

    if (!existing.exists) {
      return res.status(404).json({
        error: "Placement not found",
      });
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();

    res.json({
      message: "Placement updated",
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to update placement.");
  }
});

// APPLY for placement
app.put("/api/placements/:id/apply", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    // OLD WEB SDK:
    // const docRef = doc(db, "placements", id);
    // const docSnap = await getDoc(docRef);
    // const currentData = docSnap.data();
    // await updateDoc(docRef, {
    //   applicants: newApplicants
    // });

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("placements")
      .doc(id);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Placement not found",
      });
    }

    if (req.user.role !== "admin" && !req.user.studentId) {
      return res.status(403).json({ error: "A student profile is required to apply." });
    }

    const applicationRef = docRef.collection("applications").doc(req.user.uid);
    const result = await db.runTransaction(async (transaction) => {
      const [placementSnapshot, applicationSnapshot] = await Promise.all([
        transaction.get(docRef),
        transaction.get(applicationRef),
      ]);
      if (applicationSnapshot.exists) return { alreadyApplied: true, applicants: placementSnapshot.data().applicants || 0 };
      const newApplicants = (placementSnapshot.data().applicants || 0) + 1;
      transaction.set(applicationRef, {
        uid: req.user.uid,
        studentId: req.user.studentId || null,
        appliedAt: new Date().toISOString(),
      });
      transaction.update(docRef, { applicants: newApplicants });
      return { alreadyApplied: false, applicants: newApplicants };
    });

    if (result.alreadyApplied) return res.status(409).json({ error: "You have already applied for this position." });

    res.json({
      message: "Application recorded",
      applicants: result.applicants,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to record application.");
  }
});

// DELETE placement
app.delete("/api/placements/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    // OLD WEB SDK:
    // await deleteDoc(
    //   doc(db, "placements", id.toString())
    // );

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("placements")
      .doc(id.toString());

    await docRef.delete();

    res.json({
      message: "Placement deleted successfully",
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to delete placement.");
  }
});

// =====================================================
// MESSAGES
// =====================================================

// GET all messages
app.get("/api/messages", requireAuth, async (req, res) => {
  try {
    // OLD WEB SDK:
    // const messagesCol = collection(db, "messages");
    // const snapshot = await getDocs(messagesCol);

    // NEW FIREBASE ADMIN SDK
    const snapshot = await db
      .collection("messages")
      .get();

    const messages = snapshot.docs.filter((doc) =>
      req.user.role === "admin" || doc.data().broadcast === true || doc.data().recipientUid === req.user.uid
    ).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      data: messages,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to fetch messages.");
  }
});

// CREATE message
app.post("/api/messages", requireAdmin, async (req, res) => {
  try {
    const message = req.body;

    const docRef = db.collection("messages").doc();
    message.id = docRef.id;
    message.broadcast = !message.recipientUid;
    message.date = new Date()
      .toISOString()
      .split("T")[0];

    message.status = "Sent";

    // OLD WEB SDK:
    // await setDoc(
    //   doc(db, "messages", message.id.toString()),
    //   message
    // );

    await docRef.set(message);

    res.status(201).json({
      message: "Message created",
      data: message,
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to create message.");
  }
});

// DELETE message
app.delete("/api/messages/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    // OLD WEB SDK:
    // await deleteDoc(
    //   doc(db, "messages", id.toString())
    // );

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("messages")
      .doc(id.toString());

    await docRef.delete();

    res.json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to delete message.");
  }
});

// UPDATE message
app.put("/api/messages/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    // OLD WEB SDK:
    // const docRef = doc(db, "messages", id.toString());
    // const existing = await getDoc(docRef);
    // await updateDoc(docRef, updateData);

    // NEW FIREBASE ADMIN SDK
    const docRef = db
      .collection("messages")
      .doc(id.toString());

    const existing = await docRef.get();

    if (!existing.exists) {
      return res.status(404).json({
        error: "Message not found",
      });
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();

    res.json({
      message: "Message updated",
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error(error);

    safeServerError(res, "Failed to update message.");
  }
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Progova backend running on port ${PORT}`
  );
});