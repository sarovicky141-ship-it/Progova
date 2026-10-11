import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessAttendanceRecord,
  canAccessStudentRecord,
  canDeliverMessageToUser,
  buildMessageUpdate,
  createVerifiedRequestUser,
  isValidStudentRecipient,
  parseMessageAudience,
  sanitizeMessageForStudent,
} from "./access.js";

test("verified token identity cannot be overwritten by profile fields", () => {
  const user = createVerifiedRequestUser(
    { uid: "verified-uid", email: "verified@example.com" },
    {
      uid: "spoofed-uid",
      email: "spoofed@example.com",
      role: "student",
      studentId: "ST001",
    }
  );

  assert.deepEqual(user, {
    uid: "verified-uid",
    email: "verified@example.com",
    role: "student",
    studentId: "ST001",
  });
});

test("malformed profiles and invalid roles are rejected", () => {
  assert.equal(
    createVerifiedRequestUser({ uid: "u1" }, null),
    null
  );
  assert.equal(
    createVerifiedRequestUser({ uid: "u1" }, []),
    null
  );
  assert.equal(
    createVerifiedRequestUser({ uid: "u1" }, { role: "unknown" }),
    null
  );
  assert.equal(
    createVerifiedRequestUser({}, { role: "student" }),
    null
  );
});

test("admins and only exact-UID students can access student records", () => {
  assert.equal(
    canAccessStudentRecord({ role: "admin", uid: "admin-uid" }, {}),
    true
  );
  assert.equal(
    canAccessStudentRecord(
      { role: "student", uid: "student-uid" },
      { uid: "student-uid" }
    ),
    true
  );
  assert.equal(
    canAccessStudentRecord(
      { role: "student", uid: "student-uid" },
      {}
    ),
    false
  );
  assert.equal(
    canAccessStudentRecord(
      { role: "student", uid: "student-uid" },
      { uid: "other-uid" }
    ),
    false
  );
  assert.equal(
    canAccessStudentRecord(
      { role: "student", uid: " " },
      { uid: " " }
    ),
    false
  );
});

test("attendance access requires exact UIDs on both source records", () => {
  const student = { uid: "student-uid" };
  const user = { role: "student", uid: "student-uid" };

  assert.equal(
    canAccessAttendanceRecord(user, student, { uid: "student-uid" }),
    true
  );
  assert.equal(
    canAccessAttendanceRecord(user, student, {}),
    false
  );
  assert.equal(
    canAccessAttendanceRecord(user, student, { uid: "other-uid" }),
    false
  );
  assert.equal(
    canAccessAttendanceRecord(
      user,
      { uid: "other-uid" },
      { uid: "student-uid" }
    ),
    false
  );
  assert.equal(
    canAccessAttendanceRecord({ role: "admin" }, {}, {}),
    true
  );
});

test("audience parser requires an explicit, valid audience", () => {
  assert.ok(parseMessageAudience(undefined).error);
  assert.ok(parseMessageAudience({ type: "cohort", recipients: "All" }).error);
  assert.ok(
    parseMessageAudience({
      type: "broadcast",
      recipientUids: ["student-1"],
    }).error
  );
  assert.deepEqual(parseMessageAudience({ type: "broadcast" }).value, {
    audienceType: "broadcast",
    recipientUids: [],
    recipients: "All Students",
  });
});

test("message updates accept only allowlisted editable fields", () => {
  assert.deepEqual(
    buildMessageUpdate({
      title: "  Updated title ",
      content: " Updated content ",
      priority: "Urgent",
    }),
    {
      value: {
        title: "Updated title",
        content: "Updated content",
        priority: "Urgent",
      },
      audienceChanged: false,
    }
  );
  assert.ok(buildMessageUpdate({ id: "replacement-id" }).error);
  assert.ok(buildMessageUpdate({ date: "2026-10-11" }).error);
  assert.ok(buildMessageUpdate({ status: "Draft" }).error);
  assert.ok(buildMessageUpdate({ recipientUid: "student-1" }).error);
  assert.ok(buildMessageUpdate({ recipientUids: ["student-1"] }).error);
  assert.ok(buildMessageUpdate({ broadcast: true }).error);
  assert.ok(buildMessageUpdate({}).error);
});

test("message updates require a complete valid audience when audience changes", () => {
  assert.deepEqual(
    buildMessageUpdate({
      audience: { type: "individual", recipientUids: ["student-1"] },
    }),
    {
      value: {
        audienceType: "individual",
        recipientUids: ["student-1"],
        recipients: "Individual student",
      },
      audienceChanged: true,
    }
  );
  assert.deepEqual(
    buildMessageUpdate({ audience: { type: "broadcast" } }),
    {
      value: {
        audienceType: "broadcast",
        recipientUids: [],
        recipients: "All Students",
      },
      audienceChanged: true,
    }
  );
  assert.ok(buildMessageUpdate({ audience: { type: "individual" } }).error);
  assert.ok(
    buildMessageUpdate({
      audience: { type: "group", recipientUids: [] },
    }).error
  );
  assert.ok(
    buildMessageUpdate({
      audience: {
        type: "group",
        recipientUids: ["student-1"],
        recipients: "All Students",
      },
    }).error
  );
});

test("individual and group audiences require nonempty, unique student UIDs", () => {
  assert.deepEqual(
    parseMessageAudience({
      type: "individual",
      recipientUids: ["student-1"],
    }).value,
    {
      audienceType: "individual",
      recipientUids: ["student-1"],
      recipients: "Individual student",
    }
  );
  assert.deepEqual(
    parseMessageAudience({
      type: "group",
      recipientUids: ["student-1", "student-2"],
    }).value,
    {
      audienceType: "group",
      recipientUids: ["student-1", "student-2"],
      recipients: "2 selected students",
    }
  );
  assert.ok(
    parseMessageAudience({
      type: "individual",
      recipientUids: ["student-1", "student-2"],
    }).error
  );
  assert.ok(
    parseMessageAudience({ type: "group", recipientUids: [] }).error
  );
  assert.ok(
    parseMessageAudience({
      type: "group",
      recipientUids: ["student-1", "student-1"],
    }).error
  );
  assert.ok(
    parseMessageAudience({ type: "group", recipientUids: [" "] }).error
  );
});

test("message recipients require a valid student profile and matching student UID", () => {
  assert.equal(
    isValidStudentRecipient(
      "student-1",
      { role: "student", studentId: "ST001" },
      { uid: "student-1" }
    ),
    true
  );
  assert.equal(
    isValidStudentRecipient("student-1", null, { uid: "student-1" }),
    false
  );
  assert.equal(
    isValidStudentRecipient(
      "student-1",
      { role: "admin", studentId: "ST001" },
      { uid: "student-1" }
    ),
    false
  );
  assert.equal(
    isValidStudentRecipient(
      "student-1",
      { role: "student" },
      { uid: "student-1" }
    ),
    false
  );
  assert.equal(
    isValidStudentRecipient(
      "student-1",
      { role: "student", studentId: "ST001" },
      {}
    ),
    false
  );
  assert.equal(
    isValidStudentRecipient(
      "student-1",
      { role: "student", studentId: "ST001" },
      { uid: "student-2" }
    ),
    false
  );
});

test("message delivery reaches only explicit recipients and broadcasts", () => {
  const student = { role: "student", uid: "student-1" };

  assert.equal(
    canDeliverMessageToUser({ audienceType: "broadcast" }, student),
    true
  );
  assert.equal(
    canDeliverMessageToUser(
      { audienceType: "group", recipientUids: ["student-1", "student-2"] },
      student
    ),
    true
  );
  assert.equal(
    canDeliverMessageToUser(
      { audienceType: "individual", recipientUids: ["student-2"] },
      student
    ),
    false
  );
  assert.equal(
    canDeliverMessageToUser({ broadcast: true, recipients: "A cohort" }, student),
    false
  );
  assert.equal(
    canDeliverMessageToUser({ recipientUid: "student-1" }, student),
    true
  );
  assert.equal(
    canDeliverMessageToUser(
      { audienceType: "broadcast" },
      { role: "admin", uid: "admin-uid" }
    ),
    false
  );
});

test("student message responses do not expose recipient UID lists", () => {
  assert.deepEqual(
    sanitizeMessageForStudent({
      id: "m1",
      audienceType: "group",
      recipientUids: ["student-1", "student-2"],
      recipientUid: "student-1",
      recipients: "2 selected students",
    }),
    {
      id: "m1",
      audienceType: "group",
      recipients: "2 selected students",
    }
  );
});
