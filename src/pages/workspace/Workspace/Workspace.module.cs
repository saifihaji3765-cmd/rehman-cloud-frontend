/* =========================
   PAGE
========================= */

.page{

  height:calc(100vh - 72px);

  display:grid;

  grid-template-columns:
  280px
  1fr
  320px;

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

  padding:12px;

  border-radius:12px;

  background:#0f172a;

  color:#cbd5e1;

  cursor:pointer;

}

/* =========================
   CHAT
========================= */

.chatArea{

  display:flex;

  flex-direction:column;

  height:100%;

}

.messages{

  flex:1;

  padding:20px;

  overflow:auto;

}

.message{

  max-width:700px;

  padding:16px;

  border-radius:14px;

  margin-bottom:16px;

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

  border-top:1px solid #1f2937;

  padding:16px;

}

.textarea{

  width:100%;

  min-height:120px;

  resize:none;

  border:none;

  outline:none;

  padding:16px;

  border-radius:14px;

  background:#0f172a;

  color:#ffffff;

}

.sendButton{

  margin-top:12px;

  height:48px;

  padding:0 20px;

  border:none;

  border-radius:12px;

  background:#6366f1;

  color:#ffffff;

  cursor:pointer;

}

/* =========================
   TOOLS
========================= */

.tools{

  padding:16px;

  display:flex;

  flex-direction:column;

  gap:12px;

}

.toolCard{

  padding:16px;

  border-radius:12px;

  background:#0f172a;

  color:#cbd5e1;

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
