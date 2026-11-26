/* ============================================================
   ARYAN — LIQUID GLASS INTERACTIONS
   Scroll reveals · Magnetic buttons · Tilt · Parallax
   Liquid SVG animation · Counters · Nav · Timeline
   ============================================================ */
(function(){
  "use strict";
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- 1. SCROLL PROGRESS + NAV STATE ---------- */
  const progress = $("#scrollProgress span");
  const navWrap  = $("#navWrap");
  const nav      = $("#mainNav");
  const toTop    = $("#toTop");
  let lastY = 0, ticking = false;

  function onScroll(){
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    const pct = h > 0 ? (y / h) * 100 : 0;
    if(progress) progress.style.width = pct + "%";

    nav.classList.toggle("scrolled", y > 24);
    toTop.classList.toggle("show", y > 600);

    // hide nav on scroll down, show on scroll up
    if(y > 140 && y > lastY + 4 && !navLinks.classList.contains("open") && !navWrap.contains(document.activeElement)) navWrap.classList.add("hidden");
    else if(y < lastY - 4 || y < 140) navWrap.classList.remove("hidden");
    lastY = y;

    // timeline fill
    const tl = $("#timeline");
    if(tl){
      const r = tl.getBoundingClientRect();
      const total = tl.offsetHeight;
      const seen = Math.min(Math.max((innerHeight * 0.75 - r.top), 0), total);
      $("#timelineFill").style.height = (seen / total * 100) + "%";
    }
    ticking = false;
  }
  addEventListener("scroll", () => { if(!ticking){ requestAnimationFrame(onScroll); ticking = true; } }, {passive:true});
  toTop?.addEventListener("click", () => window.scrollTo({top:0, behavior: prefersReduced ? "auto" : "smooth"}));

  /* ---------- 2. MOBILE NAV ---------- */
  const burger = $("#burger"), navLinks = $("#navLinks");
  function setMenu(open){
    burger.classList.toggle("open", open);
    navLinks.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger?.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  document.addEventListener("keydown", e => { if(e.key === "Escape" && navLinks.classList.contains("open")){ setMenu(false); burger.focus(); } });
  document.addEventListener("click", e => { if(!nav.contains(e.target) && navLinks.classList.contains("open")) setMenu(false); });
  onScroll();
  $$(".nav-link", navLinks).forEach(a => a.addEventListener("click", () => {
    setMenu(false);
  }));

  /* active link on scroll */
  const sections = ["home","about","skills","work","experience","contact"];
  const navMap = {};
  $$(".nav-link").forEach(l => navMap[l.getAttribute("href").slice(1)] = l);
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        $$(".nav-link").forEach(l => l.classList.remove("active"));
        navMap[e.target.id]?.classList.add("active");
      }
    });
  }, {rootMargin:"-40% 0px -55% 0px"});
  sections.forEach(id => { const el = document.getElementById(id); if(el) secObs.observe(el); });

  /* ---------- 3. REVEAL ON SCROLL ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add("in-view");
        // trigger skill bars + counters inside
        $$(".skill-bar span", e.target).forEach(bar => {
          const card = bar.closest("[data-skill]");
          if(card) bar.style.setProperty("--p", card.dataset.skill + "%");
        });
        $$("[data-count]", e.target).forEach(runCounter);
        revealObs.unobserve(e.target);
      }
    });
  }, {threshold:.15, rootMargin:"0px 0px -8% 0px"});
  $$(".reveal").forEach(el => revealObs.observe(el));

  // skill cards: observe separately so bars fill even if card itself is reveal
  const skillObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const bar = $(".skill-bar span", e.target);
        if(bar) bar.style.setProperty("--p", e.target.dataset.skill + "%");
        skillObs.unobserve(e.target);
      }
    });
  }, {threshold:.4});
  $$(".skill-card").forEach(c => skillObs.observe(c));

  /* ---------- 4. COUNTERS ---------- */
  function runCounter(el){
    if(el.dataset.done) return; el.dataset.done = "1";
    const target = +el.dataset.count;
    const dur = 1400, t0 = performance.now();
    function tick(t){
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 && target >= 99 ? "%" : target >= 99 ? "%" : "");
      if(p < 1) requestAnimationFrame(tick);
      else el.textContent = target + (target >= 99 ? "%" : "");
    }
    requestAnimationFrame(tick);
  }
  // hero counters are above fold — run immediately
  $$(".hero-card [data-count]").forEach(runCounter);

  /* ---------- 5. MAGNETIC BUTTONS ---------- */
  if(!isTouch && !prefersReduced){
    $$("[data-magnetic]").forEach(el => {
      const strength = parseFloat(el.dataset.magnetic || 0.35);
      let raf = null;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width/2;
        const y = e.clientY - r.top - r.height/2;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${x*strength}px, ${y*strength}px)`;
          el.style.setProperty("--mx", ((e.clientX - r.left)/r.width*100)+"%");
          el.style.setProperty("--my", ((e.clientY - r.top)/r.height*100)+"%");
        });
      });
      el.addEventListener("mouseleave", () => {
        cancelAnimationFrame(raf);
        el.style.transform = "";
        el.style.transition = "transform .5s cubic-bezier(.34,1.56,.64,1)";
        setTimeout(() => el.style.transition = "", 500);
      });
    });
  }

  /* ---------- 6. SPECULAR LIGHT (all glass buttons) ---------- */
  $$(".btn").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", ((e.clientX - r.left)/r.width*100)+"%");
      btn.style.setProperty("--my", ((e.clientY - r.top)/r.height*100)+"%");
    });
  });

  /* ---------- 7. 3D TILT CARDS ---------- */
  if(!isTouch && !prefersReduced){
    $$("[data-tilt], .tilt").forEach(card => {
      const max = 10;
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width - .5;
        const py = (e.clientY - r.top)/r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${px*max}deg) rotateX(${-py*max}deg) translateY(-4px)`;
        card.style.setProperty("--mx", ((e.clientX - r.left)/r.width*100)+"%");
        card.style.setProperty("--my", ((e.clientY - r.top)/r.height*100)+"%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        card.style.transform = "";
        setTimeout(() => card.style.transition = "", 600);
      });
    });
  }

  /* ---------- 8. PARALLAX BLOBS ---------- */
  if(!prefersReduced){
    const blobs = $$("[data-parallax]");
    let py = 0;
    function parallax(){
      blobs.forEach(b => {
        const speed = parseFloat(b.dataset.parallax);
        b.style.translate = `0 ${py * speed * 120}px`;
      });
    }
    addEventListener("scroll", () => {
      py = window.scrollY / (document.documentElement.scrollHeight - innerHeight || 1);
      requestAnimationFrame(parallax);
    }, {passive:true});
    parallax();
  }

  /* ---------- 9. LIQUID SVG FILTER ANIMATION ---------- */
  // Animate turbulence so the liquid glass actually flows
  const turb = $("#liquidTurbulence");
  const turbStrong = $("#liquidTurbulenceStrong");
  const disp = $("#liquidDisplacement");
  if(turb && !prefersReduced){
    let t = 0, lastFrame = 0;
    (function animateLiquid(now){
      requestAnimationFrame(animateLiquid);
      if(document.hidden || now - lastFrame < 40) return;
      lastFrame = now;
      t += 0.02;
      const bx = 0.012 + Math.sin(t) * 0.004;
      const by = 0.018 + Math.cos(t * 0.8) * 0.005;
      turb.setAttribute("baseFrequency", `${bx.toFixed(4)} ${by.toFixed(4)}`);
      if(disp) disp.setAttribute("scale", (16 + Math.sin(t*1.3)*5).toFixed(1));
      if(turbStrong){
        turbStrong.setAttribute("baseFrequency", `${(0.02 + Math.sin(t*1.1)*0.006).toFixed(4)} ${(0.03 + Math.cos(t)*0.007).toFixed(4)}`);
      }
    })(0);
  }

  /* ---------- 10. ROTATING WORD ---------- */
  const words = ["liquid interfaces","glass experiences","living websites","tactile products","motion stories"];
  const rot = $("#rotator");
  if(rot && !prefersReduced){
    let i = 0;
    setInterval(() => {
      rot.classList.add("swap");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove("swap");
      }, 420);
    }, 2800);
  }

  /* ---------- 12. SMOOTH ANCHOR OFFSET FIX ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if(id.length > 1){
        const target = $(id);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior: prefersReduced ? "auto" : "smooth", block:"start"});
          history.replaceState(null, "", id);
        }
      }
    });
  });

  /* ---------- 13. HERO CARD ENTRANCE ---------- */
  const heroCard = $("#heroCard");
  if(heroCard && !prefersReduced){
    heroCard.style.opacity = "0";
    heroCard.style.transform = "translateY(40px) scale(.96)";
    requestAnimationFrame(() => setTimeout(() => {
      heroCard.style.transition = "opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1)";
      heroCard.style.opacity = "1";
      heroCard.style.transform = "";
    }, 300));
  }

  console.log("%c✦ Aryan — liquid glass portfolio loaded","color:#2563eb;font-weight:bold");
})();
