import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Nav,
  Table,
  Badge,
  Form,
  InputGroup,
  Spinner,
  CloseButton,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUsers,
  faFileLines,
  faChartLine,
  faPen,
  faTrash,
  faGear,
  faUserShield,
  faRightFromBracket,
  faMagnifyingGlass,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types";
import { getRoleDisplayName } from "../../utils/roleUtils";

// ---------- Types ----------
type Status = "active" | "inactive" | "draft";
type SimpleRole = "admin" | "teacher" | "student";

type UserRow = {
  id: number;
  username: string;
  email: string;
  role: SimpleRole;
  status: Extract<Status, "active" | "inactive">;
};

type SurveyRow = {
  id: number;
  title: string;
  creator: string;
  responses: number;
  status: Extract<Status, "active" | "draft">;
};

// ---------- Reusable Compact Search ----------
const SearchBar: React.FC<{
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  maxWidth?: number;
  height?: number;
}> = ({ placeholder, value, onChange, onClear, maxWidth = 220, height = 30 }) => (
  <InputGroup size="sm" style={{ maxWidth }}>
    <InputGroup.Text className="bg-white border-end-0" style={{ height, paddingRight: ".25rem", paddingLeft: ".5rem" }}>
      <FontAwesomeIcon icon={faMagnifyingGlass} />
    </InputGroup.Text>
    <Form.Control
      className="border-start-0"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ height, lineHeight: "1.2" }}
    />
    {value && (
      <Button variant="link" size="sm" className="text-muted px-2" onClick={onClear} aria-label="Clear search" style={{ height }}>
        <CloseButton aria-label="Clear" />
      </Button>
    )}
  </InputGroup>
);

// ---------- Helpers ----------
const statusVariant: Record<Status, string> = { active: "success", draft: "warning", inactive: "secondary" };

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => (
  <Badge bg={statusVariant[status]} className="text-capitalize">
    {status}
  </Badge>
);

const StatCard: React.FC<{ icon: any; value: number | string; label: string; iconClass?: string }> = ({
  icon,
  value,
  label,
  iconClass,
}) => (
  <Card className="border-0 shadow-sm text-center h-100">
    <Card.Body>
      <FontAwesomeIcon icon={icon} size="2x" className={`${iconClass ?? "text-primary"} mb-2`} />
      <h3 className="mb-1">{value}</h3>
      <p className="text-muted mb-0">{label}</p>
    </Card.Body>
  </Card>
);

const toUserRoleEnum = (role: SimpleRole): UserRole => {
  switch (role) {
    case "admin":
      return UserRole.ADMIN;
    case "teacher":
      return UserRole.TEACHER;
    default:
      return UserRole.STUDENT;
  }
};

// ---------- Main ----------
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "surveys" | "settings">("overview");

  // Mock data
  const [users, setUsers] = useState<UserRow[]>([
    { id: 1, username: "admin", email: "admin@example.com", role: "admin", status: "active" },
    { id: 2, username: "teacher1", email: "teacher1@example.com", role: "teacher", status: "active" },
    { id: 3, username: "student1", email: "student1@example.com", role: "student", status: "active" },
  ]);

  const [surveys, setSurveys] = useState<SurveyRow[]>([
    { id: 1, title: "Course Evaluation Q1 2025", creator: "teacher1", responses: 45, status: "active" },
    { id: 2, title: "Teaching Quality Assessment", creator: "teacher1", responses: 23, status: "draft" },
  ]);

  // Filters
  const [userQuery, setUserQuery] = useState("");
  const [userStatus, setUserStatus] = useState<"all" | UserRow["status"]>("all");
  const [surveyQuery, setSurveyQuery] = useState("");
  const [surveyStatus, setSurveyStatus] = useState<"all" | SurveyRow["status"]>("all");

  // Auth guard
  useEffect(() => {
    if (!state?.isAuthenticated || state.user?.role !== UserRole.ADMIN) {
      navigate("/login");
    }
  }, [state?.isAuthenticated, state?.user, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  const handleDeleteUser = useCallback((userId: number) => setUsers((prev) => prev.filter((u) => u.id !== userId)), []);
  const handleDeleteSurvey = useCallback((surveyId: number) => setSurveys((prev) => prev.filter((s) => s.id !== surveyId)), []);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalSurveys: surveys.length,
      totalResponses: surveys.reduce((acc, s) => acc + s.responses, 0),
      activeUsers: users.filter((u) => u.status === "active").length,
    }),
    [users, surveys]
  );

  const filteredUsers = useMemo(() => {
    const q = userQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchQ = !q || `${u.username} ${u.email} ${u.role}`.toLowerCase().includes(q);
      const matchS = userStatus === "all" || u.status === userStatus;
      return matchQ && matchS;
    });
  }, [users, userQuery, userStatus]);

  const filteredSurveys = useMemo(() => {
    const q = surveyQuery.toLowerCase().trim();
    return surveys.filter((s) => {
      const matchQ = !q || `${s.title} ${s.creator}`.toLowerCase().includes(q);
      const matchS = surveyStatus === "all" || s.status === surveyStatus;
      return matchQ && matchS;
    });
  }, [surveys, surveyQuery, surveyStatus]);

  const Header: React.FC = () => (
    <div className="bg-white shadow-sm">
      <Container fluid className="px-3 px-lg-4">
        <div className="d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUserShield} className="text-danger me-2" size="lg" />
            <h4 className="mb-0 text-danger">
              <span className="d-none d-md-inline">Admin </span>Dashboard
            </h4>
          </div>
          <div className="d-flex align-items-center">
            <div className="text-end me-3 d-none d-md-block">
              <div className="fw-semibold">Welcome, {state.user?.username ?? ""}</div>
              <small className="text-muted">{state.user ? getRoleDisplayName(state.user.role) : ""}</small>
            </div>
            <Button variant="outline-danger" size="sm" onClick={handleLogout} aria-label="Logout">
              <FontAwesomeIcon icon={faRightFromBracket} className="me-1" />
              <span className="d-none d-md-inline">Logout</span>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );

  const Sidebar: React.FC = () => (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <Nav variant="pills" className="flex-column">
          <Nav.Item className="mb-2">
            <Nav.Link active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              <FontAwesomeIcon icon={faChartLine} className="me-2" /> Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-2">
            <Nav.Link active={activeTab === "users"} onClick={() => setActiveTab("users")}>
              <FontAwesomeIcon icon={faUsers} className="me-2" /> Users
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-2">
            <Nav.Link active={activeTab === "surveys"} onClick={() => setActiveTab("surveys")}>
              <FontAwesomeIcon icon={faFileLines} className="me-2" /> Survey Management
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
              <FontAwesomeIcon icon={faGear} className="me-2" /> System Settings
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Body>
    </Card>
  );

  if (state.user === undefined) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </div>
    );
  }

  // Inline styles (không cần file CSS)
  const compactBtnStyle: React.CSSProperties = {
    padding: "0.15rem 0.45rem",
    fontSize: ".8rem",
    lineHeight: 1.1,
    borderRadius: ".5rem",
  };
  const compactSelectStyle: React.CSSProperties = {
    width: 120,
    height: 30,
    lineHeight: "1.2",
    paddingTop: ".25rem",
    paddingBottom: ".25rem",
  };

  return (
    <div className="min-vh-100 bg-light">
      <Header />

      <Container fluid className="py-3 py-lg-4 px-3 px-lg-4">
        <Row>
          {/* Sidebar */}
          <Col lg={3} md={12} className="mb-4 mb-lg-0">
            <Sidebar />
          </Col>

          {/* Main */}
          <Col lg={9} md={12}>
            {/* Overview */}
            {activeTab === "overview" && (
              <>
                <Row xs={1} md={2} xl={4} className="g-3 mb-4">
                  <Col>
                    <StatCard icon={faUsers} value={stats.totalUsers} label="Total Users" iconClass="text-primary" />
                  </Col>
                  <Col>
                    <StatCard icon={faFileLines} value={stats.totalSurveys} label="Total Surveys" iconClass="text-success" />
                  </Col>
                  <Col>
                    <StatCard icon={faChartLine} value={stats.totalResponses} label="Total Responses" iconClass="text-warning" />
                  </Col>
                  <Col>
                    <StatCard icon={faUsers} value={stats.activeUsers} label="Active Users" iconClass="text-info" />
                  </Col>
                </Row>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white d-flex align-items-center justify-content-between">
                    <h5 className="mb-0">System Activity</h5>
                    <Button variant="outline-secondary" size="sm" style={compactBtnStyle}>
                      <FontAwesomeIcon icon={faArrowsRotate} className="me-1" /> Refresh
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted mb-0">Recent system activities and statistics will appear here.</p>
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex flex-wrap gap-2 align-items-center justify-content-between">
                  <h5 className="mb-0">User Management</h5>
                  <div className="d-flex gap-2 align-items-center">
                    <SearchBar placeholder="Search user…" value={userQuery} onChange={setUserQuery} onClear={() => setUserQuery("")} maxWidth={200} height={30} />
                    <Form.Select
                      size="sm"
                      value={userStatus}
                      onChange={(e) => setUserStatus(e.target.value as any)}
                      aria-label="Filter by status"
                      style={compactSelectStyle}
                    >
                      <option value="all">All status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate("/admin/users/create")}
                      aria-label="Add User"
                      style={compactBtnStyle}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-1" />
                      <span className="d-none d-sm-inline">Add User</span>
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{getRoleDisplayName(toUserRoleEnum(user.role))}</td>
                          <td>
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="text-end">
                            <Button variant="outline-primary" size="sm" className="me-1" aria-label={`Edit ${user.username}`} style={compactBtnStyle}>
                              <FontAwesomeIcon icon={faPen} />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(user.id)} aria-label={`Delete ${user.username}`} style={compactBtnStyle}>
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Surveys */}
            {activeTab === "surveys" && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex flex-wrap gap-2 align-items-center justify-content-between">
                  <h5 className="mb-0">Survey Management</h5>
                  <div className="d-flex gap-2 align-items-center">
                    <SearchBar placeholder="Search survey…" value={surveyQuery} onChange={setSurveyQuery} onClear={() => setSurveyQuery("")} maxWidth={220} height={30} />
                    <Form.Select
                      size="sm"
                      value={surveyStatus}
                      onChange={(e) => setSurveyStatus(e.target.value as any)}
                      aria-label="Filter by status"
                      style={compactSelectStyle}
                    >
                      <option value="all">All status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </Form.Select>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate("/create-survey")}
                      aria-label="Create Survey"
                      style={compactBtnStyle}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-1" />
                      <span className="d-none d-sm-inline">Create Survey</span>
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Creator</th>
                        <th>Responses</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSurveys.map((survey) => (
                        <tr key={survey.id}>
                          <td>{survey.id}</td>
                          <td>{survey.title}</td>
                          <td>{survey.creator}</td>
                          <td>{survey.responses}</td>
                          <td>
                            <StatusBadge status={survey.status} />
                          </td>
                          <td className="text-end">
                            <Button variant="outline-primary" size="sm" className="me-1" aria-label={`Edit ${survey.title}`} style={compactBtnStyle}>
                              <FontAwesomeIcon icon={faPen} />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSurvey(survey.id)} aria-label={`Delete ${survey.title}`} style={compactBtnStyle}>
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredSurveys.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No surveys found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">System Settings</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-0">System configuration and settings will be available here.</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
