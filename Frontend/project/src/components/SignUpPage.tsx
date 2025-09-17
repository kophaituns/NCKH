import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUser, faEnvelope, faLock, faUserTag, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/index';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, state } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: UserRole.STUDENT,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.full_name,
        formData.role
      );
      navigate('/dashboard');
    } catch (error) {
      // Error handled by context
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
                  <h2 className="auth-title">Create Account</h2>
                  <p className="auth-subtitle">Sign up to start your survey journey</p>
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

                {/* Enhanced Sign Up Form */}
                <Form onSubmit={handleSubmit} className="auth-form-enhanced fade-in-up-delayed">
                  <div className="form-group-enhanced">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faUser} />
                      </span>
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username"
                      required
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    />
                  </div>

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

                  <div className="form-group-enhanced">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faUserTag} />
                      </span>
                      Full Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    />
                  </div>

                  <div className="form-group-enhanced">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faLock} />
                      </span>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    />
                  </div>

                  <div className="form-group-enhanced">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faLock} />
                      </span>
                      Confirm Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    />
                  </div>

                  <div className="form-group-enhanced">
                    <Form.Label className="form-label-enhanced">
                      <span className="form-icon">
                        <FontAwesomeIcon icon={faUserTag} />
                      </span>
                      Role
                    </Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="form-control-enhanced"
                      disabled={state.isLoading}
                    >
                      <option value={UserRole.STUDENT}>Student</option>
                      <option value={UserRole.TEACHER}>Teacher</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </Form.Select>
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
                        Signing Up...
                      </>
                    ) : (
                      <>
                        Sign Up
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
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 auth-link"
                      onClick={() => navigate('/login')}
                    >
                      Sign in here
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

export default SignUpPage;