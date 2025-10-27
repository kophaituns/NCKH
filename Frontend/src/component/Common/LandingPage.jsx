import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChartLine, faUsers, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import './LandingPage.scss';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: faRobot, title: 'AI-Powered', description: 'Intelligent survey analysis and insights' },
    { icon: faChartLine, title: 'Real-time Analytics', description: 'Track responses and trends instantly' },
    { icon: faUsers, title: 'Easy Collaboration', description: 'Share and collaborate with your team' },
    { icon: faShieldAlt, title: 'Secure & Private', description: 'Your data is safe and encrypted' },
  ];

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <FontAwesomeIcon icon={faRobot} className="brand-icon" />
            <span className="brand-text">
              Smart <span className="brand-highlight">Survey</span> AI
            </span>
          </div>
          <div className="nav-actions">
            <button className="btn-link" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Create Powerful Surveys with AI
          </h1>
          <p className="hero-description">
            Build, distribute, and analyze surveys with the power of artificial intelligence.
            Get insights faster and make better decisions.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              Get Started Free
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Why Choose Us</h2>
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

      <section className="cta-section">
        <h2 className="cta-title">Ready to Get Started?</h2>
        <p className="cta-description">
          Join thousands of users creating better surveys with AI
        </p>
        <button className="btn-cta" onClick={() => navigate('/register')}>
          Create Your Account
        </button>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2024 Smart Survey AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
