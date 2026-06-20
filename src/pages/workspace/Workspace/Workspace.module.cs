/* =========================
   PAGE
========================= */

.page{

  height:calc(100vh - 72px);

  display:grid;

  grid-template-columns:
  280px
  1fr
  340px;

  gap:20px;

}

/* =========================
   PANEL
========================= */

.panel{

  background:#111827;

  border:1px solid #1f2937;

  border-radius:18px;

  overflow:hidden;

}

/* =========================
   HEADER
========================= */

.panelHeader{

  height:60px;

  display:flex;

  align-items:center;

  padding:0 20px;

  border-bottom:1px solid #1f2937;

}

.panelTitle{

  color:#ffffff;

  font-size:16px;

  font-weight:700;

}

/* =========================
   HISTORY
========================= */

.history{

  padding:16px;

  display:flex;

  flex-direction:column;

  gap:12px;

}

.historyItem{

  background:#0f172a;

  border:1px solid #1e293b;

  padding:14px;

  border-radius:12px;

  color:#cbd5e1;

  cursor:pointer;

}

/* =========================
   CHAT
========================= */

.chatArea{

  height:100%;

  display:flex;

  flex-direction:column;

}

.messages{

  flex:1;

  overflow:auto;

  padding:24px;

}

.message{

  max-width:850px;

  padding:18px;

  border-radius:16px;

  margin-bottom:18px;

  line-height:1.8;

}

.user{

  background:#6366f1;

  color:#ffffff;

  margin-left:auto;

}

.ai{

  background:#1e293b;

  color:#ffffff;

}

/* =========================
   INPUT
========================= */

.inputArea{

  padding:20px;

  border-top:1px solid #1f2937;

}

.textarea{

  width:100%;

  min-height:120px;

  background:#0f172a;

  border:1px solid #1f2937;

  border-radius:14px;

  color:#ffffff;

  padding:16px;

  resize:none;

  outline:none;

}

.actions{

  display:flex;

  justify-content:flex-end;

  gap:12px;

  margin-top:12px;

}

.generateButton{

  height:48px;

  padding:0 20px;

  border:none;

  border-radius:12px;

  cursor:pointer;

  background:#6366f1;

  color:#ffffff;

  font-weight:600;

}

/* =========================
   RIGHT SIDEBAR
========================= */

.sidebar{

  padding:16px;

  display:flex;

  flex-direction:column;

  gap:16px;

}

.card{

  background:#0f172a;

  border:1px solid #1f2937;

  border-radius:14px;

  padding:16px;

}

.cardTitle{

  color:#ffffff;

  font-weight:700;

  margin-bottom:10px;

}

.cardText{

  color:#94a3b8;

  line-height:1.7;

}

/* =========================
   RESPONSIVE
========================= */

@media(max-width:1200px){

  .page{

    grid-template-columns:
    240px
    1fr;

  }

}

@media(max-width:900px){

  .page{

    grid-template-columns:1fr;

  }

}
/* =========================
   FILE EXPLORER
========================= */

.fileList{

  display:flex;

  flex-direction:column;

  gap:10px;

}

.fileItem{

  padding:12px;

  border-radius:10px;

  background:#111827;

  border:1px solid #1f2937;

  color:#cbd5e1;

}

/* =========================
   DEPLOY BUTTON
========================= */

.deployButton{

  width:100%;

  height:48px;

  border:none;

  border-radius:12px;

  background:#22c55e;

  color:#ffffff;

  font-weight:700;

  cursor:pointer;

}

.deployButton:hover{

  opacity:0.9;

}

/* =========================
   LIVE URL
========================= */

.liveUrl{

  color:#60a5fa;

  word-break:break-all;

}

/* =========================
   STATUS
========================= */

.statusReady{

  color:#22c55e;

  font-weight:700;

}

.statusPending{

  color:#f59e0b;

  font-weight:700;

}
/* =========================
   ACTIVE PROJECT
========================= */

.activeProject{

  border:1px solid #6366f1;

  background:#1e1b4b;

}

/* =========================
   EMPTY STATE
========================= */

.emptyState{

  display:flex;

  align-items:center;

  justify-content:center;

  padding:24px;

  text-align:center;

  color:#64748b;

  font-size:14px;

}

/* =========================
   LOADING
========================= */

.loadingText{

  color:#f8fafc;

  font-size:14px;

  text-align:center;

  padding:12px;

}

/* =========================
   PREVIEW
========================= */

.previewBox{

  background:#0b1220;

  border:1px solid #1f2937;

  border-radius:14px;

  overflow:hidden;

}

.previewHeader{

  padding:14px;

  border-bottom:1px solid #1f2937;

  background:#111827;

  color:#ffffff;

  font-weight:700;

}

.previewContent{

  max-height:320px;

  overflow:auto;

  padding:16px;

  color:#cbd5e1;

  font-size:13px;

  line-height:1.8;

  white-space:pre-wrap;

  word-break:break-word;

}

/* =========================
   STATUS
========================= */

.statusFailed{

  color:#ef4444;

  font-weight:700;

}

/* =========================
   DISABLED
========================= */

.generateButton:disabled{

  opacity:0.6;

  cursor:not-allowed;

}

.deployButton:disabled{

  opacity:0.6;

  cursor:not-allowed;

}

/* =========================
   HOVER
========================= */

.historyItem{

  transition:all .2s ease;

}

.historyItem:hover{

  border-color:#334155;

}

/* =========================
   FILE ITEM
========================= */

.fileItem{

  transition:all .2s ease;

}

.fileItem:hover{

  border-color:#6366f1;

  cursor:pointer;

}

/* =========================
   SCROLLBAR
========================= */

.previewContent::-webkit-scrollbar{

  width:8px;

}

.previewContent::-webkit-scrollbar-thumb{

  background:#374151;

  border-radius:999px;

}

/* =========================
   MOBILE
========================= */

@media(max-width:900px){

  .previewContent{

    max-height:220px;

  }

}
.activeProject{

  border:1px solid #6366f1;

  background:#1e1b4b;

}

.previewButton{

  width:100%;
  height:48px;

  border:none;

  border-radius:12px;

  cursor:pointer;

}

.downloadButton{

  width:100%;
  height:48px;

  border:none;

  border-radius:12px;

  cursor:pointer;

}
