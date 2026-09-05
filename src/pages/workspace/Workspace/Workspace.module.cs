/* =========================================================
   ZYRIONOS — ENTERPRISE AI WORKSPACE
   Workspace.module.css

   Architecture:
   ┌───────────────────────────────────────────────────────┐
   │ Project Explorer │ AI Build Workspace │ Intelligence │
   └───────────────────────────────────────────────────────┘

   Designed for:
   • AI SaaS Builder
   • AI Product Development
   • Project Generation
   • File Preview
   • Deployment
   • Future Versioning / Logs / Environments
   ========================================================= */


/* =========================================================
   DESIGN SYSTEM
   ========================================================= */

.page {
  /* ---------- Background ---------- */

  --ws-bg: #070b14;
  --ws-bg-soft: #0a101d;
  --ws-surface: #0d1422;
  --ws-surface-2: #111a2b;
  --ws-surface-3: #162136;

  /* ---------- Borders ---------- */

  --ws-border: rgba(148, 163, 184, 0.12);
  --ws-border-hover: rgba(129, 140, 248, 0.28);
  --ws-border-strong: rgba(148, 163, 184, 0.20);

  /* ---------- Text ---------- */

  --ws-text: #f8fafc;
  --ws-text-secondary: #c1c9d6;
  --ws-text-muted: #7d899c;
  --ws-text-dim: #566277;

  /* ---------- Primary ---------- */

  --ws-primary: #6366f1;
  --ws-primary-light: #818cf8;
  --ws-primary-dark: #4f46e5;
  --ws-primary-soft: rgba(99, 102, 241, 0.11);
  --ws-primary-glow: rgba(99, 102, 241, 0.22);

  /* ---------- Status ---------- */

  --ws-success: #22c55e;
  --ws-success-soft: rgba(34, 197, 94, 0.10);

  --ws-warning: #f59e0b;
  --ws-warning-soft: rgba(245, 158, 11, 0.10);

  --ws-danger: #ef4444;
  --ws-danger-soft: rgba(239, 68, 68, 0.10);

  --ws-info: #38bdf8;
  --ws-info-soft: rgba(56, 189, 248, 0.10);

  /* ---------- Radius ---------- */

  --ws-radius-sm: 8px;
  --ws-radius-md: 11px;
  --ws-radius-lg: 15px;
  --ws-radius-xl: 18px;

  /* ---------- Shadows ---------- */

  --ws-shadow-sm:
    0 4px 16px rgba(0, 0, 0, 0.18);

  --ws-shadow-md:
    0 10px 30px rgba(0, 0, 0, 0.25);

  --ws-shadow-lg:
    0 20px 60px rgba(0, 0, 0, 0.35);

  /* =======================================================
     PAGE
     ======================================================= */

  width: 100%;
  height: calc(100vh - 72px);

  min-height: 620px;

  padding: 18px;

  box-sizing: border-box;

  display: grid;

  /*
    Left  = Project Explorer
    Center = Main AI Workspace
    Right = Project Intelligence
  */

  grid-template-columns:
    minmax(210px, 0.78fr)
    minmax(500px, 2.35fr)
    minmax(270px, 0.92fr);

  gap: 14px;

  overflow: hidden;

  background:
    radial-gradient(
      circle at 75% 0%,
      rgba(99, 102, 241, 0.09),
      transparent 30%
    ),
    radial-gradient(
      circle at 0% 100%,
      rgba(56, 189, 248, 0.035),
      transparent 25%
    ),
    var(--ws-bg);

  color: var(--ws-text);

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}


/* =========================================================
   GLOBAL BOX SIZING
   ========================================================= */

.page *,
.page *::before,
.page *::after {
  box-sizing: border-box;
}


/* =========================================================
   PANELS
   ========================================================= */

.panel {
  position: relative;

  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background:
    linear-gradient(
      145deg,
      rgba(15, 23, 40, 0.98),
      rgba(9, 14, 26, 0.98)
    );

  border: 1px solid var(--ws-border);

  border-radius: var(--ws-radius-xl);

  box-shadow: var(--ws-shadow-md);

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.panel:hover {
  border-color:
    rgba(148, 163, 184, 0.16);
}


/* =========================================================
   PANEL HEADER
   ========================================================= */

.panelHeader {
  position: relative;

  flex-shrink: 0;

  min-height: 58px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 12px;

  padding: 13px 16px;

  background:
    linear-gradient(
      180deg,
      rgba(18, 27, 45, 0.96),
      rgba(13, 20, 34, 0.94)
    );

  border-bottom:
    1px solid var(--ws-border);
}

.panelHeader::after {
  content: "";

  position: absolute;

  left: 16px;
  right: 16px;
  bottom: -1px;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(99, 102, 241, 0.28),
      transparent
    );

  pointer-events: none;
}


.panelTitle {
  margin: 0;

  color: var(--ws-text);

  font-size: 13px;

  line-height: 1.4;

  font-weight: 750;

  letter-spacing: -0.01em;
}


/* =========================================================
   PROJECT HISTORY
   ========================================================= */

.history {
  flex: 1;

  min-height: 0;

  padding: 10px;

  overflow-y: auto;
  overflow-x: hidden;

  scrollbar-width: thin;

  scrollbar-color:
    #27334a
    transparent;
}


.historyItem {
  position: relative;

  width: 100%;

  margin-bottom: 6px;

  padding: 11px 12px;

  border:
    1px solid transparent;

  border-radius: 10px;

  color: var(--ws-text-secondary);

  background: transparent;

  font-size: 12px;

  line-height: 1.45;

  font-weight: 550;

  cursor: pointer;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}


.historyItem::before {
  content: "◈";

  display: inline-block;

  margin-right: 8px;

  color: var(--ws-text-dim);

  font-size: 9px;

  transition:
    color 160ms ease;
}


.historyItem:hover {
  color: var(--ws-text);

  background:
    rgba(99, 102, 241, 0.08);

  border-color:
    rgba(129, 140, 248, 0.20);

  transform: translateX(2px);
}


.historyItem:hover::before {
  color: var(--ws-primary-light);
}


.historyItem:active {
  transform: translateX(1px);
}


/* =========================================================
   ACTIVE PROJECT
   ========================================================= */

.activeProject {
  color: #ffffff;

  background:
    linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.17),
      rgba(79, 70, 229, 0.08)
    );

  border-color:
    rgba(129, 140, 248, 0.30);

  box-shadow:
    inset 3px 0 0 var(--ws-primary);
}


.activeProject::before {
  color: var(--ws-primary-light);
}


/* =========================================================
   CHAT / AI WORKSPACE
   ========================================================= */

.chatArea {
  flex: 1;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  overflow: hidden;
}


/* =========================================================
   MESSAGE AREA
   ========================================================= */

.messages {
  flex: 1;

  min-height: 0;

  padding: 22px;

  overflow-y: auto;
  overflow-x: hidden;

  display: flex;

  flex-direction: column;

  gap: 14px;

  scrollbar-width: thin;

  scrollbar-color:
    #27334a
    transparent;

  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(99, 102, 241, 0.045),
      transparent 35%
    ),
    linear-gradient(
      180deg,
      #0a101d 0%,
      #080d17 100%
    );
}


/* =========================================================
   MESSAGE
   ========================================================= */

.message {
  max-width: min(900px, 92%);

  padding: 14px 16px;

  border:
    1px solid var(--ws-border);

  border-radius: 14px;

  color: var(--ws-text-secondary);

  background:
    linear-gradient(
      145deg,
      rgba(18, 27, 45, 0.96),
      rgba(13, 20, 34, 0.96)
    );

  box-shadow:
    0 5px 18px rgba(0, 0, 0, 0.14);

  font-size: 13px;

  line-height: 1.7;

  white-space: pre-wrap;

  overflow-wrap: anywhere;
}


.message h3 {
  margin: 0 0 10px;

  color: var(--ws-text);

  font-size: 14px;

  font-weight: 750;
}


/* =========================================================
   AI MESSAGE
   ========================================================= */

.ai {
  align-self: flex-start;

  border-color:
    rgba(99, 102, 241, 0.16);

  background:
    linear-gradient(
      145deg,
      rgba(18, 27, 45, 0.98),
      rgba(11, 17, 30, 0.98)
    );
}


/* =========================================================
   USER MESSAGE SUPPORT
   ========================================================= */

.user {
  align-self: flex-end;

  max-width: min(760px, 85%);

  color: #ffffff;

  background:
    linear-gradient(
      135deg,
      var(--ws-primary),
      var(--ws-primary-dark)
    );

  border-color:
    rgba(129, 140, 248, 0.35);

  box-shadow:
    0 8px 24px rgba(79, 70, 229, 0.20);
}


/* =========================================================
   AI OUTPUT / CODE
   ========================================================= */

.message pre {
  max-width: 100%;

  margin: 0;

  padding: 14px;

  overflow: auto;

  color: #dbe4f0;

  background:
    #070b14;

  border:
    1px solid rgba(148, 163, 184, 0.12);

  border-radius: 10px;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;

  font-size: 11px;

  line-height: 1.65;
}


/* =========================================================
   INPUT AREA
   ========================================================= */

.inputArea {
  flex-shrink: 0;

  padding: 13px 15px;

  background:
    linear-gradient(
      180deg,
      rgba(13, 20, 34, 0.96),
      rgba(9, 14, 26, 0.99)
    );

  border-top:
    1px solid var(--ws-border);
}


/* =========================================================
   TEXTAREA
   ========================================================= */

.textarea {
  display: block;

  width: 100%;

  min-height: 94px;
  max-height: 260px;

  resize: vertical;

  padding: 13px 14px;

  color: var(--ws-text);

  background:
    #080e19;

  border:
    1px solid var(--ws-border-strong);

  border-radius: 12px;

  outline: none;

  font-family: inherit;

  font-size: 13px;

  line-height: 1.6;

  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}


.textarea::placeholder {
  color: var(--ws-text-dim);
}


.textarea:hover {
  border-color:
    rgba(148, 163, 184, 0.30);
}


.textarea:focus {
  border-color:
    rgba(129, 140, 248, 0.65);

  background:
    #090f1c;

  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.10),
    0 8px 25px rgba(0, 0, 0, 0.18);
}


/* =========================================================
   ACTIONS
   ========================================================= */

.actions {
  display: flex;

  align-items: center;

  justify-content: flex-end;

  gap: 9px;

  margin-top: 10px;
}


/* =========================================================
   GENERATE BUTTON
   ========================================================= */

.generateButton {
  min-height: 42px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding: 0 18px;

  border:
    1px solid rgba(129, 140, 248, 0.35);

  border-radius: 10px;

  color: #ffffff;

  background:
    linear-gradient(
      135deg,
      var(--ws-primary-light),
      var(--ws-primary-dark)
    );

  font-family: inherit;

  font-size: 12px;

  font-weight: 750;

  cursor: pointer;

  box-shadow:
    0 7px 20px rgba(79, 70, 229, 0.22);

  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease,
    opacity 160ms ease;
}


.generateButton:hover:not(:disabled) {
  transform: translateY(-1px);

  filter: brightness(1.07);

  box-shadow:
    0 10px 28px rgba(79, 70, 229, 0.30);
}


.generateButton:active:not(:disabled) {
  transform: translateY(0);
}


.generateButton:disabled {
  opacity: 0.55;

  cursor: not-allowed;

  box-shadow: none;
}


/* =========================================================
   RIGHT INTELLIGENCE SIDEBAR
   ========================================================= */

.sidebar {
  flex: 1;

  min-height: 0;

  padding: 11px;

  overflow-y: auto;
  overflow-x: hidden;

  display: flex;

  flex-direction: column;

  gap: 10px;

  scrollbar-width: thin;

  scrollbar-color:
    #27334a
    transparent;
}


/* =========================================================
   CARDS
   ========================================================= */

.card {
  position: relative;

  flex-shrink: 0;

  padding: 14px;

  border:
    1px solid var(--ws-border);

  border-radius: 13px;

  background:
    linear-gradient(
      145deg,
      rgba(18, 27, 45, 0.90),
      rgba(11, 17, 30, 0.94)
    );

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.12);

  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}


.card:hover {
  border-color:
    rgba(148, 163, 184, 0.20);

  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.18);
}


/* =========================================================
   CARD TITLE
   ========================================================= */

.cardTitle {
  margin-bottom: 10px;

  color: var(--ws-text-muted);

  font-size: 10px;

  line-height: 1.4;

  font-weight: 750;

  text-transform: uppercase;

  letter-spacing: 0.075em;
}


/* =========================================================
   CARD TEXT
   ========================================================= */

.cardText {
  color: var(--ws-text-secondary);

  font-size: 12px;

  line-height: 1.6;

  overflow-wrap: anywhere;
}


/* =========================================================
   FILE EXPLORER
   ========================================================= */

.fileList {
  max-height: 210px;

  overflow-y: auto;

  overflow-x: hidden;

  scrollbar-width: thin;

  scrollbar-color:
    #27334a
    transparent;
}


.fileItem {
  position: relative;

  display: flex;

  align-items: center;

  min-height: 36px;

  margin-bottom: 5px;

  padding: 8px 10px;

  border:
    1px solid transparent;

  border-radius: 8px;

  color: #b8c2d1;

  background:
    rgba(23, 32, 51, 0.65);

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;

  font-size: 10px;

  cursor: pointer;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  transition:
    color 150ms ease,
    background 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}


.fileItem::before {
  content: "▸";

  flex-shrink: 0;

  margin-right: 8px;

  color: var(--ws-primary-light);
}


.fileItem:hover {
  color: #ffffff;

  background:
    rgba(99, 102, 241, 0.10);

  border-color:
    rgba(129, 140, 248, 0.25);

  transform: translateX(1px);
}


/* =========================================================
   PREVIEW BOX
   ========================================================= */

.previewBox {
  overflow: hidden;

  border:
    1px solid var(--ws-border);

  border-radius: 12px;

  background:
    #080e19;
}


.previewHeader {
  min-height: 42px;

  display: flex;

  align-items: center;

  padding: 0 12px;

  color: var(--ws-text);

  background:
    #101827;

  border-bottom:
    1px solid var(--ws-border);

  font-size: 11px;

  font-weight: 700;
}


.previewContent {
  max-height: 280px;

  overflow: auto;

  padding: 13px;

  color: #b8c2d1;

  background:
    #080e19;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;

  font-size: 10px;

  line-height: 1.7;

  white-space: pre-wrap;

  overflow-wrap: anywhere;

  scrollbar-width: thin;

  scrollbar-color:
    #27334a
    transparent;
}


/* =========================================================
   DEPLOYMENT STATUS
   ========================================================= */

.statusReady,
.statusPending,
.statusFailed {
  display: inline-flex;

  align-items: center;

  min-height: 28px;

  padding: 5px 10px;

  border-radius: 999px;

  font-size: 10px;

  line-height: 1.2;

  font-weight: 750;
}


.statusReady {
  color: #4ade80;

  background:
    var(--ws-success-soft);

  border:
    1px solid rgba(34, 197, 94, 0.20);
}


.statusReady::before {
  content: "";

  width: 6px;
  height: 6px;

  margin-right: 7px;

  border-radius: 50%;

  background:
    var(--ws-success);

  box-shadow:
    0 0 0 3px rgba(34, 197, 94, 0.08),
    0 0 12px rgba(34, 197, 94, 0.35);
}


.statusPending {
  color: #fbbf24;

  background:
    var(--ws-warning-soft);

  border:
    1px solid rgba(245, 158, 11, 0.20);
}


.statusPending::before {
  content: "";

  width: 6px;
  height: 6px;

  margin-right: 7px;

  border-radius: 50%;

  background:
    var(--ws-warning);
}


.statusFailed {
  color: #f87171;

  background:
    var(--ws-danger-soft);

  border:
    1px solid rgba(239, 68, 68, 0.20);
}


.statusFailed::before {
  content: "";

  width: 6px;
  height: 6px;

  margin-right: 7px;

  border-radius: 50%;

  background:
    var(--ws-danger);
}


/* =========================================================
   LIVE URL
   ========================================================= */

.liveUrl {
  min-height: 38px;

  display: flex;

  align-items: center;

  padding: 8px 10px;

  color: #a5b4fc;

  background:
    rgba(99, 102, 241, 0.08);

  border:
    1px solid rgba(129, 140, 248, 0.20);

  border-radius: 8px;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;

  font-size: 10px;

  line-height: 1.5;

  overflow-wrap: anywhere;
}


/* =========================================================
   DEPLOY BUTTON
   ========================================================= */

.deployButton {
  width: 100%;

  min-height: 43px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding: 0 15px;

  border:
    1px solid rgba(34, 197, 94, 0.25);

  border-radius: 10px;

  color: #ffffff;

  background:
    linear-gradient(
      135deg,
      #16a34a,
      #15803d
    );

  font-family: inherit;

  font-size: 12px;

  font-weight: 750;

  cursor: pointer;

  box-shadow:
    0 7px 20px rgba(22, 163, 74, 0.18);

  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease,
    opacity 160ms ease;
}


.deployButton:hover:not(:disabled) {
  transform: translateY(-1px);

  filter: brightness(1.06);

  box-shadow:
    0 10px 26px rgba(22, 163, 74, 0.25);
}


.deployButton:active:not(:disabled) {
  transform: translateY(0);
}


.deployButton:disabled {
  opacity: 0.55;

  cursor: not-allowed;

  box-shadow: none;
}


/* =========================================================
   PREVIEW / DOWNLOAD BUTTONS
   ========================================================= */

.previewButton,
.downloadButton {
  width: 100%;

  min-height: 40px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding: 0 14px;

  border:
    1px solid var(--ws-border);

  border-radius: 9px;

  color: var(--ws-text-secondary);

  background:
    rgba(23, 32, 51, 0.75);

  font-family: inherit;

  font-size: 11px;

  font-weight: 650;

  cursor: pointer;

  transition:
    color 150ms ease,
    background 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}


.previewButton:hover,
.downloadButton:hover {
  color: #ffffff;

  background:
    rgba(99, 102, 241, 0.10);

  border-color:
    rgba(129, 140, 248, 0.25);

  transform: translateY(-1px);
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

.emptyState {
  min-height: 100px;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20px;

  text-align: center;

  color: var(--ws-text-dim);

  font-size: 11px;

  line-height: 1.6;
}


/* =========================================================
   LOADING
   ========================================================= */

.loadingText {
  display: flex;

  align-items: center;

  justify-content: center;

  min-height: 44px;

  padding: 10px;

  color: var(--ws-primary-light);

  font-size: 11px;

  font-weight: 650;
}


/* =========================================================
   FOCUS / ACCESSIBILITY
   ========================================================= */

.historyItem:focus-visible,
.fileItem:focus-visible,
.generateButton:focus-visible,
.deployButton:focus-visible,
.previewButton:focus-visible,
.downloadButton:focus-visible,
.textarea:focus-visible {
  outline:
    2px solid rgba(129, 140, 248, 0.60);

  outline-offset: 2px;
}


/* =========================================================
   SELECTION
   ========================================================= */

.page ::selection {
  color: #ffffff;

  background:
    rgba(99, 102, 241, 0.38);
}


/* =========================================================
   SCROLLBARS
   ========================================================= */

.page ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}


.page ::-webkit-scrollbar-track {
  background: transparent;
}


.page ::-webkit-scrollbar-thumb {
  background:
    #27334a;

  border-radius: 999px;
}


.page ::-webkit-scrollbar-thumb:hover {
  background:
    #36435e;
}


/* =========================================================
   LARGE DESKTOP
   ========================================================= */

@media (max-width: 1350px) {

  .page {
    grid-template-columns:
      minmax(195px, 0.72fr)
      minmax(450px, 2.15fr)
      minmax(255px, 0.88fr);

    gap: 12px;

    padding: 14px;
  }

  .messages {
    padding: 18px;
  }
}


/* =========================================================
   TABLET
   ========================================================= */

@media (max-width: 1120px) {

  .page {
    grid-template-columns:
      200px
      minmax(0, 1fr);

    height: auto;

    min-height: calc(100vh - 72px);

    overflow: visible;
  }

  .page > .panel:last-child {
    grid-column: 1 / -1;

    min-height: 330px;
  }

  .page > .panel:last-child .sidebar {
    display: grid;

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    align-items: start;
  }
}


/* =========================================================
   SMALL TABLET
   ========================================================= */

@media (max-width: 820px) {

  .page {
    grid-template-columns:
      180px
      minmax(0, 1fr);

    padding: 10px;
  }

  .panel {
    border-radius: 14px;
  }

  .messages {
    padding: 15px;
  }

  .message {
    max-width: 95%;
  }

  .page > .panel:last-child .sidebar {
    grid-template-columns:
      1fr;
  }
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 680px) {

  .page {
    display: flex;

    flex-direction: column;

    height: auto;

    min-height: calc(100vh - 72px);

    padding: 8px;

    gap: 9px;

    overflow: visible;
  }


  /* Project explorer */

  .page > .panel:first-child {
    min-height: 0;

    max-height: 180px;
  }


  .page > .panel:first-child .history {
    max-height: 115px;
  }


  /* Main workspace */

  .page > .panel:nth-child(2) {
    min-height: 570px;

    height: 72vh;

    max-height: 850px;
  }


  /* Intelligence */

  .page > .panel:last-child {
    min-height: 0;
  }


  .page > .panel:last-child .sidebar {
    display: flex;
  }


  .panelHeader {
    min-height: 52px;

    padding: 12px 14px;
  }


  .panelTitle {
    font-size: 12px;
  }


  .messages {
    padding: 13px;
  }


  .message {
    max-width: 97%;

    padding: 12px 13px;

    font-size: 12px;

    line-height: 1.6;
  }


  .inputArea {
    padding: 10px;
  }


  .textarea {
    min-height: 90px;

    font-size: 12px;
  }


  .actions {
    justify-content: stretch;
  }


  .generateButton {
    width: 100%;
  }
}


/* =========================================================
   SMALL PHONE
   ========================================================= */

@media (max-width: 420px) {

  .page {
    padding: 6px;

    gap: 7px;
  }


  .panel {
    border-radius: 12px;
  }


  .page > .panel:nth-child(2) {
    min-height: 530px;

    height: 75vh;
  }


  .panelHeader {
    min-height: 48px;

    padding:
      10px 12px;
  }


  .messages {
    padding: 11px;
  }


  .message {
    padding: 11px;

    font-size: 11px;
  }


  .textarea {
    min-height: 82px;

    padding: 11px;

    font-size: 11px;
  }


  .generateButton,
  .deployButton,
  .previewButton,
  .downloadButton {
    min-height: 40px;

    font-size: 11px;
  }


  .card {
    padding: 12px;
  }
}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {

  .page *,
  .page *::before,
  .page *::after {
    scroll-behavior: auto !important;

    transition: none !important;

    animation: none !important;
  }
}
