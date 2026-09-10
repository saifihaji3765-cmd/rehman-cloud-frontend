import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import styles from "./Settings.module.css";

import { useAuth } from "../../../context/AuthContext.jsx";
import { getSubscription } from "../../../services/billingService.js";


/* =========================================================
   ICON SYSTEM
========================================================= */

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  switch (name) {
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
        </svg>
      );

    case "security":
      return (
        <svg {...common}>
          <path d="M12 3 19 6v5c0 4.7-2.7 8.2-7 10-4.3-1.8-7-5.3-7-10V6z" />
          <path d="m9.5 12 1.7 1.7 3.6-3.8" />
        </svg>
      );

    case "sessions":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
      );

    case "notifications":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="m5.6 5.6 2.1 2.1" />
          <path d="m16.3 16.3 2.1 2.1" />
          <path d="m18.4 5.6-2.1 2.1" />
          <path d="m7.7 16.3-2.1 2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );

    case "workspace":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h4l2 2h5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M4 10h16" />
        </svg>
      );

    case "billing":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );

    case "integrations":
      return (
        <svg {...common}>
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );

    case "privacy":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    case "danger":
      return (
        <svg {...common}>
          <path d="M12 3 22 20H2z" />
          <path d="M12 9v5" />
          <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );

    case "external":
      return (
        <svg {...common}>
          <path d="M14 5h5v5" />
          <path d="m19 5-8 8" />
          <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}


/* =========================================================
   SECTION DEFINITIONS
========================================================= */

const sections = [
  {
    id: "profile",
    label: "Profile & Account",
    description: "Your identity and account information",
    icon: "profile",
  },
  {
    id: "security",
    label: "Security",
    description: "Authentication and account protection",
    icon: "security",
  },
  {
    id: "sessions",
    label: "Sessions & Devices",
    description: "Review active account sessions",
    icon: "sessions",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Control product notifications",
    icon: "notifications",
  },
  {
    id: "ai",
    label: "AI Preferences",
    description: "Configure your AI experience",
    icon: "ai",
  },
  {
    id: "workspace",
    label: "Workspace",
    description: "Workspace and project preferences",
    icon: "workspace",
  },
  {
    id: "billing",
    label: "Billing & Plan",
    description: "Subscription and payment settings",
    icon: "billing",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connected services and providers",
    icon: "integrations",
  },
  {
    id: "privacy",
    label: "Privacy & Data",
    description: "Data and privacy controls",
    icon: "privacy",
  },
  {
    id: "danger",
    label: "Danger Zone",
    description: "Irreversible account actions",
    icon: "danger",
  },
];


/* =========================================================
   HELPERS
========================================================= */

function getInitials(user) {
  const source =
    user?.name ||
    user?.displayName ||
    user?.email ||
    "Z";

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}


function getDisplayName(user) {
  return (
    user?.name ||
    user?.displayName ||
    user?.fullName ||
    "ZyrionOS User"
  );
}


function getEmail(user) {
  return user?.email || "Account email unavailable";
}


function getSubscriptionData(response) {
  if (!response) return null;

  if (response?.data?.data) {
    return response.data.data;
  }

  if (response?.data) {
    return response.data;
  }

  return response;
}


/* =========================================================
   SETTINGS
========================================================= */

function Settings() {
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [activeSection, setActiveSection] =
    useState("profile");

  const [subscription, setSubscription] =
    useState(null);

  const [subscriptionLoading, setSubscriptionLoading] =
    useState(false);

  const [subscriptionError, setSubscriptionError] =
    useState("");

  const [mobileSectionsOpen, setMobileSectionsOpen] =
    useState(false);


  /* -------------------------------------------------------
     USER DATA
  ------------------------------------------------------- */

  const profile = useMemo(
    () => ({
      name: getDisplayName(user),
      email: getEmail(user),
      initials: getInitials(user),
      avatar:
        user?.avatar ||
        user?.photo ||
        user?.picture ||
        null,
      provider:
        user?.provider ||
        user?.authProvider ||
        null,
    }),
    [user]
  );


  /* -------------------------------------------------------
     LOAD SUBSCRIPTION ONLY WHEN BILLING SECTION IS OPEN
  ------------------------------------------------------- */

  const loadSubscription = async () => {
    setSubscriptionLoading(true);
    setSubscriptionError("");

    try {
      const response = await getSubscription();
      setSubscription(
        getSubscriptionData(response)
      );
    } catch (error) {
      setSubscription(null);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load subscription information.";

      setSubscriptionError(message);
    } finally {
      setSubscriptionLoading(false);
    }
  };


  /* -------------------------------------------------------
     SECTION CHANGE
  ------------------------------------------------------- */

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setMobileSectionsOpen(false);

    if (sectionId === "billing" && !subscription) {
      loadSubscription();
    }
  };


  /* -------------------------------------------------------
     SUBSCRIPTION PRESENTATION
  ------------------------------------------------------- */

  const subscriptionName =
    subscription?.planName ||
    subscription?.plan ||
    subscription?.name ||
    null;

  const billingCycle =
    subscription?.billingCycle ||
    subscription?.interval ||
    null;

  const subscriptionStatus =
    subscription?.status ||
    null;


  /* -------------------------------------------------------
     AUTH LOADING
  ------------------------------------------------------- */

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className={styles.page}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <span>Loading settings...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>

      <div className={styles.page}>

        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <header className={styles.header}>

          <div className={styles.headerCopy}>

            <div className={styles.breadcrumb}>
              <span>Platform</span>
              <Icon
                name="chevron"
                size={13}
              />
              <span>Settings</span>
            </div>

            <h1 className={styles.title}>
              Settings
            </h1>

            <p className={styles.subtitle}>
              Manage your ZyrionOS account,
              security, AI experience and
              workspace configuration.
            </p>

          </div>

          <div className={styles.headerActions}>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                navigate("/billing")
              }
            >
              <Icon
                name="billing"
                size={16}
              />
              Billing
            </button>

          </div>

        </header>


        {/* =================================================
            MOBILE SECTION SELECTOR
        ================================================== */}

        <div className={styles.mobileSectionSelector}>

          <button
            type="button"
            className={styles.mobileSectionButton}
            onClick={() =>
              setMobileSectionsOpen(
                (current) => !current
              )
            }
            aria-expanded={
              mobileSectionsOpen
            }
          >

            <span
              className={styles.mobileSectionIcon}
            >
              <Icon
                name={
                  sections.find(
                    (item) =>
                      item.id ===
                      activeSection
                  )?.icon || "profile"
                }
                size={17}
              />
            </span>

            <span
              className={styles.mobileSectionContent}
            >
              <strong>
                {
                  sections.find(
                    (item) =>
                      item.id ===
                      activeSection
                  )?.label
                }
              </strong>

              <small>
                Settings section
              </small>
            </span>

            <Icon
              name="chevron"
              size={17}
            />

          </button>


          {mobileSectionsOpen && (
            <div
              className={
                styles.mobileSectionMenu
              }
            >
              {sections.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={
                    activeSection ===
                    section.id
                      ? styles.mobileSectionItemActive
                      : styles.mobileSectionItem
                  }
                  onClick={() =>
                    handleSectionChange(
                      section.id
                    )
                  }
                >
                  <Icon
                    name={section.icon}
                    size={17}
                  />

                  <span>
                    {section.label}
                  </span>

                  {activeSection ===
                    section.id && (
                    <Icon
                      name="check"
                      size={16}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

        </div>


        {/* =================================================
            SETTINGS LAYOUT
        ================================================== */}

        <div className={styles.settingsLayout}>

          {/* =================================================
              LEFT SETTINGS NAVIGATION
          ================================================== */}

          <aside
            className={
              styles.settingsNavigation
            }
            aria-label="Settings navigation"
          >

            <div
              className={
                styles.navigationHeader
              }
            >
              <span>
                SETTINGS
              </span>
            </div>

            <nav>

              {sections.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={
                    activeSection ===
                    section.id
                      ? styles.settingsNavActive
                      : styles.settingsNavItem
                  }
                  onClick={() =>
                    handleSectionChange(
                      section.id
                    )
                  }
                >

                  <span
                    className={
                      styles.settingsNavIcon
                    }
                  >
                    <Icon
                      name={section.icon}
                      size={17}
                    />
                  </span>

                  <span
                    className={
                      styles.settingsNavText
                    }
                  >
                    <strong>
                      {section.label}
                    </strong>

                    <small>
                      {section.description}
                    </small>
                  </span>

                  {activeSection ===
                    section.id && (
                    <span
                      className={
                        styles.settingsNavIndicator
                      }
                    />
                  )}

                </button>
              ))}

            </nav>

          </aside>


          {/* =================================================
              SETTINGS CONTENT
          ================================================== */}

          <main
            className={styles.settingsContent}
          >

            {/* =================================================
                PROFILE
            ================================================== */}

            {activeSection === "profile" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >

                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      ACCOUNT
                    </span>

                    <h2>
                      Profile & Account
                    </h2>

                    <p>
                      Your account identity
                      and connected authentication
                      information.
                    </p>
                  </div>

                </div>


                <div
                  className={
                    styles.profileHero
                  }
                >

                  <div
                    className={
                      styles.profileAvatar
                    }
                  >

                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt=""
                      />
                    ) : (
                      profile.initials
                    )}

                  </div>

                  <div
                    className={
                      styles.profileIdentity
                    }
                  >
                    <h3>
                      {profile.name}
                    </h3>

                    <p>
                      {profile.email}
                    </p>

                    {profile.provider && (
                      <span
                        className={
                          styles.providerBadge
                        }
                      >
                        {profile.provider}
                        {" "}
                        authentication
                      </span>
                    )}
                  </div>

                </div>


                <div
                  className={styles.cardGrid}
                >

                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      DISPLAY NAME
                    </span>

                    <strong>
                      {profile.name}
                    </strong>

                    <p>
                      Your name currently
                      associated with the
                      authenticated account.
                    </p>
                  </div>


                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      EMAIL
                    </span>

                    <strong>
                      {profile.email}
                    </strong>

                    <p>
                      Authentication email
                      returned by your account.
                    </p>
                  </div>

                </div>


                <div
                  className={
                    styles.infoNotice
                  }
                >
                  <Icon
                    name="security"
                    size={17}
                  />

                  <div>
                    <strong>
                      Account identity is
                      managed by authentication.
                    </strong>

                    <p>
                      Profile information shown
                      here comes from your
                      authenticated account.
                    </p>
                  </div>
                </div>

              </section>
            )}


            {/* =================================================
                SECURITY
            ================================================== */}

            {activeSection === "security" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      PROTECTION
                    </span>

                    <h2>
                      Security
                    </h2>

                    <p>
                      Manage authentication and
                      account protection controls.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.securityCard
                  }
                >

                  <div
                    className={
                      styles.securityIcon
                    }
                  >
                    <Icon
                      name="security"
                      size={20}
                    />
                  </div>

                  <div
                    className={
                      styles.securityCopy
                    }
                  >
                    <h3>
                      Authentication
                    </h3>

                    <p>
                      Your account authentication
                      is handled through the
                      configured ZyrionOS
                      authentication flow.
                    </p>
                  </div>

                  <div
                    className={
                      styles.statusUnavailable
                    }
                  >
                    <span />
                    Managed by account
                  </div>

                </div>


                <div
                  className={
                    styles.actionCard
                  }
                >

                  <div>
                    <h3>
                      Additional security
                    </h3>

                    <p>
                      Advanced security controls
                      will appear here when their
                      corresponding backend
                      capabilities are available.
                    </p>
                  </div>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Backend controlled
                  </span>

                </div>

              </section>
            )}


            {/* =================================================
                SESSIONS
            ================================================== */}

            {activeSection === "sessions" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      ACCESS
                    </span>

                    <h2>
                      Sessions & Devices
                    </h2>

                    <p>
                      Review account sessions and
                      connected devices.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.emptyState
                  }
                >

                  <div
                    className={
                      styles.emptyStateIcon
                    }
                  >
                    <Icon
                      name="sessions"
                      size={24}
                    />
                  </div>

                  <h3>
                    Session management
                  </h3>

                  <p>
                    Detailed active-session data
                    will be displayed here once
                    the backend session-management
                    contract is connected.
                  </p>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    No fabricated session data
                  </span>

                </div>

              </section>
            )}


            {/* =================================================
                NOTIFICATIONS
            ================================================== */}

            {activeSection === "notifications" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      PREFERENCES
                    </span>

                    <h2>
                      Notifications
                    </h2>

                    <p>
                      Control how ZyrionOS
                      communicates with you.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.preferencePlaceholder
                  }
                >

                  <Icon
                    name="notifications"
                    size={22}
                  />

                  <div>
                    <h3>
                      Notification preferences
                    </h3>

                    <p>
                      Notification controls will
                      be connected to the real
                      preferences API before any
                      setting is made interactive.
                    </p>
                  </div>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Awaiting preferences API
                  </span>

                </div>

              </section>
            )}


            {/* =================================================
                AI PREFERENCES
            ================================================== */}

            {activeSection === "ai" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      INTELLIGENCE
                    </span>

                    <h2>
                      AI Preferences
                    </h2>

                    <p>
                      Configure how ZyrionOS AI
                      works with your projects.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.aiHero
                  }
                >

                  <div
                    className={
                      styles.aiIcon
                    }
                  >
                    <Icon
                      name="ai"
                      size={24}
                    />
                  </div>

                  <div>
                    <h3>
                      ZyrionOS AI
                    </h3>

                    <p>
                      AI behavior controls will
                      be connected to the real
                      AI preference contract.
                    </p>
                  </div>

                </div>


                <div
                  className={
                    styles.cardGrid
                  }
                >

                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      AI MODEL
                    </span>

                    <strong>
                      Backend controlled
                    </strong>

                    <p>
                      The active model must come
                      from the connected AI service,
                      not a hard-coded frontend value.
                    </p>
                  </div>

                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      AI EXECUTION
                    </span>

                    <strong>
                      Project controlled
                    </strong>

                    <p>
                      AI execution remains tied to
                      the selected project and its
                      real backend capabilities.
                    </p>
                  </div>

                </div>

              </section>
            )}


            {/* =================================================
                WORKSPACE
            ================================================== */}

            {activeSection === "workspace" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      WORKSPACE
                    </span>

                    <h2>
                      Workspace Preferences
                    </h2>

                    <p>
                      Manage your project-building
                      environment.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.navigationActionCard
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate("/workspace")
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      navigate("/workspace");
                    }
                  }}
                >

                  <div
                    className={
                      styles.navigationActionIcon
                    }
                  >
                    <Icon
                      name="workspace"
                      size={21}
                    />
                  </div>

                  <div
                    className={
                      styles.navigationActionCopy
                    }
                  >
                    <h3>
                      Open Workspace
                    </h3>

                    <p>
                      Manage projects, AI builds,
                      code, preview and deployment
                      from the main workspace.
                    </p>
                  </div>

                  <Icon
                    name="arrow"
                    size={18}
                  />

                </div>

              </section>
            )}


            {/* =================================================
                BILLING
            ================================================== */}

            {activeSection === "billing" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      COMMERCE
                    </span>

                    <h2>
                      Billing & Plan
                    </h2>

                    <p>
                      View your real subscription
                      and manage billing.
                    </p>
                  </div>
                </div>


                {subscriptionLoading && (
                  <div
                    className={
                      styles.loadingInline
                    }
                  >
                    <div
                      className={
                        styles.loadingSpinner
                      }
                    />
                    Loading subscription...
                  </div>
                )}


                {subscriptionError && (
                  <div
                    className={
                      styles.errorNotice
                    }
                  >
                    <strong>
                      Subscription unavailable
                    </strong>

                    <p>
                      {subscriptionError}
                    </p>

                    <button
                      type="button"
                      onClick={loadSubscription}
                      className={
                        styles.retryButton
                      }
                    >
                      Retry
                    </button>
                  </div>
                )}


                {!subscriptionLoading &&
                  !subscriptionError &&
                  subscription && (
                    <div
                      className={
                        styles.subscriptionCard
                      }
                    >

                      <div
                        className={
                          styles.subscriptionIcon
                        }
                      >
                        <Icon
                          name="billing"
                          size={22}
                        />
                      </div>

                      <div
                        className={
                          styles.subscriptionCopy
                        }
                      >
                        <span
                          className={
                            styles.cardLabel
                          }
                        >
                          CURRENT PLAN
                        </span>

                        <h3>
                          {subscriptionName ||
                            "Plan information"}
                        </h3>

                        {billingCycle && (
                          <p>
                            Billing cycle:{" "}
                            {billingCycle}
                          </p>
                        )}

                        {subscriptionStatus && (
                          <span
                            className={
                              styles.subscriptionStatus
                            }
                          >
                            {subscriptionStatus}
                          </span>
                        )}

                      </div>

                      <button
                        type="button"
                        className={
                          styles.primaryButton
                        }
                        onClick={() =>
                          navigate("/billing")
                        }
                      >
                        Manage Billing
                        <Icon
                          name="arrow"
                          size={16}
                        />
                      </button>

                    </div>
                  )}


                {!subscriptionLoading &&
                  !subscriptionError &&
                  !subscription && (
                    <div
                      className={
                        styles.emptyState
                      }
                    >

                      <div
                        className={
                          styles.emptyStateIcon
                        }
                      >
                        <Icon
                          name="billing"
                          size={24}
                        />
                      </div>

                      <h3>
                        Subscription information
                      </h3>

                      <p>
                        No subscription record was
                        returned by the connected
                        billing service.
                      </p>

                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          navigate("/billing")
                        }
                      >
                        Open Billing
                        <Icon
                          name="arrow"
                          size={15}
                        />
                      </button>

                    </div>
                  )}

              </section>
            )}


            {/* =================================================
                INTEGRATIONS
            ================================================== */}

            {activeSection === "integrations" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      CONNECTIVITY
                    </span>

                    <h2>
                      Integrations
                    </h2>

                    <p>
                      Manage external services
                      connected to ZyrionOS.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.preferencePlaceholder
                  }
                >

                  <Icon
                    name="integrations"
                    size={22}
                  />

                  <div>
                    <h3>
                      Connected integrations
                    </h3>

                    <p>
                      Integration records will
                      appear here from the real
                      backend integration contract.
                    </p>
                  </div>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Backend controlled
                  </span>

                </div>

              </section>
            )}


            {/* =================================================
                PRIVACY
            ================================================== */}

            {activeSection === "privacy" && (
              <section
                className={styles.section}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      DATA
                    </span>

                    <h2>
                      Privacy & Data
                    </h2>

                    <p>
                      Review data-management and
                      privacy controls.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.privacyCard
                  }
                >

                  <div
                    className={
                      styles.privacyIcon
                    }
                  >
                    <Icon
                      name="privacy"
                      size={21}
                    />
                  </div>

                  <div>
                    <h3>
                      Data controls
                    </h3>

                    <p>
                      Data export, deletion and
                      privacy controls must remain
                      connected to authenticated
                      backend operations.
                    </p>
                  </div>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Secure by design
                  </span>

                </div>

              </section>
            )}


            {/* =================================================
                DANGER ZONE
            ================================================== */}

            {activeSection === "danger" && (
              <section
                className={`${styles.section} ${styles.dangerSection}`}
              >

                <div
                  className={styles.sectionHeader}
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrowDanger
                      }
                    >
                      ACCOUNT CONTROL
                    </span>

                    <h2>
                      Danger Zone
                    </h2>

                    <p>
                      Sensitive actions that can
                      affect your account or data.
                    </p>
                  </div>
                </div>


                <div
                  className={
                    styles.dangerCard
                  }
                >

                  <div
                    className={
                      styles.dangerIcon
                    }
                  >
                    <Icon
                      name="danger"
                      size={21}
                    />
                  </div>

                  <div
                    className={
                      styles.dangerCopy
                    }
                  >
                    <h3>
                      Destructive account actions
                    </h3>

                    <p>
                      Account deletion and other
                      irreversible operations will
                      only be enabled when the
                      corresponding protected
                      backend endpoint is available.
                    </p>
                  </div>

                  <span
                    className={
                      styles.dangerBadge
                    }
                  >
                    Protected
                  </span>

                </div>

              </section>
            )}

          </main>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Settings;
