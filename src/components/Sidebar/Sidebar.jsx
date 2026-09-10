import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

import navigation from "../../config/navigation";
import { APP_NAME, APP_TAGLINE } from "../../config/constants";

/* =========================================================
   ENTERPRISE ICON SYSTEM
   No external icon dependency required.
========================================================= */

function Icon({ name, size = 19 }) {
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

  switch (String(name || "").toLowerCase()) {
    /* -----------------------------------------------------
       DASHBOARD / HOME
    ----------------------------------------------------- */
    case "dashboard":
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 10.5 12 3l8.5 7.5" />
          <path d="M5.5 9.5V20h13V9.5" />
          <path d="M9.5 20v-6h5v6" />
        </svg>
      );

    /* -----------------------------------------------------
       WORKSPACE
    ----------------------------------------------------- */
    case "workspace":
    case "projects":
    case "project":
      return (
        <svg {...common}>
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6A2.5 2.5 0 0 1 20.5 9.5v8A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5z" />
          <path d="M3.5 10h17" />
          <path d="M8 14h4" />
        </svg>
      );

    /* -----------------------------------------------------
       DEPLOYMENTS
    ----------------------------------------------------- */
    case "deployment":
    case "deployments":
    case "deploy":
      return (
        <svg {...common}>
          <path d="M12 15V3" />
          <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
          <path d="M5 15.5h14" />
          <path d="M4 20.5h16" />
          <path d="M8 15.5v2.5" />
          <path d="M16 15.5v2.5" />
        </svg>
      );

    /* -----------------------------------------------------
       AI TOOLS
    ----------------------------------------------------- */
    case "ai":
    case "ai-tools":
    case "sparkles":
      return (
        <svg {...common}>
          <path d="m12 3 1.25 4.25L17.5 9 13.25 10.25 12 14.5l-1.25-4.25L6.5 9l4.25-1.75z" />
          <path d="m19 14 .65 2.35L22 17l-2.35.65L19 20l-.65-2.35L16 17l2.35-.65z" />
          <path d="m5 14 .5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5z" />
        </svg>
      );

    /* -----------------------------------------------------
       TEMPLATES
    ----------------------------------------------------- */
    case "template":
    case "templates":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );

    /* -----------------------------------------------------
       BILLING
    ----------------------------------------------------- */
    case "billing":
    case "payment":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 10h18" />
          <path d="M7 15h3.5" />
          <path d="M16 15h1" />
        </svg>
      );

    /* -----------------------------------------------------
       SETTINGS
    ----------------------------------------------------- */
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .35 1.95l.05.05-1.8 1.8-.05-.05a1.8 1.8 0 0 0-1.95-.35 1.8 1.8 0 0 0-1.1 1.65v.15h-2.55v-.15a1.8 1.8 0 0 0-1.1-1.65 1.8 1.8 0 0 0-1.95.35l-.05.05-1.8-1.8.05-.05A1.8 1.8 0 0 0 7.85 15a1.8 1.8 0 0 0-1.65-1.1h-.15v-2.55h.15a1.8 1.8 0 0 0 1.65-1.1 1.8 1.8 0 0 0-.35-1.95L7.45 8.25l1.8-1.8.05.05a1.8 1.8 0 0 0 1.95.35 1.8 1.8 0 0 0 1.1-1.65v-.15h2.55v.15a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.95-.35l.05-.05 1.8 1.8-.05.05A1.8 1.8 0 0 0 19.4 10a1.8 1.8 0 0 0 1.65 1.1h.15v2.55h-.15A1.8 1.8 0 0 0 19.4 15Z" />
        </svg>
      );

    /* -----------------------------------------------------
       ANALYTICS
    ----------------------------------------------------- */
    case "analytics":
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19.5V12" />
          <path d="M10 19.5V7" />
          <path d="M16 19.5V10" />
          <path d="M22 19.5V4.5" />
          <path d="M3 19.5h20" />
        </svg>
      );

    /* -----------------------------------------------------
       TERMINAL / DEVELOPER
    ----------------------------------------------------- */
    case "terminal":
    case "code":
      return (
        <svg {...common}>
          <path d="m8 7-5 5 5 5" />
          <path d="m16 7 5 5-5 5" />
          <path d="m14 4-4 16" />
        </svg>
      );

    /* -----------------------------------------------------
       CLOUD
    ----------------------------------------------------- */
    case "cloud":
      return (
        <svg {...common}>
          <path d="M7 18.5h10a4 4 0 0 0 .45-7.97A6 6 0 0 0 6 11.5h1a3.5 3.5 0 0 0 0 7Z" />
        </svg>
      );

    /* -----------------------------------------------------
       FOLDER
    ----------------------------------------------------- */
    case "folder":
      return (
        <svg {...common}>
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z" />
          <path d="M3.5 10h17" />
        </svg>
      );

    /* -----------------------------------------------------
       SECURITY
    ----------------------------------------------------- */
    case "security":
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3.5 19 6v5.5c0 4.25-2.75 7.55-7 9-4.25-1.45-7-4.75-7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    /* -----------------------------------------------------
       USERS / TEAM
    ----------------------------------------------------- */
    case "users":
    case "team":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.4-3 2.25-5 5.5-5s5.1 2 5.5 5" />
          <path d="M16 6.5a2.7 2.7 0 0 1 0 5.2" />
          <path d="M16.5 14c2.2.35 3.45 1.95 4 4" />
        </svg>
      );

    /* -----------------------------------------------------
       HELP
    ----------------------------------------------------- */
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.35 2.35 0 1 1 3.9 1.75c-.95.75-1.7 1.15-1.7 2.5" />
          <path d="M12 16.8h.01" />
        </svg>
      );

    /* -----------------------------------------------------
       DEFAULT
    ----------------------------------------------------- */
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* =======================================================
     RESTORE SIDEBAR STATE
  ======================================================= */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "zyrionos.sidebar.collapsed"
      );

      if (saved === "true") {
        setCollapsed(true);
      }
    } catch {
      // Storage can be unavailable.
    }
  }, []);

  /* =======================================================
     PERSIST SIDEBAR STATE
  ======================================================= */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "zyrionos.sidebar.collapsed",
        String(collapsed)
      );
    } catch {
      // Ignore persistence failures.
    }
  }, [collapsed]);

  /* =======================================================
     KEYBOARD CONTROLS
     
     Ctrl/Cmd + B = desktop collapse
     Escape        = mobile close
  ======================================================= */

  useEffect(() => {
    const handleKeyboard = (event) => {
      const modifier = event.ctrlKey || event.metaKey;

      if (
        modifier &&
        event.key.toLowerCase() === "b"
      ) {
        event.preventDefault();

        if (window.innerWidth > 768) {
          setCollapsed((value) => !value);
        }
      }

      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, []);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  /* =======================================================
     NORMALIZE NAVIGATION CONFIG
  ======================================================= */

  const navigationItems = useMemo(() => {
    if (!Array.isArray(navigation)) {
      return [];
    }

    return navigation.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.path === "string" &&
        typeof item.label === "string"
    );
  }, []);

  /* =======================================================
     GROUP NAVIGATION
  ======================================================= */

  const sections = useMemo(() => {
    const groups = new Map();

    navigationItems.forEach((item) => {
      const section =
        typeof item.section === "string" &&
        item.section.trim()
          ? item.section
          : "Platform";

      if (!groups.has(section)) {
        groups.set(section, []);
      }

      groups.get(section).push(item);
    });

    return Array.from(groups.entries());
  }, [navigationItems]);

  /* =======================================================
     MOBILE NAVIGATION CLOSE
  ======================================================= */

  const closeMobileNavigation = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  };

  /* =======================================================
     TOGGLE COLLAPSE
  ======================================================= */

  const toggleCollapsed = () => {
    setCollapsed((value) => !value);
  };

  /* =======================================================
     BRAND
  ======================================================= */

  return (
    <>
      {/* ===================================================
          MOBILE MENU BUTTON
      ==================================================== */}

      <button
        type="button"
        className={styles.mobileMenuButton}
        onClick={() =>
          setMobileOpen((value) => !value)
        }
        aria-label={
          mobileOpen
            ? "Close navigation"
            : "Open navigation"
        }
        aria-expanded={mobileOpen}
        aria-controls="zyrionos-navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {/* ===================================================
          MOBILE BACKDROP
      ==================================================== */}

      <button
        type="button"
        className={`${styles.mobileBackdrop} ${
          mobileOpen
            ? styles.mobileBackdropVisible
            : ""
        }`}
        onClick={() => setMobileOpen(false)}
        aria-label="Close navigation"
        tabIndex={mobileOpen ? 0 : -1}
      />

      {/* ===================================================
          SIDEBAR
      ==================================================== */}

      <aside
        id="zyrionos-navigation"
        className={`${styles.sidebar} ${
          collapsed ? styles.collapsed : ""
        } ${
          mobileOpen ? styles.mobileOpen : ""
        }`}
        aria-label="ZyrionOS primary navigation"
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div className={styles.header}>
          <NavLink
            to="/dashboard"
            className={styles.brand}
            onClick={closeMobileNavigation}
            aria-label={`${APP_NAME} dashboard`}
          >
            <span
              className={styles.brandMark}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>

            <span className={styles.brandContent}>
              <span className={styles.brandName}>
                {APP_NAME}
              </span>

              <span className={styles.brandTagline}>
                {APP_TAGLINE}
              </span>
            </span>
          </NavLink>

          {/* Desktop collapse button */}

          <button
            type="button"
            className={styles.collapseButton}
            onClick={toggleCollapsed}
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-pressed={collapsed}
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            <span
              className={
                collapsed
                  ? styles.chevronCollapsed
                  : styles.chevron
              }
              aria-hidden="true"
            >
              ‹
            </span>
          </button>

          {/* Mobile close button */}

          <button
            type="button"
            className={styles.mobileCloseButton}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        {/* =================================================
            WORKSPACE CONTEXT
        ================================================== */}

        <div
          className={styles.workspaceContext}
          title={
            collapsed
              ? "Workspace"
              : undefined
          }
        >
          <span
            className={styles.workspaceIcon}
            aria-hidden="true"
          >
            <Icon
              name="workspace"
              size={18}
            />
          </span>

          {!collapsed && (
            <span
              className={styles.workspaceContent}
            >
              <span className={styles.eyebrow}>
                WORKSPACE
              </span>

              <span
                className={styles.workspaceValue}
              >
                Workspace
              </span>
            </span>
          )}
        </div>

        {/* =================================================
            PRIMARY NAVIGATION
        ================================================== */}

        <nav
          className={styles.navigation}
          aria-label="Application navigation"
        >
          {sections.map(
            ([sectionName, items]) => (
              <section
                key={sectionName}
                className={
                  styles.navigationSection
                }
              >
                {!collapsed && (
                  <div
                    className={
                      styles.sectionLabel
                    }
                  >
                    {sectionName}
                  </div>
                )}

                <div
                  className={
                    styles.navigationItems
                  }
                >
                  {items.map((item) => {
                    const iconName =
                      item.icon ||
                      item.id ||
                      "dashboard";

                    return (
                      <NavLink
                        key={
                          item.id ||
                          item.path
                        }
                        to={item.path}
                        end={
                          item.path ===
                          "/dashboard"
                        }
                        onClick={
                          closeMobileNavigation
                        }
                        className={({
                          isActive,
                        }) =>
                          `${styles.navItem} ${
                            isActive
                              ? styles.active
                              : ""
                          }`
                        }
                        title={
                          collapsed
                            ? item.label
                            : undefined
                        }
                        aria-label={
                          collapsed
                            ? item.label
                            : undefined
                        }
                      >
                        <span
                          className={
                            styles.navIcon
                          }
                        >
                          <Icon
                            name={iconName}
                            size={19}
                          />
                        </span>

                        <span
                          className={
                            styles.navLabel
                          }
                        >
                          {item.label}
                        </span>

                        {item.badge &&
                          !collapsed && (
                            <span
                              className={
                                styles.navBadge
                              }
                            >
                              {item.badge}
                            </span>
                          )}

                        <span
                          className={
                            styles.activeIndicator
                          }
                          aria-hidden="true"
                        />
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </nav>

        {/* =================================================
            BOTTOM AREA
        ================================================== */}

        <div className={styles.bottomArea}>
          {!collapsed && (
            <div
              className={
                styles.platformCard
              }
            >
              <div
                className={
                  styles.platformHeader
                }
              >
                <span
                  className={
                    styles.platformIndicator
                  }
                  aria-hidden="true"
                />

                <span>
                  ZyrionOS Platform
                </span>
              </div>

              <p
                className={
                  styles.platformDescription
                }
              >
                Build, manage and operate
                your applications from one
                workspace.
              </p>
            </div>
          )}

          <div
            className={styles.sidebarMeta}
          >
            {!collapsed ? (
              <>
                <span>
                  {APP_NAME}
                </span>

                <span
                  className={
                    styles.metaSeparator
                  }
                  aria-hidden="true"
                >
                  /
                </span>

                <span>
                  Platform
                </span>
              </>
            ) : (
              <span
                className={
                  styles.collapsedMeta
                }
                aria-hidden="true"
              >
                Z
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
