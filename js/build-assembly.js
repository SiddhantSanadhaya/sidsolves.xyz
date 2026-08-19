/* ============================================================
   Build assembly — the "machines close on the object" canvas.
   Scroll-driven: two robotic arms alternate, seating one governed
   capability at a time onto a single object, until it's complete
   (and complete is not the same as cleared to act — that's Phase 02).

   Adapted from an interactive canvas I engineered at StatusNeo for
   the Agent OS product page — same kinematics, same easing curves,
   recolored to this site's palette and reduced to five stages.
   ============================================================ */
(function(){

  var BUILD = [
    { name: "Scope the decision" },
    { name: "Ground the context" },
    { name: "Connect the systems" },
    { name: "Coordinate the reasoning" },
    { name: "Ship and watch" }
  ];
  var BUILD_M = [
    { job: "Pours the intent in",            part: "The propellant" },
    { job: "Loads the context",              part: "The tanks" },
    { job: "Pipes in the systems of record", part: "The umbilicals" },
    { job: "Fits the guidance computer",     part: "The guidance computer" },
    { job: "Presses it into a release",      part: "The payload fairing" }
  ];

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var MONO = "'IBM Plex Mono', ui-monospace, monospace";
  var GOLD  = "20,184,166"; /* teal, matching the site's --signal accent: settled, governed */
  var AMBER = "194,118,10"; /* matches the site's --pulse accent: fresh off the arm, still hot */

  function lerpRGB(c0, c1, t){
    var a = c0.split(",").map(Number), b = c1.split(",").map(Number);
    return Math.round(a[0]+(b[0]-a[0])*t) + "," + Math.round(a[1]+(b[1]-a[1])*t) + "," + Math.round(a[2]+(b[2]-a[2])*t);
  }

  window.initBuildAssembly = function initBuildAssembly(){
    var acv   = document.getElementById("asmCv");
    if (!acv) return;
    var actx  = acv.getContext("2d");
    var track = document.getElementById("asmScroll");
    var hint  = document.getElementById("asmHint");

    var N    = BUILD.length;
    var SEGH = 32;
    var BW   = 76;
    var NOSE = 42;
    var W    = 1120;
    var MARG = { top: 92, floor: 90, side: 96 };

    var STACK = N * SEGH;
    var DECK  = MARG.top + NOSE + STACK;
    var H     = DECK + MARG.floor;
    var CX    = W / 2;
    var RL    = MARG.side, RR = W - MARG.side;
    var RTOP  = MARG.top - 4;
    var L1 = 235, L2 = 235;
    var RAILY = H - 16;
    var asc = 1;

    var T = { start: 0.55, step: 1.05, cycle: 1.15, seat: 0.86, hot: 0.50 };
    T.reach = 0.26; T.place = 0.78;
    T.last  = T.start + (N - 1) * T.step + T.seat;
    T.fair  = T.last + 0.39;  T.fairRun = 0.45;
    T.done  = T.fair + 0.75;
    T.hold  = T.done + 1.00;
    T.span  = T.hold + 1.00;

    function segCY(i){ return DECK - SEGH*(i + 0.5); }
    function side(i){ return i % 2; }
    function rail(i){ return side(i) ? RR : RL; }
    function home(i){  return { x: rail(i) + (side(i) ? -172 : 172), y: segCY(i) + 62 }; }
    function stage(i){ return { x: rail(i) + (side(i) ? -186 : 186), y: segCY(i) + 16 }; }
    function grip(i){  return { x: CX + (side(i) ? BW/2 : -BW/2),    y: segCY(i) }; }

    function bow(i){
      var s = segCY(i) > (RTOP + DECK)/2 ? -1 : 1;
      return side(i) ? -s : s;
    }

    function ik(sx, sy, tx, ty, sign){
      var dx = tx - sx, dy = ty - sy;
      var d  = Math.sqrt(dx*dx + dy*dy);
      d = Math.min(d, L1 + L2 - 0.01);
      d = Math.max(d, Math.abs(L1 - L2) + 0.01);
      var a1 = Math.atan2(dy, dx);
      var a2 = Math.acos((L1*L1 + d*d - L2*L2) / (2*L1*d));
      var ang = a1 + sign*a2;
      return { x: sx + L1*Math.cos(ang), y: sy + L1*Math.sin(ang) };
    }

    function clamp(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
    function swing(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2; }
    function release(x){ return x*x*x; }
    function press(x){
      if(x < 0.86) return 1 - Math.pow(1 - x/0.86, 3);
      return 1 + 0.014*Math.sin((x - 0.86)/0.14 * Math.PI);
    }

    function bloom(colour, blur, fn){
      var g = actx;
      if(blur < 0.6){ fn(g); return; }
      g.save(); g.shadowColor = colour; g.shadowBlur = blur;
      fn(g);
      g.restore();
    }
    function lab(t, x, y, c, a, sz, w, ls){
      var g = actx;
      g.font = (w||"600") + " " + (sz||9) + "px " + MONO;
      if(ls && "letterSpacing" in g) g.letterSpacing = ls + "px";
      g.fillStyle = c; g.textAlign = a || "center"; g.textBaseline = "middle";
      g.fillText(t, x, y);
      if("letterSpacing" in g) g.letterSpacing = "0px";
    }
    function plate(lines, x, y, align, sz, alpha){
      var g = actx, i, w = 0, s;
      g.save();
      g.globalAlpha = alpha === undefined ? 1 : alpha;
      for(i=0;i<lines.length;i++){
        s = i === 0 ? sz : sz - 1.6;
        g.font = "700 " + s + "px " + MONO;
        w = Math.max(w, g.measureText(lines[i].t).width);
      }
      var pad = 8, lh = sz + 4, h = lines.length*lh + 6;
      var x0 = align === "right" ? x - w - pad : x - pad;
      g.fillStyle = "rgba(6,6,6,.86)";
      g.strokeStyle = "rgba(94,234,212,.14)"; g.lineWidth = 1;
      g.fillRect(x0, y - h/2, w + pad*2, h);
      g.strokeRect(x0, y - h/2, w + pad*2, h);
      for(i=0;i<lines.length;i++){
        s = i === 0 ? sz : sz - 1.6;
        lab(lines[i].t, x, y - h/2 + 8 + i*lh + lh/2 - 4, lines[i].c, align, s, lines[i].w || "600", i === 0 ? 0 : 0.3);
      }
      g.restore();
    }

    function bay(g, fitted){
      var sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0,    "#050505");
      sky.addColorStop(0.68, "#0C0C0C");
      sky.addColorStop(1,    "#070707");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);

      var wl = g.createRadialGradient(CX, DECK - STACK*0.4, 30, CX, DECK - STACK*0.4, 540);
      wl.addColorStop(0, "rgba(255,255,255,.055)");
      wl.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = wl; g.fillRect(0, 0, W, H);

      g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
      g.setLineDash([1, 5]);
      g.beginPath(); g.moveTo(CX, RTOP - 8); g.lineTo(CX, DECK + 16); g.stroke();
      g.setLineDash([]);

      for(var i=0;i<2;i++){
        var rx = i ? RR : RL;
        g.strokeStyle = "rgba(255,255,255,.10)"; g.lineWidth = 1;
        g.beginPath(); g.moveTo(rx, RTOP); g.lineTo(rx, DECK); g.stroke();
        for(var ry = RTOP + 16; ry < DECK; ry += 22){
          g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 0.75;
          g.beginPath(); g.moveTo(rx - 4, ry); g.lineTo(rx + 4, ry); g.stroke();
        }
      }

      if(fitted){
        var pool = g.createRadialGradient(CX, DECK + 4, 0, CX, DECK + 4, 230);
        pool.addColorStop(0, "rgba(" + GOLD + "," + (0.075 * fitted/N) + ")");
        pool.addColorStop(1, "rgba(" + GOLD + ",0)");
        g.save();
        g.beginPath(); g.ellipse(CX, DECK + 4, 230, 20, 0, 0, 6.2832);
        g.fillStyle = pool; g.fill();
        g.restore();
      }
      g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(CX - 150, DECK); g.lineTo(CX + 150, DECK); g.stroke();
      for(var hx = CX - 146; hx < CX + 150; hx += 12){
        g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 0.75;
        g.beginPath(); g.moveTo(hx, DECK + 2); g.lineTo(hx - 6, DECK + 10); g.stroke();
      }
    }

    function armAt(i, t){
      var w = (t - (T.start + i*T.step)) / T.cycle;
      if(w <= 0 || w >= 1.02) return null;
      var hm = home(i), sg = stage(i), gr = grip(i), q, gx, gy, carry = false;
      if(w < T.reach){
        q = swing(w / T.reach);
        gx = hm.x + (sg.x - hm.x)*q; gy = hm.y + (sg.y - hm.y)*q;
      } else if(w < T.place){
        q = press((w - T.reach) / (T.place - T.reach)); carry = true;
        gx = sg.x + (gr.x - sg.x)*q; gy = sg.y + (gr.y - sg.y)*q;
      } else {
        q = release((w - T.place) / (1 - T.place));
        gx = gr.x + (hm.x - gr.x)*q; gy = gr.y + (hm.y - gr.y)*q;
      }
      return { i:i, w:w, gx:gx, gy:gy, carry:carry, sg:sg,
               a: Math.min(clamp(w/0.05), clamp((1.02 - w)/0.07)) };
    }

    function link(g, ax, ay, bx, by, w1, w2){
      var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx*dx + dy*dy) || 1;
      var nx = -dy/L, ny = dx/L;
      var up = ny > 0 ? -1 : 1;
      g.beginPath();
      g.moveTo(ax + nx*w1, ay + ny*w1);
      g.lineTo(bx + nx*w2, by + ny*w2);
      g.lineTo(bx - nx*w2, by - ny*w2);
      g.lineTo(ax - nx*w1, ay - ny*w1);
      g.closePath();
      g.fillStyle = "#1E1E1E"; g.fill();
      g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1; g.stroke();
      g.strokeStyle = "rgba(255,255,255,.40)"; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(ax + up*nx*w1, ay + up*ny*w1);
      g.lineTo(bx + up*nx*w2, by + up*ny*w2);
      g.stroke();
    }

    function arm(g, s){
      var sh = { x: rail(s.i), y: segCY(s.i) };
      var el = ik(sh.x, sh.y, s.gx, s.gy, bow(s.i));
      g.save();
      g.globalAlpha = s.a;
      link(g, sh.x, sh.y, el.x, el.y, 5.0, 3.4);
      link(g, el.x, el.y, s.gx, s.gy, 3.4, 2.2);
      g.fillStyle = "#1C1C1C"; g.strokeStyle = "rgba(" + GOLD + ",.8)"; g.lineWidth = 1.3;
      g.beginPath(); g.arc(sh.x, sh.y, 5.5, 0, 6.2832); g.fill(); g.stroke();
      g.beginPath(); g.arc(el.x, el.y, 4.2, 0, 6.2832); g.fill(); g.stroke();
      g.restore();
    }

    function jaws(g, s){
      var jd = side(s.i) ? -1 : 1;
      g.save();
      g.globalAlpha = s.a;
      g.lineCap = "round"; g.lineWidth = 1.6;
      g.strokeStyle = s.carry ? "rgba(" + GOLD + ",.9)" : "rgba(255,255,255,.34)";
      g.beginPath();
      g.moveTo(s.gx, s.gy - 10); g.lineTo(s.gx, s.gy + 10);
      g.moveTo(s.gx, s.gy - 10); g.lineTo(s.gx + jd*8, s.gy - 10);
      g.moveTo(s.gx, s.gy + 10); g.lineTo(s.gx + jd*8, s.gy + 10);
      g.stroke();
      g.lineCap = "butt";
      g.restore();
    }

    function object(g, t, body){
      var i;
      for(i=0;i<N;i++){
        var s = T.start + i*T.step;
        if(t < s + T.seat) continue;
        var y0  = DECK - SEGH*(i + 1);
        var hot = Math.max(0, 1 - (t - (s + T.seat))/T.hot);

        g.fillStyle = body; g.fillRect(CX - BW/2, y0, BW, SEGH);
        g.strokeStyle = "rgba(255,255,255,.26)"; g.lineWidth = 1;
        g.beginPath(); g.moveTo(CX - BW/2 + 0.5, y0); g.lineTo(CX - BW/2 + 0.5, y0 + SEGH); g.stroke();
        if(i > 0){
          g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 1;
          g.beginPath(); g.moveTo(CX - BW/2, y0 + SEGH - 0.5); g.lineTo(CX + BW/2, y0 + SEGH - 0.5); g.stroke();
        }
        var flashHue = lerpRGB(GOLD, AMBER, hot);
        bloom("rgba(" + flashHue + ",.9)", 14*hot, function(c){
          c.strokeStyle = "rgba(" + flashHue + "," + (0.30 + 0.60*hot) + ")";
          c.lineWidth = 1 + hot*0.9;
          c.strokeRect(CX - BW/2, y0, BW, SEGH);
        });
      }
      if(t >= T.fair){
        var ny = DECK - SEGH*N, np = Math.min(1, (t - T.fair)/T.fairRun);
        bloom("rgba(" + GOLD + ",.75)", 16*np, function(c){
          c.fillStyle = "rgba(" + GOLD + ",.05)";
          c.strokeStyle = "rgba(" + GOLD + ",.62)"; c.lineWidth = 1.3;
          c.beginPath();
          c.moveTo(CX - BW/2, ny); c.lineTo(CX, ny - NOSE*np); c.lineTo(CX + BW/2, ny);
          c.fill(); c.stroke();
        });
      }
    }

    function load(g, s, t){
      var sy = s.sg.y + SEGH/2 + 5, rx = rail(s.i), inner = s.sg.x + (side(s.i) ? 44 : -44);
      g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(s.sg.x - 44, sy); g.lineTo(s.sg.x + 44, sy);
      g.moveTo(rx, sy);          g.lineTo(inner, sy);
      g.stroke();

      if(s.w < 0.80){
        var ax = (s.w < T.reach) ? s.sg.x : s.gx;
        var ay = (s.w < T.reach) ? s.sg.y : s.gy;
        var px = ax + (side(s.i) ? -BW/2 : BW/2);

        bloom("rgba(" + GOLD + ",.55)", s.carry ? 13 : 4, function(c){
          c.fillStyle   = "rgba(" + GOLD + ",.10)";
          c.strokeStyle = "rgba(" + GOLD + ",.95)"; c.lineWidth = 1.4;
          c.beginPath(); c.rect(px - BW/2, ay - SEGH/2, BW, SEGH); c.fill(); c.stroke();
        });
        if(s.carry)
          plate([{t: BUILD_M[s.i].job, c:"rgba(" + GOLD + ",.95)", w:"700"}],
                px, ay - SEGH/2 - 14, "center", 8.5, clamp((s.w - T.reach)/0.10));
      }
      jaws(g, s);
    }

    function render(p){
      if(!acv) return;
      var g = actx, t = p * T.span, i;

      var fitted = 0, live = [];
      for(i=0;i<N;i++){
        if(t >= T.start + i*T.step + T.seat) fitted++;
        var s = armAt(i, t);
        if(s) live.push(s);
      }

      g.setTransform(asc*DPR, 0, 0, asc*DPR, 0, 0);

      bay(g, fitted);
      for(i=0;i<live.length;i++) arm(g, live[i]);

      var body = g.createLinearGradient(CX - BW/2, 0, CX + BW/2, 0);
      body.addColorStop(0,    "#252525");
      body.addColorStop(0.22, "#171717");
      body.addColorStop(1,    "#0C0C0C");
      object(g, t, body);

      for(i=0;i<live.length;i++) load(g, live[i], t);

      for(i=0;i<N;i++){
        var st = T.start + i*T.step + T.seat;
        if(t < st) continue;
        var lx = side(i) ? CX + BW/2 + 14 : CX - BW/2 - 14;
        var a  = clamp((t - st)/0.30);
        plate([{t: BUILD[i].name,                   c:"rgba(255,255,255,.92)", w:"700"},
               {t: BUILD_M[i].part.toLowerCase(),   c:"rgba(" + GOLD + ",.75)",   w:"600"}],
              lx, segCY(i) + (1 - a)*5, side(i) ? "left" : "right", 9, a);
      }

      if(t >= T.done){
        var ca = Math.min(1, (t - T.done)/0.5);
        bloom("rgba(" + GOLD + ",.5)", 10*ca, function(c){
          c.strokeStyle = "rgba(" + GOLD + "," + (0.55*ca) + ")"; c.lineWidth = 1;
          c.setLineDash([4,4]);
          c.strokeRect(CX - BW/2 - 6, DECK - STACK - NOSE - 12, BW + 12, STACK + NOSE + 24);
          c.setLineDash([]);
        });
        lab("COMPLETE", CX, DECK - STACK - NOSE - 26, "rgba(" + GOLD + "," + ca + ")", "center", 11, "800", 1.6);
      }
      if(t >= T.hold){
        var sa = Math.min(1, (t - T.hold)/0.5);
        lab("NOT CLEARED", CX, DECK + 34, "rgba(229,72,77," + (0.95*sa) + ")", "center", 11, "800", 1.6);
        lab("it is finished. it is permitted to do nothing.", CX, DECK + 52,
            "rgba(166,166,166," + (0.8*sa) + ")", "center", 8.5);
      } else {
        lab(fitted + " / " + N + " FITTED", CX, DECK + 34, "rgba(120,120,120,.9)", "center", 9, "700", 1.4);
      }

      lab("PHASE 01 · INTEGRATION", 24, 34, "rgba(166,166,166,.6)", "left", 9, "700", 1.4);
      lab("one object · " + N + " arms · nothing that goes on comes off", W - 24, 34,
          "rgba(110,110,110,.9)", "right", 8.5);

      g.lineCap = "round";
      g.strokeStyle = "rgba(255,255,255,.09)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(28, RAILY); g.lineTo(W - 28, RAILY); g.stroke();
      bloom("rgba(" + GOLD + ",.6)", 8, function(c){
        c.strokeStyle = "rgba(" + GOLD + ",.85)"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(28, RAILY); c.lineTo(28 + (W - 56)*p, RAILY); c.stroke();
      });
      g.lineCap = "butt";

      if(hint) hint.style.opacity = p > 0.02 ? "0" : "1";
    }

    function progress(){
      if(!track) return 1;
      var r = track.getBoundingClientRect();
      var span = r.height - (window.innerHeight || 1);
      if(span <= 8) return 1;
      return Math.max(0, Math.min(1, -r.top / span));
    }

    var target = 0, cur = 0, raf = 0;
    function tick(){
      var d = target - cur;
      cur += d * 0.16;
      if(Math.abs(d) < 0.0005){ cur = target; raf = 0; render(cur); return; }
      render(cur);
      raf = requestAnimationFrame(tick);
    }
    function onScroll(){
      target = progress();
      if(reduce){ cur = target; render(cur); return; }
      if(!raf) raf = requestAnimationFrame(tick);
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    function layout(){
      if(!acv) return;
      var w = acv.parentNode.getBoundingClientRect().width;
      asc = w / W;
      acv.style.width  = Math.round(W*asc) + "px";
      acv.style.height = Math.round(H*asc) + "px";
      acv.width  = Math.round(W*asc*DPR);
      acv.height = Math.round(H*asc*DPR);
      target = cur = progress();
      render(cur);
    }
    window.addEventListener("resize", layout);
    layout();
  };
})();
