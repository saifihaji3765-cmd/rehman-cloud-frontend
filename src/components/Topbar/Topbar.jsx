import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Topbar.module.css";

import { APP_NAME } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";

function Topbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  /*
   * Real authenticated user information.
   * No fallback identity is invented.
   */
  const displayName =
    user?.name ||
    user?.displayName ||
    user?.email ||
    "Account";

  const email = user?.email || "";

  const initials = useMemo(() => {
    const source =
      user?.name ||
      user?.displayName ||
      user?.email ||
      APP_NAME ||
      "Z";

    const parts = source
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }, [user]);

  const credits = user?.credits;

  /*
   * Keyboard shortcut:
   * Ctrl + K / Cmd + K focuses global search.
   */
  useEffect(() => {
    const handleKeyboard = (event) => {
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        setProfileOpen(false);
        setSearchFocused(false);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  /*
   * Close profile menu when clicking outside.
   */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      searchRef.current?.focus();
      return;
    }

    /*
     * Search backend is intentionally not fabricated here.
     * Keep the query available for the future global-search service.
     */
    console.info("ZyrionOS global search:", query);
  };

  const openSettings = () => {
    setProfileOpen(false);
    navigate("/settings");
  };

  const handleNotifications = () => {
    /*
     * Notification backend/UI is not fabricated.
     * This control remains ready for the real notification system.
     */
    console.info("ZyrionOS notifications requested");
  };

  return (
    <header className={styles.topbar}>
      {/* =====================================================
          LEFT — PRODUCT / WORKSPACE
      ====================================================== */}

      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.workspaceButton}
          aria-label={`${APP_NAME} workspace`}
          title={`${APP_NAME} Workspace`}
        >
          <span className={styles.workspaceMark}>
            <span className={styles.workspaceMarkInner} />
          </span>

          <span className={styles.workspaceIdentity}>
            <span className={styles.productName}>
              {APP_NAME}
            </span>

            <span className={styles.workspaceLabel}>
              Workspace
            </span>
          </span>

          <svg
            className={styles.chevron}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              d="m5 7 5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* =====================================================
          CENTER — GLOBAL SEARCH
      ====================================================== */}

      <div
        className={`${styles.centerSection} ${
          searchFocused ? styles.searchActive : ""
        }`}
      >
        <form
          className={styles.searchForm}
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <span className={styles.searchIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle
                cx="11"
                cy="11"
                r="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m16 16 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search projects, deployments, services..."
            aria-label="Global search"
            autoComplete="off"
          />

          <button
            type="button"
            className={styles.commandShortcut}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => searchRef.current?.focus()}
            aria-label="Focus search"
          >
            <span>⌘</span>
            <span>K</span>
          </button>
        </form>
      </div>

      {/* =====================================================
          RIGHT — PLATFORM CONTROLS
      ====================================================== */}

      <div className={styles.rightSection}>
        {/* SYSTEM STATUS */}

        <div
          className={styles.systemStatus}
          title="Platform system status"
        >
          <span className={styles.statusIndicator}>
            <span className={styles.statusPulse} />
          </span>

          <span className={styles.statusText}>
            Operational
          </span>
        </div>

        {/* AI CREDITS */}

        {credits !== undefined && credits !== null && (
          <div
            className={styles.credits}
            title="Available AI credits"
          >
            <span className={styles.creditsIcon}>
              ✦
            </span>

            <span className={styles.creditsValue}>
              {Number(credits).toLocaleString()}
            </span>

            <span className={styles.creditsLabel}>
              AI
            </span>
          </div>
        )}

        {/* NOTIFICATIONS */}

        <button
          type="button"
          className={styles.iconButton}
          onClick={handleNotifications}
          aria-label="Notifications"
          title="Notifications"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M10 21h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* DIVIDER */}

        <span className={styles.divider} />

        {/* ACCOUNT */}

        <div
          className={styles.profileContainer}
          ref={profileRef}
        >
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className={styles.avatar}>
              {initials}
            </span>

            <span className={styles.profileText}>
              <span className={styles.profileName}>
                {displayName}
              </span>

              {email && (
                <span className={styles.profileEmail}>
                  {email}
                </span>
              )}
            </span>

            <svg
              className={`${styles.profileChevron} ${
                profileOpen ? styles.profileChevronOpen : ""
              }`}
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="m5 7 5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* ACCOUNT MENU */}

          {profileOpen && (
            <div
              className={styles.profileMenu}
              role="menu"
            >
              <div className={styles.profileMenuHeader}>
                <span className={styles.menuAvatar}>
                  {initials}
                </span>

                <div>
                  <strong>{displayName}</strong>

                  {email && (
                    <span>{email}</span>
                  )}
                </div>
              </div>

              <div className={styles.menuDivider} />

              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={openSettings}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />

                  <path
                    d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1A2 2 0 1 1 3 15l.1-.1A2 2 0 0 0 1.7 11.5h-.2a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 4.1L3 4A2 2 0 1 1 5.8 1.2l.1.1A2 2 0 0 0 9.3 0h.2a2 2 0 0 1 4 0h.2a2 2 0 0 0 3.4 1.3l.1-.1A2 2 0 1 1 20 4l-.1.1a2 2 0 0 0 1.4 3.4h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.9 3.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
