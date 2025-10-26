import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faChartLine, 
  faUsers, 
  faShieldAlt, 
  faChevronRight,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-vh-100 bg-white">
      {/* Navigation */}
      <Navbar bg="white" expand="lg" className="shadow-sm py-3 navbar-responsive">
        <Container>
          <Navbar.Brand href="#" className="nav-brand">
            <FontAwesomeIcon icon={faRobot} className="text-primary me-2" size="lg" />
            <span className="hidden-mobile">Smart </span>
            <span className="text-gradient-primary">Survey</span>
            <span className="hidden-mobile"> AI</span>
          </Navbar.Brand>
          
          <Navbar.Toggle 
            aria-controls="basic-navbar-nav"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="navbar-toggler border-0"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
          </Navbar.Toggle>
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-lg-center">
              <Nav.Link href="#features" className="me-lg-3 py-2 py-lg-1">Features</Nav.Link>
              <Nav.Link href="#demo" className="me-lg-3 py-2 py-lg-1">Demo</Nav.Link>
              <Nav.Link href="#testimonials" className="me-lg-3 py-2 py-lg-1">Testimonials</Nav.Link>
              <div className="d-flex flex-column flex-lg-row gap-2 mt-3 mt-lg-0">
                <Button 
                  variant="outline-dark" 
                  className="me-lg-2 btn-responsive"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button 
                  className="btn-gradient-primary btn-responsive"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up Free
                </Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="hero-section text-center py-5">
        <Container className="container-responsive">
          <Row className="justify-content-center">
            <Col lg={10} xl={8}>
              <h1 className="mb-4 responsive-heading h1-responsive">
                Smart <span className="text-gradient-primary">Survey</span>
                <br className="d-none d-md-block" />
                <span className="d-md-none"> </span>Applications with LLM
              </h1>
              <p className="lead text-muted mb-5 px-3 px-md-0">
                Revolutionize your data collection with AI-powered surveys that adapt, learn, 
                and provide deeper insights than ever before.
              </p>
              <Button 
                className="btn-gradient-primary btn-lg-responsive hover-lift px-4 px-md-5 py-3"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
                <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-light">
        <Container className="container-responsive">
          <Row className="text-center mb-5">
            <Col>
              <h2 className="responsive-heading h2-responsive fw-bold mb-3">
                Powerful Features for Modern <span className="text-gradient-primary">Surveys</span>
              </h2>
              <p className="lead text-muted px-3 px-md-0">
                Leverage cutting-edge AI technology to create surveys that think, adapt, 
                and deliver unprecedented insights.
              </p>
            </Col>
          </Row>

          <Row className="g-4 features-grid">
            <Col sm={6} lg={3}>
              <Card className="feature-card h-100 border-0 hover-lift">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-gradient-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                    <FontAwesomeIcon icon={faRobot} className="text-white" size="2x" />
                  </div>
                  <Card.Title className="h5 fw-bold mb-3">AI-Powered Questions</Card.Title>
                  <Card.Text className="text-muted">
                    Generate intelligent, contextual questions that adapt based on previous responses.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} lg={3}>
              <Card className="feature-card h-100 border-0 hover-lift">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-gradient-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                    <FontAwesomeIcon icon={faChartLine} className="text-white" size="2x" />
                  </div>
                  <Card.Title className="h5 fw-bold mb-3">Real-time Analytics</Card.Title>
                  <Card.Text className="text-muted">
                    Get instant insights with advanced analytics powered by machine learning.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} lg={3}>
              <Card className="feature-card h-100 border-0 hover-lift">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-gradient-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                    <FontAwesomeIcon icon={faUsers} className="text-white" size="2x" />
                  </div>
                  <Card.Title className="h5 fw-bold mb-3">Smart Targeting</Card.Title>
                  <Card.Text className="text-muted">
                    Reach the right audience with AI-driven participant selection and segmentation.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} lg={3}>
              <Card className="feature-card h-100 border-0 hover-lift">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-white" />
                  </div>
                  <Card.Title className="h5 fw-bold">Enterprise Security</Card.Title>
                  <Card.Text className="text-muted">
                    Bank-level security with advanced encryption and compliance standards.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Dashboard Preview Section */}
      <section id="demo" className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">
                Intuitive Dashboard for <span className="text-gradient-primary">Survey</span> Management
              </h2>
              <p className="lead text-muted">
                Manage all your surveys from one powerful dashboard with real-time insights 
                and collaborative tools.
              </p>
            </Col>
          </Row>

          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="dashboard-preview">
                <div className="mock-dashboard">
                  {/* Mock Dashboard Header */}
                  <div className="mock-dashboard-header">
                    <h3 className="text-white fw-bold mb-0">Smart Survey Dashboard</h3>
                    <div className="d-flex">
                      <div className="rounded-circle bg-white bg-opacity-25 me-2" style={{width: '12px', height: '12px'}}></div>
                      <div className="rounded-circle bg-white bg-opacity-25 me-2" style={{width: '12px', height: '12px'}}></div>
                      <div className="rounded-circle bg-white bg-opacity-25" style={{width: '12px', height: '12px'}}></div>
                    </div>
                  </div>

                  {/* Mock Dashboard Content */}
                  <div className="p-4">
                    <Row className="g-3">
                      <Col md={3}>
                        <Card className="stats-card border-0">
                          <Card.Body className="p-3">
                            <div className="text-primary fw-bold h4 mb-1">2,847</div>
                            <div className="text-muted small">Total Surveys</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="stats-card border-0">
                          <Card.Body className="p-3">
                            <div className="text-success fw-bold h4 mb-1">18,302</div>
                            <div className="text-muted small">Responses</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="stats-card border-0">
                          <Card.Body className="p-3">
                            <div className="text-warning fw-bold h4 mb-1">94.2%</div>
                            <div className="text-muted small">Completion Rate</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="stats-card border-0">
                          <Card.Body className="p-3">
                            <div className="text-info fw-bold h4 mb-1">1,294</div>
                            <div className="text-muted small">Active Users</div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">
                What Our <span className="text-gradient-primary">Users</span> Say
              </h2>
              <p className="lead text-muted">
                Join thousands of researchers, educators, and businesses who trust our platform.
              </p>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={4}>
              <Card className="testimonial-card border-0">
                <Card.Body>
                  <div className="mb-3">
                    {"★".repeat(5)}
                  </div>
                  <Card.Text className="text-muted mb-3">
                    "The AI-generated questions saved us hours of work and provided insights 
                    we never would have thought to ask for."
                  </Card.Text>
                  <div className="fw-bold">Dr. Sarah Chen</div>
                  <div className="text-muted small">Marketing Research Director</div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="testimonial-card border-0">
                <Card.Body>
                  <div className="mb-3">
                    {"★".repeat(5)}
                  </div>
                  <Card.Text className="text-muted mb-3">
                    "The real-time analytics dashboard gives us instant feedback on our 
                    IT projects and user satisfaction."
                  </Card.Text>
                  <div className="fw-bold">Mike Johnson</div>
                  <div className="text-muted small">IT Project Manager</div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="testimonial-card border-0">
                <Card.Body>
                  <div className="mb-3">
                    {"★".repeat(5)}
                  </div>
                  <Card.Text className="text-muted mb-3">
                    "As an economics professor, I love how the platform adapts questions 
                    based on student responses for better learning outcomes."
                  </Card.Text>
                  <div className="fw-bold">Prof. Anna Rodriguez</div>
                  <div className="text-muted small">Economics Professor</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-5 bg-dark text-white">
        <Container>
          <Row>
            <Col lg={6}>
              <div className="nav-brand text-white">
                <FontAwesomeIcon icon={faRobot} className="text-primary me-2" size="lg" />
                Smart <span className="text-gradient-primary">Survey</span> AI
              </div>
              <p className="text-muted mt-3">
                Applying Large Language Models to Automatically Generate Surveys for 
                IT, Marketing, and Economics domains.
              </p>
            </Col>
            <Col lg={6}>
              <div className="text-lg-end">
                <p className="text-muted mb-0">
                  © 2025 ALLMTAGS Project. All rights reserved.
                </p>
                <p className="text-muted small">
                  Developed by C1SE.27 Team - Duy Tan University
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;