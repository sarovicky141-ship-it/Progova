import { db } from "../libs/firebase.js";
import { canAccessStudentRecord } from "../security/access.js";

const normalizeTrimmedString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeSemester = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : undefined;
};

const createStudentRecord = (doc) => {
  const data = doc.data();
  return {
    id: data.id || doc.id,
    ...data,
  };
};

const ensureAdminAccess = (user) => {
  if (!user || user.role !== "admin") {
    return {
      error: "You do not have permission to access student records.",
    };
  }

  return null;
};

const ensureOwnProfileAccess = (user, student) => {
  if (!canAccessStudentRecord(user, student)) {
    return {
      error: "You can only access your own student profile.",
    };
  }

  return null;
};

const applyFilters = (query, filters = {}) => {
  let result = query;
  const course = normalizeTrimmedString(filters.course);
  const semester = normalizeSemester(filters.semester);
  const status = normalizeTrimmedString(filters.status);
  const rollNumber = normalizeTrimmedString(filters.rollNumber);

  if (course) {
    result = result.where("course", "==", course);
  }

  if (semester !== undefined) {
    result = result.where("semester", "==", semester);
  }

  if (status) {
    result = result.where("status", "==", status);
  }

  if (rollNumber) {
    result = result.where("rollNumber", "==", rollNumber);
  }

  return result;
};

export const getStudents = async (filters = {}, context = {}) => {
  const adminAccessError = ensureAdminAccess(context.user);
  if (adminAccessError) {
    return adminAccessError;
  }

  try {
    const studentQuery = applyFilters(db.collection("students"), filters);
    const snapshot = await studentQuery.get();
    const students = snapshot.docs.map(createStudentRecord);

    return {
      students,
      count: students.length,
    };
  } catch (error) {
    console.error("getStudents tool error:", error);
    return {
      error: "Unable to fetch students from Firestore.",
    };
  }
};

export const getStudentById = async (filters = {}, context = {}) => {
  const studentId = normalizeTrimmedString(filters.studentId || filters.id);

  if (!studentId) {
    return {
      error: "A valid student ID is required.",
    };
  }

  try {
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      return {
        error: `Student with ID ${studentId} was not found.`,
      };
    }

    const student = createStudentRecord(studentDoc);
    const accessError = ensureOwnProfileAccess(context.user, student);
    if (accessError) {
      return accessError;
    }

    return {
      student,
    };
  } catch (error) {
    console.error("getStudentById tool error:", error);
    return {
      error: "Unable to locate the requested student.",
    };
  }
};

export const getStudentCount = async (filters = {}, context = {}) => {
  const adminAccessError = ensureAdminAccess(context.user);
  if (adminAccessError) {
    return adminAccessError;
  }

  try {
    const studentQuery = applyFilters(db.collection("students"), filters);
    const snapshot = await studentQuery.get();

    return {
      count: snapshot.size,
    };
  } catch (error) {
    console.error("getStudentCount tool error:", error);
    return {
      error: "Unable to count students in Firestore.",
    };
  }
};

export const getStudentProfile = async (_, context = {}) => {
  const currentUser = context.user;

  if (!currentUser) {
    return {
      error: "Authentication is required to access a profile.",
    };
  }

  try {
    const studentSnapshot = await db
      .collection("students")
      .where("uid", "==", currentUser.uid)
      .limit(1)
      .get();

    if (studentSnapshot.empty) {
      return {
        student: {
          uid: currentUser.uid,
          email: currentUser.email || null,
          name: currentUser.name || currentUser.email || "User",
          role: currentUser.role,
        },
      };
    }

    const student = createStudentRecord(studentSnapshot.docs[0]);
    return {
      student,
    };
  } catch (error) {
    console.error("getStudentProfile tool error:", error);
    return {
      error: "Unable to load the authenticated user's profile.",
    };
  }
};

export const getCourses = async (_, context = {}) => {
  if (!context.user) {
    return {
      error: "Authentication is required to view available courses.",
    };
  }

  try {
    const snapshot = await db.collection("students").get();
    const courses = [...new Set(
      snapshot.docs
        .map((doc) => doc.data().course)
        .filter((course) => typeof course === "string" && course.trim())
        .map((course) => course.trim())
    )].sort();

    return {
      courses,
    };
  } catch (error) {
    console.error("getCourses tool error:", error);
    return {
      error: "Unable to load available courses.",
    };
  }
};

export const getStudentsByCourseAndSemester = async (filters = {}, context = {}) => {
  const course = normalizeTrimmedString(filters.course);
  const semester = normalizeSemester(filters.semester);

  if (!course) {
    return {
      error: "A valid course is required.",
    };
  }

  if (semester === undefined || semester < 1 || semester > 8) {
    return {
      error: "Semester must be an integer from 1 to 8.",
    };
  }

  return getStudents({ course, semester }, context);
};

export const PROGOVA_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "getStudents",
        description: "Return students from Firestore using optional course, semester, status, and roll number filters.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            course: { type: "string" },
            semester: { type: "integer" },
            status: { type: "string" },
            rollNumber: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      {
        name: "getStudentById",
        description: "Retrieve a single student using their PROGOVA student ID.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            studentId: { type: "string" },
          },
          required: ["studentId"],
          additionalProperties: false,
        },
      },
      {
        name: "getStudentCount",
        description: "Return the number of students matching optional course, semester, and status filters.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            course: { type: "string" },
            semester: { type: "integer" },
            status: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      {
        name: "getStudentProfile",
        description: "Return the authenticated user's own PROGOVA profile.",
        parametersJsonSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "getCourses",
        description: "Return the list of available academic courses from PROGOVA student records.",
        parametersJsonSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "getStudentsByCourseAndSemester",
        description: "Return students enrolled in a specific course and semester.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            course: { type: "string" },
            semester: { type: "integer" },
          },
          required: ["course", "semester"],
          additionalProperties: false,
        },
      },
    ],
  },
];

export const TOOL_HANDLERS = {
  getStudents,
  getStudentById,
  getStudentCount,
  getStudentProfile,
  getCourses,
  getStudentsByCourseAndSemester,
};

export const runToolCall = async (toolName, args = {}, context = {}) => {
  const handler = TOOL_HANDLERS[toolName];

  if (!handler) {
    return {
      error: `Tool ${toolName} is not available.`,
    };
  }

  try {
    return await handler(args, context);
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return {
      error: `The tool ${toolName} failed while retrieving PROGOVA data.`,
    };
  }
};
