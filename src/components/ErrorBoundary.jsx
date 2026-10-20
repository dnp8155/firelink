import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #F87171", borderRadius: "12px", padding: "24px" }}>
            <h2 style={{ color: "#991B1B", margin: "0 0 12px 0", fontSize: "20px", fontWeight: "bold" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#7F1D1D", margin: "0 0 16px 0", fontSize: "14px" }}>
              {this.state.error?.message || "An unexpected error occurred while rendering this page."}
            </p>
            {this.state.error?.stack && (
              <pre style={{ background: "#1E293B", color: "#F8FAFC", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", lineHeight: "1.5" }}>
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              style={{
                marginTop: "16px",
                background: "#DC2626",
                color: "#FFFFFF",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Reset Cache & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
