import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChartLine, faUsers, faShieldAlt, faBolt } from '@fortawesome/free-solid-svg-icons';
import './LandingPage.scss';

const LandingPage = () => {
  const navigate = useNavigate();
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features = [
    { icon: faRobot, title: 'AI-Powered Questions', description: 'Generate intelligent, contextual questions that adapt based on previous responses.' },
    { icon: faChartLine, title: 'Real-time Analytics', description: 'Get instant insights with advanced analytics powered by machine learning.' },
    { icon: faUsers, title: 'Smart Targeting', description: 'Reach the right audience with AI-driven participant selection and segmentation.' },
    { icon: faShieldAlt, title: 'Enterprise Security', description: 'Bank-level security with advanced encryption and compliance standards.' },
  ];

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-content">
          <Link to="/" className="nav-brand" aria-label="Go to home">
            <FontAwesomeIcon icon={faRobot} className="brand-icon" />
            <span className="brand-text">
              Smart <span className="brand-highlight">Survey</span> AI
            </span>
          </Link>
          <div className="nav-links">
            <button type="button" onClick={() => handleScrollTo('features')}>Features</button>
            <button type="button" onClick={() => handleScrollTo('demo')}>Demo</button>
            <button type="button" onClick={() => handleScrollTo('information')}>Information</button>
          </div>
          <div className="nav-actions">
            <button className="btn-link" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-signup" onClick={() => navigate('/register')}>SIGN UP FREE</button>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart <span className="highlight">Survey</span><br />
            Applications with LLM
          </h1>
          <p className="hero-description">
            Revolutionize your data collection with AI-powered surveys that adapt, learn, and
            provide deeper insights than ever before.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              GET STARTED FREE
              <span className="arrow">›</span>
            </button>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <h2 className="section-title">Powerful Features for Modern <span className="highlight">Surveys</span></h2>
        <p className="section-subtitle">
          Leverage cutting-edge AI technology to create surveys that think, adapt, and deliver
          unprecedented insights.
        </p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section" id="demo">
        <h2 className="dashboard-title">Intuitive Dashboard for <span className="highlight">Survey</span> Management</h2>
        <p className="dashboard-subtitle">Manage all your surveys from one powerful dashboard with real-time insights and collaborative tools.</p>
        <div className="dashboard-preview">
          <div className="mock-dashboard">
            <div className="mock-dashboard-header">
              <div className="mock-title">Smart Survey Dashboard</div>
              <div className="mock-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="mock-stats">
              <div className="stat-card stat-blue">
                <div className="stat-head">
                  <span>Active Surveys</span>
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                </div>
                <div className="stat-value">24</div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-head">
                  <span>Responses</span>
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                </div>
                <div className="stat-value">1,247</div>
              </div>
              <div className="stat-card stat-peach">
                <div className="stat-head">
                  <span>Completion Rate</span>
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={faBolt} />
                  </div>
                </div>
                <div className="stat-value">94%</div>
              </div>
            </div>
            <div className="mock-list">
              <div className="list-header">Recent Surveys</div>
              <div className="list-item">
                <span className="list-bullet" />
                <span className="list-text">Customer Satisfaction Q4</span>
                <span className="pill pill-active">Active</span>
              </div>
              <div className="list-item">
                <span className="list-bullet" />
                <span className="list-text">Product Feedback Survey</span>
                <span className="pill pill-draft">Draft</span>
              </div>
              <div className="list-item">
                <span className="list-bullet" />
                <span className="list-text">Market Research Study</span>
                <span className="pill pill-completed">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="information">
        <h2 className="cta-title">Ready to Transform Your <span className="highlight">Survey</span> Experience?</h2>
        <p className="cta-description">Join thousands of companies already using AI-powered surveys to gather better insights faster.</p>
        <button className="btn-cta" onClick={() => navigate('/register')}>
          START FREE TRIAL <span className="arrow">›</span>
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <p>© 2025 Smart Survey AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
