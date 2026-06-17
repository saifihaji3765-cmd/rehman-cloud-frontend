/* =========================
   PAGE
========================= */

.page{

  display:flex;

  flex-direction:column;

  gap:24px;

}

/* =========================
   HEADER
========================= */

.header{

  display:flex;

  justify-content:space-between;

  align-items:center;

}

.title{

  color:#ffffff;

  font-size:32px;

  font-weight:800;

}

.subtitle{

  color:#94a3b8;

  margin-top:6px;

}

/* =========================
   SAVE BUTTON
========================= */

.saveButton{

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
   GRID
========================= */

.grid{

  display:grid;

  grid-template-columns:
  repeat(2,1fr);

  gap:20px;

}

/* =========================
   CARD
========================= */

.card{

  background:#111827;

  border:1px solid #1f2937;

  border-radius:16px;

  padding:24px;

}

.cardTitle{

  color:#ffffff;

  font-size:18px;

  font-weight:700;

  margin-bottom:18px;

}

/* =========================
   ROW
========================= */

.row{

  display:flex;

  justify-content:space-between;

  align-items:center;

  padding:14px 0;

  border-bottom:1px solid #1f2937;

}

.row:last-child{

  border-bottom:none;

}

.label{

  color:#cbd5e1;

}

.value{

  color:#94a3b8;

}

/* =========================
   RESPONSIVE
========================= */

@media(max-width:992px){

  .grid{

    grid-template-columns:1fr;

  }

}

@media(max-width:768px){

  .header{

    flex-direction:column;

    align-items:flex-start;

    gap:16px;

  }

}
