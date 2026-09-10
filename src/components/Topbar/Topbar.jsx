import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import styles from "./Topbar.module.css";

import { APP_NAME } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";


/* =========================================================
   ICON SYSTEM
   Self-contained SVG.
   No external dependency.
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

    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),

    chevronDown: (
      <path d="m6 9 6 6 6-6" />
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />

        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L7 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5.7v-2.4H6a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L7 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5.6h2.4V6a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L20 8.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.7.8Z" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
      </>
    ),

    workspace: (
      <>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h4l2 2h5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        <path d="M4 10h16" />
      </>
    ),

    credits: (
      <>
        <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
      </>
    ),

  };

  return (
    <svg {...common}>
      {icons[name]}
    </svg>
  );
}


/* =========================================================
   TOPBAR
========================================================= */

function Topbar() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);


  /* =======================================================
     AUTHENTICATED USER
  ======================================================= */

  const displayName =
    user?.name ||
    user?.displayName ||
    user?.email ||
    "Account";

  const email =
    user?.email || "";


  /* =======================================================
     AVATAR INITIALS
  ======================================================= */

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

    return source
      .slice(0, 2)
      .toUpperCase();

  }, [user]);


  /* =======================================================
     REAL USER DATA ONLY
  ======================================================= */

  const credits = user?.credits;

  /*
   * Platform status is shown only when supplied by the
   * authenticated/user/application state.
   *
   * We deliberately do NOT invent "Operational".
   */

  const platformStatus =
    user?.platformStatus ||
    user?.systemStatus ||
    null;


  /* =======================================================
     GLOBAL SEARCH SHORTCUT
     Ctrl + K / Cmd + K
  ======================================================= */

  useEffect(() => {

    const handleKeyboard = (event) => {

      const modifier =
        event.ctrlKey ||
        event.metaKey;

      if (
        modifier &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        searchRef.current?.focus();

      }

      if (event.key === "Escape") {

        setProfileOpen(false);

        setSearchFocused(false);

        searchRef.current?.blur();

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


  /* =======================================================
     OUTSIDE PROFILE CLICK
  ======================================================= */

  useEffect(() => {

    const handleOutsideClick = (event) => {

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {

        setProfileOpen(false);

      }

    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);


  /* =======================================================
     SEARCH SUBMIT
  ======================================================= */

  const handleSearchSubmit = (event) => {

    event.preventDefault();

    const query =
      search.trim();

    if (!query) {

      searchRef.current?.focus();

      return;

    }

    /*
     * Global search service is not yet connected.
     *
     * We intentionally do not fabricate a route,
     * API call, or search result.
     */

    searchRef.current?.blur();

  };


  /* =======================================================
     SETTINGS
  ======================================================= */

  const openSettings = () => {

    setProfileOpen(false);

    navigate("/settings");

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <header
      className={styles.topbar}
      aria-label={`${APP_NAME} application header`}
    >

      {/* ===================================================
          LEFT
      =================================================== */}

      <div className={styles.leftSection}>

        <NavLink
          to="/workspace"
          className={styles.workspaceLink}
          aria-label={`${APP_NAME} workspace`}
        >

          <span
            className={styles.workspaceMark}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>

          <span className={styles.workspaceIdentity}>

            <span className={styles.productName}>
              {APP_NAME}
            </span>

            <span className={styles.workspaceLabel}>
              Workspace
            </span>

          </span>

          <Icon
            name="chevronDown"
            size={16}
          />

        </NavLink>

      </div>


      {/* ===================================================
          CENTER — GLOBAL SEARCH
      =================================================== */}

      <div
        className={`
          ${styles.centerSection}
          ${searchFocused ? styles.searchActive : ""}
        `}
      >

        <form
          className={styles.searchForm}
          onSubmit={handleSearchSubmit}
          role="search"
        >

          <span
            className={styles.searchIcon}
            aria-hidden="true"
          >
            <Icon
              name="search"
              size={18}
            />
          </span>


          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onFocus={() =>
              setSearchFocused(true)
            }
            onBlur={() =>
              setSearchFocused(false)
            }
            placeholder="Search projects, deployments, services..."
            aria-label="Global search"
            autoComplete="off"
            spellCheck="false"
          />


          <button
            type="button"
            className={styles.commandShortcut}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              searchRef.current?.focus()
            }
            aria-label="Focus global search"
            title="Focus search"
          >
            <span>⌘</span>
            <span>K</span>
          </button>

        </form>

      </div>


      {/* ===================================================
          RIGHT
      =================================================== */}

      <div className={styles.rightSection}>

        {/* -----------------------------------------------
            PLATFORM STATUS
        ----------------------------------------------- */}

        {platformStatus && (

          <div
            className={styles.systemStatus}
            title="Platform status"
          >

            <span
              className={styles.statusIndicator}
              aria-hidden="true"
            >
              <span />
            </span>

            <span>
              {platformStatus}
            </span>

          </div>

        )}


        {/* -----------------------------------------------
            AI CREDITS
        ----------------------------------------------- */}

        {credits !== undefined &&
          credits !== null && (

            <div
              className={styles.credits}
              title="Available AI credits"
            >

              <span
                className={styles.creditsIcon}
                aria-hidden="true"
              >
                <Icon
                  name="credits"
                  size={15}
                />
              </span>

              <span className={styles.creditsValue}>
                {Number(credits).toLocaleString()}
              </span>

              <span className={styles.creditsLabel}>
                AI
              </span>

            </div>

          )}


        {/* -----------------------------------------------
            PROFILE
        ----------------------------------------------- */}

        <div
          className={styles.profileContainer}
          ref={profileRef}
        >

          <button
            type="button"
            className={styles.profileButton}
            onClick={() =>
              setProfileOpen(
                (value) => !value
              )
            }
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="Open account menu"
          >

            <span
              className={styles.avatar}
              aria-hidden="true"
            >
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

            <span
              className={`
                ${styles.profileChevron}
                ${profileOpen ? styles.profileChevronOpen : ""}
              `}
            >
              <Icon
                name="chevronDown"
                size={15}
              />
            </span>

          </button>


          {/* ---------------------------------------------
              ACCOUNT MENU
          --------------------------------------------- */}

          {profileOpen && (

            <div
              className={styles.profileMenu}
              role="menu"
              aria-label="Account menu"
            >

              <div className={styles.profileMenuHeader}>

                <span
                  className={styles.menuAvatar}
                  aria-hidden="true"
                >
                  {initials}
                </span>

                <div className={styles.menuIdentity}>

                  <strong>
                    {displayName}
                  </strong>

                  {email && (
                    <span>
                      {email}
                    </span>
                  )}

                </div>

              </div>


              <div
                className={styles.menuDivider}
                role="separator"
              />


              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={openSettings}
              >

                <Icon
                  name="settings"
                  size={17}
                />

                <span>
                  Settings
                </span>

              </button>

            </div>

          )}

        </div>

      </div>

    </header>

  );
}

export default Topbar;
