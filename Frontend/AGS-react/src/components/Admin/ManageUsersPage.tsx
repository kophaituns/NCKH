import React from 'react';
import { Container, Card } from 'react-bootstrap';

const ManageUsersPage: React.FC = () => {
  return (
    <Container className="py-5">
      <Card>
        <Card.Body className="text-center py-5">
          <h2>Manage Users</h2>
          <p className="text-muted">User management functionality coming soon...</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ManageUsersPage;