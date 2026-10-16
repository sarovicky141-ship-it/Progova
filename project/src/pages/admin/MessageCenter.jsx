import React, { useState, useEffect } from "react";
import { Send, Plus, Users, Bell, Mail, Trash2 } from "lucide-react";
import { apiFetch, isApiRequestInterrupted } from "../../lib/api";
import FormIllustration from "../../components/shared/FormIllustration";
import LoadingState from "../../components/shared/LoadingState";

const MessageCenter = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]); // Start with empty array
  const [students, setStudents] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");
  const [announcementsError, setAnnouncementsError] = useState("");
  const [studentsError, setStudentsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setMessagesLoading(true);
    setMessagesError("");
    const fetchMessages = async () => {
      try {
        const response = await apiFetch("/api/messages", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        if (active) setMessages(data.data || []);
      } catch (error) {
        if (active && !isApiRequestInterrupted(error)) {
          setMessagesError(error.message);
        }
      } finally {
        if (active) setMessagesLoading(false);
      }
    };

    fetchMessages();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAnnouncementsLoading(true);
    setAnnouncementsError("");
    fetchAnnouncements(controller.signal);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setStudentsLoading(true);
    setStudentsError("");
    const fetchStudents = async () => {
      try {
        const response = await apiFetch("/api/students", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch students");
        }
        const data = await response.json();
        if (active) setStudents(data.data || []);
      } catch (error) {
        if (active && !isApiRequestInterrupted(error)) {
          setStudentsError(error.message);
        }
      } finally {
        if (active) setStudentsLoading(false);
      }
    };

    fetchStudents();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const fetchAnnouncements = async (signal) => {
    try {
      const response = await apiFetch("/api/announcements", { signal });
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();
      // Assuming backend returns announcements as an array in data field
      if (!signal.aborted) setAnnouncements(data.data || data);
    } catch (error) {
      if (!signal.aborted && !isApiRequestInterrupted(error)) {
        setAnnouncementsError(error.message);
      }
    } finally {
      if (!signal.aborted) setAnnouncementsLoading(false);
    }
  };

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    audienceType: "",
    recipientUids: [],
    priority: "Normal",
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "Normal",
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newMessage.title,
          content: newMessage.content,
          priority: newMessage.priority,
          audience:
            newMessage.audienceType === "broadcast"
              ? { type: "broadcast" }
              : {
                  type: newMessage.audienceType,
                  recipientUids: newMessage.recipientUids,
                },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error sending message: ${error.error || response.statusText}`);
        return;
      }

      const result = await response.json();
      setMessages((prev) => [result.data, ...prev]);
      setNewMessage({
        title: "",
        content: "",
        audienceType: "",
        recipientUids: [],
        priority: "Normal",
      });
      setShowMessageForm(false);
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    const announcement = {
      ...newAnnouncement,
      date: new Date().toISOString().split("T")[0],
    };

    try {
      const response = await apiFetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(announcement),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(
          `Error posting announcement: ${error.error || response.statusText}`
        );
        return;
      }

      const result = await response.json();
      // Assuming backend returns created announcement with ID in `result.data`
      setAnnouncements((prev) => [result.data, ...prev]);
      alert("Announcement posted successfully!");

      setNewAnnouncement({
        title: "",
        content: "",
        priority: "Normal",
      });
      setShowAnnouncementForm(false);
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;

    try {
      const response = await apiFetch(
        `/api/announcements/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(
          `Error deleting announcement: ${error.error || response.statusText}`
        );
        return;
      }

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      alert("Announcement deleted successfully!");
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    try {
      const response = await apiFetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error deleting message: ${error.error || response.statusText}`);
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== id));
      alert("Message deleted successfully!");
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  };

  const closeModals = () => {
    setShowMessageForm(false);
    setShowAnnouncementForm(false);
    setNewMessage({
      title: "",
      content: "",
      audienceType: "",
      recipientUids: [],
      priority: "Normal",
    });
    setNewAnnouncement({
      title: "",
      content: "",
      priority: "Normal",
    });
  };

  return (
    <div className="message-center">
      <div className="page-header">
        <h1>Message Center</h1>
        <p>Send messages and announcements to students</p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={() => setShowMessageForm(true)}
        >
          <Send size={20} />
          Send Message
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowAnnouncementForm(true)}
        >
          <Bell size={20} />
          Post Announcement
        </button>
      </div>

      <div className="content-grid">
        {/* Recent Messages */}
        <div className="content-section">
          <div className="section-header">
            <h2>
              <Mail size={24} />
              Recent Messages
            </h2>
          </div>
          <div className="messages-list">
            {messagesLoading ? (
              <LoadingState />
            ) : messagesError ? (
              <p role="alert">{messagesError}</p>
            ) : messages.length === 0 ? (
              <p>No messages found.</p>
            ) : messages.map((message) => (
              <div key={message.id} className="message-card">
                <div className="message-header">
                  <div className="message-info">
                    <h3>{message.title}</h3>
                    <div className="message-meta">
                      <span>To: {message.recipients}</span>
                      <span>•</span>
                      <span>{new Date(message.date).toLocaleDateString()}</span>
                      <span
                        className={`priority-badge priority-${message.priority.toLowerCase()}`}
                      >
                        {message.priority}
                      </span>
                    </div>
                  </div>
                  <div className="message-actions">
                    <span
                      className={`status-badge status-${message.status.toLowerCase()}`}
                    >
                      {message.status}
                    </span>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteMessage(message.id)}
                      title="Delete Message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="message-content">
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="content-section">
          <div className="section-header">
            <h2>
              <Bell size={24} />
              Active Announcements
            </h2>
          </div>
          <div className="announcements-list">
            {announcementsLoading ? (
              <LoadingState />
            ) : announcementsError ? (
              <p role="alert">{announcementsError}</p>
            ) : announcements.length === 0 ? (
              <p>No active announcements.</p>
            ) : announcements.map((announcement) => (
              <div key={announcement.id} className="announcement-card">
                <div className="announcement-header">
                  <div className="announcement-info">
                    <h3>{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span>
                        {new Date(announcement.date).toLocaleDateString()}
                      </span>
                      <span
                        className={`priority-badge priority-${announcement.priority.toLowerCase()}`}
                      >
                        {announcement.priority}
                      </span>
                    </div>
                  </div>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    title="Delete Announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="announcement-content">
                  <p>{announcement.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {showMessageForm && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal progova-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Send size={24} />
                Send Message
              </h2>
              <button className="close-btn" onClick={closeModals}>
                ×
              </button>
            </div>
            <form onSubmit={handleSendMessage}>
              <div className="progova-form-layout">
              <div className="progova-form-fields">
              <div className="form-content">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newMessage.title}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, title: e.target.value })
                    }
                    placeholder="Enter message subject"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Audience</label>
                  <select
                    className="form-select"
                    value={newMessage.audienceType}
                    onChange={(e) =>
                      setNewMessage({
                        ...newMessage,
                        audienceType: e.target.value,
                        recipientUids: [],
                      })
                    }
                    required
                  >
                    <option value="">Select Audience</option>
                    <option value="broadcast">All Students (Broadcast)</option>
                    <option value="individual">One Student</option>
                    <option value="group">Selected Students (Group)</option>
                  </select>
                </div>
                {["individual", "group"].includes(newMessage.audienceType) && (
                  <div className="form-group">
                    <label className="form-label">Student Recipients</label>
                    {studentsLoading ? (
                      <LoadingState />
                    ) : studentsError ? (
                      <p role="alert">{studentsError}</p>
                    ) : (
                    <select
                      className="form-select"
                      multiple={newMessage.audienceType === "group"}
                      size={newMessage.audienceType === "group" ? 6 : undefined}
                      value={
                        newMessage.audienceType === "group"
                          ? newMessage.recipientUids
                          : newMessage.recipientUids[0] || ""
                      }
                      onChange={(e) => {
                        const selectedUids = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        );
                        setNewMessage({
                          ...newMessage,
                          recipientUids:
                            newMessage.audienceType === "individual"
                              ? selectedUids.slice(0, 1)
                              : selectedUids,
                        });
                      }}
                      required
                    >
                      {students
                        .filter((student) => student.uid)
                        .map((student) => (
                          <option key={student.uid} value={student.uid}>
                            {student.name || student.email}{" "}
                            {student.rollNumber
                              ? `(${student.rollNumber})`
                              : ""}
                          </option>
                        ))}
                    </select>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={newMessage.priority}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, priority: e.target.value })
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input form-textarea"
                    value={newMessage.content}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, content: e.target.value })
                    }
                    placeholder="Enter your message here..."
                    rows="6"
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Message
                </button>
              </div>
              </div>
              <FormIllustration variant="message" />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {showAnnouncementForm && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal progova-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Bell size={24} />
                Post Announcement
              </h2>
              <button className="close-btn" onClick={closeModals}>
                ×
              </button>
            </div>
            <form onSubmit={handlePostAnnouncement}>
              <div className="progova-form-layout">
              <div className="progova-form-fields">
              <div className="form-content">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        title: e.target.value,
                      })
                    }
                    placeholder="Enter announcement title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={newAnnouncement.priority}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-input form-textarea"
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        content: e.target.value,
                      })
                    }
                    placeholder="Enter announcement content..."
                    rows="6"
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Post Announcement
                </button>
              </div>
              </div>
              <FormIllustration variant="announcement" />
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .message-center {
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

        .action-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 32px;
        }

        .content-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .section-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .messages-list,
        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message-card,
        .announcement-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .message-card:hover,
        .announcement-card:hover {
          background-color: #f8fafc;
        }

        .message-header,
        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .message-info h3,
        .announcement-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .message-meta,
        .announcement-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-normal {
          background-color: #e0e7ff;
          color: #3730a3;
        }

        .priority-high {
          background-color: #fef3c7;
          color: #92400e;
        }

        .priority-urgent {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .message-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-sent {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-draft {
          background-color: #f3f4f6;
          color: #4b5563;
        }

        .action-btn {
          padding: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .delete-btn {
          background-color: #ef4444;
          color: white;
        }

        .delete-btn:hover {
          background-color: #dc2626;
        }

        .message-content p,
        .announcement-content p {
          color: #374151;
          line-height: 1.6;
          font-size: 14px;
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
          .content-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .message-header,
          .announcement-header {
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

export default MessageCenter;
