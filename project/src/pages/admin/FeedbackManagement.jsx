import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  Eye,
  Trash2,
  Filter,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "../../lib/api";

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await apiFetch("/api/feedbacks");
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        const data = await res.json();
        setFeedback(data.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchFeedbacks();
  }, []);

  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [viewingFeedback, setViewingFeedback] = useState(null);

  const filteredFeedback = feedback.filter((item) => {
    if (selectedType && item.type !== selectedType) return false;
    if (selectedStatus && item.status !== selectedStatus) return false;
    if (selectedRating && item.rating !== parseInt(selectedRating))
      return false;
    return true;
  });

  const handleStatusChange = (id, newStatus) => {
    setFeedback(
      feedback.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleDeleteFeedback = async (id) => {
    if (confirm("Are you sure you want to delete this feedback?")) {
      try {
        const response = await apiFetch(
          `/api/feedbacks/${id}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to delete feedback");
        }
        // Remove it from local state after backend deletion
        setFeedback(feedback.filter((item) => item.id !== id));
      } catch (error) {
        console.error(error);
        alert("Error deleting feedback. Please try again.");
      }
    }
  };

  const closeModal = () => {
    setViewingFeedback(null);
  };

  const getFeedbackStats = () => {
    const total = feedback.length;
    const newCount = feedback.filter((f) => f.status === "New").length;
    const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / total;
    const byType = {
      Course: feedback.filter((f) => f.type === "Course").length,
      Placement: feedback.filter((f) => f.type === "Placement").length,
      Faculty: feedback.filter((f) => f.type === "Faculty").length,
      General: feedback.filter((f) => f.type === "General").length,
    };
    return { total, newCount, avgRating: avgRating.toFixed(1), byType };
  };

  const stats = getFeedbackStats();

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? "#fbbf24" : "none"}
        color={i < rating ? "#fbbf24" : "#d1d5db"}
      />
    ));
  };

  return (
    <div className="feedback-management">
      <div className="page-header">
        <h1>Feedback Management</h1>
        <p>Monitor and respond to student feedback</p>
      </div>

      {/* Feedback Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Feedback</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon new">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.newCount}</h3>
            <p>New Feedback</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rating">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.avgRating}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      {/* Feedback by Type */}
      <div className="feedback-overview">
        <h2>Feedback by Category</h2>
        <div className="category-grid">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="category-card">
              <h3>{count}</h3>
              <p>{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="feedback-filters">
        <div className="filter-group">
          <label>Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="form-select"
          >
            <option value="">All Types</option>
            <option value="Course">Course</option>
            <option value="Placement">Placement</option>
            <option value="Faculty">Faculty</option>
            <option value="General">General</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-select"
          >
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Rating</label>
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="form-select"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        {filteredFeedback.map((item) => (
          <div key={item.id} className="feedback-card">
            <div className="feedback-header">
              <div className="student-info">
                <h3>{item.studentName}</h3>
                <p>ID: {item.studentId}</p>
              </div>
              <div className="feedback-meta">
                <span className={`type-badge type-${item.type.toLowerCase()}`}>
                  {item.type}
                </span>
                <span
                  className={`status-badge status-${item.status.toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>
            </div>

            <div className="feedback-content">
              <div className="subject-rating">
                <h4>{item.subject}</h4>
                <div className="rating">
                  {renderStars(item.rating)}
                  <span>({item.rating}/5)</span>
                </div>
              </div>
              <p className="feedback-message">{item.message}</p>
              <div className="feedback-date">
                Submitted on {new Date(item.date).toLocaleDateString()}
              </div>
            </div>

            <div className="feedback-actions">
              <button
                className="action-btn view-btn"
                onClick={() => setViewingFeedback(item)}
                title="View Details"
              >
                <Eye size={16} />
              </button>
              {item.status === "New" && (
                <button
                  className="action-btn review-btn"
                  onClick={() => handleStatusChange(item.id, "Reviewed")}
                  title="Mark as Reviewed"
                >
                  <MessageSquare size={16} />
                </button>
              )}
              <button
                className="action-btn delete-btn"
                onClick={() => handleDeleteFeedback(item.id)}
                title="Delete Feedback"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Feedback Modal */}
      {viewingFeedback && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Eye size={24} />
                Feedback Details
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="feedback-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Student Name</label>
                  <span>{viewingFeedback.studentName}</span>
                </div>
                <div className="detail-item">
                  <label>Student ID</label>
                  <span>{viewingFeedback.studentId}</span>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <span
                    className={`type-badge type-${viewingFeedback.type.toLowerCase()}`}
                  >
                    {viewingFeedback.type}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span
                    className={`status-badge status-${viewingFeedback.status.toLowerCase()}`}
                  >
                    {viewingFeedback.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Subject</label>
                  <span>{viewingFeedback.subject}</span>
                </div>
                <div className="detail-item">
                  <label>Date</label>
                  <span>
                    {new Date(viewingFeedback.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="rating-section">
                <label>Rating</label>
                <div className="rating-display">
                  {renderStars(viewingFeedback.rating)}
                  <span>({viewingFeedback.rating}/5)</span>
                </div>
              </div>
              <div className="message-section">
                <label>Message</label>
                <p>{viewingFeedback.message}</p>
              </div>
              <div className="modal-footer">
                {viewingFeedback.status === "New" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleStatusChange(viewingFeedback.id, "Reviewed");
                      closeModal();
                    }}
                  >
                    Mark as Reviewed
                  </button>
                )}
                <button className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .feedback-management {
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
        .stat-icon.new {
          background-color: #10b981;
        }
        .stat-icon.rating {
          background-color: #fbbf24;
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

        .feedback-overview {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .feedback-overview h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .category-card {
          text-align: center;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .category-card:hover {
          background-color: #f8fafc;
        }

        .category-card h3 {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .category-card p {
          color: #6b7280;
          font-size: 14px;
        }

        .feedback-filters {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .filter-group select {
          min-width: 150px;
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feedback-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .feedback-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .student-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .student-info p {
          color: #6b7280;
          font-size: 14px;
        }

        .feedback-meta {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .type-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .type-course {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .type-placement {
          background-color: #dcfce7;
          color: #166534;
        }

        .type-faculty {
          background-color: #fef3c7;
          color: #92400e;
        }

        .type-general {
          background-color: #e0e7ff;
          color: #3730a3;
        }

        .feedback-content {
          margin-bottom: 16px;
        }

        .subject-rating {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .subject-rating h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rating span {
          font-size: 14px;
          color: #6b7280;
        }

        .feedback-message {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .feedback-date {
          font-size: 14px;
          color: #9ca3af;
        }

        .feedback-actions {
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

        .review-btn {
          background-color: #10b981;
          color: white;
        }

        .review-btn:hover {
          background-color: #059669;
        }

        .delete-btn {
          background-color: #ef4444;
          color: white;
        }

        .delete-btn:hover {
          background-color: #dc2626;
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

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background-color: #f3f4f6;
        }

        .feedback-details {
          padding: 24px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .detail-item span {
          color: #6b7280;
          font-size: 16px;
        }

        .rating-section,
        .message-section {
          margin-bottom: 24px;
        }

        .rating-section label,
        .message-section label {
          display: block;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message-section p {
          color: #374151;
          line-height: 1.6;
          padding: 16px;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .feedback-filters {
            flex-direction: column;
          }

          .feedback-header {
            flex-direction: column;
            gap: 12px;
          }

          .subject-rating {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackManagement;
