import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
<<<<<<< HEAD
import {
  faRobot,
  faChartLine,
  faBullseye,
  faShieldAlt,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
=======
import { faRobot, faChartLine, faUsers, faShieldAlt, faBolt } from '@fortawesome/free-solid-svg-icons';
>>>>>>> linh2
import styles from './Landing.module.scss';

const LandingPageContent = () => {
  const navigate = useNavigate();
<<<<<<< HEAD

=======
>>>>>>> linh2
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features = [
<<<<<<< HEAD
    {
      icon: faRobot,
      title: 'AI-Powered Questions',
      description:
        'Generate intelligent, contextual questions that adapt based on previous responses.',
    },
    {
      icon: faChartLine,
      title: 'Real-time Analytics',
      description:
        'Get instant insights with advanced analytics powered by machine learning.',
    },
    {
      icon: faBullseye,
      title: 'Smart Targeting',
      description:
        'Reach the right audience with AI-driven participant selection and segmentation.',
    },
    {
      icon: faShieldAlt,
      title: 'Enterprise Security',
      description:
        'Bank-level security with advanced encryption and compliance standards.',
    },
  ];

  const testimonials = [
  {
    initials: 'SJ',
    name: 'Sarah Johnson',
    role: 'Research Director, TechCorp',
    quote:
      "The AI-powered survey generation saved us weeks of work. The insights we're getting are incredibly detailed and actionable.",
  },
  {
    initials: 'MC',
    name: 'Michael Chen',
    role: 'VP Marketing, DataFlow',
    quote:
      'The real-time analytics and adaptive questioning have revolutionized how we gather customer feedback. Highly recommended!',
  },
  {
    initials: 'ER',
    name: 'Emily Rodriguez',
    role: 'Head of UX, InnovateLabs',
    quote:
      'The user role management and collaboration features make it easy for our entire team to work together on research projects.',
  },
];


  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className={styles['landing-container']}>
      {/* NAVBAR */}
      <nav className={styles['landing-nav']}>
        <div className={styles['nav-content']}>
        <Link
            to="/"
            className={styles['nav-brand']}
            aria-label="Smart Survey AI"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className={styles['brand-logo']}>
              <FontAwesomeIcon icon={faRobot} />
            </div>
=======
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
>>>>>>> linh2
            <span className={styles['brand-text']}>
              Smart <span className={styles['brand-highlight']}>Survey</span> AI
            </span>
          </Link>
          <div className={styles['nav-links']}>
<<<<<<< HEAD
            <button type="button" onClick={() => handleScrollTo('features')}>
              Features
            </button>
            <button type="button" onClick={() => handleScrollTo('demo')}>
              Demo
            </button>
            <button type="button" onClick={() => handleScrollTo('testimonials')}>
              Testimonials
            </button>
            <button type="button" onClick={handleLogin}>
              Login
            </button>
          </div>

          <div className={styles['nav-actions']}>
            <button
              type="button"
              className={styles['btn-signup']}
              onClick={handleGetStarted}
            >
              SIGN UP FREE
            </button>
=======
            <button type="button" onClick={() => handleScrollTo('features')}>Features</button>
            <button type="button" onClick={() => handleScrollTo('demo')}>Demo</button>
            <button type="button" onClick={() => handleScrollTo('information')}>Information</button>
          </div>
          <div className={styles['nav-actions']}>
            <button className={styles['btn-link']} onClick={() => navigate('/login')}>Login</button>
            <button className={styles['btn-signup']} onClick={() => navigate('/register')}>SIGN UP FREE</button>
>>>>>>> linh2
          </div>
        </div>
      </nav>

<<<<<<< HEAD
      <main className={styles['landing-main']}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles['hero-inner']}>
           
            <h1 className={styles['hero-title']}>
              Smart <span>Survey</span> Applications with LLM
            </h1>
            <p className={styles['hero-subtitle']}>
              Revolutionize your data collection with AI-powered surveys that adapt,
              learn, and provide deeper insights than ever before.
            </p>
            <div className={styles['hero-actions']}>
              <button
                type="button"
                className={styles['btn-primary']}
                onClick={handleGetStarted}
              >
                GET STARTED FREE
                <span className={styles['btn-arrow']}>›</span>
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className={styles.section}>
          <div className={styles['section-header']}>
            <h2>
              Powerful Features for Modern <span>Surveys</span>
            </h2>
            <p>
              Leverage cutting-edge AI technology to create surveys that think, adapt,
              and deliver unprecedented insights.
            </p>
          </div>

          <div className={styles['feature-grid']}>
            {features.map((feature) => (
              <div key={feature.title} className={styles['feature-card']}>
                <div className={styles['feature-icon']}>
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DASHBOARD DEMO */}
        <section id="demo" className={styles['section-alt']}>
          <div className={styles['section-header']}>
            <h2>
              Intuitive Dashboard for <span>Survey</span> Management
            </h2>
            <p>
              Manage all your surveys from one powerful dashboard with real-time
              insights and collaborative tools.
            </p>
          </div>

          <div className={styles['dashboard-wrapper']}>
            <div className={styles['dashboard-card']}>
              <div className={styles['dashboard-header']}>
                <span className={styles['dashboard-title']}>
                  Smart Survey Dashboard
                </span>
                <div className={styles['dashboard-dots']}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className={styles['dashboard-stats']}>
                <div className={styles['dashboard-stat']}>
                  <p className={styles['stat-label']}>Active Surveys</p>
                  <p className={styles['stat-value']}>24</p>
                </div>
                <div className={styles['dashboard-stat']}>
                  <p className={styles['stat-label']}>Responses</p>
                  <p className={styles['stat-value']}>1,247</p>
                </div>
                <div className={styles['dashboard-stat']}>
                  <p className={styles['stat-label']}>Completion Rate</p>
                  <p className={styles['stat-value']}>94%</p>
                </div>
              </div>

              <div className={styles['dashboard-list']}>
                <div className={styles['dashboard-list-header']}>
                  <span>Recent Surveys</span>
                  <span>Status</span>
                </div>
                <div className={styles['dashboard-row']}>
                  <span>Customer Satisfaction Q4</span>
                  <span className={`${styles['status-pill']} ${styles.active}`}>
                    Active
                  </span>
                </div>
                <div className={styles['dashboard-row']}>
                  <span>Product Feedback Survey</span>
                  <span className={`${styles['status-pill']} ${styles.draft}`}>
                    Draft
                  </span>
                </div>
                <div className={styles['dashboard-row']}>
                  <span>Market Research Study</span>
                  <span
                    className={`${styles['status-pill']} ${styles.completed}`}
                  >
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
       <section id="testimonials" className={styles.section}>
  <div className={styles['section-header']}>
    <h2>Trusted by Industry Leaders</h2>
    <p>
      See how companies are transforming their research with AI-powered{' '}
      <span>surveys</span>.
    </p>
  </div>

  <div className={styles['testimonial-grid']}>
    {testimonials.map((item) => (
      <div key={item.name} className={styles['testimonial-card']}>
        <div className={styles['testimonial-stars']}>
          {[...Array(5)].map((_, idx) => (
            <FontAwesomeIcon
              key={idx}
              icon={faStar}
              className={styles['star-icon']}
            />
          ))}
        </div>

        <p className={styles['testimonial-quote']}>&ldquo;{item.quote}&rdquo;</p>

        <div className={styles['testimonial-footer']}>
          <div className={styles['testimonial-avatar']}>{item.initials}</div>
          <div className={styles['testimonial-meta']}>
            <p className={styles['testimonial-name']}>{item.name}</p>
            <p className={styles['testimonial-role']}>{item.role}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>


        {/* FINAL CTA */}
        <section className={styles['section-alt']}>
          <div className={styles['cta-inner']}>
            <h2>
              Ready to Transform Your <span>Survey</span> Experience?
            </h2>
            <p>
              Join thousands of companies already using AI-powered surveys to gather
              better insights faster.
            </p>
            <button
              type="button"
              className={styles['btn-primary']}
              onClick={handleGetStarted}
            >
              START FREE TRIAL
              <span className={styles['btn-arrow']}>›</span>
            </button>
            <p className={styles['cta-note']}>
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
     <footer className={styles['landing-footer']}>
        <div className={styles['footer-content']}>
          <span className={styles['footer-logo']}>
            Smart <span>Survey</span> AI
          </span>

          <span className={styles['footer-copy']}>
            © 2025 Smart Survey AI. Proudly created by team C1.SE27. All rights reserved.
          </span>
=======
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
>>>>>>> linh2
        </div>
      </footer>
    </div>
  );
};

export default LandingPageContent;
