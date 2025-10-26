import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Nav, Offcanvas } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  sidebarContent,
  headerContent,
  title,
  titleIcon,
  titleColor = 'primary'
}) => {
  const [showSidebar, setShowSidebar] = useState(false);

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);

  return (
    <div className="min-vh-100 bg-light dashboard-responsive">
      {/* Header */}
      <div className="bg-white shadow-sm dashboard-header sticky-top">
        <Container fluid className="px-3 px-lg-4">
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <Button
                variant="link" 
                className="d-lg-none p-0 me-3 text-decoration-none"
                onClick={handleShowSidebar}
              >
                <FontAwesomeIcon icon={faBars} size="lg" className={`text-${titleColor}`} />
              </Button>
              {titleIcon && <FontAwesomeIcon icon={titleIcon} className={`text-${titleColor} me-2`} size="lg" />}
              <h4 className={`mb-0 text-${titleColor} dashboard-title`}>
                {title}
              </h4>
            </div>
            <div className="d-flex align-items-center">
              {headerContent}
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="py-3 py-lg-4 px-3 px-lg-4">
        <Row>
          {/* Desktop Sidebar */}
          <Col lg={3} className="d-none d-lg-block mb-4">
            <Card className="border-0 shadow-sm card-responsive sticky-top" style={{ top: '100px' }}>
              <Card.Body>
                {sidebarContent}
              </Card.Body>
            </Card>
          </Col>

          {/* Mobile Sidebar */}
          <Offcanvas show={showSidebar} onHide={handleCloseSidebar} placement="start">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title className="d-flex align-items-center">
                {titleIcon && <FontAwesomeIcon icon={titleIcon} className={`text-${titleColor} me-2`} />}
                <span className={`text-${titleColor}`}>{title}</span>
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {sidebarContent}
            </Offcanvas.Body>
          </Offcanvas>

          {/* Main Content */}
          <Col lg={9} className="main-content">
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ResponsiveDashboardLayout;