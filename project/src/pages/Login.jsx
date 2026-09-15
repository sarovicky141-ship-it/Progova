import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { User, Lock, GraduationCap } from "lucide-react";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(id, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay">
          <div className="container">
            <div className="login-content">
              <div className="login-header">
                <div className="logo">
                  <GraduationCap size={48} color="#3b82f6" />
                  <h1>Progova</h1>
                  <p>Student Management & Placement System</p>
                </div>
              </div>

              <div className="login-form-container">
                <form onSubmit={handleSubmit} className="login-form">
                  <h2>Welcome Back</h2>
                  <p className="login-subtitle">Sign in to your account</p>

                  {error && (
                    <div className="notification notification-error">
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      <User size={16} />
                      User ID
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder="Enter your ID"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Lock size={16} />
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary login-btn"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>

                  <div className="demo-credentials">
                    <h4>Demo Credentials:</h4>
                    <div className="demo-users">
                      <div className="demo-user">
                        <strong>Admin:</strong> admin001 / admin123
                      </div>
                      <div className="demo-user">
                        <strong>Student:</strong> ST001 / student123
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="login-footer">
                <div className="footer-links">
                  <Link to="/about" className="footer-link">
                    About
                  </Link>
                  <Link to="/contact" className="footer-link">
                    Contact
                  </Link>
                </div>
                <p>&copy; 2024 Progova. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          position: relative;
        }

        .login-background {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          position: relative;
        }

        .login-overlay {
          background: rgba(0, 0, 0, 0.1);
          min-width: 1500px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 400px;
          width: 100%;
        }

        .login-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }

        .logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .logo h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
        }

        .logo p {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
        }

        .login-form-container {
          padding: 40px 30px;
        }

        .login-form h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: center;
          color: #1f2937;
        }

        .login-subtitle {
          color: #6b7280;
          text-align: center;
          margin-bottom: 30px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          margin-top: 10px;
        }

        .demo-credentials {
          margin-top: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .demo-credentials h4 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .demo-users {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .demo-user {
          font-size: 13px;
          color: #6b7280;
        }

        .demo-user strong {
          color: #374151;
        }

        .login-footer {
          padding: 30px;
          background: #f8fafc;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .footer-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        .login-footer p {
          color: #6b7280;
          font-size: 13px;
          margin: 0;
        }

        @media (max-width: 480px) {
          .login-content {
            margin: 0;
            border-radius: 0;
            min-height: 100vh;
          }
          .login-overlay{
            min-width: 100%;
          }

          .login-header,
          .login-form-container,
          .login-footer {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
