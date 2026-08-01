const FEATURES = [
  ["🩺", "Book & consult", "Find a doctor, book in‑person or video visits, and get seen faster — no queues."],
  ["📁", "Your health, one place", "Visits, prescriptions, lab results and vaccinations, always in your pocket."],
  ["💊", "Pharmacy delivered", "Order medicines, upload a prescription, pay with Mobile Money, pick up or get it delivered."],
  ["🔬", "Lab results on your phone", "Book tests and receive results the moment they're ready."],
  ["🔔", "Never miss a dose", "Smart reminders for medication, appointments and follow‑ups."],
  ["🔒", "Private & secure", "Encrypted and built to Cameroon's 2024 Data Protection Law."],
];

const STEPS = [
  ["Create your account", "Sign up in seconds and get your personal health ID."],
  ["Book or shop", "Request a consultation or order medicines from the pharmacy."],
  ["Get care", "See a doctor, view results, and manage everything from home."],
];

const PLANS = [
  { name: "Free", price: "0 FCFA", tag: "Everyone", perks: ["Personal health records", "Book appointments", "Pharmacy shop", "Hospital news feed"], cta: "Get started", highlight: false },
  { name: "CamHealth+", price: "2,000 FCFA/mo", tag: "Best value", perks: ["Everything in Free", "Priority booking", "Free medicine delivery", "Discounts on consults & drugs", "Unlimited chat with doctors"], cta: "Go premium", highlight: true },
];

export default function Home() {
  return (
    <main>
      {/* Nav */}
      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top"><span className="mark">C</span> CamHealth</a>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Membership</a>
            <a href="#hospitals">For hospitals</a>
          </nav>
          <a className="btn btn-primary" href="#download">Get the app</a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero" id="top">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Cameroon’s personal health app</span>
            <h1>Your hospital, <span className="grad">in your pocket.</span></h1>
            <p className="lead">Book doctors, keep your medical records, order medicines and pay with Mobile Money — all in one beautifully simple app.</p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-lg" href="#download">Download free</a>
              <a className="btn btn-ghost btn-lg" href="#how">See how it works</a>
            </div>
            <div className="hero-trust">
              <div><strong>250+</strong><span>specialties</span></div>
              <div><strong>Offline</strong><span>works with low data</span></div>
              <div><strong>MTN · Orange</strong><span>Mobile Money</span></div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="phone-wrap">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="ps-head">
                  <div><div className="ps-hi">Good morning,</div><div className="ps-name">Ada Bih</div></div>
                  <div className="ps-avatar">AB</div>
                </div>
                <div className="ps-quick">
                  {["📅", "💊", "📁", "🩺"].map((e, i) => <div key={i} className="ps-q">{e}</div>)}
                </div>
                <div className="ps-card ps-appt">
                  <div className="ps-date"><b>24</b><span>AUG</span></div>
                  <div><div className="ps-t">Consultation</div><div className="ps-s">Mon · 09:00 · Confirmed</div></div>
                </div>
                <div className="ps-card">
                  <div className="ps-cat">CAMPAIGN</div>
                  <div className="ps-t">Free malaria screening</div>
                  <div className="ps-s">This week at all branches.</div>
                </div>
              </div>
            </div>
            <div className="blob blob-1" />
            <div className="blob blob-2" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="container">
          <h2 className="h2">Everything you need to stay well</h2>
          <p className="sub">One app for care, records, pharmacy and payments.</p>
          <div className="features">
            {FEATURES.map(([icon, title, body]) => (
              <div className="feature" key={title}>
                <div className="feature-ic">{icon}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section alt" id="how">
        <div className="container">
          <h2 className="h2">Get started in minutes</h2>
          <div className="steps">
            {STEPS.map(([t, b], i) => (
              <div className="step" key={t}>
                <div className="step-no">{i + 1}</div>
                <h3>{t}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <div className="container">
          <h2 className="h2">Simple membership</h2>
          <p className="sub">Start free. Upgrade when you want more.</p>
          <div className="plans">
            {PLANS.map((p) => (
              <div className={`plan ${p.highlight ? "plan-hi" : ""}`} key={p.name}>
                <div className="plan-tag">{p.tag}</div>
                <h3>{p.name}</h3>
                <div className="plan-price">{p.price}</div>
                <ul>{p.perks.map((k) => <li key={k}>✓ {k}</li>)}</ul>
                <a className={`btn ${p.highlight ? "btn-primary" : "btn-ghost"} btn-block`} href="#download">{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For hospitals */}
      <section className="section alt" id="hospitals">
        <div className="container hospitals">
          <div>
            <span className="eyebrow">For clinics & hospitals</span>
            <h2 className="h2 left">Run your whole facility — even offline</h2>
            <p className="sub left">CamHealth also powers the front desk: patients, consultations, e‑prescriptions, pharmacy stock, laboratory and billing (cash + Mobile Money). Desktop app works without internet and syncs to the cloud.</p>
            <a className="btn btn-primary" href="#download">Request a demo</a>
          </div>
          <div className="hosp-list">
            {["Patients & records", "Appointments & queue", "Pharmacy + stock alerts", "Laboratory", "Billing & Mobile Money", "Audit & data security"].map((x) => (
              <div className="hosp-item" key={x}>✓ {x}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="cta" id="download">
        <div className="container cta-inner">
          <h2>Take charge of your health today</h2>
          <p>Download CamHealth free and carry your hospital everywhere.</p>
          <div className="cta-btns">
            <a className="store" href="mailto:ndimihboclair4@gmail.com?subject=CamHealth%20app">▶ Google Play</a>
            <a className="store" href="mailto:ndimihboclair4@gmail.com?subject=CamHealth%20app"> App Store</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div><span className="mark">C</span> CamHealth</div>
          <div>© {new Date().getFullYear()} NBN TECH · Bamenda, Cameroon</div>
          <a href="https://www.ndimihboclair.com">www.ndimihboclair.com</a>
        </div>
      </footer>
    </main>
  );
}
