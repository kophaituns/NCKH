import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faEnvelope, faLock, faChevronRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, state } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="auth-container-enhanced d-flex align-items-center">
      <Container className="container-responsive">
        <Row className="justify-content-center">
          <Col sm={10} md={8} lg={6} xl={5}>
            <Card className="auth-card-enhanced border-0 shadow-lg fade-in-up">
              <Card.Body className="position-relative">
                {state.isLoading && (
                  <div className="loading-overlay">
                    <div className="spinner"></div>
                  </div>
                )}
                
                {/* Enhanced Header */}
                <div className="auth-header-enhanced">
                  <div className="brand-logo-enhanced">
                    <FontAwesomeIcon icon={faRobot} className="text-primary brand-icon" />
                    <div className="brand-text">
                      Smart <span className="brand-highlight">Survey</span> AI
                    </div>
                  </div>
                  <h2 className="auth-title">Welcome Back</h2>
                  <p className="auth-subtitle">Sign in to your account to continue your survey journey</p>
                </div>

                {/* Error Alert */}
                {state.error && (
                  <Alert variant="danger" className="py-3 mb-4 border-0 fade-in-up-delayed" style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    color: '#dc2626'
                  }}>
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    {state.error}
                  </Alert>
                )}

                {/* Enhanced Login Form */}
                <Form onSubmit={handleSubmit} className="auth-form-enhanced fade-in-up-delayed">
                  <div className="form-group-enhanced">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </span>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      required
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    />
                  </div>

                  <div className="form-group-enhanced position-relative">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faLock} />
                      </span>
                      Password
                    </Form.Label>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    />
                    <span
                      className="toggle-password-visibility"
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "70%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "#dbd8d8ff"
                      }}
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={0}
                      role="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                  </div>

                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                      <div className="d-flex align-items-center gap-2">
                       <input
                        type="checkbox"
                       id="remember-me"
                       className="form-check-input"
                       style={{ width: 18, height: 18, marginRight: 8 }}
                      />
                   <label htmlFor="remember-me" style={{ margin: 0, fontWeight: 400, color: "#6b7280", fontSize: "1rem", cursor: "pointer" }}>
                      Remember me
                  </label>
                   </div>
                   <Button variant="link" className="p-0 auth-link">
                    Forgot password?
                  </Button>
                  </div>
                  <Button
                    type="submit"
                    className="btn-auth-enhanced w-100"
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
                      </>
                    )}
                  </Button>
                </Form>

                {/* Enhanced Footer */}
                <div className="auth-footer-enhanced">
                  <div className="divider">
                    <span>or</span>
                  </div>
                  
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Button 
                      variant="link" 
                      className="p-0 auth-link"
                      onClick={() => navigate('/signup')}
                    >
                      Create one now
                    </Button>
                  </p>
                </div>

                {/* Test Accounts Info - Enhanced */}
                <div className="mt-4 p-3 rounded-3" style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <h6 className="text-muted small mb-3 text-center">
                    🔑 Test Accounts Available
                  </h6>
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="small">
                        <strong className="text-primary">Admin</strong><br />
                        <code className="text-muted">admin@example.com</code><br />
                        <code className="text-muted">admin123</code>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="small">
                        <strong className="text-success">Teacher</strong><br />
                        <code className="text-muted">teacher1@example.com</code><br />
                        <code className="text-muted">teacher123</code>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col">
                      <small className="text-muted">
                        <strong>Students:</strong> student1, student2, student3, student4, student5<br />
                        <strong>Password:</strong> 123456 (cho tất cả)
                      </small>
                    </div>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 text-primary fw-semibold"
                      onClick={() => navigate('/signup')}
                    >
                      Sign up here
                    </Button>
                  </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-3">
                  <Button
                    variant="link"
                    className="p-0 text-muted small"
                    onClick={() => navigate('/')}
                  >
                    ← Back to Home
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;