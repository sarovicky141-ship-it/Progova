# Progova Complete Logical and Security Audit

**Audit date:** 2026-09-20  
**Scope:** React/Vite frontend, Express backend, Firebase client/Admin SDK integration, authentication, Firestore data flows, routes, configuration, and user workflows.  
**Method:** Read-only static audit of all non-generated project source and configuration files. No source files were modified during the audit.

> Secret handling: this report does not reproduce credentials, private keys, passwords, or API-key values. It identifies only their type and location.

## Executive Summary

The project is in the middle of an authentication migration. The frontend authenticates with Firebase client Auth and reads `users/{uid}`. The backend uses Firebase Admin SDK and protects only a small subset of routes. Most frontend API calls do not send Firebase ID tokens, so protected operations fail while many other operations remain publicly accessible.

The highest-risk issues are:

1. A Firebase service-account private key is present in `server/.env`.
2. Most API reads, writes, updates, and deletes have no authentication or authorization.
3. Frontend requests do not attach Firebase ID tokens.
4. Student provisioning is not transactional and can leave Auth and Firestore inconsistent.
5. Student ownership is not consistently enforced.
6. No Firestore Security Rules file exists in the repository.
7. The frontend and backend use duplicated, inconsistent profile models.

The frontend production build succeeds, but ESLint reports 55 errors and 1 warning.

## A. Project Architecture

- React/Vite frontend in `project/`.
- Express backend in `server/`.
- Firebase client SDK used by the frontend.
- Firebase Admin SDK used by the backend.
- Firebase email/password authentication.
- Firestore collections for users, students, attendance, feedback, placements, messages, and announcements.
- Frontend route protection in `project/src/components/ProtectedRoute.jsx`.
- Backend token verification in `server/middleware/authMiddleware.js`.

The current worktree also contains an in-progress authentication migration: the backend middleware is untracked, while several Firebase/auth files are modified.

## B. Authentication Flow

### Actual login flow

`project/src/contexts/AuthContext.jsx`:

1. The login form calls Firebase `signInWithEmailAndPassword()`.
2. Firebase returns a user and UID.
3. The frontend reads `users/{uid}` from Firestore.
4. The Firestore `role` is copied into frontend state.
5. `Login.jsx` redirects to `/${user.role}`.
6. `ProtectedRoute.jsx` checks the frontend role.

There is one shared login form for admins and students. There is no separate admin credential flow.

### Authentication findings

#### Critical: backend authorization depends on a Firestore role profile

`server/middleware/authMiddleware.js` verifies the Firebase token, then reads `users/{uid}` and trusts its `role` field. This is only secure if clients cannot modify role fields. No Firestore rules file exists in the repository, so that protection cannot be verified.

**Impact:** authentication and authorization integrity. A writable role profile could allow privilege escalation.

#### High: frontend requests omit Firebase ID tokens

The frontend does not send `Authorization: Bearer <token>` on API calls. Examples include:

- `project/src/pages/admin/StudentManagement.jsx`
- `project/src/pages/admin/AttendanceManagement.jsx`
- `project/src/pages/student/StudentAttendance.jsx`

**Impact:** protected backend calls return `401`, while public routes remain callable without authentication.

#### High: role validation is incomplete

`AuthContext.jsx` accepts any role value, including missing or unexpected values. `Login.jsx` then navigates to `/${user.role}`.

**Impact:** invalid redirects, inconsistent role state, and possible authorization bugs.

#### Medium: duplicate profile-loading paths

Login loads the profile directly, while `onAuthStateChanged` independently calls `syncUserProfile()`. These asynchronous paths can race and update state in different orders.

#### Medium: logout navigation is not awaited

`AdminLayout.jsx` and `StudentLayout.jsx` call `logout()` without awaiting it and navigate immediately. Firebase eventually clears the state, but a short race exists.

#### Low: login route does not explicitly handle initial auth loading

The login page checks `user` but not `loading`, so refresh can briefly show the login page before Firebase restores the session.

## C. Admin Login Flow

Actual flow:

```text
Login form
  -> Firebase signInWithEmailAndPassword
  -> users/{firebaseUid}
  -> role copied to frontend state
  -> /admin redirect if role is admin
  -> ProtectedRoute checks frontend state
```

There are no active hard-coded admin credentials in the authentication implementation. The login page contains commented demo credentials, and student management contains a default password, both of which should be removed.

The backend does not receive the Firebase token from the frontend API calls. Dashboard reads may work because many endpoints are public, but protected admin mutations fail.

## D. Student Creation Flow

Backend implementation in `server/index.js`:

```text
POST /api/students
  -> requireAdmin
  -> Firebase Admin createUser
  -> generate ST### ID
  -> write users/{uid}
  -> write students/{studentId}
  -> return student profile
```

### Confirmed defects

#### Critical: no transactional rollback

Auth creation, `users` write, and `students` write occur sequentially. If either Firestore write fails, the Auth user remains. If the second document fails, the system is partially provisioned.

#### High: race-prone student ID generation

`generateStudentId()` scans all student documents and returns the highest number plus one. Concurrent requests can receive the same ID.

#### High: duplicate roll numbers are allowed

There is no uniqueness check for `rollNumber`.

#### Medium: weak server validation

The backend checks only whether required values are truthy. It does not validate email format, password strength, phone format, semester range, course values, roll-number format, field lengths, or unexpected fields.

#### Medium: predictable default password

The frontend initializes new students with `student123`. It is not stored in Firestore, but it encourages shared credentials.

#### Low: admin session is not replaced

The backend uses Firebase Admin SDK, so creating a student does not automatically log the admin out or log the student into the admin browser. This expected migration problem is not present in the current implementation.

## E. Student Login Flow

Actual flow:

```text
Student submits email/password
  -> Firebase Authentication
  -> users/{firebaseUid}
  -> role must be student for routing
  -> /student
  -> student pages use user.studentId
```

The `users` profile created by the backend contains `uid`, `name`, `email`, `role`, and `studentId`, but not `course`, `semester`, `rollNumber`, or `phone`. Those fields exist only in `students/{studentId}`.

**Result:** the student layout and dashboard can render missing student details even though the data exists in Firestore.

The student attendance endpoint is protected by the backend, but the frontend sends no token, so it fails with `401`.

## F. Firestore Data Model

| Collection | Document ID | Main data/identity |
|---|---|---|
| `users` | Firebase Auth UID | Auth profile and role |
| `students` | `ST###` | Student profile and `uid` |
| `attendance` | `ST###_YYYY-MM-DD` | `studentId`, `uid`, status |
| `feedbacks` | Client timestamp or supplied ID | Feedback with no owner UID |
| `placements` | Client timestamp or supplied ID | Placement and applicant count |
| `messages` | Client timestamp or supplied ID | Message with recipient string |
| `announcements` | Firestore-generated ID | Global announcement |

Intended relationship:

```text
Firebase Auth UID
  -> users/{uid}
  -> users.studentId
  -> students/{studentId}.uid
```

### Data model problems

- `users` and `students` duplicate profile data and can diverge.
- Email changes update Auth, `users`, and `students` sequentially without a transaction.
- Deletion removes Firestore data before Auth deletion.
- Attendance stores both `studentId` and `uid`, allowing disagreement.
- Feedback has no owner UID.
- Placement applications have no application records or student UID.
- Messages have no recipient UID list or access model.
- Student progress and dashboard metrics are hard-coded rather than sourced from Firestore.

## G. Firestore Security Rules

No Firestore rules file was found in the repository.

The backend uses Firebase Admin SDK, which bypasses Firestore Security Rules. Therefore every backend route must enforce authentication and authorization independently.

The repository provides no evidence that unauthenticated direct client reads/writes are blocked, or that students cannot change role/profile fields.

## H. API Route Audit

| Method and route | Actual protection | Purpose | Main issue |
|---|---|---|---|
| `GET /api/students` | Public | List students | Exposes all student data |
| `POST /api/students` | `requireAdmin` | Create Auth/profile/student | Frontend sends no token; no rollback |
| `PUT /api/students/:id` | `requireAdmin` | Update student | Weak validation; no transaction |
| `DELETE /api/students/:id` | `requireAdmin` | Delete student | Partial deletion possible |
| `GET /api/attendance` | Public | List attendance by date | Exposes all attendance |
| `GET /api/attendance/student/:studentId` | `requireAuth` | Read student attendance | Frontend sends no token; identity supplied by URL |
| `PUT /api/attendance/:studentId` | `requireAdmin` | Mark attendance | Frontend sends no token |
| `GET /api/feedbacks` | Public | List feedback | Exposes all feedback |
| `POST /api/feedbacks` | Public | Create feedback | Anyone can create/overwrite records |
| `DELETE /api/feedbacks/:id` | Public | Delete feedback | Anyone can delete records |
| `GET /api/announcements` | Public | List announcements | Public read may be intentional |
| `POST /api/announcements` | Public | Create announcement | Anyone can publish |
| `DELETE /api/announcements/:id` | Public | Delete announcement | Anyone can delete |
| `GET /api/placements` | Public | List placements | Public read may be intentional |
| `POST /api/placements` | Public | Create placement | Anyone can create |
| `PUT /api/placements/:id` | Public | Update placement | Anyone can modify |
| `PUT /api/placements/:id/apply` | Public | Increment applicants | Anyone can apply/replay requests |
| `DELETE /api/placements/:id` | Public | Delete placement | Anyone can delete |
| `GET /api/messages` | Public | List messages | Exposes all messages |
| `POST /api/messages` | Public | Create message | Anyone can send |
| `DELETE /api/messages/:id` | Public | Delete message | Anyone can delete |
| `PUT /api/messages/:id` | Public | Update message | Anyone can modify |

### Backend issues

- `cors()` allows all origins.
- No request schema validation.
- No rate limiting.
- No body-size limit.
- No audit logging.
- No pagination.
- Client-supplied document IDs can overwrite records.
- Placement applicant increments are race-prone.
- Errors expose internal `error.message` values.
- Some deletion routes do not check whether the document exists.
- No server-side status/deadline validation.

## I. Student Management Audit

### Add student

- Frontend does not attach authentication headers.
- Default password is predictable.
- Duplicate email is handled by Firebase Auth, but duplicate roll number is not.
- Generated IDs can collide.
- No rollback exists.
- Internal error details may be returned to the client.

### Edit student

`PUT /api/students/:id` accepts arbitrary body fields after deleting only `uid`, `id`, and `password`.

Problems:

- No validation for email, phone, course, semester, roll number, or status.
- Auth, `users`, and `students` updates are not atomic.
- Email changes can leave inconsistent records.
- Frontend submits the entire student object.

### Delete student

- Deletes `students` and `users` before Firebase Auth.
- Auth cleanup failure leaves inconsistent state.
- Related attendance, feedback, and application data remains.

### View/search/filter

- Student listing is public.
- Search assumes all fields exist and are strings.
- Local state can show success while later backend refresh reveals failure.

## J. Admin vs Student Role Separation

| Capability | Intended admin | Intended student | Actual result |
|---|---:|---:|---|
| Manage students | Yes | No | Student routes protected; list route public |
| Manage attendance | Yes | No | Write protected; date read public |
| View own attendance | No | Yes | Auth protected, but frontend token missing |
| Manage placements | Yes | No | All management routes public |
| View placements | Yes | Yes | Public |
| Manage feedback | Yes | No | Routes public |
| Submit feedback | No | Yes | Route public |
| Manage messages | Yes | No | Routes public |
| View own messages | No | Yes | All messages public |
| View announcements | Yes | Yes | Public |
| Manage announcements | Yes | No | Routes public |

Frontend role checks are not sufficient security. Backend route authorization is required for every sensitive operation.

## K. Data Ownership and IDOR

The attendance endpoint is the only student-specific endpoint with an explicit ownership check:

```text
currentUser.studentId === requested studentId
OR
currentUser.uid === students/{studentId}.uid
```

With a valid token and trustworthy profiles, this blocks Student A from reading Student B's attendance. However:

- The frontend does not send the token.
- The requested student ID is supplied by the URL.
- Feedback has no owner field.
- Messages are not filtered by recipient.
- Placement applications are not associated with the authenticated student.
- Other collections have no student ownership enforcement.

## L. Error Handling

Observed patterns:

- Many failures are logged to the console or shown with `alert()`.
- Several pages clear data on error without showing a persistent error state.
- Some requests update local state using client-created data instead of the server response.
- Backend errors often return raw internal messages.
- Loading states are inconsistent.
- No global API error handling or token-refresh handling exists.
- No explicit handling exists for partial student provisioning.

## M. React Logic Audit

Confirmed issues:

- Many files use unsupported `<style>` and fail lint rules.
- Numerous unused imports and state variables exist.
- Missing PropTypes are reported by ESLint.
- Feedback average rating becomes `NaN` when there are no records.
- Student progress can divide by zero when total credits are zero.
- Placement applications are local-only and disappear after refresh.
- Notification read/delete actions are local-only.
- Feedback status updates are local-only.
- Placement status changes are local-only.
- `StudentAttendance.jsx` sorts a derived array during render.
- `location.pathname` is read as a global instead of through React Router location hooks.
- API URLs are inconsistent: many use hard-coded localhost URLs while some use `VITE_API_URL`.
- Dashboard metrics and progress are hard-coded.

## N. Frontend/Backend Consistency

The backend expects bearer authentication on:

- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `GET /api/attendance/student/:studentId`
- `PUT /api/attendance/:studentId`

The frontend sends no bearer tokens on these calls. This is a direct contract mismatch.

Other mismatches include:

- Frontend uses hard-coded localhost URLs in most features.
- Frontend sometimes updates state from locally constructed objects instead of returned data.
- Backend stores placement applicants as a count, while frontend treats application state as local IDs.
- Backend messages are global, while the student notification page assumes student-specific notifications.
- Backend user profiles omit fields expected by the student layout.

## O. Environment and Deployment Audit

- `server/.env` contains a Firebase service-account private key. It is ignored and not tracked in the current Git tree, but the credential must be treated as sensitive and rotated if exposed anywhere.
- Firebase web configuration is committed in `project/libs/firebase.js`. The web API key is generally public, but must be protected by correct Firebase rules and Auth settings.
- No `.env.example` exists.
- Backend Firebase initialization does not explicitly fail fast when the private key is missing.
- Frontend API configuration is inconsistent.
- CORS is unrestricted.
- No production deployment configuration is present.
- No Firestore rules or rules deployment configuration is present.

## P. Duplicate and Obsolete Logic

- Commented-out Firebase Web SDK code remains throughout `server/index.js`.
- Server Firebase initialization still contains obsolete client SDK comments.
- Login contains commented demo credentials.
- Student creation defaults every new form to `student123`.
- Authentication middleware exists as an untracked migration file.
- Frontend and backend security assumptions belong to different migration stages.

No active `localStorage` or `sessionStorage` authentication implementation was found. Firebase Auth persistence is active through the client SDK.

## Q. End-to-End Scenario Results

### Scenario A: Admin logs in

Firebase Auth succeeds, `users/{uid}` loads, and the user reaches `/admin` when the role is `admin`. Public reads work, but protected mutations fail because frontend requests lack tokens.

### Scenario B: Admin creates a student

The current frontend request is rejected with `401` by `requireAdmin`. If a valid token is manually added, Auth and Firestore writes occur sequentially without rollback.

### Scenario C: Admin logs out

The layout navigates immediately. Firebase sign-out then clears Auth state asynchronously. Protected routes eventually redirect to login.

### Scenario D: New student logs in

Firebase Auth and `users/{uid}` lookup succeed. The student reaches `/student`, but course, semester, roll number, and phone may be undefined because they exist only in `students/{studentId}`. Attendance fails without a bearer token.

### Scenario E: Student refreshes

Firebase persistence restores Auth. `AuthContext` reloads `users/{uid}` and protected routing waits during loading. This generally works when the profile exists.

### Scenario F: Student logs out and uses browser back

After Auth state clears, `ProtectedRoute` redirects to login. Browser history does not bypass the React guard, but public APIs remain callable directly.

### Scenario G: Student requests another student's data

Attendance is rejected with `403` when a valid student token is supplied. Other global collections are not student-isolated.

### Scenario H: Student calls an admin-only API

Student creation, update, delete, and attendance marking are rejected by `requireAdmin`. Placement, messaging, feedback, and announcement routes are not actually admin-only.

### Scenario I: Admin deletes a student

The student and user documents are deleted first, then Auth deletion is attempted. If Auth cleanup fails, the system is inconsistent. Related records remain.

### Scenario J: Auth succeeds but Firestore creation fails

An orphan Firebase Auth account remains. A partial `users` document may also remain depending on the failure point.

### Scenario K: Firestore succeeds but Auth fails

The normal implementation creates Auth first, so this exact order does not occur. A later Firestore failure still leaves Auth successfully created without complete profiles.

## R. Severity-Ranked Findings

### Critical

1. Firebase service-account private key present in `server/.env`. Security and deployment risk.
2. Public collection-wide access to students, attendance, feedback, messages, placements, and announcements. Confidentiality risk.
3. Public create/update/delete routes for feedback, placements, messages, and announcements. Integrity risk.
4. Non-transactional student provisioning. Authentication and data-integrity risk.
5. No repository Firestore rules evidence. Authorization risk.

### High

1. Frontend does not send Firebase ID tokens. Authentication/API contract failure.
2. Role trust is based on Firestore profile data without verified rule coverage. Privilege-escalation risk.
3. Student IDs and roll numbers are not safely unique. Data-integrity risk.
4. Student-specific data is not consistently owned by Firebase UID. IDOR/privacy risk.
5. CORS allows all origins. Deployment/security risk.
6. Error details are exposed from backend responses. Information-disclosure risk.

### Medium

1. Duplicate `users` and `students` profile data can diverge.
2. Auth/profile updates are not atomic.
3. Student deletion leaves related records.
4. Predictable default password.
5. Hard-coded dashboard and progress data.
6. Local-only status, notification, and application changes.
7. Inconsistent API base URLs.
8. Weak request validation and no rate limiting.

### Low

1. Login loading flicker during refresh.
2. Logout navigation is not awaited.
3. Obsolete migration comments and demo credentials remain.
4. ESLint cleanliness and unsupported style JSX issues.

## S. Recommended Fix Plan

1. Revoke and rotate the Firebase service-account private key.
2. Add strict Firestore Security Rules for every collection.
3. Require authentication on every non-public backend route.
4. Add Firebase ID-token retrieval and bearer headers through a shared frontend API client.
5. Enforce roles server-side from verified identity and protected role data.
6. Derive student identity from `req.user.uid`, not from client-supplied student IDs.
7. Implement transactional student provisioning with compensating Auth cleanup.
8. Replace max-plus-one IDs with transaction-backed counters or collision-resistant IDs.
9. Enforce unique email and roll number.
10. Add schema validation for every request body and query parameter.
11. Add owner UIDs to feedback, messages, placement applications, and all student-specific records.
12. Store individual placement applications keyed by authenticated student UID.
13. Make update/delete operations atomic or use compensating cleanup.
14. Remove client-supplied IDs for server-owned records.
15. Centralize API base URL and production environment configuration.
16. Remove obsolete Firebase comments and demo credentials.
17. Replace hard-coded dashboard data with authenticated backend data.
18. Add persistent loading, empty, and error states.
19. Fix the ESLint errors before further feature work.
20. Add automated authorization and integrity tests for:
    - Admin and student roles
    - Missing, expired, and invalid tokens
    - Student-to-student access attempts
    - Student provisioning rollback
    - Duplicate email and roll number
    - Account deletion cleanup
    - Token refresh and logout
    - Every protected API route

## Validation Performed

- Frontend build: succeeds with Vite.
- Backend syntax check: succeeds with `node --check index.js`.
- Frontend lint: fails with 55 errors and 1 warning.
- `server/.env`: ignored and not tracked in the current Git tree.
- Firestore rules: not found in the repository.
- `.env.example`: not found in the repository.
