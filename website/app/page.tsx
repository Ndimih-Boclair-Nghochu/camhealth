const FEATURES = [
  ["Patient records", "Unique ID + QR card, full history on one screen."],
  ["e-Prescription", "Sent straight to the pharmacy — no rewriting."],
  ["Billing", "Cash & Mobile Money (MTN / Orange), automatic receipts."],
  ["Pharmacy stock", "Live stock with low-stock and out-of-stock alerts."],
  ["Data security", "Encrypted, role-based, fully audited — Law 2024/017 ready."],
  ["Works offline", "Power cuts and internet outages never stop the facility."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="brand">
          <span className="mark">C</span>
          <span>
            CamHealth<small>BY NBN TECH</small>
          </span>
        </div>
        <h1>Modern hospital management, built for Cameroon.</h1>
        <p className="lead">
          Less paperwork. Secure patient data. Faster consultations. CamHealth runs your whole
          facility — even without internet.
        </p>
        <a className="cta" href="mailto:ndimihboclair4@gmail.com?subject=CamHealth%20demo">
          Request a demo
        </a>
      </section>

      <section className="features">
        {FEATURES.map(([title, body]) => (
          <div className="feature" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <footer>
        © {new Date().getFullYear()} NBN TECH · Bamenda, Cameroon ·{" "}
        <a href="https://www.ndimihboclair.com">www.ndimihboclair.com</a>
      </footer>
    </main>
  );
}
