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
