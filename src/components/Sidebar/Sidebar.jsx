import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

import navigation from "../../config/navigation";

import {
  APP_NAME,
  APP_TAGLINE,
} from "../../config/constants";

/* =========================================================
   ICONS
   Self-contained SVG icons.
   No external icon dependency required.
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
  };

  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    workspace: (
      <>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h4l2 2h5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        <path d="M4 10h16" />
      </>
    ),

    deployment: (
      <>
        <path d="M12 3v13" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 21h14" />
        <path d="M7 17h10" />
      </>
    ),

    billing: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),

    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.67 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.24v2.4h-.24A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),

    server: (
      <>
        <rect x="4" y="4" width="16" height="6" rx="1.5" />
        <rect x="4" y="14" width="16" height="6" rx="1.5" />
        <path d="M8 7h.01" />
        <path d="M8 17h.01" />
        <path d="M12 7h5" />
        <path d="M12 17h5" />
      </>
    ),

    ai: (
      <>
        <path d="M12 3 13.7 8.3 19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
      </>
    ),

    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
      </>
    ),

    api: (
      <>
        <path d="M8 4 3 12l5 8" />
        <path d="m16 4 5 8-5 8" />
        <path d="m14 3-4 18" />
      </>
    ),

    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </>
    ),

    security: (
      <>
        <path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    analytics: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),

    default: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2" />
      </>
    ),
  };

  return <svg {...common}>{icons[name] || icons.default}</svg>;
}

/* =========================================================
   ICON RESOLVER
========================================================= */

function resolveIcon(item) {
  const value = `${item?.id || ""} ${item?.label || ""}`.toLowerCase();

  if (value.includes("dashboard")) return "dashboard";
  if (value.includes("workspace")) return "workspace";
  if (value.includes("deploy")) return "deployment";
  if (value.includes("billing")) return "billing";
  if (value.includes("setting")) return "settings";
  if (value.includes("security")) return "security";
  if (value.includes("database") || value.includes("data")) return "database";
  if (value.includes("api")) return "api";
  if (value.includes("ai")) return "ai";
  if (value.includes("compute") || value.includes("server")) return "server";
  if (value.includes("monitor")) return "monitor";
  if (value.includes("analytic")) return "analytics";

  return "default";
}

/* =========================================================
   NAVIGATION GROUPING
   Uses real navigation configuration.
   No hard-coded fake menu records.
========================================================= */

function getSectionName(item) {
  if (item?.section) return item.section;

  if (item?.group) return item.group;

  return "Platform";
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  /* -------------------------------------------------------
     Restore sidebar preference
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
      // Storage can be unavailable in restricted environments.
    }
  }, []);

  /* -------------------------------------------------------
     Persist sidebar preference
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
     Keyboard shortcut:
     Ctrl/Cmd + B
  ------------------------------------------------------- */

  useEffect(() => {
    const handleKeyboard = (event) => {
      const isModifier = event.ctrlKey || event.metaKey;

      if (isModifier && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  /* -------------------------------------------------------
     Normalize navigation safely.
  ------------------------------------------------------- */

  const navigationItems = useMemo(() => {
    if (!Array.isArray(navigation)) {
      return [];
    }

    return navigation.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.path &&
        item.label
    );
  }, []);

  /* -------------------------------------------------------
     Group navigation without inventing data.
  ------------------------------------------------------- */

  const sections = useMemo(() => {
    const grouped = new Map();

    navigationItems.forEach((item) => {
      const section = getSectionName(item);

      if (!grouped.has(section)) {
        grouped.set(section, []);
      }

      grouped.get(section).push(item);
    });

    return Array.from(grouped.entries());
  }, [navigationItems]);

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed ? styles.collapsed : ""
      }`}
      aria-label="ZyrionOS navigation"
    >
      {/* ===================================================
          BRAND
      =================================================== */}

      <div className={styles.brandArea}>
        <NavLink
          to="/dashboard"
          className={styles.brand}
          aria-label={APP_NAME}
          title={collapsed ? APP_NAME : undefined}
        >
          <div className={styles.brandMark}>
            <span />
            <span />
            <span />
          </div>

          {!collapsed && (
            <div className={styles.brandText}>
              <div className={styles.logo}>
                {APP_NAME}
              </div>

              <div className={styles.tagline}>
                {APP_TAGLINE}
              </div>
            </div>
          )}
        </NavLink>

        {/* =================================================
            COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          className={styles.collapseButton}
          onClick={() => setCollapsed((current) => !current)}
          aria-label={
            collapsed
              ? "Expand navigation"
              : "Collapse navigation"
          }
          title={
            collapsed
              ? "Expand navigation"
              : "Collapse navigation"
          }
        >
          <span
            className={`${styles.chevron} ${
              collapsed ? styles.chevronCollapsed : ""
            }`}
          >
            ‹
          </span>
        </button>
      </div>

      {/* ===================================================
          WORKSPACE CONTEXT
      =================================================== */}

      {!collapsed && (
        <div className={styles.workspaceContext}>
          <div className={styles.contextIcon}>
            <Icon name="workspace" size={15} />
          </div>

          <div className={styles.contextContent}>
            <span className={styles.contextLabel}>
              CURRENT WORKSPACE
            </span>

            <span className={styles.contextValue}>
              Workspace
            </span>
          </div>
        </div>
      )}

      {/* ===================================================
          NAVIGATION
      =================================================== */}

      <nav className={styles.navigation}>
        {sections.map(([sectionName, items]) => (
          <div
            className={styles.navigationSection}
            key={sectionName}
          >
            {!collapsed && (
              <div className={styles.sectionLabel}>
                {sectionName}
              </div>
            )}

            <div className={styles.navigationItems}>
              {items.map((item) => {
                const iconName = resolveIcon(item);

                return (
                  <NavLink
                    key={item.id || item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    className={({ isActive }) =>
                      `${styles.link} ${
                        isActive ? styles.active : ""
                      }`
                    }
                    title={
                      collapsed
                        ? item.label
                        : undefined
                    }
                  >
                    <span className={styles.linkIcon}>
                      <Icon
                        name={iconName}
                        size={18}
                      />
                    </span>

                    {!collapsed && (
                      <>
                        <span className={styles.linkLabel}>
                          {item.label}
                        </span>

                        {item.badge && (
                          <span className={styles.badge}>
                            {item.badge}
                          </span>
                        )}

                        <span
                          className={styles.activeIndicator}
                        />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ===================================================
          SYSTEM AREA
          No fake status/data.
      =================================================== */}

      <div className={styles.bottomArea}>
        {!collapsed && (
          <div className={styles.systemCard}>
            <div className={styles.systemHeader}>
              <span className={styles.systemDot} />

              <span>
                ZyrionOS Platform
              </span>
            </div>

            <div className={styles.systemDescription}>
              Manage infrastructure, AI services,
              deployments and workspace operations.
            </div>
          </div>
        )}

        <div className={styles.sidebarFooter}>
          {!collapsed ? (
            <div className={styles.footerMeta}>
              <span>
                {APP_NAME}
              </span>

              <span>
                Workspace
              </span>
            </div>
          ) : (
            <div className={styles.footerCollapsed}>
              <Icon name="security" size={16} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
