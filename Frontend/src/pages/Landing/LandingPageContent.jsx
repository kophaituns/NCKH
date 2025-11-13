import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChartLine, faUsers, faShieldAlt, faBolt } from '@fortawesome/free-solid-svg-icons';
import styles from './Landing.module.scss';

const LandingPageContent = () => {
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
    <div className={styles['landing-container']}>
      <nav className={styles['landing-nav']}>
        <div className={styles['nav-content']}>
          <Link to="/" className={styles['nav-brand']} aria-label="Go to home">
            <FontAwesomeIcon icon={faRobot} className={styles['brand-icon']} />
            <span className={styles['brand-text']}>
              Smart <span className={styles['brand-highlight']}>Survey</span> AI
            </span>
          </Link>
          <div className={styles['nav-links']}>
            <button type="button" onClick={() => handleScrollTo('features')}>Features</button>
            <button type="button" onClick={() => handleScrollTo('demo')}>Demo</button>
            <button type="button" onClick={() => handleScrollTo('information')}>Information</button>
          </div>
          <div className={styles['nav-actions']}>
            <button className={styles['btn-link']} onClick={() => navigate('/login')}>Login</button>
            <button className={styles['btn-signup']} onClick={() => navigate('/register')}>SIGN UP FREE</button>
          </div>
        </div>
      </nav>

      <section className={styles['hero-section']}>
        <div className={styles['hero-content']}>
          <h1 className={styles['hero-title']}>
            Smart <span className={styles.highlight}>Survey</span><br />
            Applications with LLM
          </h1>
          <p className={styles['hero-description']}>
            Revolutionize your data collection with AI-powered surveys that adapt, learn, and
            provide deeper insights than ever before.
          </p>
          <div className={styles['hero-actions']}>
            <button className={styles['btn-hero-primary']} onClick={() => navigate('/register')}>
              GET STARTED FREE
              <span className={styles.arrow}>›</span>
            </button>
          </div>
        </div>
      </section>

      <section className={styles['features-section']} id="features">
        <h2 className={styles['section-title']}>Powerful Features for Modern <span className={styles.highlight}>Surveys</span></h2>
        <p className={styles['section-subtitle']}>
          Leverage cutting-edge AI technology to create surveys that think, adapt, and deliver
          unprecedented insights.
        </p>
        <div className={styles['features-grid']}>
          {features.map((feature, index) => (
            <div key={index} className={styles['feature-card']}>
              <div className={styles['feature-icon']}>
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3 className={styles['feature-title']}>{feature.title}</h3>
              <p className={styles['feature-description']}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles['dashboard-section']} id="demo">
        <h2 className={styles['dashboard-title']}>Intuitive Dashboard for <span className={styles.highlight}>Survey</span> Management</h2>
        <p className={styles['dashboard-subtitle']}>Manage all your surveys from one powerful dashboard with real-time insights and collaborative tools.</p>
        <div className={styles['dashboard-preview']}>
          <div className={styles['mock-dashboard']}>
            <div className={styles['mock-dashboard-header']}>
              <div className={styles['mock-title']}>Smart Survey Dashboard</div>
              <div className={styles['mock-dots']}>
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles['mock-stats']}>
              <div className={`${styles['stat-card']} ${styles['stat-blue']}`}>
                <div className={styles['stat-head']}>
                  <span>Active Surveys</span>
                  <div className={styles['stat-icon']}>
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                </div>
                <div className={styles['stat-value']}>24</div>
              </div>
              <div className={`${styles['stat-card']} ${styles['stat-green']}`}>
                <div className={styles['stat-head']}>
                  <span>Responses</span>
                  <div className={styles['stat-icon']}>
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                </div>
                <div className={styles['stat-value']}>1,247</div>
              </div>
              <div className={`${styles['stat-card']} ${styles['stat-peach']}`}>
                <div className={styles['stat-head']}>
                  <span>Completion Rate</span>
                  <div className={styles['stat-icon']}>
                    <FontAwesomeIcon icon={faBolt} />
                  </div>
                </div>
                <div className={styles['stat-value']}>94%</div>
              </div>
            </div>
            <div className={styles['mock-list']}>
              <div className={styles['list-header']}>Recent Surveys</div>
              <div className={styles['list-item']}>
                <span className={styles['list-bullet']} />
                <span className={styles['list-text']}>Customer Satisfaction Q4</span>
                <span className={`${styles.pill} ${styles['pill-active']}`}>Active</span>
              </div>
              <div className={styles['list-item']}>
                <span className={styles['list-bullet']} />
                <span className={styles['list-text']}>Product Feedback Survey</span>
                <span className={`${styles.pill} ${styles['pill-draft']}`}>Draft</span>
              </div>
              <div className={styles['list-item']}>
                <span className={styles['list-bullet']} />
                <span className={styles['list-text']}>Market Research Study</span>
                <span className={`${styles.pill} ${styles['pill-completed']}`}>Completed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles['cta-section']} id="information">
        <h2 className={styles['cta-title']}>Ready to Transform Your <span className={styles.highlight}>Survey</span> Experience?</h2>
        <p className={styles['cta-description']}>Join thousands of companies already using AI-powered surveys to gather better insights faster.</p>
        <button className={styles['btn-cta']} onClick={() => navigate('/register')}>
          START FREE TRIAL <span className={styles.arrow}>›</span>
        </button>
      </section>

      <footer className={styles['landing-footer']}>
        <div className={styles['footer-content']}>
          <p>© 2025 Smart Survey AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageContent;
