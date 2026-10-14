import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import styles from "./Dashboard.module.css";

const founder = {
  name: "Rehman Saifi",
  role: "Founder & Independent AI Systems Builder",
  platform: "ZyrionOS",

  introduction:
    "I am an independent AI systems builder focused on artificial intelligence, software engineering, and intelligent automation. My work is driven by a practical goal: transforming ambitious technical ideas into structured, useful, and reliable digital systems. Through ZyrionOS, I am developing a unified AI workspace intended to coordinate specialized AI capabilities, organize development workflows, and improve visibility into digital operations.",

  story:
    "My journey into AI systems development began with curiosity about how technology could move beyond isolated tools and become part of a more coordinated environment. I became interested in how complex tasks could be divided into manageable stages, how specialized AI capabilities could work together, and how a central workspace could make execution easier to understand. That direction became the foundation for ZyrionOS, an ongoing engineering project that I continue to develop through practical implementation, testing, learning, and refinement.",

  approach:
    "My approach to engineering is based on structured problem-solving, incremental implementation, and continuous improvement. I focus on understanding requirements, organizing components, integrating services carefully, and investigating errors rather than treating development as a collection of disconnected features. Reliability, security, maintainability, clear system feedback, and appropriate human oversight are important considerations throughout this process.",

  mission:
    "To develop a unified AI-powered operating environment that helps organize digital work, coordinate specialized AI capabilities, and make complex workflows easier to manage through a centralized interface.",

  vision:
    "To progressively build a dependable platform where AI-assisted research, software development, automation, content workflows, and business operations can be coordinated through structured processes, meaningful execution visibility, and appropriate human control.",

  principles: [
    {
      number: "01",
      title: "Intelligent Coordination",
      description:
        "Organize specialized AI capabilities into structured workflows with defined responsibilities, inputs, and outputs.",
    },
    {
      number: "02",
      title: "Engineering Discipline",
      description:
        "Build incrementally, validate changes, investigate failures, and improve the system through testing and careful technical evaluation.",
    },
    {
      number: "03",
      title: "Security & Reliability",
      description:
        "Prioritize secure configuration, access control, resilient integrations, error handling, and dependable execution.",
    },
    {
      number: "04",
      title: "Human Oversight",
      description:
        "Keep relevant system activity visible and preserve appropriate human control over important actions and operational decisions.",
    },
    {
      number: "05",
      title: "Continuous Improvement",
      description:
        "Evolve the platform through implementation, feedback, architectural refinement, and evidence-based prioritization.",
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

// These paths use the uploaded images already stored in the public directory.
// Verify the filenames against GitHub before committing.
const founderImages = {
  primary: "/file_0000000013f4820c92343cfd05dbf6a0.png",
  secondary: "/file_00000000f7d482078bc5932a7e7aa50a.png",
};

function SectionHeading({ number, eyebrow, title, subtitle, id }) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.sectionIndex}>{number}</span>

      <div>
        <p className={styles.sectionEyebrow}>{eyebrow}</p>
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        {subtitle ? (
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();

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
              <span className={styles.identityLabel}>Founder profile</span>

              <button
                type="button"
                className={styles.newProjectButton}
                onClick={handleOpenWorkspace}
              >
                <span aria-hidden="true">+</span>
                New Project
              </button>
            </div>
          </header>

          {/* HERO: first photograph beside the founder introduction */}
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
                  src={founderImages.primary}
                  alt="Founder of ZyrionOS"
                  className={styles.primaryPortraitImage}
                  fetchPriority="high"
                  decoding="async"
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

              <div className={styles.portraitNote}>
                <span className={styles.portraitNoteMark}>Z</span>
                <div>
                  <strong>Founder-led development</strong>
                  <span>
                    Learning, building, and improving through engineering
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Platform introduction */}
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
              AI capabilities, software development workflows, and
              operational control through a unified workspace.
            </p>
          </section>

          {/* About the founder */}
          <section
            id="about"
            className={styles.contentSection}
            aria-labelledby="about-heading"
          >
            <SectionHeading
              number="01"
              eyebrow="THE PERSON BEHIND THE PLATFORM"
              title="About the Founder"
              subtitle="The motivation, thinking, and direction behind the work."
              id="about-heading"
            />

            <div className={styles.proseGrid}>
              <p className={styles.bodyText}>{founder.introduction}</p>
              <p className={styles.bodyText}>{founder.approach}</p>
            </div>
          </section>

          {/* Journey: second photograph appears lower on the page */}
          <section
            id="journey"
            className={styles.contentSection}
            aria-labelledby="journey-heading"
          >
            <SectionHeading
              number="02"
              eyebrow="THE STORY SO FAR"
              title="The Journey Behind ZyrionOS"
              subtitle="From curiosity about AI to building a coordinated platform."
              id="journey-heading"
            />

            <div className={styles.journeyLayout}>
              <div className={styles.journeyCopy}>
                <p className={styles.bodyText}>{founder.story}</p>

                <div className={styles.journeyCallout}>
                  <span className={styles.calloutMark} aria-hidden="true">
                    “
                  </span>
                  <div>
                    <p>
                      The objective is not simply to add more tools. It is
                      to make complex digital work more organized,
                      observable, and manageable through thoughtful system
                      design.
                    </p>
                    <span>THE ENGINEERING PERSPECTIVE</span>
                  </div>
                </div>
              </div>

              <figure className={styles.journeyPortrait}>
                <img
                  src={founderImages.secondary}
                  alt="Founder of ZyrionOS in an outdoor portrait"
                  className={styles.journeyPortraitImage}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <span>THE PERSON BEHIND THE PLATFORM</span>
                  <strong>{founder.name}</strong>
                  <span>Founder · {founder.platform}</span>
                </figcaption>
              </figure>
            </div>
          </section>

          {/* Platform capabilities */}
          <section
            id="platform"
            className={styles.contentSection}
            aria-labelledby="platform-heading"
          >
            <SectionHeading
              number="03"
              eyebrow="THE PLATFORM IN DEVELOPMENT"
              title="What ZyrionOS Is Being Built For"
              subtitle="Core product directions and architectural priorities."
              id="platform-heading"
            />

            <div className={styles.pillarGrid}>
              {platformPillars.map((pillar) => (
                <article className={styles.pillarCard} key={pillar.number}>
                  <span className={styles.pillarNumber}>
                    {pillar.number}
                  </span>
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

          {/* Mission and vision */}
          <section
            className={styles.contentSection}
            aria-labelledby="mission-heading"
          >
            <SectionHeading
              number="04"
              eyebrow="WHY ZYRIONOS EXISTS"
              title="Mission & Vision"
              subtitle="A clear purpose today and a direction for tomorrow."
              id="mission-heading"
            />

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

          {/* Engineering principles */}
          <section
            className={styles.contentSection}
            aria-labelledby="principles-heading"
          >
            <SectionHeading
              number="05"
              eyebrow="HOW THE WORK IS APPROACHED"
              title="Engineering Principles"
              subtitle="The standards that guide platform development."
              id="principles-heading"
            />

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

          {/* Closing action */}
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

          {/* Footer links are placeholders until official details are set */}
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
              <a href="#platform">Platform</a>
              <a href="#journey">Founder Journey</a>
              <span title="Official Gmail address will be configured next">
                Gmail
              </span>
              <span title="Official contact details will be configured next">
                Contact
              </span>
              <span title="Terms and Conditions page will be configured next">
                Terms & Conditions
              </span>
              <span title="Privacy Policy page will be configured next">
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
