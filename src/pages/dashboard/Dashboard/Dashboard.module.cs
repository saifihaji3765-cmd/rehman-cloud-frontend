.page{

  display:flex;

  flex-direction:column;

  gap:24px;

}

.header{

  display:flex;

  justify-content:space-between;

  align-items:center;

}

.title{

  color:#ffffff;

  font-size:34px;

  font-weight:800;

}

.subtitle{

  color:#94a3b8;

  margin-top:6px;

}

.createButton{

  height:48px;

  padding:0 20px;

  border:none;

  border-radius:12px;

  background:#6366f1;

  color:#ffffff;

  font-weight:600;

  cursor:pointer;

}

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

  padding:22px;

}

.statLabel{

  color:#94a3b8;

  font-size:14px;

}

.statValue{

  color:#ffffff;

  font-size:30px;

  font-weight:800;

  margin-top:10px;

}

.contentGrid{

  display:grid;

  grid-template-columns:
  2fr 1fr;

  gap:20px;

}

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

  margin-bottom:16px;

}

.activityItem{

  padding:14px 0;

  border-bottom:1px solid #1f2937;

  color:#cbd5e1;

}

.activityItem:last-child{

  border-bottom:none;

}

@media(max-width:1200px){

  .statsGrid{

    grid-template-columns:
    repeat(2,1fr);

  }

  .contentGrid{

    grid-template-columns:1fr;

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
