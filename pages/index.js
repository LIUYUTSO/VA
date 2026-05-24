import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FaInstagram } from 'react-icons/fa';
import { locationInfo as defaultLocationInfo } from '../data/collections';
import Head from 'next/head';
import Link from 'next/link';
import { SpeedInsights } from '@vercel/speed-insights/next';

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#e8e4dc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(40,30,20,0.3)', fontSize: '10px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Loading…</div>
});

const ModelPopup = dynamic(() => import('../components/ModelPopup'), { ssr: false });

const ModelPreview = dynamic(() => import('../components/ModelPreview'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: 'rgba(40,30,20,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(40,30,20,0.25)', fontSize: '10px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Loading…</div>
});

const MARQUEE_BASE = [
  { text: 'Voyage Artifacts', ghost: false },
  { text: 'Voyage Artifacts', ghost: true },
  { text: 'Curated · 2024 — 2026', ghost: false },
  { text: 'Voyage Artifacts', ghost: true },
];
const MARQUEE_ITEMS = [...MARQUEE_BASE, ...MARQUEE_BASE, ...MARQUEE_BASE, ...MARQUEE_BASE];

const PROCESS_STEPS = [
  { num: '01', eyebrow: 'Capture', title: 'Photograph the object.', body: 'Multi-angle photogrammetry on a clean backdrop. Daylight, no flash, every face accounted for.', accent: false },
  { num: '02', eyebrow: 'Reconstruct', title: 'Build the geometry.', body: 'SF3D infers depth and topology. Mesh, normals and UVs are baked from a single hero shot.', accent: true },
  { num: '03', eyebrow: 'Place', title: 'Pin it to the map.', body: 'Coordinates, date, travel note. The artifact is now anchored to the place that produced it.', accent: false },
  { num: '04', eyebrow: 'Archive', title: 'Open the vault.', body: 'Anyone can spin, inspect, read the note. The story stays — long after the journey ends.', accent: true },
];

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [locationInfo, setLocationInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);

  const featureRef = useRef(null);
  const fTrackRef = useRef(null);
  const fProgressRef = useRef(null);
  const cursorRef = useRef(null);
  const magnetRef = useRef(null);
  const pillRef = useRef(null);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const quoteRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); setSelectedLocation(null); }, 800);
  }, []);

  const handleSelectLocation = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  useEffect(() => {
    setLocationInfo(defaultLocationInfo);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      setScrollPct(pct);

      const y = window.scrollY;
      if (y < 1200) {
        if (pillRef.current) pillRef.current.style.transform = `translate3d(0,${y * 0.1}px,0)`;
        if (row1Ref.current) row1Ref.current.style.transform = `translate3d(${y * -0.12}px,0,0)`;
        if (row2Ref.current) row2Ref.current.style.transform = `translate3d(${y * 0.18}px,0,0)`;
        if (quoteRef.current && quoteRef.current.classList.contains('va-in')) {
          quoteRef.current.style.transform = `translate3d(0,${y * -0.05}px,0)`;
        }
      }

      if (featureRef.current && fTrackRef.current && fProgressRef.current) {
        const rect = featureRef.current.getBoundingClientRect();
        const total = featureRef.current.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const p = total > 0 ? scrolled / total : 0;
        const maxX = fTrackRef.current.scrollWidth - window.innerWidth + 64;
        fTrackRef.current.style.transform = `translateX(${-p * maxX}px)`;
        fProgressRef.current.style.width = `${p * 100}%`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('va-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.va-reveal, .va-line, .va-quote').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [isLoading, locationInfo]);

  useEffect(() => {
    if (isLoading) return;
    const navEl = document.getElementById('va-nav');
    if (navEl) setTimeout(() => navEl.classList.add('va-nav-in'), 200);
    const heroLines = document.querySelectorAll('.va-hero-section .va-line');
    heroLines.forEach((el, i) => setTimeout(() => el.classList.add('va-in'), 300 + i * 160));
    setTimeout(() => { if (quoteRef.current) quoteRef.current.classList.add('va-in'); }, 800);
  }, [isLoading]);

  useEffect(() => {
    const cur = cursorRef.current;
    if (!cur) return;
    let cx = 0, cy = 0, tx = 0, ty = 0, raf;
    const onMove = e => { tx = e.clientX; ty = e.clientY; };
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    loop();
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const expand = () => { if (cursorRef.current) { cursorRef.current.style.width = '40px'; cursorRef.current.style.height = '40px'; } };
    const shrink = () => { if (cursorRef.current) { cursorRef.current.style.width = '12px'; cursorRef.current.style.height = '12px'; } };
    const els = document.querySelectorAll('a, button, .va-card, .va-ig');
    els.forEach(el => { el.addEventListener('mouseenter', expand); el.addEventListener('mouseleave', shrink); });
    return () => els.forEach(el => { el.removeEventListener('mouseenter', expand); el.removeEventListener('mouseleave', shrink); });
  }, [isLoading, locationInfo]);

  useEffect(() => {
    const btn = magnetRef.current;
    if (!btn) return;
    const onMove = e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.3}px,${y * 0.4}px)`;
    };
    const onLeave = () => { btn.style.transform = ''; };
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    return () => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#e8e4dc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.14em', color: 'rgba(40,30,20,0.35)', textTransform: 'uppercase', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>Loading</div>
        <div style={{ width: '100px', height: '1px', background: 'rgba(40,30,20,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'rgba(40,30,20,0.4)', animation: 'va-load 1.4s ease-in-out infinite alternate' }}></div>
        </div>
        <style>{`@keyframes va-load { from { width: 15%; } to { width: 85%; } }`}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <title>VOYAGE ARTIFACTS | A 3D Global Curiosities Exploration</title>
        <meta name="description" content="Explore a curated collection of travel artifacts in immersive 3D. Each object tells a story of a place, a moment, and a journey." />
      </Head>

      <div className="va-progress" style={{ width: `${scrollPct}%` }} />
      <div className="va-cursor-dot" ref={cursorRef} />

      <main className="va-main">

        {/* ── NAV ── */}
        <header id="va-nav" className="va-nav">
          <div>
            <h1 className="va-nav-title">Voyage Artifacts</h1>
            <small className="va-nav-sub">Curated by Adam Liu</small>
          </div>
          <Link href="/admin" className="va-nav-cta" data-text="Management">
            <span>Management</span>
          </Link>
        </header>

        {/* ── HERO ── */}
        <section className="va-hero-section">
          <div className="va-pill va-reveal" ref={pillRef}>
            <span className="va-dot" /> Now Live: Interactive Collection v2.1
          </div>

          <h2 className="va-display va-hero-display">
            <span className="va-row va-line">
              <span className="va-word" ref={row1Ref}>Explore the stories</span>
            </span>
            <span className="va-row va-row-muted va-line">
              <span className="va-word" ref={row2Ref}>left behind by time.</span>
            </span>
          </h2>

          <div className="va-hero-quote va-quote" ref={quoteRef}>
            <p>&ldquo;Every journey leaves behind meaningful treasures. This digital vault showcases objects from my travels, each holding a fragment of the destination, the culture, and the moment.&rdquo;</p>
            <div className="va-blob" />
          </div>

          <div className="va-scroll-cue va-reveal">
            Scroll
            <div className="va-cue-bar" />
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="va-marquee">
          <div className="va-marquee-track">
            {MARQUEE_ITEMS.map((item, i) => (
              <div key={i} className={`va-marquee-item${item.ghost ? ' va-ghost' : ''}`}>
                <span className="va-star">✦</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAP STORY ── */}
        <section className="va-map-story">
          <div className="va-map-sticky">
            <div className="va-map-grid" />
            <div className="va-pin va-pin-1" />
            <div className="va-pin va-pin-2" />
            <div className="va-pin va-pin-3" />
            <div className="va-pin va-pin-4" />
            <div className="va-map-actual">
              <Map locations={locationInfo} onSelectLocation={handleSelectLocation} />
            </div>
            <div className="va-map-content">
              <div className="va-map-tag"><span className="va-dot" /> Tactical Archive</div>
              <h2 className="va-display">
                <span className="va-row va-line"><span className="va-word">Five places.</span></span>
                <span className="va-row va-row-muted va-line"><span className="va-word">Five small things.</span></span>
              </h2>
              <p>From Tokyo to Calgary — every artifact pinned to the moment it found its way home.</p>
            </div>
          </div>
        </section>

        {/* ── GALLERY ── */}
        <section className="va-gallery">
          <div className="va-gallery-head">
            <div>
              <h3 className="va-gallery-title va-reveal">Manifest</h3>
              <div className="va-gallery-sub va-reveal">Archive Records</div>
            </div>
            <div className="va-gallery-line va-reveal" />
            <div>
              <div className="va-gallery-count va-reveal">{String(locationInfo.length).padStart(2, '0')}</div>
              <div className="va-gallery-count-sub va-reveal">Total</div>
            </div>
          </div>

          <div className="va-grid-cards">
            {locationInfo.map((item, index) => (
              <div
                key={index}
                className="va-card va-reveal"
                style={{ transitionDelay: `${index * 0.06}s` }}
                onClick={() => handleSelectLocation(item)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectLocation(item); } }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${item.name}`}
              >
                <div className="va-card-thumb">
                  <div className="va-card-index">R-0{index + 1}</div>
                  <div className="va-card-canvas">
                    {item.modelPath ? (
                      <ModelPreview
                        modelPath={item.modelPath}
                        scale={1}
                        intensity={item.intensity || 1.5}
                        rotationY={item.rotationY || 0}
                        autoRotateSpeed={item.autoRotateSpeed || 2}
                        fov={50}
                        adjustCamera={1.8}
                      />
                    ) : (
                      <div className="va-card-placeholder">
                        <div className="va-card-glyph" />
                        <span className="va-card-glyph-label">3D Model</span>
                      </div>
                    )}
                  </div>
                  <div className="va-reveal-cta">View →</div>
                </div>
                <div className="va-card-meta">
                  <h4>{item.name}</h4>
                  <div className="va-card-tags">
                    <span className="va-tag-loc">{item.location}</span>
                    <span className="va-tag-date">{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HORIZONTAL SCROLL: PROCESS ── */}
        <section className="va-feature" ref={featureRef}>
          <div className="va-feature-pin">
            <div className="va-feature-header">
              <h3>Process · From hand<br />to hologram.</h3>
              <div className="va-feature-meta">04 Steps · Scroll →</div>
            </div>
            <div className="va-feature-track" ref={fTrackRef}>
              {PROCESS_STEPS.map(step => (
                <div key={step.num} className={`va-feature-card${step.accent ? ' va-feature-accent' : ''}`}>
                  <div className="va-feature-ph" />
                  <div className="va-feature-num">{step.num}</div>
                  <div className="va-feature-body">
                    <div className="va-feature-eyebrow">{step.eyebrow}</div>
                    <h5>{step.title}</h5>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="va-feature-progress">
              <div className="va-feature-fill" ref={fProgressRef} />
            </div>
          </div>
        </section>

        {/* ── CTA STRIP ── */}
        <section className="va-cta-strip">
          <h2 className="va-display va-cta-display">
            <span className="va-row va-line"><span className="va-word">Every object</span></span>
            <span className="va-row va-line"><span className="va-word va-stroke">tells a place.</span></span>
          </h2>
          <div className="va-magnet-wrap">
            <button
              className="va-magnet"
              ref={magnetRef}
              onClick={() => locationInfo[0] && handleSelectLocation(locationInfo[0])}
            >
              Open the archive →
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="va-footer">
          <div className="va-foot-inner">
            <div>
              <h2>Voyage<br /><span className="va-foot-ghost">Artifacts</span></h2>
              <p>Documenting curated artifacts from global expeditions, blending interactive 3D visualization with personal storytelling.</p>
            </div>
            <div className="va-foot-right">
              <div className="va-foot-label">Transmission</div>
              <a href="https://www.instagram.com/adam.liou/" target="_blank" rel="noopener noreferrer" className="va-ig" aria-label="Instagram">
                <FaInstagram size={20} />
              </a>
              <div className="va-v-badge">System Revision v2.3</div>
            </div>
          </div>
          <div className="va-foot-bottom">
            <div>© {new Date().getFullYear()} Voyage Artifacts</div>
            <div className="va-foot-links">
              <span>Entry Log</span>
              <span>Adam Liu</span>
            </div>
          </div>
        </footer>

        {selectedLocation && (
          <ModelPopup
            selectedLocation={selectedLocation}
            isClosing={isClosing}
            onClose={handleClose}
          />
        )}

        <SpeedInsights />
      </main>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0; padding: 0;
          background: #e8e4dc;
          cursor: default;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          overflow-x: hidden;
          color: #1a1410;
        }
        ::selection { background: rgba(40,30,20,0.12); color: #1a1410; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        a { color: inherit; text-decoration: none; }

        /* ── PROGRESS BAR ── */
        .va-progress {
          position: fixed; top: 0; left: 0;
          height: 1px;
          background: rgba(40,30,20,0.35);
          z-index: 200; pointer-events: none; will-change: width;
        }

        /* ── CURSOR ── */
        .va-cursor-dot {
          position: fixed; top: 0; left: 0;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: rgba(40,30,20,0.4);
          pointer-events: none; z-index: 300;
          display: none;
          transition: width 0.2s cubic-bezier(0.22,1,0.36,1), height 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        @media (hover: hover) { .va-cursor-dot { display: block; } }

        /* ── MAIN ── */
        .va-main { position: relative; background: #e8e4dc; min-height: 100vh; overflow-x: hidden; }

        /* ── NAV ── */
        .va-nav {
          position: fixed; top: 0; left: 0; right: 0; height: 64px;
          background: rgba(255,253,250,0.92);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          color: #1a1410;
          border-bottom: 0.5px solid rgba(40,30,20,0.08);
          z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.04);
          transform: translateY(-110%);
          transition: transform 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .va-nav.va-nav-in { transform: translateY(0); }
        .va-nav-title {
          font-size: 16px; font-weight: 500; font-style: normal;
          letter-spacing: -0.02em; margin: 0; line-height: 1;
          color: #1a1410;
        }
        .va-nav-sub {
          display: block;
          color: rgba(40,30,20,0.35);
          font-size: 10px; letter-spacing: 0.1em; font-weight: 400;
          margin-top: 4px; text-transform: uppercase;
        }
        .va-nav-cta {
          background: rgba(40,30,20,0.06);
          color: rgba(40,30,20,0.6);
          border: 0.5px solid rgba(40,30,20,0.12);
          padding: 9px 18px; border-radius: 999px;
          font-size: 10px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          position: relative; overflow: hidden; display: inline-block;
          transition: background 0.2s, color 0.2s;
        }
        .va-nav-cta span { position: relative; z-index: 2; display: inline-block; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
        .va-nav-cta:hover { background: rgba(40,30,20,0.1); color: rgba(40,30,20,0.9); }
        .va-nav-cta:hover span { transform: translateY(-140%); }
        .va-nav-cta::after { content: attr(data-text); position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform: translateY(140%); transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); font-size: 10px; font-weight: 400; letter-spacing: 0.1em; }
        .va-nav-cta:hover::after { transform: translateY(0); }

        /* ── HERO ── */
        .va-hero-section {
          max-width: 1400px; margin: 0 auto;
          padding: 120px 32px 160px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          position: relative;
        }
        .va-pill {
          background: rgba(255,253,250,0.85);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 0.5px solid rgba(40,30,20,0.12);
          color: rgba(40,30,20,0.5);
          padding: 7px 18px; border-radius: 999px;
          font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 48px; display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          will-change: transform;
        }
        .va-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(40,30,20,0.45);
          animation: va-pulse 2s infinite; display: inline-block; flex-shrink: 0;
        }
        @keyframes va-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* ── DISPLAY TYPE ── */
        .va-display {
          font-size: clamp(48px, 9vw, 128px);
          font-weight: 500; font-style: normal;
          text-transform: none; letter-spacing: -0.02em;
          line-height: 1.0; margin: 0 0 56px; max-width: 1100px;
          color: #1a1410;
        }
        .va-row { display: block; overflow: hidden; }
        .va-word {
          display: inline-block;
          transform: translateY(105%);
          transition: transform 0.7s cubic-bezier(0.22,1,0.36,1);
          will-change: transform;
        }
        .va-line.va-in .va-word { transform: translateY(0); }
        .va-row-muted .va-word { color: rgba(40,30,20,0.28); }
        .va-hero-display { margin-bottom: 56px; }

        /* ── HERO QUOTE ── */
        .va-hero-quote {
          max-width: 680px;
          background: rgba(255,253,250,0.92);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 0.5px solid rgba(40,30,20,0.08);
          padding: 40px 44px; border-radius: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          position: relative; overflow: hidden;
          opacity: 0; transform: translateY(20px);
          transition: transform 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s, opacity 0.7s 0.3s;
          will-change: transform, opacity;
        }
        .va-hero-quote.va-in { opacity: 1; transform: translateY(0); }
        .va-hero-quote p {
          margin: 0; font-size: 15px; line-height: 1.8;
          color: rgba(40,30,20,0.6); font-weight: 400; font-style: normal;
          position: relative; z-index: 2;
          transition: color 0.4s;
        }
        .va-hero-quote:hover p { color: rgba(40,30,20,0.85); }
        .va-blob {
          position: absolute; right: -24px; bottom: -24px;
          width: 96px; height: 96px; border-radius: 50%;
          background: rgba(40,30,20,0.04);
          transition: transform 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .va-hero-quote:hover .va-blob { transform: scale(1.3); }

        /* ── SCROLL CUE ── */
        .va-scroll-cue {
          margin-top: 72px; display: flex; flex-direction: column; align-items: center; gap: 14px;
          color: rgba(40,30,20,0.3); font-size: 10px; letter-spacing: 0.14em; font-weight: 400; text-transform: uppercase;
        }
        .va-cue-bar { width: 1px; height: 56px; background: linear-gradient(rgba(40,30,20,0.3), transparent); position: relative; overflow: hidden; }
        .va-cue-bar::after { content: ""; position: absolute; left: 0; right: 0; top: -28px; height: 28px; background: rgba(40,30,20,0.4); animation: va-cue 2.2s infinite; }
        @keyframes va-cue { 0% { transform: translateY(0); } 100% { transform: translateY(110px); } }

        /* ── MARQUEE ── */
        .va-marquee {
          border-top: 0.5px solid rgba(40,30,20,0.1);
          border-bottom: 0.5px solid rgba(40,30,20,0.1);
          padding: 32px 0; overflow: hidden; background: #e8e4dc;
        }
        .va-marquee-track { display: flex; gap: 64px; width: max-content; animation: va-scroll 55s linear infinite; align-items: center; }
        .va-marquee:hover .va-marquee-track { animation-play-state: paused; }
        .va-marquee-item {
          display: flex; align-items: center; gap: 24px;
          font-weight: 400; font-style: normal;
          font-size: 52px; letter-spacing: -0.02em;
          white-space: nowrap; color: #1a1410;
        }
        .va-star { font-size: 28px; font-style: normal; color: rgba(40,30,20,0.4); display: inline-block; animation: va-spin 10s linear infinite; }
        .va-ghost { -webkit-text-stroke: 1px rgba(40,30,20,0.25); color: transparent; }
        @keyframes va-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes va-spin { to { transform: rotate(360deg); } }

        /* ── MAP STORY ── */
        .va-map-story { position: relative; height: 100vh; }
        .va-map-sticky { position: sticky; top: 64px; height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; background: #1a1410; overflow: hidden; }
        .va-map-sticky::before { content: ""; position: absolute; inset: 0; background: radial-gradient(1200px 600px at 30% 40%, rgba(255,253,250,0.06), transparent 60%), radial-gradient(800px 500px at 75% 65%, rgba(255,253,250,0.04), transparent 60%); pointer-events: none; z-index: 6; }
        .va-map-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,253,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,253,250,0.05) 1px, transparent 1px); background-size: 60px 60px; transform: perspective(800px) rotateX(45deg) translateY(-10%) scale(1.6); transform-origin: center bottom; mask-image: radial-gradient(ellipse 60% 50% at center, black 30%, transparent 80%); -webkit-mask-image: radial-gradient(ellipse 60% 50% at center, black 30%, transparent 80%); animation: va-gridPulse 6s ease-in-out infinite; z-index: 1; }
        @keyframes va-gridPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        .va-map-actual { position: absolute; inset: 0; opacity: 0.18; z-index: 4; pointer-events: all; transition: opacity 0.8s; }
        .va-map-actual:hover { opacity: 0.45; }
        .va-map-content { position: absolute; z-index: 10; color: rgba(255,253,250,0.92); text-align: center; max-width: 900px; padding: 0 32px; pointer-events: none; }
        .va-map-content .va-display { color: rgba(255,253,250,0.92); margin-bottom: 0; }
        .va-map-content .va-row-muted .va-word { color: rgba(255,253,250,0.3); }
        .va-map-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,253,250,0.06); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 0.5px solid rgba(255,253,250,0.1); padding: 9px 18px; border-radius: 999px; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,253,250,0.45); margin-bottom: 32px; }
        .va-map-tag .va-dot { background: rgba(255,253,250,0.5); }
        .va-map-content p { font-size: 14px; color: rgba(255,253,250,0.4); font-weight: 400; max-width: 480px; margin: 20px auto 0; line-height: 1.75; }
        .va-pin { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: rgba(255,253,250,0.7); box-shadow: 0 0 0 0 rgba(255,253,250,0.4); animation: va-ping 2.8s infinite; z-index: 8; pointer-events: none; }
        .va-pin::after { content: ""; position: absolute; inset: -10px; border: 0.5px solid rgba(255,253,250,0.2); border-radius: 50%; }
        .va-pin-1 { top: 32%; left: 20%; animation-delay: 0s; }
        .va-pin-2 { top: 48%; left: 72%; animation-delay: 0.6s; }
        .va-pin-3 { top: 62%; left: 35%; animation-delay: 1.1s; }
        .va-pin-4 { top: 38%; left: 55%; animation-delay: 1.6s; }
        @keyframes va-ping { 0% { box-shadow: 0 0 0 0 rgba(255,253,250,0.4); } 80%, 100% { box-shadow: 0 0 0 24px rgba(255,253,250,0); } }

        /* ── GALLERY ── */
        .va-gallery { max-width: 1400px; margin: 0 auto; padding: 120px 32px 160px; }
        .va-gallery-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 72px; padding: 0 16px; }
        .va-gallery-title { font-size: clamp(32px, 4vw, 56px); font-weight: 500; font-style: normal; letter-spacing: -0.02em; line-height: 1.0; margin: 0; color: #1a1410; }
        .va-gallery-sub { font-size: 10px; letter-spacing: 0.12em; font-weight: 400; color: rgba(40,30,20,0.35); text-transform: uppercase; margin-top: 8px; }
        .va-gallery-line { flex: 1; height: 0.5px; background: rgba(40,30,20,0.1); margin: 0 48px 8px; }
        .va-gallery-count { font-size: 40px; font-weight: 500; font-style: normal; color: rgba(40,30,20,0.15); line-height: 1; text-align: right; letter-spacing: -0.02em; }
        .va-gallery-count-sub { font-size: 10px; letter-spacing: 0.1em; font-weight: 400; color: rgba(40,30,20,0.25); text-transform: uppercase; text-align: right; margin-top: 4px; }
        .va-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }

        /* ── CARDS ── */
        .va-card {
          background: rgba(255,253,250,0.7);
          border: 0.5px solid rgba(40,30,20,0.08);
          border-radius: 16px; padding: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
          transition: box-shadow 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.4s, opacity 0.6s;
          cursor: pointer; display: flex; flex-direction: column; gap: 20px;
          transform: translateY(20px); opacity: 0; outline: none;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .va-card.va-in { transform: translateY(0); opacity: 1; }
        .va-card:hover { box-shadow: 0 8px 40px rgba(0,0,0,0.08); transform: translateY(-4px) !important; border-color: rgba(40,30,20,0.14); }
        .va-card:focus-visible { border-color: rgba(40,30,20,0.3); box-shadow: 0 0 0 2px rgba(40,30,20,0.15); }
        .va-card-thumb { height: 260px; background: rgba(40,30,20,0.04); border-radius: 10px; overflow: hidden; position: relative; }
        .va-card-index {
          position: absolute; top: 14px; left: 14px;
          background: rgba(255,253,250,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          color: rgba(40,30,20,0.45);
          border: 0.5px solid rgba(40,30,20,0.1);
          padding: 5px 10px; border-radius: 6px;
          font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
          z-index: 3; transition: background 0.2s, color 0.2s;
        }
        .va-card:hover .va-card-index { background: rgba(40,30,20,0.85); color: rgba(255,253,250,0.9); }
        .va-card-canvas { width: 100%; height: 100%; }
        .va-card-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; background: rgba(40,30,20,0.03); }
        .va-card-glyph { width: 48px; height: 48px; border: 0.5px solid rgba(40,30,20,0.25); transition: transform 0.8s cubic-bezier(0.22,1,0.36,1); }
        .va-card:hover .va-card-glyph { transform: rotate(45deg); }
        .va-card-glyph-label { font-size: 9px; color: rgba(40,30,20,0.3); letter-spacing: 0.12em; text-transform: uppercase; font-weight: 400; }
        .va-reveal-cta {
          position: absolute; left: 14px; right: 14px; bottom: 14px;
          background: rgba(255,253,250,0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          color: rgba(40,30,20,0.6);
          border: 0.5px solid rgba(40,30,20,0.1);
          padding: 12px; border-radius: 8px;
          font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center;
          z-index: 3; transform: translateY(16px); opacity: 0;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.4s;
        }
        .va-card:hover .va-reveal-cta { transform: translateY(0); opacity: 1; }
        .va-card-meta { padding: 0 4px; display: flex; flex-direction: column; gap: 14px; }
        .va-card-meta h4 { font-size: 18px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.2; margin: 0; color: #1a1410; transition: color 0.2s; }
        .va-card:hover .va-card-meta h4 { color: rgba(40,30,20,0.6); }
        .va-card-tags { display: flex; align-items: center; gap: 8px; border-top: 0.5px solid rgba(40,30,20,0.08); padding-top: 12px; flex-wrap: wrap; }
        .va-tag-loc { background: rgba(40,30,20,0.07); color: rgba(40,30,20,0.5); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1; }
        .va-tag-date { font-size: 10px; font-weight: 400; color: rgba(40,30,20,0.3); letter-spacing: 0.1em; text-transform: uppercase; line-height: 1; padding-left: 8px; border-left: 0.5px solid rgba(40,30,20,0.1); }

        /* ── HORIZONTAL SCROLL PROCESS ── */
        .va-feature { position: relative; height: 300vh; }
        .va-feature-pin { position: sticky; top: 0; height: 100vh; overflow: hidden; display: flex; align-items: center; background: #1a1410; color: rgba(255,253,250,0.9); }
        .va-feature-track { display: flex; gap: 40px; padding: 0 64px; will-change: transform; }
        .va-feature-card {
          flex: 0 0 auto; width: 500px; height: 62vh;
          border-radius: 16px; overflow: hidden; position: relative;
          background: #221e18;
          border: 0.5px solid rgba(255,253,250,0.07);
          display: flex; flex-direction: column; justify-content: flex-end; padding: 32px;
        }
        .va-feature-ph { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(255,253,250,0.02) 0 18px, rgba(255,253,250,0.04) 18px 36px); }
        .va-feature-ph::after { content: ""; position: absolute; inset: 30%; border: 0.5px solid rgba(255,253,250,0.12); border-radius: 8px; }
        .va-feature-accent { background: rgba(255,253,250,0.95); color: #1a1410; }
        .va-feature-accent .va-feature-ph { background: repeating-linear-gradient(45deg, rgba(40,30,20,0.03) 0 18px, rgba(40,30,20,0.01) 18px 36px); }
        .va-feature-accent .va-feature-ph::after { border-color: rgba(40,30,20,0.12); }
        .va-feature-num { position: absolute; top: 24px; right: 24px; font-size: 10px; letter-spacing: 0.14em; color: rgba(255,253,250,0.25); text-transform: uppercase; }
        .va-feature-accent .va-feature-num { color: rgba(40,30,20,0.25); }
        .va-feature-body { position: relative; z-index: 2; }
        .va-feature-eyebrow { font-size: 10px; letter-spacing: 0.12em; color: rgba(255,253,250,0.35); font-weight: 400; text-transform: uppercase; margin-bottom: 12px; }
        .va-feature-accent .va-feature-eyebrow { color: rgba(40,30,20,0.35); }
        .va-feature-body h5 { font-size: 32px; font-weight: 500; font-style: normal; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 14px; }
        .va-feature-body p { font-size: 14px; color: rgba(255,253,250,0.4); line-height: 1.75; margin: 0; max-width: 360px; }
        .va-feature-accent .va-feature-body p { color: rgba(40,30,20,0.55); }
        .va-feature-header { position: absolute; top: 0; left: 0; right: 0; padding: 80px 64px 0; display: flex; justify-content: space-between; align-items: flex-start; z-index: 3; pointer-events: none; }
        .va-feature-header h3 { font-size: clamp(28px, 4vw, 64px); font-weight: 500; font-style: normal; letter-spacing: -0.02em; line-height: 1.0; margin: 0; max-width: 500px; color: rgba(255,253,250,0.88); }
        .va-feature-meta { font-size: 10px; letter-spacing: 0.12em; color: rgba(255,253,250,0.25); text-transform: uppercase; text-align: right; padding-top: 8px; font-weight: 400; }
        .va-feature-progress { position: absolute; bottom: 40px; left: 64px; right: 64px; height: 0.5px; background: rgba(255,253,250,0.1); z-index: 3; }
        .va-feature-fill { height: 100%; background: rgba(255,253,250,0.5); width: 0%; }

        /* ── CTA STRIP ── */
        .va-cta-strip { background: #1a1410; color: rgba(255,253,250,0.92); padding: 140px 32px; text-align: center; position: relative; overflow: hidden; border-radius: 24px 24px 0 0; }
        .va-cta-display { color: rgba(255,253,250,0.92); }
        .va-cta-display .va-row-muted .va-word { color: rgba(255,253,250,0.3); }
        .va-stroke { -webkit-text-stroke: 1.5px rgba(255,253,250,0.7); color: transparent; }
        .va-magnet-wrap { margin-top: 56px; display: flex; justify-content: center; }
        .va-magnet {
          background: rgba(255,253,250,0.9);
          color: #1a1410;
          padding: 20px 48px; border-radius: 999px;
          font-size: 13px; font-weight: 400; letter-spacing: -0.01em;
          cursor: pointer; border: 0.5px solid rgba(255,253,250,0.2);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          transition: box-shadow 0.4s cubic-bezier(0.22,1,0.36,1), background 0.2s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .va-magnet:hover { box-shadow: 0 8px 40px rgba(0,0,0,0.2); background: rgba(255,253,250,1); }
        .va-magnet:active { transform: scale(0.97); transition: transform 0.1s; }

        /* ── FOOTER ── */
        .va-footer { background: #1a1410; color: rgba(255,253,250,0.9); padding: 64px 32px 40px; }
        .va-foot-inner { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .va-foot-inner > div > h2 { font-size: clamp(28px, 3.5vw, 48px); font-weight: 500; font-style: normal; letter-spacing: -0.02em; line-height: 1.0; margin: 0; color: rgba(255,253,250,0.88); }
        .va-foot-ghost { color: rgba(255,253,250,0.18); }
        .va-foot-inner > div > p { color: rgba(255,253,250,0.35); font-size: 13px; font-weight: 400; line-height: 1.75; max-width: 360px; margin: 20px 0 0; }
        .va-foot-right { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 28px; }
        .va-foot-label { font-size: 10px; letter-spacing: 0.12em; font-weight: 400; color: rgba(255,253,250,0.25); text-transform: uppercase; }
        .va-ig { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,253,250,0.06); border: 0.5px solid rgba(255,253,250,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,253,250,0.6); transition: background 0.2s, color 0.2s; }
        .va-ig:hover { background: rgba(255,253,250,0.12); color: rgba(255,253,250,0.9); }
        .va-v-badge { font-size: 10px; letter-spacing: 0.1em; font-weight: 400; color: rgba(255,253,250,0.25); text-transform: uppercase; border: 0.5px solid rgba(255,253,250,0.1); padding: 8px 16px; border-radius: 999px; }
        .va-foot-bottom { max-width: 1400px; margin: 28px auto 0; border-top: 0.5px solid rgba(255,253,250,0.08); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 400; color: rgba(255,253,250,0.25); letter-spacing: 0.1em; text-transform: uppercase; }
        .va-foot-links { display: flex; gap: 28px; }

        /* ── GENERIC REVEAL ── */
        .va-reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .va-reveal.va-in { opacity: 1; transform: translateY(0); }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .va-nav { padding: 0 20px; }
          .va-hero-section { padding: 96px 20px 80px; }
          .va-display { font-size: clamp(36px, 10vw, 64px); line-height: 1.05; }
          .va-hero-quote { padding: 28px; border-radius: 14px; }
          .va-hero-quote p { font-size: 14px; }
          .va-marquee-item { font-size: 36px; }
          .va-gallery { padding: 60px 16px 80px; }
          .va-gallery-head { flex-direction: column; align-items: flex-start; gap: 12px; padding: 0; }
          .va-gallery-line { display: none; }
          .va-gallery-count { text-align: left; }
          .va-grid-cards { grid-template-columns: 1fr 1fr; gap: 12px; }
          .va-card { border-radius: 12px; padding: 14px; gap: 14px; }
          .va-card-thumb { height: 180px; border-radius: 8px; }
          .va-card-meta h4 { font-size: 15px; }
          .va-feature-card { width: 82vw; height: 58vh; }
          .va-feature-header { padding: 56px 24px 0; }
          .va-feature-track { padding: 0 24px; gap: 20px; }
          .va-cta-strip { padding: 80px 20px; border-radius: 20px 20px 0 0; }
          .va-magnet { padding: 16px 32px; font-size: 12px; }
          .va-foot-inner { grid-template-columns: 1fr; gap: 28px; }
          .va-foot-right { align-items: flex-start; }
          .va-map-content p { display: none; }
        }
      `}</style>
    </>
  );
}
