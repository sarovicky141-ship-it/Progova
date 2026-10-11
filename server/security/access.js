const hasNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const createVerifiedRequestUser = (decodedToken, profile) => {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile) ||
    !["admin", "student"].includes(profile.role) ||
    !hasNonEmptyString(decodedToken?.uid)
  ) {
    return null;
  }

  return {
    ...profile,
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
  };
};

export const canAccessStudentRecord = (user, student) => {
  if (user?.role === "admin") {
    return true;
  }

  return (
    user?.role === "student" &&
    hasNonEmptyString(user.uid) &&
    hasNonEmptyString(student?.uid) &&
    student.uid === user.uid
  );
};

export const canAccessAttendanceRecord = (user, student, attendance) => {
  if (user?.role === "admin") {
    return true;
  }

  return (
    canAccessStudentRecord(user, student) &&
    hasNonEmptyString(attendance?.uid) &&
    attendance.uid === user.uid
  );
};

export const isValidStudentRecipient = (uid, userProfile, student) =>
  hasNonEmptyString(uid) &&
  userProfile?.role === "student" &&
  hasNonEmptyString(userProfile.studentId) &&
  hasNonEmptyString(student?.uid) &&
  student.uid === uid;

export const areValidMessageRecipients = async (db, recipientUids) => {
  const recipientChecks = await Promise.all(
    recipientUids.map(async (uid) => {
      const userSnapshot = await db.collection("users").doc(uid).get();
      if (!userSnapshot.exists) {
        return false;
      }

      const userProfile = userSnapshot.data();
      if (
        userProfile.role !== "student" ||
        !hasNonEmptyString(userProfile.studentId)
      ) {
        return false;
      }

      const studentSnapshot = await db
        .collection("students")
        .doc(userProfile.studentId)
        .get();
      return (
        studentSnapshot.exists &&
        isValidStudentRecipient(uid, userProfile, studentSnapshot.data())
      );
    })
  );

  return recipientChecks.every(Boolean);
};

export const parseMessageAudience = (audience) => {
  if (!audience || typeof audience !== "object" || Array.isArray(audience)) {
    return { error: "Select a valid message audience." };
  }
  if (
    Object.keys(audience).some(
      (field) => field !== "type" && field !== "recipientUids"
    )
  ) {
    return { error: "The message audience contains unsupported fields." };
  }

  if (audience.type === "broadcast") {
    if (
      audience.recipientUids !== undefined &&
      (!Array.isArray(audience.recipientUids) ||
        audience.recipientUids.length > 0)
    ) {
      return { error: "Broadcast messages cannot specify recipients." };
    }

    return {
      value: {
        audienceType: "broadcast",
        recipientUids: [],
        recipients: "All Students",
      },
    };
  }

  if (audience.type !== "individual" && audience.type !== "group") {
    return { error: "Select a valid message audience." };
  }

  if (
    !Array.isArray(audience.recipientUids) ||
    audience.recipientUids.length === 0 ||
    audience.recipientUids.some((uid) => !hasNonEmptyString(uid))
  ) {
    return { error: "Select at least one valid student recipient." };
  }

  const recipientUids = audience.recipientUids.map((uid) => uid.trim());
  if (new Set(recipientUids).size !== recipientUids.length) {
    return { error: "Duplicate student recipients are not allowed." };
  }

  if (audience.type === "individual" && recipientUids.length !== 1) {
    return { error: "An individual message must have exactly one recipient." };
  }

  return {
    value: {
      audienceType: audience.type,
      recipientUids,
      recipients:
        audience.type === "individual"
          ? "Individual student"
          : `${recipientUids.length} selected students`,
    },
  };
};

export const buildMessageUpdate = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "A valid message update is required." };
  }

  const allowedFields = new Set(["title", "content", "priority", "audience"]);
  const fields = Object.keys(input);
  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.has(field))
  ) {
    return { error: "The message update contains unsupported fields." };
  }

  const update = {};
  if (Object.hasOwn(input, "title")) {
    if (!hasNonEmptyString(input.title)) {
      return { error: "A valid message title is required." };
    }
    update.title = input.title.trim();
  }

  if (Object.hasOwn(input, "content")) {
    if (!hasNonEmptyString(input.content)) {
      return { error: "A valid message body is required." };
    }
    update.content = input.content.trim();
  }

  if (Object.hasOwn(input, "priority")) {
    if (!["Normal", "High", "Urgent"].includes(input.priority)) {
      return { error: "A valid message priority is required." };
    }
    update.priority = input.priority;
  }

  if (Object.hasOwn(input, "audience")) {
    const parsedAudience = parseMessageAudience(input.audience);
    if (parsedAudience.error) {
      return parsedAudience;
    }
    Object.assign(update, parsedAudience.value);
  }

  return {
    value: update,
    audienceChanged: Object.hasOwn(input, "audience"),
  };
};

export const canDeliverMessageToUser = (message, user) => {
  if (user?.role !== "student" || !hasNonEmptyString(user.uid)) {
    return false;
  }

  return (
    message?.audienceType === "broadcast" ||
    (Array.isArray(message?.recipientUids) &&
      message.recipientUids.includes(user.uid)) ||
    message?.recipientUid === user.uid
  );
};

export const sanitizeMessageForStudent = (message) => {
  const { recipientUids, recipientUid, ...studentMessage } = message;
  return studentMessage;
};
