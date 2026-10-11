import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import test, { after, before } from "node:test";
import { createMessageUpdateRouter } from "./messageUpdateRouter.js";
import {
  areValidMessageRecipients as validateRecipientsInDb,
} from "../security/access.js";

const DELETE_FIELD = Symbol("delete-field");
const messageId = "message-1";

let server;
let baseUrl;
let messageData;
let dbCalls;
let updateCalls;
let recipientRecords;
let recipientValidationCalls;
let mockDb;

const createMockDb = () => ({
  collection: (collectionName) => ({
    doc: (id) => ({
      get: async () => {
        dbCalls.push({ collectionName, id, operation: "get" });
        if (collectionName === "messages") {
          if (id !== messageId) {
            return { exists: false };
          }

          return {
            exists: true,
            id,
            data: () => ({ ...messageData }),
          };
        }

        if (collectionName === "users") {
          const profile = recipientRecords[id]?.userProfile;
          return {
            exists: Boolean(profile),
            data: () => profile,
          };
        }

        if (collectionName === "students") {
          const record = Object.values(recipientRecords).find(
            ({ userProfile }) => userProfile?.studentId === id
          );
          const student = record?.student;
          return {
            exists: Boolean(student && Object.keys(student).length),
            data: () => student,
          };
        }

        return { exists: false };
      },
      update: async (changes) => {
        dbCalls.push({ collectionName, id, operation: "update" });
        updateCalls.push({ ...changes });
        for (const [field, value] of Object.entries(changes)) {
          if (value === DELETE_FIELD) {
            delete messageData[field];
          } else {
            messageData[field] = value;
          }
        }
      },
    }),
  }),
});

const areValidMessageRecipients = async (recipientUids) => {
  recipientValidationCalls.push([...recipientUids]);
  return areValidMessageRecipientsWithDb(recipientUids);
};

const areValidMessageRecipientsWithDb = (recipientUids) =>
  validateRecipientsInDb(mockDb, recipientUids);

const resetFixture = () => {
  messageData = {
    title: "Original",
    content: "Original body",
    priority: "Normal",
    audienceType: "individual",
    recipientUids: ["legacy-target"],
    recipients: "Individual student",
    broadcast: false,
    recipientUid: "legacy-target",
    date: "2026-10-11",
    status: "Sent",
  };
  dbCalls = [];
  updateCalls = [];
  recipientRecords = {
    "student-1": {
      userProfile: { role: "student", studentId: "ST001" },
      student: { uid: "student-1" },
    },
    "student-missing-profile": {
      userProfile: null,
      student: { uid: "student-missing-profile" },
    },
    "student-missing-owner": {
      userProfile: { role: "student", studentId: "ST002" },
      student: {},
    },
    "student-mismatched-owner": {
      userProfile: { role: "student", studentId: "ST003" },
      student: { uid: "someone-else" },
    },
  };
  recipientValidationCalls = [];
};

before(async () => {
  const app = express();
  mockDb = createMockDb();
  app.use(express.json());
  app.use(
    "/api/messages",
    createMessageUpdateRouter({
      db: mockDb,
      FieldValue: { delete: () => DELETE_FIELD },
      requireAdmin: (req, res, next) => {
        if (req.get("x-test-role") !== "admin") {
          return res.status(403).json({ error: "Admin access required." });
        }
        return next();
      },
      areValidMessageRecipients,
      safeServerError: (res, message) => res.status(500).json({ error: message }),
    })
  );
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.close();
    await once(server, "close");
  }
});

const putMessage = (body, role = "admin") =>
  fetch(`${baseUrl}/api/messages/${messageId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-test-role": role,
    },
    body: JSON.stringify(body),
  });

test("non-admin cannot update a message or access Firestore", async () => {
  resetFixture();
  const response = await putMessage({ title: "Attempted change" }, "student");

  assert.equal(response.status, 403);
  assert.equal(dbCalls.length, 0);
  assert.equal(messageData.title, "Original");
});

test("admin can update an allowed message field without changing audience", async () => {
  resetFixture();
  const response = await putMessage({ title: "Updated title" });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result, {
    message: "Message updated",
    data: {
      id: messageId,
      ...messageData,
    },
  });
  assert.deepEqual(updateCalls, [{ title: "Updated title" }]);
  assert.deepEqual(recipientValidationCalls, []);
});

test("invalid audiences and protected fields are rejected before Firestore access", async () => {
  for (const body of [
    { audience: { type: "broadcast", recipientUids: ["student-1"] } },
    { id: "replacement-id" },
  ]) {
    resetFixture();
    const response = await putMessage(body);
    assert.equal(response.status, 400);
    assert.equal(dbCalls.length, 0);
    assert.equal(updateCalls.length, 0);
    assert.equal(messageData.title, "Original");
  }
});

test("individual audiences reject zero and multiple recipients before Firestore access", async () => {
  for (const recipientUids of [[], ["student-1", "student-2"]]) {
    resetFixture();
    const response = await putMessage({
      audience: { type: "individual", recipientUids },
    });

    assert.equal(response.status, 400);
    assert.equal(dbCalls.length, 0);
    assert.equal(updateCalls.length, 0);
  }
});

test("group audiences reject an empty recipient list before Firestore access", async () => {
  resetFixture();
  const response = await putMessage({
    audience: { type: "group", recipientUids: [] },
  });

  assert.equal(response.status, 400);
  assert.equal(dbCalls.length, 0);
  assert.equal(updateCalls.length, 0);
});

test("missing or mismatched recipient ownership rejects update without a write", async () => {
  for (const uid of [
    "student-missing-profile",
    "student-missing-owner",
    "student-mismatched-owner",
  ]) {
    resetFixture();
    const response = await putMessage({
      audience: { type: "individual", recipientUids: [uid] },
    });

    assert.equal(response.status, 400);
    assert.equal(updateCalls.length, 0);
    assert.equal(
      dbCalls.some((call) => call.operation === "update"),
      false
    );
    assert.deepEqual(recipientValidationCalls, [[uid]]);
  }
});

test("valid targeted audience updates allowed fields and removes legacy markers", async () => {
  resetFixture();
  const response = await putMessage({
    title: "Targeted",
    audience: { type: "individual", recipientUids: ["student-1"] },
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(recipientValidationCalls, [["student-1"]]);
  assert.deepEqual(updateCalls, [
    {
      title: "Targeted",
      audienceType: "individual",
      recipientUids: ["student-1"],
      recipients: "Individual student",
      broadcast: DELETE_FIELD,
      recipientUid: DELETE_FIELD,
    },
  ]);
  assert.equal(Object.hasOwn(result.data, "broadcast"), false);
  assert.equal(Object.hasOwn(result.data, "recipientUid"), false);
  assert.equal(result.data.title, "Targeted");
  assert.equal(result.data.recipientUids[0], "student-1");
});

test("explicit broadcast updates clear conflicting targeted markers", async () => {
  resetFixture();
  const response = await putMessage({
    audience: { type: "broadcast" },
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(recipientValidationCalls, [[]]);
  assert.equal(result.data.audienceType, "broadcast");
  assert.deepEqual(result.data.recipientUids, []);
  assert.equal(result.data.recipients, "All Students");
  assert.equal(Object.hasOwn(result.data, "recipientUid"), false);
  assert.equal(Object.hasOwn(result.data, "broadcast"), false);
});
