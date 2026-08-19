/* ============================================================
   Skills orchestration graph — styled like an agent state graph:
   hub nodes = skill categories, leaves = individual skills,
   cross-links = how they actually connect in the work.
   ============================================================ */

const CATS = [
  { id: "ai",    label: "AI & Machine Learning",        color: "#0EA5A0" },
  { id: "fw",    label: "Frameworks & Libraries",        color: "#D97706" },
  { id: "cv",    label: "Computer Vision & NLP",         color: "#9333EA" },
  { id: "infra", label: "Software & Infrastructure",     color: "#2563EB" },
  { id: "biz",   label: "Applied R&D & Business",        color: "#E11D48" },
];

const LEAVES = {
  ai: ["Generative AI", "Agentic AI Orchestration", "Multimodal Learning", "LLMs", "Transformers", "Deep Learning", "Recommendation Systems", "Semantic Understanding"],
  fw: ["PyTorch", "TensorFlow", "LangGraph", "Hugging Face", "OpenCV", "Scikit-Learn", "PySpark", "AutoML"],
  cv: ["Deep Learning OCR", "Object Detection", "Medical Image Analysis", "Automated Data Annotation", "NLP Semantic Pipelines"],
  infra: ["Python", "REST APIs", "AWS", "Azure", "GCP", "SQL / NoSQL", "DevOps & Linux"],
  biz: ["Enterprise POC Development", "Algorithmic Optimization", "Pre/Post-Sales Support", "Multi-agent Architecture Design"],
};

const CROSS_LINKS = [
  ["LangGraph", "Agentic AI Orchestration"],
  ["LangGraph", "Multi-agent Architecture Design"],
  ["PyTorch", "Deep Learning"],
  ["PyTorch", "Medical Image Analysis"],
  ["TensorFlow", "Deep Learning"],
  ["OpenCV", "Object Detection"],
  ["OpenCV", "Automated Data Annotation"],
  ["PySpark", "NLP Semantic Pipelines"],
  ["PySpark", "Transformers"],
  ["AWS", "Object Detection"],
  ["REST APIs", "Recommendation Systems"],
  ["AutoML", "Algorithmic Optimization"],
  ["Scikit-Learn", "AutoML"],
  ["Hugging Face", "LLMs"],
  ["Transformers", "LLMs"],
  ["Recommendation Systems", "Semantic Understanding"],
  ["Python", "PyTorch"],
  ["Enterprise POC Development", "Medical Image Analysis"],
];

function buildGraphData(){
  const nodes = [];
  const links = [];

  CATS.forEach(cat => {
    nodes.push({ id: `hub-${cat.id}`, label: cat.label, cat: cat.id, hub: true });
    LEAVES[cat.id].forEach(name => {
      nodes.push({ id: name, label: name, cat: cat.id, hub: false });
      links.push({ source: `hub-${cat.id}`, target: name, cross: false });
    });
  });

  CROSS_LINKS.forEach(([a, b]) => links.push({ source: a, target: b, cross: true }));

  return { nodes, links };
}

function catColor(catId){
  const c = CATS.find(c => c.id === catId);
  return c ? c.color : "#9AA3C0";
}

function initSkillGraph(){
  const svgEl = document.getElementById("skillGraph");
  const tooltip = document.getElementById("graphTooltip");
  const legendEl = document.getElementById("graphLegend");
  if (!svgEl || typeof d3 === "undefined") return;

  legendEl.innerHTML = CATS.map(c =>
    `<li><span class="swatch" style="background:${c.color}"></span>${c.label}</li>`
  ).join("");

  const { nodes, links } = buildGraphData();
  const svg = d3.select(svgEl);
  const g = svg.append("g");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = svgEl.clientWidth, height = svgEl.clientHeight;

  const angleFor = (cat) => {
    const i = CATS.findIndex(c => c.id === cat);
    return (i / CATS.length) * Math.PI * 2 - Math.PI / 2;
  };
  const anchor = (cat) => {
    const a = angleFor(cat);
    const rx = width * 0.37, ry = height * 0.4;
    return { x: width / 2 + Math.cos(a) * rx, y: height / 2 + Math.sin(a) * ry };
  };

  const linkSel = g.append("g").attr("class", "links")
    .selectAll("line").data(links).join("line")
    .attr("class", d => "link" + (d.cross ? "" : " hub-link"))
    .attr("stroke-opacity", d => d.cross ? 0.45 : 0.65);

  const nodeG = g.append("g").attr("class", "nodes")
    .selectAll("g").data(nodes).join("g")
    .style("cursor", "pointer")
    .call(drag());

  nodeG.append("circle")
    .attr("r", d => d.hub ? 11 : 5)
    .attr("fill", d => d.hub ? catColor(d.cat) : "#FFFFFF")
    .attr("stroke", d => catColor(d.cat))
    .attr("stroke-width", d => d.hub ? 0 : 1.8);

  nodeG.append("text")
    .attr("class", d => "node-label" + (d.hub ? " hub" : ""))
    .attr("x", d => d.hub ? 0 : 9)
    .attr("y", d => d.hub ? -16 : 3.5)
    .attr("text-anchor", d => d.hub ? "middle" : "start")
    .text(d => d.label);

  const linkedIds = new Map();
  links.forEach(l => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    if (!linkedIds.has(s)) linkedIds.set(s, new Set());
    if (!linkedIds.has(t)) linkedIds.set(t, new Set());
    linkedIds.get(s).add(t);
    linkedIds.get(t).add(s);
  });

  function highlight(d){
    const connected = linkedIds.get(d.id) || new Set();
    nodeG.style("opacity", n => n.id === d.id || connected.has(n.id) ? 1 : 0.22);
    linkSel.style("opacity", l => {
      const s = l.source.id ?? l.source, t = l.target.id ?? l.target;
      return (s === d.id || t === d.id) ? 0.9 : 0.06;
    });
  }
  function resetHighlight(){
    nodeG.style("opacity", 1);
    linkSel.style("opacity", l => l.cross ? 0.45 : 0.65);
  }

  nodeG
    .on("mouseenter", (event, d) => {
      highlight(d);
      tooltip.textContent = d.hub ? d.label : `${d.label} — ${CATS.find(c => c.id === d.cat).label}`;
      tooltip.classList.add("is-visible");
    })
    .on("mousemove", (event) => {
      const rect = svgEl.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left) + "px";
      tooltip.style.top = (event.clientY - rect.top) + "px";
    })
    .on("mouseleave", () => {
      resetHighlight();
      tooltip.classList.remove("is-visible");
    });

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.cross ? 100 : 58).strength(d => d.cross ? 0.3 : 0.7))
    .force("charge", d3.forceManyBody().strength(d => d.hub ? -260 : -110))
    .force("collide", d3.forceCollide().radius(d => (d.hub ? 42 : 26)))
    .force("x", d3.forceX(d => anchor(d.cat).x).strength(0.1))
    .force("y", d3.forceY(d => anchor(d.cat).y).strength(0.1))
    .alphaDecay(reducedMotion ? 1 : 0.02)
    .on("tick", ticked);

  function ticked(){
    linkSel
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    nodeG.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  function drag(){
    return d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
  }

  function resize(){
    width = svgEl.clientWidth; height = svgEl.clientHeight;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    simulation.force("x", d3.forceX(d => anchor(d.cat).x).strength(0.09));
    simulation.force("y", d3.forceY(d => anchor(d.cat).y).strength(0.09));
    simulation.alpha(0.3).restart();
  }
  window.addEventListener("resize", debounce(resize, 200));
  resize();
}

function debounce(fn, ms){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ============================================================
   Hero ambient constellation — lightweight canvas 2D, no d3.
   Purely atmospheric: slow drifting nodes + proximity edges.
   ============================================================ */
function initHeroCanvas(){
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colors = CATS.map(c => c.color);

  let w, h, dpr, points;

  function sizeCanvas(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePoints(){
    const count = Math.round((w * h) / 42000);
    points = Array.from({ length: Math.max(18, Math.min(46, count)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.6 + 1,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
  }

  function frame(){
    ctx.clearRect(0, 0, w, h);
    const maxDist = Math.min(160, w * 0.14);

    for (const p of points){
      if (!reducedMotion){
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
      }
    }
    for (let i = 0; i < points.length; i++){
      for (let j = i + 1; j < points.length; j++){
        const a = points[i], b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist){
          ctx.strokeStyle = `rgba(90, 98, 140, ${0.32 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const p of points){
      ctx.beginPath();
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.85;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (!reducedMotion) requestAnimationFrame(frame);
  }

  function start(){
    sizeCanvas(); makePoints(); frame();
  }
  window.addEventListener("resize", debounce(() => { sizeCanvas(); makePoints(); if (reducedMotion) frame(); }, 200));
  start();
}
