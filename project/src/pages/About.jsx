import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Users, Award, Target, ArrowLeft } from 'lucide-react'

const About = () => {
  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Comprehensive student information management system with easy access to academic records and personal details.'
    },
    {
      icon: GraduationCap,
      title: 'Academic Tracking',
      description: 'Track academic progress, attendance, and course performance with detailed analytics and reporting.'
    },
    {
      icon: Award,
      title: 'Placement Assistance',
      description: 'Connect students with placement opportunities and manage the entire recruitment process efficiently.'
    },
    {
      icon: Target,
      title: 'Communication Hub',
      description: 'Seamless communication between administrators and students through notifications and messaging.'
    }
  ]

  const stats = [
    { number: '1000+', label: 'Students Managed' },
    { number: '50+', label: 'Partner Companies' },
    { number: '95%', label: 'Placement Rate' },
    { number: '24/7', label: 'System Availability' }
  ]

  return (
    <div className="about-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <Link to="/login" className="back-link">
            <ArrowLeft size={20} />
            Back to Login
          </Link>
          <div className="header-content">
            <div className="logo-section">
              <GraduationCap size={64} color="#10b981" />
              <h1>Progova</h1>
              <p className="tagline">Student Management & Placement System</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="about-section">
        <div className="container">
          <div className="about-content">
            <h2>About Progova</h2>
            <p className="lead">
              Progova is a comprehensive student management and placement assistance system designed to streamline 
              educational administration and enhance the learning experience for both students and administrators.
            </p>
            <p>
              Our platform provides a unified solution that integrates academic tracking, attendance management, 
              placement services, and communication tools into a single, easy-to-use system. By reducing manual 
              effort and improving transparency, Progova helps educational institutions focus on what matters most - 
              providing quality education and career opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={32} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="container">
          <h2>Our Impact</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              To empower educational institutions with modern technology solutions that enhance student success, 
              streamline administrative processes, and bridge the gap between education and industry through 
              effective placement services.
            </p>
            <div className="mission-points">
              <div className="mission-point">
                <h4>Innovation</h4>
                <p>Leveraging cutting-edge technology to solve educational challenges</p>
              </div>
              <div className="mission-point">
                <h4>Accessibility</h4>
                <p>Making quality education management tools accessible to all institutions</p>
              </div>
              <div className="mission-point">
                <h4>Excellence</h4>
                <p>Committed to delivering exceptional user experiences and outcomes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of students and administrators who trust Progova for their educational needs.</p>
            <Link to="/login" className="btn btn-primary">
              Access Portal
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .about-page {
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 0 80px 0;
          position: relative;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 40px;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: white;
        }

        .header-content {
          text-align: center;
        }

        .logo-section h1 {
          font-size: 48px;
          font-weight: 700;
          margin: 20px 0 10px 0;
        }

        .tagline {
          font-size: 20px;
          opacity: 0.9;
        }

        .about-section {
          padding: 80px 0;
          background: white;
          margin-top: -40px;
          border-radius: 20px 20px 0 0;
          position: relative;
          z-index: 1;
        }

        .about-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .about-content h2 {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 24px;
        }

        .lead {
          font-size: 20px;
          color: #4b5563;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .about-content p {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.7;
        }

        .features-section {
          padding: 80px 0;
          background: #f8fafc;
        }

        .features-section h2 {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          margin-bottom: 48px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }

        .feature-card {
          background: white;
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px auto;
          color: white;
        }

        .feature-card h3 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        .stats-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
        }

        .stats-section h2 {
          font-size: 36px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 48px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
        }

        .stat-card {
          text-align: center;
          padding: 24px;
        }

        .stat-card h3 {
          font-size: 48px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 8px;
        }

        .stat-card p {
          font-size: 18px;
          opacity: 0.9;
        }

        .mission-section {
          padding: 80px 0;
          background: white;
        }

        .mission-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .mission-content h2 {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 24px;
        }

        .mission-content > p {
          font-size: 18px;
          color: #4b5563;
          line-height: 1.7;
          margin-bottom: 48px;
        }

        .mission-points {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          text-align: left;
        }

        .mission-point {
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .mission-point:hover {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .mission-point h4 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .mission-point p {
          color: #6b7280;
          line-height: 1.6;
        }

        .cta-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .cta-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-content h2 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .cta-content p {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 32px;
        }

        .cta-content .btn {
          background: white;
          color: #10b981;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .cta-content .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .logo-section h1 {
            font-size: 36px;
          }

          .tagline {
            font-size: 18px;
          }

          .about-content h2,
          .features-section h2,
          .stats-section h2,
          .mission-content h2,
          .cta-content h2 {
            font-size: 28px;
          }

          .lead {
            font-size: 18px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .mission-points {
            grid-template-columns: 1fr;
          }

          .stat-card h3 {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  )
}

export default About