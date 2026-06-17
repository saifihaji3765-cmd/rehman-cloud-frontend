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
   ACTION
========================= */

.createButton{

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
   STATS
========================= */

.statsGrid{

  display:grid;

  grid-template-columns:
  repeat(4,1fr);

  gap:20px;

}

.statCard{

  background:#111827;

  border:1px solid #1f2937;

  border-radius:16px;

  padding:20px;

}

.statLabel{

  color:#94a3b8;

  font-size:14px;

}

.statValue{

  color:#ffffff;

  font-size:32px;

  font-weight:800;

  margin-top:10px;

}

/* =========================
   SECTION
========================= */

.section{

  background:#111827;

  border:1px solid #1f2937;

  border-radius:16px;

  padding:24px;

}

.sectionTitle{

  color:#ffffff;

  font-size:20px;

  font-weight:700;

  margin-bottom:12px;

}

.sectionText{

  color:#94a3b8;

  line-height:1.7;

}

/* =========================
   RESPONSIVE
========================= */

@media(max-width:1200px){

  .statsGrid{

    grid-template-columns:
    repeat(2,1fr);

  }

}

@media(max-width:768px){

  .statsGrid{

    grid-template-columns:1fr;

  }

  .header{

    flex-direction:column;

    align-items:flex-start;

    gap:16px;

  }

}
