import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faPlus, 
  faTrash, 
  faBrain,
  faSave,
  faEye,
  faArrowLeft,
  faMagicWandSparkles
} from '@fortawesome/free-solid-svg-icons';
import { llmAPI, surveyAPI } from '../../services/api.jsx';
import { Question, QuestionType, Survey } from '../../types.jsx';

const CreateSurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    domain: 'IT' as 'IT' | 'Marketing' | 'Economics',
    targetAudience: '',
    questionCount,
    isPublic: false
  });
  
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSurveyData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target).checked : value
    }));
  };

  const generateQuestionsWithAI = async () => {
    if (!surveyData.title.trim()) {
      setError('Please enter a survey title first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const aiQuestions = await llmAPI.generateQuestions({
        topic: surveyData.title,
        domain: surveyData.domain,
        questionCount: surveyData.questionCount,
        questionTypes: [QuestionType.MULTIPLE_CHOICE, QuestionType.TEXT, QuestionType.RATING],
        targetAudience: surveyData.targetAudience,
        context: surveyData.description
      });

      setQuestions(aiQuestions);
      setSuccess(`Successfully generated ${aiQuestions.length} AI-powered questions!`);
    } catch (error) {
      setError('Failed to generate questions. Please try again.');
      console.error('AI Generation Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      surveyId: '',
      type: QuestionType.TEXT,
      title: '',
      description: '',
      required,
      order: questions.length + 1,
      aiGenerated: false
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveSurvey = async () => {
    try {
      setError(null);
      
      const surveyPayload: Partial<Survey> = {
        title: surveyData.title,
        description: surveyData.description,
        isPublic: surveyData.isPublic,
        questions,
        status: 'draft',
        settings: {
          allowAnonymous,
          requireLogin,
          showResults,
          collectEmail: false
        }
      };

      await surveyAPI.createSurvey(surveyPayload);
      setSuccess('Survey saved successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError('Failed to save survey. Please try again.');
      console.error('Save Error:', error);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Container className="py-4">
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <Button 
            variant="outline-secondary" 
            className="me-3"
            onClick={() => navigate('/dashboard')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="h2 fw-bold mb-0">Create New Survey</h1>
            <p className="text-muted mb-0">Design your AI-powered survey</p>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

        <Row>
          <Col lg={8}>
            {/* Survey Settings */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold">Survey Settings</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Survey Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={surveyData.title}
                        onChange={handleInputChange}
                        placeholder="Enter survey title"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Domain</Form.Label>
                      <Form.Select
                        name="domain"
                        value={surveyData.domain}
                        onChange={handleInputChange}
                      >
                        <option value="IT">Information Technology</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Economics">Economics</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={surveyData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the purpose of your survey"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Target Audience</Form.Label>
                      <Form.Control
                        type="text"
                        name="targetAudience"
                        value={surveyData.targetAudience}
                        onChange={handleInputChange}
                        placeholder="e.g., Software developers, Students"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">AI Questions Count</Form.Label>
                      <Form.Control
                        type="number"
                        name="questionCount"
                        value={surveyData.questionCount}
                        onChange={handleInputChange}
                        min="1"
                        max="20"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Check
                  type="checkbox"
                  name="isPublic"
                  label="Make this survey public"
                  checked={surveyData.isPublic}
                  onChange={handleInputChange}
                />
              </Card.Body>
            </Card>

            {/* AI Question Generation */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-gradient-primary text-white">
                <h5 className="mb-0 fw-semibold">
                  <FontAwesomeIcon icon={faBrain} className="me-2" />
                  AI Question Generation
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  Let our AI generate intelligent, context-aware questions based on your survey settings.
                </p>
                <Button 
                  className="btn-gradient-primary"
                  onClick={generateQuestionsWithAI}
                  disabled={isGenerating}
                >
                  <FontAwesomeIcon icon={isGenerating ? faRobot : faMagicWandSparkles} className="me-2" />
                  {isGenerating ? 'Generating Questions...' : 'Generate AI Questions'}
                </Button>
              </Card.Body>
            </Card>

            {/* Questions */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold">Survey Questions ({questions.length})</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={addManualQuestion}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add Manual Question
                </Button>
              </Card.Header>
              <Card.Body>
                {questions.length === 0 ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faRobot} size="3x" className="text-muted mb-3" />
                    <h6>No questions yet</h6>
                    <p className="text-muted">Use AI generation or add questions manually</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div key={question.id} className="question-card mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-secondary me-2">Q{index + 1}</span>
                          {question.aiGenerated && (
                            <Badge bg="success" className="me-2">
                              <FontAwesomeIcon icon={faRobot} className="me-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Question</Form.Label>
                        <Form.Control
                          type="text"
                          value={question.title}
                          onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                          placeholder="Enter your question"
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Type</Form.Label>
                            <Form.Select
                              value={question.type}
                              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                            >
                              <option value={QuestionType.TEXT}>Text</option>
                              <option value={QuestionType.TEXTAREA}>Long Text</option>
                              <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                              <option value={QuestionType.SINGLE_CHOICE}>Single Choice</option>
                              <option value={QuestionType.RATING}>Rating</option>
                              <option value={QuestionType.BOOLEAN}>Yes/No</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label="Required"
                            checked={question.required}
                            onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                            className="mt-4"
                          />
                        </Col>
                      </Row>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Actions */}
            <Card className="border-0 shadow-sm position-sticky" style={{top: '20px'}}>
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold">Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-info"
                    onClick={() => setShowPreview(true)}
                    disabled={questions.length === 0}
                  >
                    <FontAwesomeIcon icon={faEye} className="me-2" />
                    Preview Survey
                  </Button>
                  
                  <Button 
                    variant="success"
                    onClick={saveSurvey}
                    disabled={!surveyData.title.trim() || questions.length === 0}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Save Survey
                  </Button>
                </div>

                {/* Survey Stats */}
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-semibold mb-3">Survey Statistics</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Total Questions:</span>
                    <span className="fw-semibold">{questions.length}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">AI Generated:</span>
                    <span className="fw-semibold">{questions.filter(q => q.aiGenerated).length}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Required Questions:</span>
                    <span className="fw-semibold">{questions.filter(q => q.required).length}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Survey Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>{surveyData.title}</h4>
            <p className="text-muted">{surveyData.description}</p>
            
            {questions.map((question, index) => (
              <div key={question.id} className="mb-4 p-3 border rounded">
                <h6>
                  {index + 1}. {question.title}
                  {question.required && <span className="text-danger">*</span>}
                </h6>
                <small className="text-muted">Type: {question.type}</small>
              </div>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default CreateSurveyPage;