import "dotenv/config";
console.log("Firebase environment loaded:", !!process.env.FIREBASE_PRIVATE_KEY);
import fs from "fs";
import { parse } from "csv-parse/sync";
import { admin, db, auth } from "./libs/firebase.js";

const CSV_FILE = "./students.csv";
const generateEmail = (rollNumber) => {
  return `${rollNumber.toLowerCase()}@progova-demo.com`;
};

const generatePassword = (rollNumber) => {
  return `Progova@${rollNumber}`;
};

const getNextStudentId = async () => {
  const counterRef = db.collection("metadata").doc("counters");

  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let nextId = 1;

    if (counterDoc.exists) {
      nextId = (counterDoc.data().studentCounter || 0) + 1;
    }

    transaction.set(
      counterRef,
      { studentCounter: nextId },
      { merge: true }
    );

    return `ST${String(nextId).padStart(3, "0")}`;
  });
};

const main = async () => {
  console.log("Starting Progova student import...\n");

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(`CSV file not found: ${CSV_FILE}`);
  }

  const csv = fs.readFileSync(CSV_FILE, "utf8");

  const students = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${students.length} students.\n`);

  let imported = 0;
  let skipped = 0;

  for (const student of students) {
    try {
      const name = student["Full Name"];
      const course = student["Course"];
      const semester = Number(student["Semester"]);
      const rollNumber = student["Roll Number"];
      const phone = student["Phone"];

      if (!name || !course || !semester || !rollNumber || !phone) {
        console.log(`Skipping invalid record: ${rollNumber}`);
        skipped++;
        continue;
      }

      const email = generateEmail(rollNumber);
      const password = generatePassword(rollNumber);

      // Check whether Firebase Auth user already exists
      let firebaseUser;

      try {
        firebaseUser = await auth.getUserByEmail(email);
        console.log(`Already exists: ${rollNumber}`);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          firebaseUser = await auth.createUser({
            email,
            password,
            displayName: name,
          });

          console.log(`Auth created: ${rollNumber}`);
        } else {
          throw error;
        }
      }

      const uid = firebaseUser.uid;

      // Check if this student already exists by roll number
      const existingStudent = await db
        .collection("students")
        .where("rollNumber", "==", rollNumber)
        .limit(1)
        .get();

      if (!existingStudent.empty) {
        console.log(`Student already exists: ${rollNumber}`);
        skipped++;
        continue;
      }

      const studentId = await getNextStudentId();

      // Create student document
      await db.collection("students").doc(studentId).set({
        uid,
        id: studentId,
        name,
        email,
        role: "student",
        course,
        semester,
        rollNumber,
        phone,
        joinDate: new Date().toISOString().split("T")[0],
        status: "Active",
      });

      // Create users profile
      await db.collection("users").doc(uid).set({
        uid,
        name,
        email,
        role: "student",
        studentId,
      });

      imported++;

      console.log(
        `Imported ${studentId} | ${name} | ${rollNumber}`
      );
    } catch (error) {
      console.error(
        `Failed: ${student["Roll Number"]}`,
        error.message
      );
    }
  }

  console.log("\n================================");
  console.log("Progova import completed");
  console.log("================================");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Total:    ${students.length}`);
};

main().catch((error) => {
  console.error("\nImport failed:");
  console.error(error);
  process.exit(1);
});