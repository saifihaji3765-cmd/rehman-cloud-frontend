
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import styles from "./Dashboard.module.css";

const founder = {
  name: "Rehman Saifi",
  role: "Founder & Independent AI Systems Builder",
  platform: "ZyrionOS",
  introduction:
    "I am a student and independent AI systems builder interested in technology, artificial intelligence, and turning complex problems into practical solutions. I am building ZyrionOS as a platform designed to bring intelligent agents, automation, and centralized control into one coordinated environment.",
  journey:
    "My journey began with an interest in understanding technology and exploring the practical capabilities of AI. Rather than relying only on existing tools, I wanted to build a system that could coordinate multiple AI capabilities through structured workflows. ZyrionOS is my long-term engineering project, which I aim to improve progressively through better architecture, reliability, automation, and agent coordination.",
  mission:
    "To develop a centralized AI-powered operating environment that helps organize, coordinate, and automate digital operations through specialized AI agents and a unified control interface.",
  vision:
    "Build a dependable AI environment in which specialized agents can support research, software development, content creation, business workflows, client discovery, and operational analysis—with progress visibility and human oversight.",
  principles: [
    {
      number: "01",
      title: "Intelligent Coordination",
      description:
        "Bring specialized AI capabilities together through structured workflows rather than isolated tools.",
    },
    {
      number: "02",
      title: "Security & Reliability",
      description:
        "Prioritize secure design, dependable execution, and responsible system development.",
    },
    {
      number: "03",
      title: "Human Oversight",
      description:
        "Keep important decisions and operational controls visible, understandable, and under human control.",
    },
    {
      number: "04",
      title: "Progressive Engineering",
      description:
        "Improve the platform step by step through practical implementation, testing, and refinement.",
    },
  ],
};

function Dashboard() {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/workspace");
  };

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <span className={styles.brandMark}>Z</span>

              <div>
                <span className={styles.brandName}>
                  ZyrionOS
                </span>
                <span className={styles.brandCaption}>
                  Founder & Platform Identity
                </span>
              </div>
            </div>

            <button
              type="button"
              className={styles.newProjectButton}
              onClick={handleNewProject}
            >
              <span aria-hidden="true">+</span>
              New Project
            </button>
          </header>

          <section
            className={styles.hero}
            aria-labelledby="founder-heading"
          >
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                FOUNDER PROFILE
              </div>

              <h1
                id="founder-heading"
                className={styles.founderName}
              >
                {founder.name}
              </h1>

              <p className={styles.founderRole}>
                {founder.role}
              </p>

              <p className={styles.introduction}>
                {founder.introduction}
              </p>

              <div className={styles.heroTags}>
                <span>Artificial Intelligence</span>
                <span>AI Systems</span>
                <span>Automation</span>
              </div>
            </div>

            <div className={styles.photoColumn}>
              <div
                className={styles.photoFrame}
                role="img"
                aria-label="Founder photo placeholder"
              >
                <div className={styles.photoPlaceholder}>
                  <span className={styles.photoInitials}>
                    RS
                  </span>
                  <span className={styles.photoLabel}>
                    Founder Photo
                  </span>
                  <span className={styles.photoHint}>
                    Photo will be added
                  </span>
                </div>
              </div>

              <span className={styles.photoCaption}>
                Founder · {founder.platform}
              </span>
            </div>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="about-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>01</span>

              <div>
                <p className={styles.sectionEyebrow}>
                  THE PERSON BEHIND THE PLATFORM
                </p>
                <h2 id="about-heading" className={styles.sectionTitle}>
                  About the Founder
                </h2>
              </div>
            </div>

            <p className={styles.bodyText}>
              {founder.introduction}
            </p>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="journey-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>02</span>

              <div>
                <p className={styles.sectionEyebrow}>
                  THE STORY SO FAR
                </p>
                <h2 id="journey-heading" className={styles.sectionTitle}>
                  My Journey
                </h2>
              </div>
            </div>

            <p className={styles.bodyText}>
              {founder.journey}
            </p>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="mission-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>03</span>

              <div>
                <p className={styles.sectionEyebrow}>
                  WHY ZYRIONOS EXISTS
                </p>
                <h2 id="mission-heading" className={styles.sectionTitle}>
                  Mission & Purpose
                </h2>
              </div>
            </div>

            <div className={styles.missionBlock}>
              <span className={styles.blockLabel}>OUR MISSION</span>
              <p>{founder.mission}</p>
            </div>

            <div className={styles.visionBlock}>
              <span className={styles.blockLabel}>LONG-TERM VISION</span>
              <p>{founder.vision}</p>
            </div>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="principles-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>04</span>

              <div>
                <p className={styles.sectionEyebrow}>
                  HOW THE PLATFORM IS APPROACHED
                </p>
                <h2
                  id="principles-heading"
                  className={styles.sectionTitle}
                >
                  Engineering Principles
                </h2>
              </div>
            </div>

            <div className={styles.principlesList}>
              {founder.principles.map((principle) => (
                <article
                  key={principle.number}
                  className={styles.principle}
                >
                  <span className={styles.principleNumber}>
                    {principle.number}
                  </span>

                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            className={styles.closingSection}
            aria-labelledby="closing-heading"
          >
            <span className={styles.closingMark}>Z</span>

            <div>
              <p className={styles.sectionEyebrow}>
                BUILDING STEP BY STEP
              </p>
              <h2 id="closing-heading">
                A coordinated AI system, built with purpose.
              </h2>
              <p>
                ZyrionOS is being developed as a long-term engineering
                project focused on useful automation, reliable execution,
                and human oversight.
              </p>
            </div>

            <button
              type="button"
              className={styles.closingButton}
              onClick={handleNewProject}
            >
              Open Workspace <span aria-hidden="true">→</span>
            </button>
          </section>

          <footer className={styles.footer}>
            <span>
              © {new Date().getFullYear()} ZyrionOS
            </span>
            <span>Founder & Platform Identity</span>
          </footer>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default Dashboard;
