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
  },
  brand: {
    fontSize: "24px",
    fontWeight: "bold",
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
  hero: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e0dfdc",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "10px",
    color: "#5e6a75",
    fontSize: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e0dfdc",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "20px",
  },
  cardText: {
    color: "#5e6a75",
    fontSize: "14px",
    minHeight: "48px",
  },
  button: {
    display: "inline-block",
    marginTop: "12px",
    backgroundColor: "#0a66c2",
    color: "white",
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: "14px",
  },
};

const cards = [
  { title: "Submit Application", path: "/submit", text: "Create a new application for an open job." },
  { title: "Get Application", path: "/get", text: "Fetch one application and inspect its details." },
  { title: "Applications by Job", path: "/byJob", text: "Recruiter view of all applications for a job." },
  { title: "Applications by Member", path: "/byMember", text: "Member dashboard view of submitted applications." },
  { title: "Update Status", path: "/status", text: "Move an application to reviewing, interview, offer, or rejected." },
  { title: "Add Note", path: "/note", text: "Attach recruiter notes and decision rationale." },
];

export default function Home() {
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
        <div style={styles.hero}>
          <h1 style={styles.title}>Application Service Demo</h1>
          <div style={styles.subtitle}>
            LinkedIn-style frontend for testing apply flow, recruiter review, notes, and status updates.
          </div>
        </div>

        <div style={styles.grid}>
          {cards.map((card) => (
            <div key={card.path} style={styles.card}>
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <div style={styles.cardText}>{card.text}</div>
              <Link style={styles.button} to={card.path}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}