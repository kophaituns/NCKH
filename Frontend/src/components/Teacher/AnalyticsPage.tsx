import React from 'react';
import { Container, Card } from 'react-bootstrap';

const AnalyticsPage: React.FC = () => {
  return (
    <Container className="py-5">
      <Card>
        <Card.Body className="text-center py-5">
          <h2>Analytics</h2>
          <p className="text-muted">AI-powered analytics dashboard coming soon...</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AnalyticsPage;