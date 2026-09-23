import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Eye, EyeOff, UserPlus } from "lucide-react";
import { apiFetch } from "../../lib/api";
import FormIllustration from "../../components/shared/FormIllustration";
import "./StudentManagement.css";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiFetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data.data);
    } catch (error) {
      alert(error.message);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    course: "",
    semester: "",
    rollNumber: "",
    phone: "",
    password: "",
  });

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const studentPayload = {
      name: newStudent.name,
      email: newStudent.email,
      course: newStudent.course,
      semester: Number(newStudent.semester),
      rollNumber: newStudent.rollNumber,
      phone: newStudent.phone,
      password: newStudent.password,
    };

    try {
      const response = await apiFetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error adding student: ${error.error || response.statusText}`);
        return;
      }

      const result = await response.json();
      setStudents((prev) => [...prev, result.data]);
      alert("Student added successfully!");

      setNewStudent({
        name: "",
        email: "",
        course: "",
        semester: "",
        rollNumber: "",
        phone: "",
        password: "student123",
      });
      setShowAddForm(false);
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  // When clicking the edit button:
  const handleEditClick = (student) => {
    setEditingStudent(student);
    setNewStudent({ ...student }); // copy existing student data to form
    setShowAddForm(true);
  };

  // Handle update (after editing form submission):
  const handleUpdateStudent = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/api/students/${editingStudent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStudent),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        alert(`Update error: ${error.error || response.statusText}`);
        return;
      }
      const updatedStudent = await response.json();

      // update local students array with response:
      setStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? updatedStudent.data : s))
      );
      alert("Student updated!");
      setEditingStudent(null);
      setShowAddForm(false);
      setNewStudent({
        name: "",
        email: "",
        course: "",
        semester: "",
        rollNumber: "",
        phone: "",
        password: "student123",
      });
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  // When clicking delete:
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;

    try {
      const response = await apiFetch(`/api/students/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        alert(`Error deleting: ${error.error || response.statusText}`);
        return;
      }
      setStudents((prev) => prev.filter((s) => s.id !== id));
      alert("Deleted successfully");
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  const closeModal = () => {
    setShowAddForm(false);
    setEditingStudent(null);
    setViewingStudent(null);
    setNewStudent({
      name: "",
      email: "",
      course: "",
      semester: "",
      rollNumber: "",
      phone: "",
      password: "student123",
    });
  };

  return (
    <div className="student-management">
      <div className="page-header">
        <h1>Student Management</h1>
        <p>Manage all student information and records</p>
      </div>

      <div className="management-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="students-table-container">
        <table className="table students-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Roll Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.course}</td>
                <td>{student.semester}</td>
                <td>{student.rollNumber}</td>
                <td>
                  <span
                    className={`status-badge status-${student.status.toLowerCase()}`}
                  >
                    {student.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view-btn"
                      onClick={() => setViewingStudent(student)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditClick(student)}
                      title="Edit Student"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteStudent(student.id)}
                      title="Delete Student"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Student Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal progova-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <UserPlus size={24} />
                {editingStudent ? "Edit Student" : "Add New Student"}
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form
              onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
            >
              <div className="progova-form-layout">
              <div className="progova-form-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStudent.name}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select
                    className="form-select"
                    value={newStudent.course}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, course: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Course</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Chemical">Chemical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    className="form-select"
                    value={newStudent.semester}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        semester: parseInt(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStudent.rollNumber}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        rollNumber: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newStudent.phone}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, phone: e.target.value })
                    }
                    required
                  />
                </div>
                {!editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Temporary Password</label>
                    <div className="password-field">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        value={newStudent.password}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, password: e.target.value })
                        }
                        minLength="8"
                        required
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? "Update Student" : "Add Student"}
                </button>
              </div>
              </div>
              <FormIllustration variant="student" />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {viewingStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Eye size={24} />
                Student Details
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="student-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Student ID</label>
                  <span>{viewingStudent.id}</span>
                </div>
                <div className="detail-item">
                  <label>Full Name</label>
                  <span>{viewingStudent.name}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{viewingStudent.email}</span>
                </div>
                <div className="detail-item">
                  <label>Course</label>
                  <span>{viewingStudent.course}</span>
                </div>
                <div className="detail-item">
                  <label>Semester</label>
                  <span>{viewingStudent.semester}</span>
                </div>
                <div className="detail-item">
                  <label>Roll Number</label>
                  <span>{viewingStudent.rollNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{viewingStudent.phone}</span>
                </div>
                <div className="detail-item">
                  <label>Join Date</label>
                  <span>
                    {new Date(viewingStudent.joinDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span
                    className={`status-badge status-${viewingStudent.status.toLowerCase()}`}
                  >
                    {viewingStudent.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
