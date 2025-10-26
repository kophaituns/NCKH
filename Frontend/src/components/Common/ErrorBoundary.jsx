import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError,
    error,
    errorInfo: null
  };

  public static getDerivedStateFromError(error): State {
    return {
      hasError,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError,
      error,
      errorInfo: null
    });
    // Attempt to reload the app
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container className="my-5">
          <Alert variant="danger" className="text-center py-5">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="d-flex justify-content-center mt-3">
              <Button
                variant="outline-danger"
                onClick={this.handleRetry}
                className="me-2"
              >
                Try Again
              </Button>
              <Button
                variant="danger"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
            </div>
          </Alert>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-3 text-muted">
              <summary>Error Details</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
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