import React, { Component } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';
import styles from './ErrorBoundary.module.scss';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console in development
    console.error('Uncaught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className={`my-5 ${styles.container}`}>
          <Alert variant="danger" className={`text-center py-5 ${styles.alert}`}>
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className={`d-flex justify-content-center mt-3 ${styles.buttonGroup}`}>
              <Button
                variant="outline-danger"
                onClick={this.handleRetry}
                className={styles.button}
              >
                Try Again
              </Button>
              <Button
                variant="danger"
                onClick={() => window.location.href = '/'}
                className={styles.button}
              >
                Go to Home
              </Button>
            </div>
          </Alert>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className={`mt-3 text-muted ${styles.details}`}>
              <summary>Error Details</summary>
              <pre className={styles.errorStack}>
                {this.state.error?.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
