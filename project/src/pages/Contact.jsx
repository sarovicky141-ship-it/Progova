import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsSubmitted(true)
    setIsSubmitting(false)
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    })

    // Reset success message after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: 'support@progova.com',
      description: 'Send us an email anytime'
    },
    {
      icon: Phone,
      title: 'Phone',
      details: '+1 (555) 123-4567',
      description: 'Mon-Fri from 8am to 5pm'
    },
    {
      icon: MapPin,
      title: 'Address',
      details: '123 Education Street, Learning City, LC 12345',
      description: 'Visit our main office'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: 'Mon-Fri: 8am-5pm',
      description: 'Weekend support available'
    }
  ]

  const faqItems = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page and following the instructions sent to your email.'
    },
    {
      question: 'How can I check my attendance?',
      answer: 'Students can view their attendance records in the Student Dashboard under the "Attendance" section, which shows detailed attendance history and statistics.'
    },
    {
      question: 'Where can I find placement opportunities?',
      answer: 'All available placement opportunities are listed in the "Placements" section of your student dashboard. You can filter by company, position type, and application deadline.'
    },
    {
      question: 'How do I submit feedback?',
      answer: 'You can submit feedback through the "Feedback" section in your dashboard. Choose the appropriate category and share your thoughts to help us improve our services.'
    }
  ]

  return (
    <div className="contact-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <Link to="/login" className="back-link">
            <ArrowLeft size={20} />
            Back to Login
          </Link>
          <div className="header-content">
            <h1>Contact Us</h1>
            <p>Get in touch with our support team</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="contact-info-section">
        <div className="container">
          <div className="contact-grid">
            {contactInfo.map((info, index) => (
              <div key={index} className="contact-card">
                <div className="contact-icon">
                  <info.icon size={24} />
                </div>
                <div className="contact-details">
                  <h3>{info.title}</h3>
                  <p className="contact-value">{info.details}</p>
                  <p className="contact-description">{info.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form & FAQ */}
      <div className="main-content">
        <div className="container">
          <div className="content-grid">
            {/* Contact Form */}
            <div className="form-section">
              <div className="form-header">
                <MessageSquare size={32} color="#10b981" />
                <h2>Send us a Message</h2>
                <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              </div>

              {isSubmitted && (
                <div className="success-message">
                  <Send size={20} />
                  <span>Thank you! Your message has been sent successfully.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    name="message"
                    className="form-input form-textarea"
                    rows="6"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqItems.map((item, index) => (
                  <div key={index} className="faq-item">
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-page {
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          width: 100%;
        }

        .page-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 0 60px 0;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 32px;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: white;
        }

        .header-content {
          text-align: center;
        }

        .header-content h1 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .header-content p {
          font-size: 20px;
          opacity: 0.9;
        }

        .contact-info-section {
          padding: 60px 0;
          background: white;
          margin-top: -30px;
          border-radius: 20px 20px 0 0;
          position: relative;
          z-index: 1;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }

        .contact-card {
          display: flex;
          gap: 20px;
          padding: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          transition: all 0.3s ease;
          min-width: 0;
        }

        .contact-card:hover {
          border-color: #10b981;
          background-color: #f0fdf4;
          transform: translateY(-2px);
        }

        .contact-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .contact-details h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          overflow-wrap: anywhere;
        }

        .contact-value {
          font-size: 16px;
          font-weight: 500;
          color: #10b981;
          margin-bottom: 4px;
          overflow-wrap: anywhere;
        }

        .contact-description {
          font-size: 14px;
          color: #6b7280;
        }

        .main-content {
          padding: 60px 0;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          min-width: 0;
        }

        .form-section {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          min-width: 0;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 16px 0 8px 0;
        }

        .form-header p {
          color: #6b7280;
          line-height: 1.6;
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background-color: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 8px;
          color: #065f46;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .faq-section {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          min-width: 0;
        }

        .faq-section h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 32px;
          text-align: center;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .faq-item {
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .faq-item:hover {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .faq-item h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .faq-item p {
          color: #6b7280;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .header-content h1 {
            font-size: 36px;
          }

          .header-content p {
            font-size: 18px;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .form-section,
          .faq-section {
            padding: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-header h2,
          .faq-section h2 {
            font-size: 24px;
          }
        }

        @media (max-width: 425px) {
          .container { padding: 0 14px; }
          .page-header { padding: 26px 0 44px 0; }
          .back-link { margin-bottom: 22px; }
          .header-content h1 { font-size: 31px; }
          .header-content p { font-size: 16px; }
          .contact-info-section, .main-content { padding: 34px 0; }
          .contact-grid { gap: 14px; }
          .contact-card { gap: 12px; padding: 18px; }
          .contact-icon { width: 44px; height: 44px; }
          .contact-details h3 { font-size: 17px; }
          .contact-value { font-size: 14px; }
          .form-section, .faq-section { padding: 18px; border-radius: 12px; }
          .contact-form { gap: 17px; }
          .faq-list { gap: 14px; }
          .faq-item { padding: 17px; }
        }

        @media (max-width: 375px) {
          .container { padding: 0 12px; }
          .contact-card { align-items: flex-start; }
          .contact-icon { width: 40px; height: 40px; }
          .form-header h2, .faq-section h2 { font-size: 21px; }
          .submit-btn { width: 100%; padding-inline: 16px; }
        }
      `}</style>
    </div>
  )
}

export default Contact