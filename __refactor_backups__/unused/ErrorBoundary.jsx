import React, { Component } from 'react';
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
        <div className={styles.container}>
          <div className={styles.alert}>
            <h2 className={styles.heading}>Oops! Something went wrong</h2>
            <p className={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className={styles.buttonGroup}>
              <button
                onClick={this.handleRetry}
                className={`${styles.button} ${styles.buttonOutline}`}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className={`${styles.button} ${styles.buttonDanger}`}
              >
                Go to Home
              </button>
            </div>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className={styles.details}>
              <summary className={styles.summary}>Error Details</summary>
              <pre className={styles.errorStack}>
                {this.state.error?.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
