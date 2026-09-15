import express from "express";
import { db } from "./libs/firebase.js"; // Adjust path as needed
import cors from "cors";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const app = express();
app.use(cors());

app.use(express.json());
// //updated for hosting
app.get("/", (req, res) => {
  res.send("Progova backend is running successfully!");
});

// GET all students
app.get("/api/students", async (req, res) => {
  try {
    const studentsCol = collection(db, "students");
    const snapshot = await getDocs(studentsCol);
    const students = snapshot.docs.map((doc) => doc.data());

    //students);

    res.status(200).json({ data: students });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch students", details: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  const studentData = req.body;
  //   //studentData);

  if (!studentData.id) {
    return res.status(400).json({ error: "Student id is required" });
  }

  try {
    await setDoc(doc(db, "students", studentData.id), studentData);
    res
      .status(201)
      .json({ message: "Student data saved successfully", data: studentData });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to save student data", details: error.message });
  }
});

// Update student
app.put("/api/students/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    //id, updatedData);

    const docRef = doc(db, "students", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Student not found" });
    }

    await updateDoc(docRef, updatedData);
    const updatedDocSnap = await getDoc(docRef);
    res.json({ message: "Student updated", data: updatedDocSnap.data() });
  } catch (err) {
    //err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const docRef = doc(db, "students", req.params.id);
    await deleteDoc(docRef);
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update student attendance
app.put("/api/students/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const docRef = doc(db, "students", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Student not found" });
    }

    await updateDoc(docRef, { status });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

//feedback

app.get("/api/feedbacks", async (req, res) => {
  try {
    const feedbacksCol = collection(db, "feedbacks");
    const snapshot = await getDocs(feedbacksCol);
    const feedbacks = snapshot.docs.map((doc) => doc.data());
    res.status(200).json({ data: feedbacks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/feedbacks", async (req, res) => {
  try {
    const feedbackData = req.body;
    if (!feedbackData.id) {
      feedbackData.id = Date.now().toString();
    }
    const docRef = doc(db, "feedbacks", feedbackData.id.toString());
    await setDoc(docRef, feedbackData);
    res
      .status(201)
      .json({ message: "Feedback saved successfully", data: feedbackData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/feedbacks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = doc(db, "feedbacks", id.toString());
    await deleteDoc(docRef);
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// announcements

app.get("/api/announcements", async (req, res) => {
  try {
    const announcementsCol = collection(db, "announcements");
    const snapshot = await getDocs(announcementsCol);
    const announcements = snapshot.docs.map((doc) => doc.data());
    res.status(200).json({ data: announcements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/announcements", async (req, res) => {
  try {
    const announcement = req.body;
    if (!announcement.title || !announcement.content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    const announcementsCol = collection(db, "announcements");
    const docRef = doc(announcementsCol); // auto-generated doc ref
    announcement.id = docRef.id;

    await setDoc(docRef, announcement);

    res
      .status(201)
      .json({ message: "Announcement created", data: announcement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/announcements/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = doc(db, "announcements", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    await deleteDoc(docRef);

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all placements
app.get("/api/placements", async (req, res) => {
  try {
    const placementsCol = collection(db, "placements");
    const snapshot = await getDocs(placementsCol);
    const placements = snapshot.docs.map((doc) => doc.data());
    res.status(200).json({ data: placements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new placement
app.post("/api/placements", async (req, res) => {
  try {
    const placement = req.body;
    if (!placement.id) {
      placement.id = Date.now().toString(); // fallback id
    }
    await setDoc(doc(db, "placements", placement.id.toString()), placement);
    res.status(201).json({ message: "Placement created", data: placement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update/Edit placement by id
app.put("/api/placements/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    const docRef = doc(db, "placements", id.toString());
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      return res.status(404).json({ error: "Placement not found" });
    }
    await updateDoc(docRef, updateData);
    res.json({ message: "Placement updated", data: updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/placements/:id/apply", async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = doc(db, "placements", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists())
      return res.status(404).json({ error: "Placement not found" });
 
    const currentData = docSnap.data();
    const newApplicants = (currentData.applicants || 0) + 1;

    await updateDoc(docRef, { applicants: newApplicants });
    res.json({ message: "Application recorded", applicants: newApplicants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a placement by id
app.delete("/api/placements/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await deleteDoc(doc(db, "placements", id.toString()));
    res.json({ message: "Placement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const messagesCol = collection(db, "messages");
    const snapshot = await getDocs(messagesCol);
    const messages = snapshot.docs.map((doc) => doc.data());
    res.status(200).json({ data: messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new message
app.post("/api/messages", async (req, res) => {
  try {
    const message = req.body;
    if (!message.id) {
      message.id = Date.now().toString(); // Fallback id
    }
    message.date = new Date().toISOString().split("T")[0];
    message.status = "Sent";

    await setDoc(doc(db, "messages", message.id.toString()), message);
    res.status(201).json({ message: "Message created", data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a message by id
app.delete("/api/messages/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await deleteDoc(doc(db, "messages", id.toString()));
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optional: Update/Edit message by id
app.put("/api/messages/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    const docRef = doc(db, "messages", id.toString());
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      return res.status(404).json({ error: "Message not found" });
    }

    await updateDoc(docRef, updateData);
    res.json({ message: "Message updated", data: updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  //`Server listening on port ${PORT}`);
  // //updated for hosting
  console.log(`Progova backend running on port ${PORT}`);
});
