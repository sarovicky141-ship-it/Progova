import React, { useState, useEffect } from "react";
import {
  Send,
  MessageSquare,
  Star,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import FormIllustration from "../../components/shared/FormIllustration";

const StudentFeedback = () => {
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

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    type: "Course",
    subject: "",
    rating: 5,
    message: "",
  });

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    const feedback_item = {
      ...newFeedback,
      id: Date.now(), // or let backend generate ID
      date: new Date().toISOString().split("T")[0],
      status: "Submitted",
      response: null,
    };

    // Send feedback_item to your backend API
    try {
      const response = await apiFetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback_item),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      // Optionally, get response data (created feedback) from backend and update UI
      // const savedFeedback = await response.json();

      // Update local state with new feedback item
      setFeedback([feedback_item, ...feedback]);
      setNewFeedback({
        type: "Course",
        subject: "",
        rating: 5,
        message: "",
      });
      setShowFeedbackForm(false);
    } catch (error) {
      console.error(error);
      alert("Error submitting feedback. Please try again.");
    }
  };

  const closeModal = () => {
    setShowFeedbackForm(false);
    setNewFeedback({
      type: "Course",
      subject: "",
      rating: 5,
      message: "",
    });
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        fill={i < rating ? "#fbbf24" : "none"}
        color={i < rating ? "#fbbf24" : "#d1d5db"}
        style={{ cursor: interactive ? "pointer" : "default" }}
        onClick={
          interactive && onRatingChange
            ? () => onRatingChange(i + 1)
            : undefined
        }
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Reviewed":
        return "status-reviewed";
      case "Under Review":
        return "status-under-review";
      case "Submitted":
        return "status-submitted";
      default:
        return "status-submitted";
    }
  };

  const getFeedbackStats = () => {
    const total = feedback.length;
    const reviewed = feedback.filter((f) => f.status === "Reviewed").length;
    const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / total;
    return { total, reviewed, avgRating: avgRating.toFixed(1) };
  };

  const stats = getFeedbackStats();

  return (
    <div className="student-feedback">
      <div className="page-header">
        <h1>Feedback & Reviews</h1>
        <p>Share your thoughts and help improve our services</p>
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
          <div className="stat-icon reviewed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.reviewed}</h3>
            <p>Reviewed</p>
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

      {/* Add Feedback Button */}
      <div className="feedback-controls">
        <button
          className="btn btn-primary"
          onClick={() => setShowFeedbackForm(true)}
        >
          <Plus size={20} />
          Submit Feedback
        </button>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        {feedback.map((item) => (
          <div key={item.id} className="feedback-card">
            <div className="feedback-header">
              <div className="feedback-info">
                <div className="feedback-meta">
                  <span
                    className={`type-badge type-${item.type.toLowerCase()}`}
                  >
                    {item.type}
                  </span>
                  <span className="feedback-date">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <h3>{item.subject}</h3>
              </div>
              <span className={`status-badge ${getStatusColor(item.status)}`}>
                {item.status === "Under Review" ? (
                  <>
                    <Clock size={14} />
                    {item.status}
                  </>
                ) : item.status === "Reviewed" ? (
                  <>
                    <CheckCircle size={14} />
                    {item.status}
                  </>
                ) : (
                  item.status
                )}
              </span>
            </div>

            <div className="rating-display">
              {renderStars(item.rating)}
              <span className="rating-text">({item.rating}/5)</span>
            </div>

            <div className="feedback-content">
              <p>{item.message}</p>
            </div>

            {item.response && (
              <div className="admin-response">
                <h4>Response:</h4>
                <p>{item.response}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Feedback Modal */}
      {showFeedbackForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal progova-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Send size={24} />
                Submit Feedback
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitFeedback}>
              <div className="progova-form-layout">
              <div className="progova-form-fields">
              <div className="form-content">
                <div className="form-group">
                  <label className="form-label">Feedback Type</label>
                  <select
                    className="form-select"
                    value={newFeedback.type}
                    onChange={(e) =>
                      setNewFeedback({ ...newFeedback, type: e.target.value })
                    }
                    required
                  >
                    <option value="Course">Course</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Placement">Placement Services</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFeedback.subject}
                    onChange={(e) =>
                      setNewFeedback({
                        ...newFeedback,
                        subject: e.target.value,
                      })
                    }
                    placeholder={`Enter ${newFeedback.type.toLowerCase()} name or subject`}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div className="rating-input">
                    {renderStars(newFeedback.rating, true, (rating) =>
                      setNewFeedback({ ...newFeedback, rating })
                    )}
                    <span className="rating-label">
                      ({newFeedback.rating}/5)
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Feedback</label>
                  <textarea
                    className="form-input form-textarea"
                    value={newFeedback.message}
                    onChange={(e) =>
                      setNewFeedback({
                        ...newFeedback,
                        message: e.target.value,
                      })
                    }
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    rows="5"
                    required
                  ></textarea>
                </div>
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
                  Submit Feedback
                </button>
              </div>
              </div>
              <FormIllustration variant="feedback" />
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .student-feedback {
          max-width: 1000px;
          width: 100%;
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        .stat-icon.reviewed {
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

        .feedback-controls {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .feedback-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
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

        .type-faculty {
          background-color: #fef3c7;
          color: #92400e;
        }

        .type-placement {
          background-color: #dcfce7;
          color: #166534;
        }

        .type-general {
          background-color: #e0e7ff;
          color: #3730a3;
        }

        .feedback-date {
          font-size: 12px;
          color: #9ca3af;
        }

        .feedback-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-reviewed {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-under-review {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-submitted {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .rating-text {
          font-size: 14px;
          color: #6b7280;
        }

        .feedback-content p {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .admin-response {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .admin-response h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .admin-response p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
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

        .form-content {
          padding: 24px;
        }

        .rating-input {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rating-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .feedback-header {
            flex-direction: column;
            gap: 12px;
          }

          .modal-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentFeedback;
