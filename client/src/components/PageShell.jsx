import { Link } from "react-router-dom";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f2ef",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#1d2226",
  },
  nav: {
    backgroundColor: "#0a66c2",
    color: "white",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brand: {
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
  },
  container: {
    maxWidth: "1100px",
    margin: "24px auto",
    padding: "0 16px",
  },
  heroCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e0dfdc",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "8px",
    color: "#5e6a75",
    fontSize: "15px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "20px",
  },
  leftCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e0dfdc",
  },
  rightCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e0dfdc",
  },
  responseTitle: {
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "20px",
  },
  pre: {
    backgroundColor: "#f8fafd",
    border: "1px solid #dde7f0",
    borderRadius: "10px",
    padding: "16px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "13px",
    minHeight: "320px",
    overflow: "auto",
  },
};

export default function PageShell({ title, children, response }) {
  return (
    <div style={styles.page}>
      <div style={styles.nav}>
        <div style={styles.brand}>in</div>
        <div style={styles.navLinks}>
          <Link style={styles.link} to="/">Home</Link>
          <Link style={styles.link} to="/submit">Submit</Link>
          <Link style={styles.link} to="/get">Get</Link>
          <Link style={styles.link} to="/byJob">By Job</Link>
          <Link style={styles.link} to="/byMember">By Member</Link>
          <Link style={styles.link} to="/status">Update Status</Link>
          <Link style={styles.link} to="/note">Add Note</Link>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.heroCard}>
          <h1 style={styles.title}>{title}</h1>
          <div style={styles.subtitle}>
            LinkedIn-style demo UI for the Application Service
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.leftCard}>{children}</div>

          <div style={styles.rightCard}>
            <h3 style={styles.responseTitle}>Response</h3>
            <pre style={styles.pre}>{response || "No response yet."}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}