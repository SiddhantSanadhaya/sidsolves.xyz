/* ============================================================
   Launch boundary — the finished vehicle clearing the nine
   governance stations on its way to production.

   Four pre-flight stations, bolted to the body, release together
   at ignition. Mission control is the one station that can say go.
   Four flight stations arm at T+0 and stay armed straight through
   the production boundary — governance doesn't end at launch, it
   rides along.

   Same dark-bay treatment and plate-label technique as the build
   assembly canvas next to it, so the two read as one deck. The
   display face is reserved for the one big status line; everything
   else — station names, taglines, telemetry — stays mono, the way
   the rest of the site keeps a display/mono split.

   Ported from the launch-pad canvas I engineered at StatusNeo for
   the Agent OS product page — same nine stations, same boundary
   line, recolored and relaid out for a single self-playing panel.
   ============================================================ */
(function(){

  var GOLD  = "20,184,166";  /* teal — matches the site's --signal accent: cleared, governed, active */
  var AMBER = "194,118,10"; /* matches the site's --pulse accent: pending, counting down, mechanical heat */
  var RED   = "229,72,77";   /* held / not cleared */
  var MONO = "'IBM Plex Mono', ui-monospace, monospace";
  var DISPLAY = "'Bricolage Grotesque', Helvetica, Arial, sans-serif";

  var PRE = [
    { name: "Agent Marketplace",           job: "No unvetted part gets in" },
    { name: "Agent Runtime",               job: "No standing privilege" },
    { name: "Agent Compliance",            job: "No untested policy ships" },
    { name: "Agent Control Specification", job: "No verdict, no passage" }
  ];
  var MC = { name: "Agent OS", job: "The only station that can say go" };
  var FLT = [
    { name: "Agent Hypervisor", job: "No action goes unrecorded" },
    { name: "Agent Mesh",       job: "No anonymous agent-to-agent call" },
    { name: "Agent SRE",        job: "No agent runs without a stop button" },
    { name: "Agent Lightning",  job: "No learning its way off course" }
  ];

  window.initLaunchBoundary = function initLaunchBoundary(){
    var cv = document.getElementById("launchCv");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    var W = 1120, H = 780;
    var CX = 560;
    var BASE = 690;                       /* the deck */
    var BW2 = 27, BODY = 140, NOSE = 40;  /* the already-built vehicle */
    var VTIP0 = BASE - BODY - NOSE;       /* nose tip, grounded */
    var BND = 130;                        /* the production boundary */
    var ORBIT_Y = BND - 24;               /* nose tip, on station */
    var CORX0 = CX - 92, CORX1 = CX + 92; /* the ascent corridor */
    var GATEY = VTIP0 - 42;               /* mission control's hold bar */

    var NP = PRE.length, NF = FLT.length;
    function ladder(n, lo, hi){ var a = [], i; for (i=0;i<n;i++) a.push(Math.round(lo + i*(hi-lo)/((n-1)||1))); return a; }
    var PREY = ladder(NP, VTIP0 + 44, BASE - 26);
    var FLTY = ladder(NF, GATEY - 40, BND + 52);

    /* ---------- the countdown, each beat stated as an offset from the one before ---------- */
    var P0 = 0.5, PSTEP = 0.6;
    var HOLD_AT = P0 + NP*PSTEP + 0.35;
    var M0 = HOLD_AT + 0.3, MSTEP = 0.5;
    var GOT  = M0 + 3*MSTEP;
    var LIFT = GOT + 0.55;
    var ADUR = 4.8, APO = LIFT + ADUR, ORB1 = APO + 2.6, LOOP = ORB1 + 1.2;

    function ez_io(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2; }
    function ez_out(x){ return 1 - Math.pow(1 - x, 3); }
    function cl(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }

    function stateAt(t){
      var s = {}, i;
      s.pollA = []; for (i=0;i<NP;i++) s.pollA.push(ez_out(cl((t - (P0 + i*PSTEP)) / 0.4)));
      s.poll = 0; for (i=0;i<NP;i++) if (s.pollA[i] > 0.5) s.poll = i+1;
      s.held = t >= HOLD_AT && t < GOT;
      s.cd = (t >= M0 && t < GOT) ? Math.max(1, 3 - Math.floor((t-M0)/MSTEP)) : -1;
      s.go = t >= GOT;
      s.open = s.go ? ez_io(Math.min(1, (t-GOT)/0.5)) : 0;
      s.ign  = s.go ? Math.min(1, (t-GOT)/0.6) : 0;
      var p = t < LIFT ? 0 : Math.min(1, (t-LIFT)/ADUR);
      var e = p < 0.86 ? Math.pow(p/0.86, 1.8)*0.94 : 0.94 + 0.06*(1 - Math.pow(1-(p-0.86)/0.14, 2));
      s.tip = VTIP0 - (VTIP0 - ORBIT_Y)*e;
      s.flown = s.tip < VTIP0 - 2;
      s.fltA = []; for (i=0;i<NF;i++) s.fltA.push(ez_out(cl((FLTY[i] - s.tip)/24)));
      s.crossed = s.tip <= BND;
      s.orbit = t >= APO ? Math.min(1, (t-APO)/0.6) : 0;
      s.burn = s.ign * (1 - s.orbit);
      s.shake = (t >= GOT && t < LIFT) ? ((t-GOT)/(LIFT-GOT))*1.6 : 0;
      s.fade = t > ORB1 ? Math.max(0, 1 - (t-ORB1)/0.9) : 1;
      return s;
    }

    /* ---------- drawing helpers ---------- */
    function bloom(c, blur, fn){ if (blur < 0.6){ fn(); return; } ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = blur; fn(); ctx.restore(); }
    function lab(t, x, y, c, align, sz, w, ls, font){
      ctx.font = (w||"600") + " " + (sz||9) + "px " + (font||MONO);
      if (ls && "letterSpacing" in ctx) ctx.letterSpacing = ls + "px";
      ctx.fillStyle = c; ctx.textAlign = align || "center"; ctx.textBaseline = "middle";
      ctx.fillText(t, x, y);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    }
    /* a plate: a dark legibility box behind a stack of mono lines — same
       technique the build-assembly canvas uses, so the two decks match.
       The name line reads a size up from its tagline, so the hierarchy
       is legible at a glance, not just by color. */
    function plate(lines, x, y, align, sz, alpha){
      var w = 0, i, s;
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      for (i=0;i<lines.length;i++){
        s = i === 0 ? sz : sz - 1.6;
        ctx.font = (lines[i].w||"600") + " " + s + "px " + MONO;
        w = Math.max(w, ctx.measureText(lines[i].t).width);
      }
      var pad = 9, lh = sz + 6, h = lines.length*lh + 8;
      var x0 = align === "right" ? x - w - pad : x - pad;
      ctx.fillStyle = "rgba(5,7,7,.86)";
      ctx.strokeStyle = "rgba(94,234,212,.14)"; ctx.lineWidth = 1;
      ctx.fillRect(x0, y - h/2, w + pad*2, h);
      ctx.strokeRect(x0, y - h/2, w + pad*2, h);
      for (i=0;i<lines.length;i++){
        s = i === 0 ? sz : sz - 1.6;
        lab(lines[i].t, x, y - h/2 + 8 + i*lh + lh/2 - 4, lines[i].c, align, s, lines[i].w || "600", i === 0 ? 0 : 0.3);
      }
      ctx.restore();
    }
    function seg(x1,y1,x2,y2,c,w){ ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle=c; ctx.lineWidth=w||1; ctx.stroke(); }
    function dash(x1,y1,x2,y2,c,w,d){ ctx.setLineDash(d||[3,5]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle=c; ctx.lineWidth=w||1; ctx.stroke(); ctx.setLineDash([]); }
    function glowAt(x,y,r,c0,c1){ var g = ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,c0); g.addColorStop(1,c1); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); }

    var srand = (function(seed){ return function(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }; })(29);
    var stars = [];
    for (var i=0;i<130;i++){
      var rc = srand();
      var tint = rc < 0.12 ? "255,232,204" : (rc < 0.24 ? "205,222,255" : "255,255,255");
      stars.push({ x: srand()*W, y: 12 + srand()*(BND-22), r: srand()*1.3+0.3, a: srand()*0.55+0.15, k: srand()*6, c: tint });
    }

    function space(t){
      var g = ctx.createLinearGradient(0,0,0,BND);
      g.addColorStop(0, "#050607"); g.addColorStop(1, "#0a0c0c");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, BND);
      for (var i=0;i<stars.length;i++){
        var q = stars[i];
        var tw = reduce ? 0.8 : 0.6 + 0.4*Math.sin(t*1.3 + q.k);
        ctx.fillStyle = "rgba(" + q.c + "," + (q.a*tw).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.2832); ctx.fill();
      }
      var floor = ctx.createLinearGradient(0, BND, 0, H);
      floor.addColorStop(0,    "#0c0e0d");
      floor.addColorStop(0.7,  "#080a09");
      floor.addColorStop(1,    "#050706");
      ctx.fillStyle = floor; ctx.fillRect(0, BND, W, H - BND);

      /* a soft column of light down the corridor, for depth */
      var col = ctx.createLinearGradient(0, BND, 0, BASE);
      col.addColorStop(0, "rgba(94,234,212,.05)"); col.addColorStop(1, "rgba(94,234,212,0)");
      ctx.fillStyle = col; ctx.fillRect(CORX0, BND, CORX1-CORX0, BASE-BND);

      /* engineering centerline, echoing the build-assembly viewport */
      ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
      ctx.setLineDash([1,5]);
      ctx.beginPath(); ctx.moveTo(CX, 26); ctx.lineTo(CX, BASE+18); ctx.stroke();
      ctx.setLineDash([]);
    }

    function boundary(s){
      var bg = ctx.createLinearGradient(0, BND-32, 0, BND+32);
      bg.addColorStop(0, "rgba(" + GOLD + ",0)"); bg.addColorStop(0.5, "rgba(" + GOLD + ",.10)"); bg.addColorStop(1, "rgba(" + GOLD + ",0)");
      ctx.fillStyle = bg; ctx.fillRect(0, BND-32, W, 64);
      bloom("rgba(" + GOLD + ",.8)", 13, function(){ seg(0, BND, W, BND, "rgba(" + GOLD + ",.62)", 1.4); });
      if (s.crossed) glowAt(CX, BND, 210, "rgba(" + GOLD + ",.17)", "rgba(" + GOLD + ",0)");
      lab("PRODUCTION BOUNDARY", 20, BND - 14, "rgba(" + GOLD + ",.78)", "left", 9.5, "700", 1.2);
    }

    function corridor(){
      dash(CORX0, BND, CORX0, GATEY+8, "rgba(255,255,255,.13)", 1, [3,8]);
      dash(CORX1, BND, CORX1, GATEY+8, "rgba(255,255,255,.13)", 1, [3,8]);
    }

    function station(x, y, s, on){
      var c = on ? "rgba(" + GOLD + "," + (0.42 + 0.5*s) + ")" : "rgba(210,213,212,.4)";
      if (on){
        glowAt(x, y, 17*s, "rgba(" + GOLD + "," + (0.38*s) + ")", "rgba(" + GOLD + ",0)");
        bloom("rgba(" + GOLD + ",.9)", 10*s, function(){ ctx.beginPath(); ctx.arc(x, y, 2.8, 0, 6.2832); ctx.fillStyle = "#8FF3E1"; ctx.fill(); });
      } else {
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.2832); ctx.fillStyle = "rgba(210,213,212,.5)"; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 5.4, 0, 6.2832); ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.stroke();
    }

    function preStation(i, s){
      var y = PREY[i], a = s.pollA[i], on = a > 0.01;
      var det = ez_io(s.ign);
      var mx = CX - BW2 - 14;
      var x0 = mx + (-46)*det;
      seg(x0, y, mx, y, on ? "rgba(" + GOLD + "," + (0.22+0.4*a) + ")" : "rgba(255,255,255,.14)", 1.3);
      station(x0 - 24, y, a, on);
      var st = PRE[i];
      plate([
        { t: st.name, c: on ? "rgba(232,255,250,.96)" : "rgba(196,199,198,.75)", w: "700" },
        { t: st.job,  c: on ? "rgba(" + GOLD + ",.9)"   : "rgba(150,153,152,.55)", w: "500" }
      ], x0 - 40, y, "right", 9.5, Math.max(0.6, a));
    }

    function fltBand(i, s){
      var y = FLTY[i], a = s.fltA[i], on = a > 0.01;
      dash(CORX0+6, y, CORX1-6, y, on ? "rgba(" + GOLD + "," + (0.28*a) + ")" : "rgba(255,255,255,.10)", 1.1, [4,6]);
      station(CORX1 + 26, y, a, on);
      var st = FLT[i];
      plate([
        { t: st.name, c: on ? "rgba(232,255,250,.96)" : "rgba(196,199,198,.75)", w: "700" },
        { t: st.job,  c: on ? "rgba(" + GOLD + ",.9)"   : "rgba(150,153,152,.55)", w: "500" }
      ], CORX1 + 42, y, "left", 9.5, Math.max(0.6, a));
    }

    /* the gate reads three states, not two: refused (red) while the pre-flight
       stack is still clearing, counting (amber) once it's holding for ignition,
       cleared (teal) once mission control says go. */
    function gateHue(s){ return s.go ? GOLD : (s.cd > 0 ? AMBER : RED); }

    function missionControl(s){
      var half = (CORX1 - CORX0)/2, o = s.open*half;
      var hue = gateHue(s), open = s.go;
      var c = "rgba(" + hue + ",.9)", f = "rgba(" + hue + ",.16)";
      bloom("rgba(" + hue + ",.65)", open ? 7+15*s.open : (s.cd > 0 ? 10 : (s.held ? 6 : 4)), function(){
        ctx.fillStyle = f; ctx.fillRect(CORX0-o, GATEY-5, half, 10);
        ctx.fillStyle = f; ctx.fillRect(CX+o,   GATEY-5, half, 10);
        ctx.strokeStyle = c; ctx.lineWidth = 1.5;
        ctx.strokeRect(CORX0-o, GATEY-5, half, 10);
        ctx.strokeRect(CX+o,   GATEY-5, half, 10);
        for (var k=0;k<Math.floor(half/12);k++){
          ctx.fillStyle = c;
          ctx.fillRect(CORX0-o+5+k*12, GATEY-1, 3, 2);
          ctx.fillRect(CX+o+5+k*12, GATEY-1, 3, 2);
        }
      });
    }

    /* drawn after the vehicle, not before — so the gate's name plate stays
       legible even mid-transit, while the vehicle still visibly passes
       between the physical bars drawn in missionControl() above. */
    function missionLabel(s){
      var hue = gateHue(s), open = s.go;
      var mg2 = ctx.createLinearGradient(CX-130, 0, CX+130, 0);
      mg2.addColorStop(0, "rgba(4,5,5,0)"); mg2.addColorStop(0.5, "rgba(4,5,5,.74)"); mg2.addColorStop(1, "rgba(4,5,5,0)");
      ctx.fillStyle = mg2; ctx.fillRect(CX-130, GATEY-46, 260, 34);
      lab(MC.name, CX, GATEY - 30, open ? "rgba(232,255,250,.97)" : (s.cd > 0 ? "rgba(255,238,214,.96)" : "rgba(255,222,222,.94)"), "center", 17, "800", 0.3, DISPLAY);
      lab(s.cd > 0 ? "T-MINUS " + s.cd : (open ? MC.job : (s.held ? "holding for clearance" : MC.job)),
          CX, GATEY + 26, "rgba(" + hue + ",.88)", "center", 8.6, "600", 0.6);
    }

    function vehicle(s, t){
      var jitter = (s.shake && !reduce) ? Math.sin(t*58)*s.shake : 0;
      var tip = s.tip + jitter;
      var baseY = tip + NOSE + BODY;

      if (s.flown){
        var eg = ctx.createLinearGradient(0, baseY, 0, baseY+44);
        var pa = 0.15*s.burn;
        eg.addColorStop(0, "rgba(" + GOLD + "," + pa + ")"); eg.addColorStop(1, "rgba(" + GOLD + ",0)");
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.moveTo(CX-6, baseY); ctx.lineTo(CX+6, baseY); ctx.lineTo(CX+19, baseY+44); ctx.lineTo(CX-19, baseY+44); ctx.closePath(); ctx.fill();
      }

      var body = ctx.createLinearGradient(CX-BW2, 0, CX+BW2, 0);
      body.addColorStop(0,    "#303030");
      body.addColorStop(0.26, "#1b1b1b");
      body.addColorStop(1,    "#0b0b0b");
      ctx.fillStyle = body;
      ctx.fillRect(CX-BW2, tip+NOSE, BW2*2, BODY);
      ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(CX-BW2+0.5, tip+NOSE); ctx.lineTo(CX-BW2+0.5, tip+NOSE+BODY); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.12)";
      ctx.strokeRect(CX-BW2, tip+NOSE, BW2*2, BODY);
      for (var k=1;k<5;k++){
        seg(CX-BW2, tip+NOSE+BODY*(k/5), CX+BW2, tip+NOSE+BODY*(k/5), "rgba(0,0,0,.4)", 1);
      }
      ctx.beginPath();
      ctx.moveTo(CX-BW2, tip+NOSE); ctx.lineTo(CX, tip); ctx.lineTo(CX+BW2, tip+NOSE); ctx.closePath();
      ctx.fillStyle = body; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CX-BW2, baseY); ctx.lineTo(CX-BW2-12, baseY+15); ctx.lineTo(CX-BW2, baseY-13); ctx.closePath();
      ctx.fillStyle = "#181818"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(CX+BW2, baseY); ctx.lineTo(CX+BW2+12, baseY+15); ctx.lineTo(CX+BW2, baseY-13); ctx.closePath();
      ctx.fillStyle = "#0f0f0f"; ctx.fill();

      bloom("rgba(" + GOLD + ",.75)", 9, function(){
        ctx.fillStyle = "rgba(" + GOLD + ",.75)";
        ctx.fillRect(CX-BW2+6, tip+NOSE+BODY-10, 7, 2);
      });

      if (s.burn > 0.01){
        var f0 = s.burn, len = (34 + 116*f0) * (reduce ? 1 : (0.86 + 0.14*Math.sin(t*36)));
        var fg = ctx.createLinearGradient(0, baseY, 0, baseY+len);
        fg.addColorStop(0,    "rgba(255,250,232," + (0.95*f0) + ")");
        fg.addColorStop(0.3,  "rgba(255,214,140," + (0.85*f0) + ")");
        fg.addColorStop(0.62, "rgba(" + AMBER + "," + (0.6*f0) + ")");
        fg.addColorStop(1,    "rgba(" + AMBER + ",0)");
        bloom("rgba(" + AMBER + ",.85)", 26*f0, function(){
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(CX-BW2+7, baseY); ctx.lineTo(CX+BW2-7, baseY);
          ctx.lineTo(CX+8, baseY+len); ctx.lineTo(CX-8, baseY+len);
          ctx.closePath(); ctx.fill();
        });
        glowAt(CX, baseY+10, 46*f0, "rgba(255,214,140," + (0.22*f0) + ")", "rgba(255,214,140,0)");
      }

      if (s.orbit > 0){
        glowAt(CX, tip+NOSE+BODY/2, 110, "rgba(" + GOLD + "," + (0.11*s.orbit) + ")", "rgba(" + GOLD + ",0)");
      }
    }

    function deckRail(){
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(28, BASE+22); ctx.lineTo(W-28, BASE+22); ctx.stroke();
      ctx.lineCap = "butt";
      for (var hx = CX - 150; hx < CX + 150; hx += 12){
        ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 0.75;
        ctx.beginPath(); ctx.moveTo(hx, BASE+24); ctx.lineTo(hx - 6, BASE+32); ctx.stroke();
      }
    }

    function draw(t){
      var s = stateAt(t);
      ctx.setTransform(sc*DPR, 0, 0, sc*DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);

      space(t);
      boundary(s);
      corridor();
      missionControl(s);
      deckRail();

      for (var j=0;j<NF;j++) fltBand(j, s);
      for (var i=0;i<NP;i++) preStation(i, s);

      vehicle(s, t);
      missionLabel(s);

      var msg, col;
      if (!s.go){
        if (s.cd > 0){ msg = "T-MINUS " + s.cd; col = "rgba(" + AMBER + ",1)"; }
        else { msg = s.poll < NP ? "PRE-FLIGHT · " + s.poll + "/" + NP + " CLEARED" : "HOLD FOR MISSION CONTROL"; col = "rgba(226,229,228,.92)"; }
      } else if (!s.crossed){
        msg = "IN FLIGHT · " + Math.min(NF, (function(){ var c=0; for (var k=0;k<NF;k++) if (s.fltA[k]>0.5) c++; return c; })()) + "/" + NF + " ARMED";
        col = "rgba(" + GOLD + ",.95)";
      } else {
        msg = "IN PRODUCTION · ON STATION";
        col = "rgba(" + GOLD + ",1)";
      }
      ctx.font = "800 25px " + DISPLAY;
      var mw = ctx.measureText(msg).width;
      var mg = ctx.createLinearGradient(CX-mw/2-30, 0, CX+mw/2+30, 0);
      mg.addColorStop(0, "rgba(4,5,5,0)"); mg.addColorStop(0.5, "rgba(4,5,5,.72)"); mg.addColorStop(1, "rgba(4,5,5,0)");
      ctx.fillStyle = mg; ctx.fillRect(0, H-40-20, W, 40);
      lab(msg, CX, H - 40, col, "center", 25, "800", 0.2, DISPLAY);
      lab("PHASE 02 · FLIGHT", 20, 30, "rgba(178,181,180,.68)", "left", 9.5, "700", 1.3);
      lab("cleared once · armed the whole way up", W-20, 30, "rgba(140,143,142,.85)", "right", 8.7);
    }

    var sc = 1;
    function layout(){
      var w = cv.parentNode.getBoundingClientRect().width;
      sc = w / W;
      cv.style.width  = Math.round(W*sc) + "px";
      cv.style.height = Math.round(H*sc) + "px";
      cv.width  = Math.round(W*sc*DPR);
      cv.height = Math.round(H*sc*DPR);
    }
    window.addEventListener("resize", layout);
    layout();

    if (reduce){
      draw(HOLD_AT + 0.2);
      return;
    }

    var visible = true;
    if ("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(entries){ visible = entries[0].isIntersecting; }, { threshold: 0.05 });
      io.observe(cv);
    }

    var start = performance.now();
    function frame(now){
      if (visible){
        var t = ((now - start) / 1000) % LOOP;
        draw(t);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
})();
