import React, { useState } from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={styles.error}>Something went wrong with the counter.</div>;
    }

    return this.props.children;
  }
}

function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(count + 1);
  };

  const handleDecrement = () => {
    setCount(count - 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>React Counter</h1>
      <div style={styles.card}>
        <div style={styles.countDisplay}>{count}</div>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleDecrement}
            style={{ ...styles.button, ...styles.buttonSecondary }}
          >
            Decrement
          </button>
          <button
            onClick={handleReset}
            style={{ ...styles.button, ...styles.buttonTertiary }}
          >
            Reset
          </button>
          <button
            onClick={handleIncrement}
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    margin: 0,
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: 40,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    minWidth: 320,
  },
  countDisplay: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 1,
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 'bold',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  buttonPrimary: {
    background: '#667eea',
    color: 'white',
  },
  buttonSecondary: {
    background: '#764ba2',
    color: 'white',
  },
  buttonTertiary: {
    background: '#e0e0e0',
    color: '#333',
  },
  error: {
    color: 'red',
    fontSize: 18,
    padding: 20,
    textAlign: 'center',
  },
};

export default function App() {
  return (
    <ErrorBoundary>
      <Counter />
    </ErrorBoundary>
  );
}
