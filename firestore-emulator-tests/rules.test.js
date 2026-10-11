import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const projectId = "demo-progova-rules-test";
const studentUid = "student-1";
const otherStudentUid = "student-2";
const adminUid = "admin-1";
const rules = readFileSync(
  new URL("./firestore.proposed.rules", import.meta.url),
  "utf8"
);

let testEnv;

const authenticatedDb = (uid) =>
  testEnv.authenticatedContext(uid).firestore();

const adminDb = () => authenticatedDb(adminUid);
const studentDb = () => authenticatedDb(studentUid);
const otherStudentDb = () => authenticatedDb(otherStudentUid);
const unauthenticatedDb = () => testEnv.unauthenticatedContext().firestore();

const seedDocuments = async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const documents = [
      ["users/admin-1", { uid: adminUid, role: "admin" }],
      [
        "users/student-1",
        { uid: studentUid, role: "student", studentId: "ST001" },
      ],
      [
        "users/student-2",
        { uid: otherStudentUid, role: "student", studentId: "ST002" },
      ],
      ["users/no-role", { uid: "no-role" }],
      ["students/ST001", { id: "ST001", uid: studentUid, name: "Owner" }],
      ["students/ST002", { id: "ST002", uid: otherStudentUid, name: "Other" }],
      ["students/NO_UID", { id: "NO_UID", name: "Missing owner" }],
      [
        "attendance/ST001_2026-01-01",
        { studentId: "ST001", uid: studentUid, status: "Present" },
      ],
      [
        "attendance/ST002_2026-01-01",
        { studentId: "ST002", uid: otherStudentUid, status: "Absent" },
      ],
      [
        "attendance/NO_UID",
        { studentId: "ST003", status: "Present" },
      ],
      [
        "feedbacks/feedback-student-1",
        {
          id: "feedback-student-1",
          uid: studentUid,
          studentId: "ST001",
          type: "Course",
          subject: "Course feedback",
          rating: 5,
          message: "Feedback text",
          date: "2026-01-01",
          status: "New",
          response: null,
        },
      ],
      [
        "feedbacks/feedback-student-2",
        {
          id: "feedback-student-2",
          uid: otherStudentUid,
          studentId: "ST002",
          type: "Course",
          subject: "Other feedback",
          rating: 4,
          message: "Other feedback text",
          date: "2026-01-01",
          status: "Reviewed",
          response: "Reviewed",
        },
      ],
      [
        "feedbacks/feedback-no-uid",
        { id: "feedback-no-uid", status: "New", response: null },
      ],
      ["announcements/announcement-1", { title: "Notice", content: "Hello" }],
      ["placements/placement-1", { company: "Example", applicants: 0 }],
      [
        "placements/placement-1/applications/student-1",
        { uid: studentUid, studentId: "ST001", appliedAt: "2026-01-01" },
      ],
      [
        "placements/placement-1/applications/student-2",
        { uid: otherStudentUid, studentId: "ST002", appliedAt: "2026-01-01" },
      ],
      [
        "placements/placement-1/applications/wrong-uid",
        { uid: otherStudentUid, studentId: "ST002", appliedAt: "2026-01-01" },
      ],
      ["messages/message-1", { broadcast: true, content: "Notice" }],
      ["metadata/counters", { studentCounter: 1 }],
      ["unlisted/private", { value: "private" }],
    ];

    for (const [path, data] of documents) {
      await setDoc(doc(db, path), data);
    }
  });
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedDocuments();
});

after(async () => {
  await testEnv?.cleanup();
});

describe("users/{uid}", () => {
  it("allows self-profile get before the application loads the role", async () => {
    await assertSucceeds(getDoc(doc(studentDb(), "users", studentUid)));
  });

  it("denies students reading another profile and listing profiles", async () => {
    await assertFails(getDoc(doc(studentDb(), "users", otherStudentUid)));
    await assertFails(getDocs(collection(studentDb(), "users")));
  });

  it("allows admins to list and read profiles but denies unauthenticated access", async () => {
    await assertSucceeds(getDocs(collection(adminDb(), "users")));
    await assertSucceeds(getDoc(doc(adminDb(), "users", studentUid)));
    await assertFails(getDoc(doc(unauthenticatedDb(), "users", studentUid)));
  });

  it("does not grant admin access when the profile is missing or has no role", async () => {
    await assertFails(getDoc(doc(authenticatedDb("no-role"), "users", studentUid)));
    await assertFails(getDoc(doc(authenticatedDb("absent"), "users", studentUid)));
  });

  it("denies profile writes to students", async () => {
    await assertFails(
      updateDoc(doc(studentDb(), "users", studentUid), { role: "admin" })
    );
  });
});

describe("students/{studentId}", () => {
  it("allows admins to read and write student records", async () => {
    await assertSucceeds(getDoc(doc(adminDb(), "students", "ST001")));
    await assertSucceeds(getDocs(collection(adminDb(), "students")));
    await assertSucceeds(
      updateDoc(doc(adminDb(), "students", "ST001"), { name: "Updated" })
    );
    await assertSucceeds(
      setDoc(doc(adminDb(), "students", "ST003"), {
        uid: studentUid,
        name: "Created",
      })
    );
    await assertSucceeds(deleteDoc(doc(adminDb(), "students", "ST003")));
  });

  it("allows a student to read only records owned by their UID", async () => {
    await assertSucceeds(getDoc(doc(studentDb(), "students", "ST001")));
    await assertFails(getDoc(doc(studentDb(), "students", "ST002")));
    await assertFails(getDoc(doc(studentDb(), "students", "NO_UID")));
  });

  it("denies student writes and unauthenticated reads", async () => {
    await assertFails(
      updateDoc(doc(studentDb(), "students", "ST001"), { name: "Changed" })
    );
    await assertFails(getDoc(doc(unauthenticatedDb(), "students", "ST001")));
  });
});

describe("attendance/{attendanceId}", () => {
  it("allows admins to read and write attendance", async () => {
    await assertSucceeds(getDocs(collection(adminDb(), "attendance")));
    await assertSucceeds(
      updateDoc(doc(adminDb(), "attendance", "ST001_2026-01-01"), {
        status: "Late",
      })
    );
  });

  it("allows students to read only attendance with their UID", async () => {
    await assertSucceeds(
      getDoc(doc(studentDb(), "attendance", "ST001_2026-01-01"))
    );
    await assertFails(
      getDoc(doc(studentDb(), "attendance", "ST002_2026-01-01"))
    );
    await assertFails(getDoc(doc(studentDb(), "attendance", "NO_UID")));
  });

  it("denies student writes", async () => {
    await assertFails(
      updateDoc(doc(studentDb(), "attendance", "ST001_2026-01-01"), {
        status: "Absent",
      })
    );
  });
});

describe("feedbacks/{feedbackId}", () => {
  const ownFeedback = () => ({
    id: "feedback-new",
    type: "Course",
    subject: "New feedback",
    rating: 5,
    message: "Student feedback",
    uid: studentUid,
    studentId: "ST001",
    date: "2026-01-02",
    status: "New",
    response: null,
  });

  it("allows an owner and admin to read feedback, not another student", async () => {
    await assertSucceeds(
      getDoc(doc(studentDb(), "feedbacks", "feedback-student-1"))
    );
    await assertFails(
      getDoc(doc(studentDb(), "feedbacks", "feedback-student-2"))
    );
    await assertFails(
      getDoc(doc(studentDb(), "feedbacks", "feedback-no-uid"))
    );
    await assertSucceeds(getDocs(collection(adminDb(), "feedbacks")));
  });

  it("allows a student to create own feedback only with protected initial fields", async () => {
    await assertSucceeds(
      setDoc(doc(studentDb(), "feedbacks", "feedback-new"), ownFeedback())
    );

    await assertFails(
      setDoc(doc(studentDb(), "feedbacks", "forged-owner"), {
        ...ownFeedback(),
        id: "forged-owner",
        uid: otherStudentUid,
      })
    );
    await assertFails(
      setDoc(doc(studentDb(), "feedbacks", "forged-status"), {
        ...ownFeedback(),
        id: "forged-status",
        status: "Reviewed",
      })
    );
    await assertFails(
      setDoc(doc(studentDb(), "feedbacks", "forged-response"), {
        ...ownFeedback(),
        id: "forged-response",
        response: "Approved",
      })
    );
    await assertFails(
      setDoc(doc(studentDb(), "feedbacks", "forged-student-id"), {
        ...ownFeedback(),
        id: "forged-student-id",
        studentId: "ST002",
      })
    );
  });

  it("denies student feedback updates/deletes and allows admins to manage it", async () => {
    await assertFails(
      updateDoc(doc(studentDb(), "feedbacks", "feedback-student-1"), {
        status: "Reviewed",
      })
    );
    await assertFails(
      updateDoc(doc(studentDb(), "feedbacks", "feedback-student-1"), {
        response: "Changed",
      })
    );
    await assertFails(
      deleteDoc(doc(studentDb(), "feedbacks", "feedback-student-1"))
    );
    await assertSucceeds(
      updateDoc(doc(adminDb(), "feedbacks", "feedback-student-1"), {
        status: "Reviewed",
        response: "Reviewed",
      })
    );
  });
});

describe("announcements/{announcementId}", () => {
  it("allows app users to read and admins to write", async () => {
    await assertSucceeds(
      getDoc(doc(studentDb(), "announcements", "announcement-1"))
    );
    await assertSucceeds(
      getDoc(doc(adminDb(), "announcements", "announcement-1"))
    );
    await assertSucceeds(
      setDoc(doc(adminDb(), "announcements", "announcement-2"), {
        title: "New",
      })
    );
    await assertFails(
      setDoc(doc(studentDb(), "announcements", "student-announcement"), {
        title: "Not allowed",
      })
    );
    await assertFails(
      getDoc(doc(unauthenticatedDb(), "announcements", "announcement-1"))
    );
  });
});

describe("placements/{placementId}", () => {
  it("allows app users to read and admins to write", async () => {
    await assertSucceeds(
      getDoc(doc(studentDb(), "placements", "placement-1"))
    );
    await assertSucceeds(
      getDoc(doc(adminDb(), "placements", "placement-1"))
    );
    await assertSucceeds(
      updateDoc(doc(adminDb(), "placements", "placement-1"), {
        applicants: 1,
      })
    );
    await assertFails(
      updateDoc(doc(studentDb(), "placements", "placement-1"), {
        applicants: 999,
      })
    );
    await assertFails(
      getDoc(doc(unauthenticatedDb(), "placements", "placement-1"))
    );
  });
});

describe("placements/{placementId}/applications/{uid}", () => {
  it("allows admins and the owner with matching path/data UID to read", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          studentDb(),
          "placements",
          "placement-1",
          "applications",
          studentUid
        )
      )
    );
    await assertSucceeds(
      getDoc(
        doc(
          adminDb(),
          "placements",
          "placement-1",
          "applications",
          otherStudentUid
        )
      )
    );
  });

  it("denies other owners and mismatched/missing ownership fields", async () => {
    await assertFails(
      getDoc(
        doc(
          studentDb(),
          "placements",
          "placement-1",
          "applications",
          otherStudentUid
        )
      )
    );
    await assertFails(
      getDoc(
        doc(
          studentDb(),
          "placements",
          "placement-1",
          "applications",
          "wrong-uid"
        )
      )
    );
  });

  it("denies student direct writes because the backend maintains placement counts", async () => {
    const application = doc(
      studentDb(),
      "placements",
      "placement-1",
      "applications",
      studentUid
    );
    await assertFails(
      setDoc(application, { uid: studentUid, studentId: "ST001" })
    );
    await assertFails(deleteDoc(application));
  });
});

describe("messages/{messageId}", () => {
  it("allows admins and denies student/unauthenticated reads and student writes", async () => {
    await assertSucceeds(
      getDoc(doc(adminDb(), "messages", "message-1"))
    );
    await assertFails(
      getDoc(doc(studentDb(), "messages", "message-1"))
    );
    await assertFails(
      getDoc(doc(unauthenticatedDb(), "messages", "message-1"))
    );
    await assertFails(
      setDoc(doc(studentDb(), "messages", "student-message"), {
        content: "Not allowed",
      })
    );
  });
});

describe("metadata and unspecified paths", () => {
  it("denies metadata reads and writes to admins and students", async () => {
    await assertFails(getDoc(doc(adminDb(), "metadata", "counters")));
    await assertFails(getDoc(doc(studentDb(), "metadata", "counters")));
    await assertFails(
      setDoc(doc(adminDb(), "metadata", "new"), { value: 1 })
    );
  });

  it("denies reads and writes to unlisted collections", async () => {
    await assertFails(getDoc(doc(adminDb(), "unlisted", "private")));
    await assertFails(getDoc(doc(studentDb(), "unlisted", "private")));
    await assertFails(
      setDoc(doc(adminDb(), "unlisted", "new"), { value: "no access" })
    );
  });
});
