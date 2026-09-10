import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

import navigation from "../../config/navigation";

import {
  APP_NAME,
  APP_TAGLINE,
} from "../../config/constants";


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
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );

    case "workspace":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h4l2 2h5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M4 10h16" />
        </svg>
      );

    case "deployment":
      return (
        <svg {...common}>
          <path d="M12 3v13" />
          <path d="m7 8 5-5 5 5" />
          <path d="M5 21h14" />
          <path d="M7 17h10" />
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

    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.67 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.24v2.4h-.24A1.7 1.7 0 0 0 19.4 15Z" />
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
   SIDEBAR
========================================================= */

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* -------------------------------------------------------
     RESTORE DESKTOP SIDEBAR PREFERENCE
  ------------------------------------------------------- */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "zyrionos.sidebar.collapsed"
      );

      if (saved === "true") {
        setCollapsed(true);
      }
    } catch {
      // Storage may be unavailable.
    }
  }, []);


  /* -------------------------------------------------------
     PERSIST DESKTOP SIDEBAR PREFERENCE
  ------------------------------------------------------- */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "zyrionos.sidebar.collapsed",
        String(collapsed)
      );
    } catch {
      // Ignore storage failures.
    }
  }, [collapsed]);


  /* -------------------------------------------------------
     KEYBOARD SHORTCUTS
     Ctrl/Cmd + B → Toggle sidebar
     Escape       → Close mobile sidebar
  ------------------------------------------------------- */

  useEffect(() => {
    const handleKeyboard = (event) => {
      const modifier = event.ctrlKey || event.metaKey;

      if (
        modifier &&
        event.key.toLowerCase() === "b"
      ) {
        event.preventDefault();

        if (window.innerWidth > 768) {
          setCollapsed((current) => !current);
        }
      }

      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, []);


  /* -------------------------------------------------------
     LOCK BODY SCROLL WHEN MOBILE DRAWER IS OPEN
  ------------------------------------------------------- */

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);


  /* -------------------------------------------------------
     NORMALIZE NAVIGATION
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     GROUP NAVIGATION
  ------------------------------------------------------- */

  const sections = useMemo(() => {
    const groups = new Map();

    navigationItems.forEach((item) => {
      const section =
        item.section || "Platform";

      if (!groups.has(section)) {
        groups.set(section, []);
      }

      groups.get(section).push(item);
    });

    return Array.from(groups.entries());
  }, [navigationItems]);


  /* -------------------------------------------------------
     CLOSE MOBILE DRAWER AFTER NAVIGATION
  ------------------------------------------------------- */

  const handleNavigation = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  };


  return (
    <>
      {/* ===================================================
          MOBILE NAVIGATION TRIGGER
      ==================================================== */}

      <button
        type="button"
        className={styles.mobileMenuButton}
        onClick={() =>
          setMobileOpen((current) => !current)
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
          mobileOpen ? styles.mobileBackdropVisible : ""
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
            BRAND HEADER
        ================================================== */}

        <div className={styles.header}>

          <NavLink
            to="/dashboard"
            className={styles.brand}
            onClick={handleNavigation}
            aria-label={APP_NAME}
          >

            <span className={styles.brandMark}>
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


          {/* DESKTOP COLLAPSE */}

          <button
            type="button"
            className={styles.collapseButton}
            onClick={() =>
              setCollapsed((current) => !current)
            }
            aria-label={
              collapsed
                ? "Expand navigation"
                : "Collapse navigation"
            }
            aria-pressed={collapsed}
            title={
              collapsed
                ? "Expand navigation"
                : "Collapse navigation"
            }
          >

            <span
              className={
                collapsed
                  ? styles.chevronCollapsed
                  : styles.chevron
              }
            >
              ‹
            </span>

          </button>


          {/* MOBILE CLOSE */}

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

        <div className={styles.workspaceContext}>

          <div className={styles.workspaceIcon}>
            <Icon
              name="workspace"
              size={16}
            />
          </div>

          {!collapsed && (
            <div className={styles.workspaceContent}>

              <span className={styles.eyebrow}>
                WORKSPACE
              </span>

              <span className={styles.workspaceValue}>
                Current workspace
              </span>

            </div>
          )}

        </div>


        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav
          className={styles.navigation}
          aria-label="Application"
        >

          {sections.map(
            ([sectionName, items]) => (
              <section
                key={sectionName}
                className={styles.navigationSection}
              >

                {!collapsed && (
                  <div
                    className={styles.sectionLabel}
                  >
                    {sectionName}
                  </div>
                )}

                <div
                  className={styles.navigationItems}
                >

                  {items.map((item) => (
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
                        handleNavigation
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
                    >

                      <span
                        className={
                          styles.navIcon
                        }
                      >
                        <Icon
                          name={item.icon}
                          size={18}
                        />
                      </span>

                      {!collapsed && (
                        <span
                          className={
                            styles.navLabel
                          }
                        >
                          {item.label}
                        </span>
                      )}

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
                  ))}

                </div>

              </section>
            )
          )}

        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================== */}

        <div className={styles.bottomArea}>

          {!collapsed && (
            <div
              className={styles.platformCard}
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
                Your application workspace
                for building and operating
                projects.
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
