
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import styles from "./Dashboard.module.css";

const founder = {
  name: "Rehman Saifi",
  role: "Founder & Independent AI Systems Builder",
  platform: "ZyrionOS",
  introduction:
    "I am an independent AI systems builder focused on the intersection of artificial intelligence, software engineering, and intelligent automation. My goal is to turn ambitious technical ideas into practical systems that solve real operational problems. Through ZyrionOS, I am developing a unified environment designed to bring AI agents, structured workflows, software development, and operational control into one coordinated platform.",
  story:
    "My journey into AI systems development began with a curiosity about how technology can do more than perform isolated tasks. I became interested in how multiple capabilities could work together, how complex workflows could be organized, and how a single interface could provide visibility into the entire process. That interest became the foundation for ZyrionOS—a long-term engineering project that I am building and improving through practical implementation, experimentation, testing, and continuous refinement.",
  approach:
    "I approach development as a process of breaking complex goals into smaller, testable components. Architecture, integration, reliability, security, and clear operational feedback are important parts of that process. Rather than treating AI as a standalone chatbot, I am exploring how specialized capabilities can be coordinated through defined workflows while keeping execution understandable and important decisions under human oversight.",
  mission:
    "To develop a unified AI-powered operating environment that helps organize digital work, coordinate specialized AI capabilities, and make complex workflows easier to manage through a centralized interface.",
  vision:
    "To progressively build a dependable platform where AI-assisted research, software development, automation, content workflows, and business operations can be coordinated with clear execution status, reliable integrations, and meaningful human control.",
  principles: [
    {
      number: "01",
      title: "Intelligent Coordination",
      description:
        "Organize specialized AI capabilities into structured workflows with clear responsibilities, defined inputs, and understandable outputs.",
    },
    {
      number: "02",
      title: "Engineering Discipline",
      description:
        "Build incrementally, validate changes, investigate failures, and improve the system through testing and measurable technical progress.",
    },
    {
      number: "03",
      title: "Security & Reliability",
      description:
        "Treat access control, secure configuration, error handling, and dependable execution as essential engineering considerations.",
    },
    {
      number: "04",
      title: "Human Oversight",
      description:
        "Keep system activity visible and preserve appropriate human control over important actions, decisions, and operational changes.",
    },
    {
      number: "05",
      title: "Continuous Improvement",
      description:
        "Evolve the platform through practical implementation, feedback, architectural refinement, and careful prioritization.",
    },
  ],
  focusAreas: [
    "AI Agent Orchestration",
    "Software Engineering",
    "Workflow Automation",
    "System Reliability",
    "Operational Visibility",
    "Platform Architecture",
  ],
};

const platformPillars = [
  {
    number: "01",
    title: "AI Agent Coordination",
    description:
      "A structured approach to coordinating specialized AI capabilities as part of broader workflows.",
  },
  {
    number: "02",
    title: "Unified Workspace",
    description:
      "A central interface intended to organize projects, development activity, and platform operations.",
  },
  {
    number: "03",
    title: "Execution Visibility",
    description:
      "A focus on making relevant progress, system states, and operational feedback easier to understand.",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/workspace");
  };

  const handleOpenWorkspace = () => {
    navigate("/workspace");
  };

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">
                Z
              </span>

              <div className={styles.brandText}>
                <span className={styles.brandName}>ZyrionOS</span>
                <span className={styles.brandCaption}>
                  FOUNDER & PLATFORM OVERVIEW
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <span className={styles.identityLabel}>
                Founder profile
              </span>

              <button
                type="button"
                className={styles.newProjectButton}
                onClick={handleNewProject}
              >
                <span aria-hidden="true">+</span>
                New Project
              </button>
            </div>
          </header>

          <section
            className={styles.hero}
            aria-labelledby="founder-heading"
          >
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                THE FOUNDER
              </div>

              <p className={styles.heroOverline}>
                Building the next chapter of intelligent systems
              </p>

              <h1 id="founder-heading" className={styles.founderName}>
                {founder.name}
                <span className={styles.namePeriod}>.</span>
              </h1>

              <p className={styles.founderRole}>{founder.role}</p>

              <p className={styles.heroIntroduction}>
                {founder.introduction}
              </p>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={handleOpenWorkspace}
                >
                  Explore Workspace
                  <span aria-hidden="true">↗</span>
                </button>

                <a className={styles.secondaryAction} href="#about">
                  Discover the story
                  <span aria-hidden="true">↓</span>
                </a>
              </div>

              <div className={styles.heroTags} aria-label="Areas of focus">
                {founder.focusAreas.slice(0, 4).map((area) => (
                  <span key={area}>{area}</span>
                ))}
              </div>
            </div>

            <div className={styles.portraitArea}>
              <div className={styles.portraitGlow} aria-hidden="true" />

              <figure className={styles.primaryPortrait}>
                <img
                  src="/founder-primary.png"
                  alt="Rehman Saifi, founder of ZyrionOS"
                  className={styles.primaryPortraitImage}
                  fetchPriority="high"
                />

                <figcaption className={styles.portraitOverlay}>
                  <span className={styles.portraitStatus}>
                    <span />
                    FOUNDER PROFILE
                  </span>
                  <strong>{founder.name}</strong>
                  <span>{founder.platform}</span>
                </figcaption>
              </figure>

              <figure className={styles.secondaryPortrait}>
                <img
                  src="/founder-secondary.png"
                  alt="Rehman Saifi in an outdoor portrait"
                  className={styles.secondaryPortraitImage}
                  loading="lazy"
                />
                <figcaption className={styles.secondaryPortraitLabel}>
                  THE PERSON BEHIND THE PLATFORM
                </figcaption>
              </figure>

              <div className={styles.portraitNote}>
                <span className={styles.portraitNoteMark}>Z</span>
                <div>
                  <strong>Founder-led development</strong>
                  <span>Built through continuous learning and engineering</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.introBand} aria-label="Platform summary">
            <div>
              <span className={styles.bandEyebrow}>THE BIG PICTURE</span>
              <h2>
                One coordinated environment.
                <br />
                A more structured way to build with AI.
              </h2>
            </div>

            <p>
              ZyrionOS is an evolving platform project focused on connecting
              AI capabilities, development workflows, and operational control
              through a unified workspace.
            </p>
          </section>

          <section
            id="about"
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
                <p className={styles.sectionSubtitle}>
                  The motivation, thinking, and direction behind the work.
                </p>
              </div>
            </div>

            <div className={styles.proseGrid}>
              <p className={styles.bodyText}>{founder.introduction}</p>
              <p className={styles.bodyText}>{founder.approach}</p>
            </div>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="journey-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>02</span>

              <div>
                <p className={styles.sectionEyebrow}>THE STORY SO FAR</p>
                <h2 id="journey-heading" className={styles.sectionTitle}>
                  The Journey Behind ZyrionOS
                </h2>
                <p className={styles.sectionSubtitle}>
                  From curiosity about AI to building a coordinated platform.
                </p>
              </div>
            </div>

            <p className={styles.bodyText}>{founder.story}</p>

            <div className={styles.journeyCallout}>
              <span className={styles.calloutMark} aria-hidden="true">
                “
              </span>
              <div>
                <p>
                  The objective is not simply to add more tools. It is to make
                  complex digital work more organized, observable, and
                  manageable through thoughtful system design.
                </p>
                <span>THE ENGINEERING PERSPECTIVE</span>
              </div>
            </div>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="platform-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>03</span>

              <div>
                <p className={styles.sectionEyebrow}>
                  THE PLATFORM IN DEVELOPMENT
                </p>
                <h2 id="platform-heading" className={styles.sectionTitle}>
                  What ZyrionOS Is Being Built For
                </h2>
                <p className={styles.sectionSubtitle}>
                  Core product directions and architectural priorities.
                </p>
              </div>
            </div>

            <div className={styles.pillarGrid}>
              {platformPillars.map((pillar) => (
                <article className={styles.pillarCard} key={pillar.number}>
                  <span className={styles.pillarNumber}>{pillar.number}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </article>
              ))}
            </div>

            <p className={styles.disclaimer}>
              ZyrionOS is an evolving engineering project. Specific
              capabilities depend on implementation, available integrations,
              and the current state of development.
            </p>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="mission-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>04</span>

              <div>
                <p className={styles.sectionEyebrow}>WHY ZYRIONOS EXISTS</p>
                <h2 id="mission-heading" className={styles.sectionTitle}>
                  Mission & Vision
                </h2>
                <p className={styles.sectionSubtitle}>
                  A clear purpose today and a direction for tomorrow.
                </p>
              </div>
            </div>

            <div className={styles.missionGrid}>
              <article className={styles.missionCard}>
                <span className={styles.cardEyebrow}>OUR MISSION</span>
                <h3>Make complex workflows easier to coordinate.</h3>
                <p>{founder.mission}</p>
              </article>

              <article className={styles.visionCard}>
                <span className={styles.cardEyebrow}>LONG-TERM VISION</span>
                <h3>Build toward a unified AI operating environment.</h3>
                <p>{founder.vision}</p>
              </article>
            </div>
          </section>

          <section
            className={styles.contentSection}
            aria-labelledby="principles-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>05</span>

              <div>
                <p className={styles.sectionEyebrow}>
                  HOW THE WORK IS APPROACHED
                </p>
                <h2
                  id="principles-heading"
                  className={styles.sectionTitle}
                >
                  Engineering Principles
                </h2>
                <p className={styles.sectionSubtitle}>
                  The standards that guide platform development.
                </p>
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
            <div className={styles.closingBrand} aria-hidden="true">
              Z
            </div>

            <div className={styles.closingCopy}>
              <p className={styles.sectionEyebrow}>
                AN ONGOING ENGINEERING JOURNEY
              </p>
              <h2 id="closing-heading">
                Building with purpose. Improving with every iteration.
              </h2>
              <p>
                ZyrionOS is being developed step by step, with an emphasis on
                practical automation, structured workflows, dependable
                engineering, and human oversight.
              </p>
            </div>

            <button
              type="button"
              className={styles.closingButton}
              onClick={handleOpenWorkspace}
            >
              Open Workspace
              <span aria-hidden="true">↗</span>
            </button>
          </section>

          <footer className={styles.footer}>
            <div className={styles.footerBrand}>
              <span className={styles.footerMark}>Z</span>
              <div>
                <strong>ZyrionOS</strong>
                <span>Founder & Platform Overview</span>
              </div>
            </div>

            <nav className={styles.footerLinks} aria-label="Platform links">
              <a href="#about">About</a>
              <a href="#platform-heading">Platform</a>
              <span title="Official platform email will be added next">
                Gmail
              </span>
              <span title="Contact details will be added next">Contact</span>
              <span title="Terms and Conditions page will be added next">
                Terms & Conditions
              </span>
              <span title="Privacy Policy page will be added next">
                Privacy Policy
              </span>
            </nav>

            <div className={styles.footerBottom}>
              <span>
                © {new Date().getFullYear()} ZyrionOS. All rights reserved.
              </span>
              <span>Built with a focus on thoughtful engineering.</span>
            </div>
          </footer>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default Dashboard;
