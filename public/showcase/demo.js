(() => {
  "use strict";
  const art = {
    coffee: '<svg viewBox="0 0 140 90" aria-hidden="true"><path d="M40 35h53v32a14 14 0 0 1-14 14H54a14 14 0 0 1-14-14z" fill="#fffdf7" stroke="#17402d" stroke-width="3"/><path d="M93 41h12c20 0 17 27-12 27M53 25c-12-12 12-10 0-23M69 25c-12-12 12-10 0-23M85 25c-12-12 12-10 0-23" fill="none" stroke="#17402d" stroke-width="3"/></svg>',
    craft: '<svg viewBox="0 0 140 90" aria-hidden="true"><path d="m51 59 8 27h23l8-27z" fill="#c4552d" stroke="#17402d" stroke-width="3"/><path d="M70 61V27M70 48 48 33M70 49l22-20" stroke="#17402d" stroke-width="3"/><g fill="#fff3b0" stroke="#17402d" stroke-width="2"><circle cx="47" cy="27" r="13"/><circle cx="73" cy="18" r="14"/><circle cx="96" cy="26" r="12"/></g><g fill="#c4552d"><circle cx="47" cy="27" r="4"/><circle cx="73" cy="18" r="5"/><circle cx="96" cy="26" r="4"/></g></svg>',
    food: '<svg viewBox="0 0 140 90" aria-hidden="true"><path d="M21 72C9 23 103 4 119 50c10 25-74 43-98 22Z" fill="#d5a769" stroke="#17402d" stroke-width="3"/><path d="m45 38 11 18M65 29l13 20M87 25l12 18" stroke="#fff3b0" stroke-width="7" stroke-linecap="round"/></svg>',
  };
  const businesses = [
    {id:"coffee",name:"קפה בפינה",category:"coffee",type:"עגלת קפה",location:"ליד גן השכונה",detail:"אספרסו, מאפה טרי ושיחה קטנה בתחילת היום.",open:true,hours:"א׳–ה׳ · 07:00–14:00",color:"#f1dfba",x:49,y:32},
    {id:"flowers",name:"פרח בשכונה",category:"craft",type:"פרחים ויצירה",location:"רחוב היוצרים",detail:"זרים קטנים, כלים בעבודת יד וצבע לשולחן.",open:true,hours:"א׳–ה׳ · 09:00–18:00",color:"#dce5d1",x:76,y:51},
    {id:"bakery",name:"מהתנור של נועה",category:"food",type:"מאפים ביתיים",location:"ליד הכיכר",detail:"לחמי מחמצת ועוגות של סוף שבוע, באיסוף מתואם.",open:false,hours:"ו׳ · 08:00–13:00",color:"#f0d9cd",x:40,y:73},
  ];
  let category="all", previousFocus;
  const search=document.querySelector("#search"), onlyOpen=document.querySelector("#open-only"), dialog=document.querySelector("#details"), content=document.querySelector("#dialog-content"), closeButton=document.querySelector("#close-dialog");
  // Only the fixed fictional catalog supplies HTML; search input is never interpolated.
  function show(html){previousFocus=document.activeElement;content.innerHTML=html;dialog.showModal();closeButton.focus();}
  function showBusiness(id){const b=businesses.find(item=>item.id===id);if(!b)return;show(`<p class="badge">עסק בדיוני · הדגמה בלבד</p><h2 id="dialog-title">${b.name}</h2><div class="card-picture" style="--color:${b.color}">${art[b.category]}</div><p>${b.detail}</p><p><strong>${b.type}</strong> · ${b.location}</p><p class="schedule"><strong>שעות בתרחיש ההדגמה</strong><br>${b.hours}</p><p>הפרטים והמיקום נוצרו לצורך תיק העבודות. אין כאן עסק אמיתי או אפשרות להזמין ולשלם.</p>`);}
  // Derive map pins and cards from one filtered catalog so both views stay aligned.
  function render(){
    const q=search.value.trim().toLocaleLowerCase("he-IL");
    const selected=businesses.filter(b=>(category==="all"||b.category===category)&&(!onlyOpen.checked||b.open)&&`${b.name} ${b.type} ${b.location} ${b.detail}`.toLocaleLowerCase("he-IL").includes(q));
    document.querySelector("#result-count").textContent=`${selected.length} עסקים בתרחיש ההדגמה`;document.querySelector("#empty").hidden=selected.length>0;
    document.querySelector("#cards").innerHTML=selected.map(b=>`<article class="business"><div class="card-picture" style="--color:${b.color}">${art[b.category]}</div><div class="card-body"><div class="card-title"><h3>${b.name}</h3><span class="status ${b.open?"":"closed"}">${b.open?"פתוח":"סגור"}</span></div><p>${b.type} · ${b.location}</p><button type="button" data-business="${b.id}">לכרטיס העסק ←</button></div></article>`).join("");
    document.querySelector("#pins").innerHTML=selected.map(b=>`<button type="button" class="pin" style="left:${b.x}%;top:${b.y}%" data-business="${b.id}" aria-label="פתיחת ${b.name}">${b.name}</button>`).join("");
  }
  document.querySelectorAll("[data-category]").forEach(button=>button.addEventListener("click",()=>{category=button.dataset.category;document.querySelectorAll("[data-category]").forEach(item=>{const selected=item===button;item.classList.toggle("selected",selected);item.setAttribute("aria-pressed",String(selected));});render();}));
  document.querySelector(".demo-grid").addEventListener("click",event=>{const button=event.target.closest("[data-business]");if(button)showBusiness(button.dataset.business);});
  search.addEventListener("input",render);onlyOpen.addEventListener("change",render);closeButton.addEventListener("click",()=>dialog.close());dialog.addEventListener("close",()=>{if(previousFocus?.isConnected)previousFocus.focus();});
  document.querySelector("#workspace-button").addEventListener("click",()=>show('<p class="badge">תצוגת בעל עסק · נתונים בדיוניים</p><h2 id="dialog-title">העסק שלי, במבט אחד.</h2><p><strong>קפה בפינה</strong><br>פרופיל מאושר · תקופת הדגמה פעילה</p><div class="schedule"><strong>שלמות הפרופיל — 5 מתוך 6</strong><ul><li>פרטי העסק ✓</li><li>מיקום ✓</li><li>תמונה ראשית ✓</li><li>תיאור ✓</li><li>פרטי קשר ✓</li><li>שעות פעילות — להשלמה</li></ul></div><p>במוצר המקורי, אזור הבעלים מנהל פרטים, תמונות, לוח זמנים ותקופת פרסום. השלמת הפרופיל אינה מחליפה אישור מנהל או תקופת פרסום בתוקף.</p>'));
  render();
})();
