import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  Building,
  Users,
  Calendar,
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import FormIllustration from "../../components/shared/FormIllustration";

const PlacementManagement = () => {
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const res = await apiFetch("/api/placements");
        if (!res.ok) throw new Error("Failed to fetch placements");
        const data = await res.json();
        setPlacements(data.data || []);
        console.log(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPlacements();
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [viewingPlacement, setViewingPlacement] = useState(null);
  const [newPlacement, setNewPlacement] = useState({
    company: "",
    position: "",
    location: "",
    salary: "",
    deadline: "",
    requirements: "",
    description: "",
    type: "Full-time",
  });

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    const placement = {
      ...newPlacement,
      status: "Active",
      applicants: 0,
    };

    try {
      const res = await apiFetch("/api/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(placement),
      });
      if (!res.ok) throw new Error("Failed to add placement");
      const result = await res.json();
      setPlacements([...placements, result.data]);
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Error adding placement. Please try again.");
    }
  };

  const handleEditPlacement = (placement) => {
    setEditingPlacement(placement);
    setNewPlacement(placement);
    setShowAddForm(true);
  };

  const handleUpdatePlacement = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(
        `/api/placements/${editingPlacement.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPlacement),
        }
      );
      if (!res.ok) throw new Error("Failed to update placement");
      // Update state with new placement data
      setPlacements(
        placements.map((p) =>
          p.id === editingPlacement.id
            ? { ...newPlacement, id: editingPlacement.id }
            : p
        )
      );
      resetForm();
    } catch (error) {
      alert("Error updating placement. Please try again.");
    }
  };

  const handleDeletePlacement = async (id) => {
    if (confirm("Are you sure you want to delete this placement?")) {
      try {
        const res = await apiFetch(`/api/placements/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete placement");
        setPlacements(placements.filter((p) => p.id !== id));
      } catch (error) {
        console.error(error);
        alert("Error deleting placement. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingPlacement(null);
    setNewPlacement({
      company: "",
      position: "",
      location: "",
      salary: "",
      deadline: "",
      requirements: "",
      description: "",
      type: "Full-time",
    });
  };

  const closeModal = () => {
    setShowAddForm(false);
    setEditingPlacement(null);
    setViewingPlacement(null);
    resetForm();
  };

  const togglePlacementStatus = (id) => {
    setPlacements(
      placements.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "Active" ? "Closed" : "Active" }
          : p
      )
    );
  };

  const getPlacementStats = () => {
    const total = placements.length;
    const active = placements.filter((p) => p.status === "Active").length;
    const totalApplicants = placements.reduce(
      (sum, p) => sum + p.applicants,
      0
    );
    return { total, active, totalApplicants };
  };

  const stats = getPlacementStats();

  return (
    <div className="placement-management">
      <div className="page-header">
        <h1>Placement Management</h1>
        <p>Manage job placements and internship opportunities</p>
      </div>

      {/* Placement Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <Briefcase size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Opportunities</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active Openings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon applicants">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalApplicants}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
      </div>

      {/* Add Placement Button */}
      <div className="management-controls">
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={20} />
          Add Placement
        </button>
      </div>

      {/* Placements Grid */}
      <div className="placements-grid">
        {placements.map((placement) => (
          <div key={placement.id} className="placement-card">
            <div className="placement-header">
              <div className="company-info">
                <h3>{placement.company}</h3>
                <p>{placement.position}</p>
              </div>
              <div className="placement-status">
                <span
                  className={`status-badge status-${placement.status.toLowerCase()}`}
                >
                  {placement.status}
                </span>
                <span
                  className={`type-badge type-${placement.type
                    .toLowerCase()
                    .replace("-", "")}`}
                >
                  {placement.type}
                </span>
              </div>
            </div>

            <div className="placement-details">
              <div className="detail-item">
                <span className="label">Location:</span>
                <span>{placement.location}</span>
              </div>
              <div className="detail-item">
                <span className="label">Salary:</span>
                <span>{placement.salary}</span>
              </div>
              <div className="detail-item">
                <span className="label">Deadline:</span>
                <span>{new Date(placement.deadline).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Applicants:</span>
                <span>{placement.applicants}</span>
              </div>
            </div>

            <div className="placement-description">
              <p>{placement.description}</p>
            </div>

            <div className="placement-actions">
              <button
                className="action-btn view-btn"
                onClick={() => setViewingPlacement(placement)}
                title="View Details"
              >
                <Eye size={16} />
              </button>
              <button
                className="action-btn edit-btn"
                onClick={() => handleEditPlacement(placement)}
                title="Edit Placement"
              >
                <Edit size={16} />
              </button>
              <button
                className={`action-btn ${
                  placement.status === "Active" ? "close-btn" : "activate-btn"
                }`}
                onClick={() => togglePlacementStatus(placement.id)}
                title={
                  placement.status === "Active"
                    ? "Close Placement"
                    : "Activate Placement"
                }
              >
                <Calendar size={16} />
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleDeletePlacement(placement.id)}
                title="Delete Placement"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Placement Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal progova-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Briefcase size={24} />
                {editingPlacement ? "Edit Placement" : "Add New Placement"}
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form
              onSubmit={
                editingPlacement ? handleUpdatePlacement : handleAddPlacement
              }
            >
              <div className="progova-form-layout">
              <div className="progova-form-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlacement.company}
                    onChange={(e) =>
                      setNewPlacement({
                        ...newPlacement,
                        company: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlacement.position}
                    onChange={(e) =>
                      setNewPlacement({
                        ...newPlacement,
                        position: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlacement.location}
                    onChange={(e) =>
                      setNewPlacement({
                        ...newPlacement,
                        location: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlacement.salary}
                    onChange={(e) =>
                      setNewPlacement({
                        ...newPlacement,
                        salary: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPlacement.deadline}
                    onChange={(e) =>
                      setNewPlacement({
                        ...newPlacement,
                        deadline: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={newPlacement.type}
                    onChange={(e) =>
                      setNewPlacement({ ...newPlacement, type: e.target.value })
                    }
                    required
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Requirements</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlacement.requirements}
                  onChange={(e) =>
                    setNewPlacement({
                      ...newPlacement,
                      requirements: e.target.value,
                    })
                  }
                  placeholder="e.g., Computer Science, 3.5+ GPA"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  value={newPlacement.description}
                  onChange={(e) =>
                    setNewPlacement({
                      ...newPlacement,
                      description: e.target.value,
                    })
                  }
                  placeholder="Job description and responsibilities"
                  required
                ></textarea>
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
                  {editingPlacement ? "Update Placement" : "Add Placement"}
                </button>
              </div>
              </div>
              <FormIllustration variant="placement" />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Placement Details Modal */}
      {viewingPlacement && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Eye size={24} />
                Placement Details
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="placement-details-view">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Company</label>
                  <span>{viewingPlacement.company}</span>
                </div>
                <div className="detail-item">
                  <label>Position</label>
                  <span>{viewingPlacement.position}</span>
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <span>{viewingPlacement.location}</span>
                </div>
                <div className="detail-item">
                  <label>Salary</label>
                  <span>{viewingPlacement.salary}</span>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <span
                    className={`type-badge type-${viewingPlacement.type
                      .toLowerCase()
                      .replace("-", "")}`}
                  >
                    {viewingPlacement.type}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span
                    className={`status-badge status-${viewingPlacement.status.toLowerCase()}`}
                  >
                    {viewingPlacement.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Deadline</label>
                  <span>
                    {new Date(viewingPlacement.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Applicants</label>
                  <span>{viewingPlacement.applicants}</span>
                </div>
              </div>
              <div className="full-width-item">
                <label>Requirements</label>
                <p>{viewingPlacement.requirements}</p>
              </div>
              <div className="full-width-item">
                <label>Description</label>
                <p>{viewingPlacement.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .placement-management {
          max-width: 1200px;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.total {
          background-color: #3b82f6;
        }
        .stat-icon.active {
          background-color: #10b981;
        }
        .stat-icon.applicants {
          background-color: #8b5cf6;
        }

        .stat-content h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stat-content p {
          color: #6b7280;
          font-size: 14px;
        }

        .management-controls {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }

        .placements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
          gap: 24px;
        }

        .placement-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .placement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .placement-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .company-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .company-info p {
          color: #6b7280;
          font-size: 16px;
        }

        .placement-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .type-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .type-fulltime {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .type-parttime {
          background-color: #fef3c7;
          color: #92400e;
        }

        .type-internship {
          background-color: #e0e7ff;
          color: #3730a3;
        }

        .placement-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-item .label {
          font-weight: 500;
          color: #6b7280;
          font-size: 14px;
        }

        .detail-item span:last-child {
          color: #1f2937;
          font-size: 14px;
        }

        .placement-description {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #f8fafc;
          border-radius: 8px;
        }

        .placement-description p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .placement-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .action-btn {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .view-btn {
          background-color: #3b82f6;
          color: white;
        }

        .view-btn:hover {
          background-color: #2563eb;
        }

        .edit-btn {
          background-color: #f59e0b;
          color: white;
        }

        .edit-btn:hover {
          background-color: #d97706;
        }

        .close-btn {
          background-color: #ef4444;
          color: white;
        }

        .close-btn:hover {
          background-color: #dc2626;
        }

        .activate-btn {
          background-color: #10b981;
          color: white;
        }

        .activate-btn:hover {
          background-color: #059669;
        }

        .delete-btn {
          background-color: #6b7280;
          color: white;
        }

        .delete-btn:hover {
          background-color: #4b5563;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .modal-header .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
        }

        .modal-header .close-btn:hover {
          background-color: #f3f4f6;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .placement-details-view {
          padding: 24px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .detail-grid .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-grid .detail-item label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .detail-grid .detail-item span {
          color: #6b7280;
          font-size: 16px;
        }

        .full-width-item {
          margin-bottom: 20px;
        }

        .full-width-item label {
          display: block;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .full-width-item p {
          color: #6b7280;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .placements-grid {
            grid-template-columns: 1fr;
          }

          .placement-details {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PlacementManagement;
