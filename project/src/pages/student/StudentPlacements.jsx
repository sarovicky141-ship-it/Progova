import React, { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  IndianRupee,
  Calendar as CalIcon,
  Users,
  CheckCircle,
  Clock,
  Building,
} from "lucide-react";

const StudentPlacements = () => {
  const [filterType, setFilterType] = useState("all");
  const [appliedJobs, setAppliedJobs] = useState([]); // Start empty; backend can prepopulate if needed
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/placements");
        if (!res.ok) throw new Error("Failed to fetch placements");
        const data = await res.json();
        setPlacements(data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPlacements();
  }, []);

  const filteredPlacements = placements.filter((placement) => {
    if (filterType === "all") return true;
    if (filterType === "applied") return appliedJobs.includes(placement.id);
    if (filterType === "fulltime") return placement.type === "Full-time";
    if (filterType === "internship") return placement.type === "Internship";
    if (filterType === "active") return placement.status === "Active";
    return true;
  });

  const handleApply = async (placementId) => {
    if (!appliedJobs.includes(placementId)) {
      try {
        const res = await fetch(
          `http://localhost:3000/api/placements/${placementId}/apply`,
          { method: "PUT" }
        );
        if (!res.ok) throw new Error("Failed to apply");
        const result = await res.json();

        setAppliedJobs([...appliedJobs, placementId]);
        setPlacements(
          placements.map((p) =>
            p.id === placementId ? { ...p, applicants: result.applicants } : p
          )
        );
        alert("Application submitted successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to submit application. Try again.");
      }
    } else {
      alert("You have already applied for this position.");
    }
  };

  const getStats = () => {
    const total = placements.length;
    const active = placements.filter((p) => p.status === "Active").length;
    const applied = appliedJobs.length;
    const fulltime = placements.filter(
      (p) => p.type === "Full-time" && p.status === "Active"
    ).length;
    return { total, active, applied, fulltime };
  };

  const stats = getStats();

  return (
    <div className="student-placements">
      <div className="page-header">
        <h1>Placement Opportunities</h1>
        <p>Explore and apply for job opportunities and internships</p>
      </div>
      {/* Stats Overview */}
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
          <div className="stat-icon applied">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.applied}</h3>
            <p>Applications Sent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon fulltime">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.fulltime}</h3>
            <p>Full-time Positions</p>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Opportunities
          </button>
          <button
            className={`filter-btn ${filterType === "applied" ? "active" : ""}`}
            onClick={() => setFilterType("applied")}
          >
            Applied Jobs
          </button>
          <button
            className={`filter-btn ${
              filterType === "fulltime" ? "active" : ""
            }`}
            onClick={() => setFilterType("fulltime")}
          >
            Full-time
          </button>
          <button
            className={`filter-btn ${
              filterType === "internship" ? "active" : ""
            }`}
            onClick={() => setFilterType("internship")}
          >
            Internships
          </button>
          <button
            className={`filter-btn ${filterType === "active" ? "active" : ""}`}
            onClick={() => setFilterType("active")}
          >
            Active Only
          </button>
        </div>
      </div>
      {/* Placements Grid */}
      <div className="placements-grid">
        {filteredPlacements.map((placement) => (
          <div key={placement.id} className="placement-card">
            <div className="placement-header">
              <div className="company-info">
                <div className="company-logo">{placement.companyLogo}</div>
                <div>
                  <h3>{placement.company}</h3>
                  <h4>{placement.position}</h4>
                </div>
              </div>
              <div className="placement-badges">
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
              <div className="detail-row">
                <MapPin size={16} color="#6b7280" />
                <span>{placement.location}</span>
              </div>
              <div className="detail-row">
                <IndianRupee size={16} color="#6b7280" />
                <span>{placement.salary}</span>
              </div>
              <div className="detail-row">
                <CalIcon size={16} color="#6b7280" />
                <span>
                  Deadline: {new Date(placement.deadline).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-row">
                <Users size={16} color="#6b7280" />
                <span>{placement.applicants} applicants</span>
              </div>
            </div>
            <div className="placement-description">
              <p>{placement.description}</p>
            </div>
            <div className="placement-requirements">
              <h5>Requirements:</h5>
              <p>{placement.requirements}</p>
            </div>
            <div className="placement-footer">
              <div className="posted-date">
                <Clock size={14} />
                <span>
                  Posted{" "}
                  {placement.posted
                    ? new Date(placement.posted).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div className="placement-actions">
                {appliedJobs.includes(placement.id) ? (
                  <button className="btn btn-success applied-btn" disabled>
                    <CheckCircle size={16} />
                    Applied
                  </button>
                ) : placement.status === "Active" ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApply(placement.id)}
                  >
                    Apply Now
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Closed
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredPlacements.length === 0 && (
        <div className="no-results">
          <Briefcase size={48} color="#9ca3af" />
          <h3>No placements found</h3>
          <p>
            Try adjusting your filters or check back later for new
            opportunities.
          </p>
        </div>
      )}
      <style jsx>{`
        .student-placements {
          max-width: 1200px;
          width: 1000px;
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
        .stat-icon.active {
          background-color: #10b981;
        }
        .stat-icon.applied {
          background-color: #8b5cf6;
        }
        .stat-icon.fulltime {
          background-color: #f59e0b;
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

        .filters-section {
          margin-bottom: 24px;
        }

        .filter-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: #10b981;
          color: #10b981;
        }

        .filter-btn.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .placements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
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

        .company-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .company-logo {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .company-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .company-info h4 {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        .placement-badges {
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
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .placement-description {
          margin-bottom: 16px;
        }

        .placement-description p {
          color: #374151;
          line-height: 1.6;
          font-size: 14px;
        }

        .placement-requirements {
          margin-bottom: 20px;
          padding: 16px;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .placement-requirements h5 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .placement-requirements p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .placement-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .posted-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #9ca3af;
        }

        .placement-actions {
          display: flex;
          gap: 8px;
        }

        .applied-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: default;
        }

        .no-results {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-results h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .placements-grid {
            grid-template-columns: 1fr;
          }

          .placement-details {
            grid-template-columns: 1fr;
          }

          .placement-footer {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .filter-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentPlacements;
