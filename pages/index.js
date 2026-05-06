import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FaInstagram } from 'react-icons/fa';
import { locationInfo as defaultLocationInfo } from '../data/collections';
import Head from 'next/head';
import Link from 'next/link';
import { SpeedInsights } from '@vercel/speed-insights/next';

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Initializing Map…</div>
});

const ModelPopup = dynamic(() => import('../components/ModelPopup'), { ssr: false });

const ModelPreview = dynamic(() => import('../components/ModelPreview'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ddd', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Warping Asset…</div>
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

  // Scroll: progress bar + hero parallax + horizontal feature
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      setScrollPct(pct);

      // Hero parallax (direct DOM)
      const y = window.scrollY;
      if (y < 1200) {
        if (pillRef.current) pillRef.current.style.transform = `translate3d(0,${y * 0.1}px,0)`;
        if (row1Ref.current) row1Ref.current.style.transform = `translate3d(${y * -0.12}px,0,0)`;
        if (row2Ref.current) row2Ref.current.style.transform = `translate3d(${y * 0.18}px,0,0)`;
        if (quoteRef.current && quoteRef.current.classList.contains('va-in')) {
          quoteRef.current.style.transform = `translate3d(0,${y * -0.05}px,0)`;
        }
      }

      // Horizontal feature track
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

  // IntersectionObserver: reveal elements
  useEffect(() => {
    if (isLoading) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('va-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.va-reveal, .va-line, .va-quote').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [isLoading, locationInfo]);

  // Nav + hero text auto-reveal on load
  useEffect(() => {
    if (isLoading) return;
    const navEl = document.getElementById('va-nav');
    if (navEl) setTimeout(() => navEl.classList.add('va-nav-in'), 200);
    const heroLines = document.querySelectorAll('.va-hero-section .va-line');
    heroLines.forEach((el, i) => setTimeout(() => el.classList.add('va-in'), 300 + i * 160));
    setTimeout(() => { if (quoteRef.current) quoteRef.current.classList.add('va-in'); }, 800);
  }, [isLoading]);

  // Custom cursor
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

  // Cursor scale on interactive elements
  useEffect(() => {
    if (isLoading) return;
    const expand = () => { if (cursorRef.current) { cursorRef.current.style.width = '44px'; cursorRef.current.style.height = '44px'; } };
    const shrink = () => { if (cursorRef.current) { cursorRef.current.style.width = '14px'; cursorRef.current.style.height = '14px'; } };
    const els = document.querySelectorAll('a, button, .va-card, .va-ig');
    els.forEach(el => { el.addEventListener('mouseenter', expand); el.addEventListener('mouseleave', shrink); });
    return () => els.forEach(el => { el.removeEventListener('mouseenter', expand); el.removeEventListener('mouseleave', shrink); });
  }, [isLoading, locationInfo]);

  // Magnetic CTA button
  useEffect(() => {
    const btn = magnetRef.current;
    if (!btn) return;
    const onMove = e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.3}px,${y * 0.4}px) scale(1.05)`;
    };
    const onLeave = () => { btn.style.transform = ''; };
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    return () => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Synchronizing Voyage…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

      {/* Scroll progress bar */}
      <div className="va-progress" style={{ width: `${scrollPct}%` }} />

      {/* Cursor follower */}
      <div className="va-cursor-dot" ref={cursorRef} />

      <main className="va-main">

        {/* ── NAV ── */}
        <header id="va-nav" className="va-nav">
          <div>
            <h1 className="va-nav-title">VOYAGE ARTIFACTS</h1>
            <small className="va-nav-sub">Curated By Adam Liu</small>
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
            {/* Actual interactive Leaflet map (low opacity behind the overlay) */}
            <div className="va-map-actual">
              <Map locations={locationInfo} onSelectLocation={handleSelectLocation} />
            </div>
            {/* Decorative text overlay */}
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
                style={{ transitionDelay: `${index * 0.08}s` }}
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
                        <span className="va-card-glyph-label">3D MODEL</span>
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
              <div className="va-feature-meta">04 STEPS · SCROLL →</div>
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
              <h2>VOYAGE<br /><span className="va-foot-ghost">ARTIFACTS</span></h2>
              <p>Documenting curated artifacts from global expeditions, blending interactive 3D visualization with personal storytelling.</p>
            </div>
            <div className="va-foot-right">
              <div className="va-foot-label">Transmission</div>
              <a href="https://www.instagram.com/adam.liou/" target="_blank" rel="noopener noreferrer" className="va-ig" aria-label="Instagram">
                <FaInstagram size={22} />
              </a>
              <div className="va-v-badge">System Revision v2.3</div>
            </div>
          </div>
          <div className="va-foot-bottom">
            <div>© {new Date().getFullYear()} VOYAGE ARTIFACTS</div>
            <div className="va-foot-links">
              <span>Entry Log</span>
              <span>Adam Liou</span>
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
        body { margin: 0; padding: 0; background: #fafafe; cursor: crosshair; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; overflow-x: hidden; }
        ::selection { background: #000; color: #fff; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        a { color: inherit; text-decoration: none; }

        /* ── PROGRESS BAR ── */
        .va-progress { position: fixed; top: 0; left: 0; height: 3px; background: #000; z-index: 200; pointer-events: none; will-change: width; }

        /* ── CURSOR ── */
        .va-cursor-dot { position: fixed; top: 0; left: 0; width: 14px; height: 14px; border-radius: 50%; background: #000; pointer-events: none; z-index: 300; mix-blend-mode: difference; display: none; transition: width 0.3s, height 0.3s; }
        @media (hover: hover) { .va-cursor-dot { display: block; } }

        /* ── MAIN ── */
        .va-main { position: relative; background: #fafafe; min-height: 100vh; overflow-x: hidden; }

        /* ── NAV ── */
        .va-nav { position: fixed; top: 0; left: 0; right: 0; height: 64px; background: #000; color: #fff; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; box-shadow: 0 30px 60px -20px rgba(0,0,0,.2); transform: translateY(-110%); transition: transform 0.9s cubic-bezier(.2,.8,.2,1); }
        .va-nav.va-nav-in { transform: translateY(0); }
        .va-nav-title { font-size: 18px; font-weight: 900; font-style: italic; letter-spacing: -0.04em; margin: 0; line-height: 1; }
        .va-nav-sub { display: block; color: #666; font-size: 8px; letter-spacing: 0.3em; font-weight: 700; margin-top: 4px; text-transform: uppercase; }
        .va-nav-cta { background: #fff; color: #000; padding: 9px 16px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; position: relative; overflow: hidden; display: inline-block; }
        .va-nav-cta span { position: relative; z-index: 2; display: inline-block; transition: transform 0.55s cubic-bezier(.7,0,.2,1); }
        .va-nav-cta:hover span { transform: translateY(-140%); }
        .va-nav-cta::after { content: attr(data-text); position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform: translateY(140%); transition: transform 0.55s cubic-bezier(.7,0,.2,1); font-size: 9px; font-weight: 900; letter-spacing: 0.18em; }
        .va-nav-cta:hover::after { transform: translateY(0); }

        /* ── HERO ── */
        .va-hero-section { max-width: 1400px; margin: 0 auto; padding: 120px 32px 160px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; }
        .va-pill { background: #000; color: #fff; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 48px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 30px 60px -20px rgba(0,0,0,.15); will-change: transform; }
        .va-dot { width: 6px; height: 6px; border-radius: 50%; background: #7CFFB2; box-shadow: 0 0 12px #7CFFB2; animation: va-pulse 1.6s infinite; display: inline-block; flex-shrink: 0; }
        @keyframes va-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* ── DISPLAY TYPE ── */
        .va-display { font-size: clamp(56px, 11vw, 160px); font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.06em; line-height: 0.88; margin: 0 0 60px; max-width: 1100px; }
        .va-row { display: block; overflow: hidden; }
        .va-word { display: inline-block; transform: translateY(110%); transition: transform 1.1s cubic-bezier(.2,.8,.2,1); will-change: transform; }
        .va-line.va-in .va-word { transform: translateY(0); }
        .va-row-muted .va-word { color: #bdbdc4; }

        .va-hero-display { margin-bottom: 60px; }

        /* ── HERO QUOTE ── */
        .va-hero-quote { max-width: 740px; background: #fff; border: 1px solid #f0f0f3; padding: 44px; border-radius: 48px; box-shadow: 0 60px 120px -40px rgba(0,0,0,.06); position: relative; overflow: hidden; opacity: 0; transform: translateY(40px); transition: transform 1.1s cubic-bezier(.2,.8,.2,1) 0.35s, opacity 1.1s 0.35s; will-change: transform, opacity; }
        .va-hero-quote.va-in { opacity: 1; transform: translateY(0); }
        .va-hero-quote p { margin: 0; font-size: 19px; line-height: 1.55; color: #5b5b66; font-weight: 600; font-style: italic; position: relative; z-index: 2; transition: color 0.6s; }
        .va-hero-quote:hover p { color: #000; }
        .va-blob { position: absolute; right: -32px; bottom: -32px; width: 128px; height: 128px; border-radius: 50%; background: #f5f5f8; transition: transform 1s; }
        .va-hero-quote:hover .va-blob { transform: scale(1.25); }

        /* ── SCROLL CUE ── */
        .va-scroll-cue { margin-top: 80px; display: flex; flex-direction: column; align-items: center; gap: 14px; color: #9a9aa3; font-size: 9px; letter-spacing: 0.4em; font-weight: 800; text-transform: uppercase; }
        .va-cue-bar { width: 1px; height: 60px; background: linear-gradient(#000, transparent); position: relative; overflow: hidden; }
        .va-cue-bar::after { content: ""; position: absolute; left: 0; right: 0; top: -30px; height: 30px; background: #000; animation: va-cue 2.2s infinite; }
        @keyframes va-cue { 0% { transform: translateY(0); } 100% { transform: translateY(120px); } }

        /* ── MARQUEE ── */
        .va-marquee { border-top: 1px solid #ececef; border-bottom: 1px solid #ececef; padding: 36px 0; overflow: hidden; background: #fafafe; }
        .va-marquee-track { display: flex; gap: 64px; width: max-content; animation: va-scroll 50s linear infinite; align-items: center; }
        .va-marquee:hover .va-marquee-track { animation-play-state: paused; }
        .va-marquee-item { display: flex; align-items: center; gap: 24px; font-style: italic; font-weight: 900; font-size: 64px; letter-spacing: -0.04em; text-transform: uppercase; white-space: nowrap; }
        .va-star { font-size: 36px; font-style: normal; color: #000; display: inline-block; animation: va-spin 8s linear infinite; }
        .va-ghost { -webkit-text-stroke: 1.5px #000; color: transparent; }
        @keyframes va-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes va-spin { to { transform: rotate(360deg); } }

        /* ── MAP STORY ── */
        .va-map-story { position: relative; height: 100vh; }
        .va-map-sticky { position: sticky; top: 64px; height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden; }
        .va-map-sticky::before { content: ""; position: absolute; inset: 0; background: radial-gradient(1200px 600px at 30% 40%, rgba(255,255,255,.08), transparent 60%), radial-gradient(800px 500px at 75% 65%, rgba(255,255,255,.05), transparent 60%); pointer-events: none; z-index: 6; }
        .va-map-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px); background-size: 60px 60px; transform: perspective(800px) rotateX(45deg) translateY(-10%) scale(1.6); transform-origin: center bottom; mask-image: radial-gradient(ellipse 60% 50% at center, black 30%, transparent 80%); -webkit-mask-image: radial-gradient(ellipse 60% 50% at center, black 30%, transparent 80%); animation: va-gridPulse 6s ease-in-out infinite; z-index: 1; }
        @keyframes va-gridPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .va-map-actual { position: absolute; inset: 0; opacity: 0.2; z-index: 4; pointer-events: all; transition: opacity 1s; }
        .va-map-actual:hover { opacity: 0.5; }
        .va-map-content { position: absolute; z-index: 10; color: #fff; text-align: center; max-width: 900px; padding: 0 32px; pointer-events: none; }
        .va-map-content .va-display { color: #fff; margin-bottom: 0; }
        .va-map-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,0,0,.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.1); padding: 10px 20px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: #bdbdc4; margin-bottom: 32px; }
        .va-map-content p { font-size: 16px; color: #9a9aa3; font-weight: 600; font-style: italic; max-width: 520px; margin: 20px auto 0; line-height: 1.6; }
        .va-pin { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 0 rgba(255,255,255,.6); animation: va-ping 2.6s infinite; z-index: 8; pointer-events: none; }
        .va-pin::after { content: ""; position: absolute; inset: -12px; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; }
        .va-pin-1 { top: 32%; left: 20%; animation-delay: 0s; }
        .va-pin-2 { top: 48%; left: 72%; animation-delay: 0.6s; }
        .va-pin-3 { top: 62%; left: 35%; animation-delay: 1.1s; }
        .va-pin-4 { top: 38%; left: 55%; animation-delay: 1.6s; }
        @keyframes va-ping { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,.6); } 80%, 100% { box-shadow: 0 0 0 28px rgba(255,255,255,0); } }

        /* ── GALLERY ── */
        .va-gallery { max-width: 1400px; margin: 0 auto; padding: 120px 32px 160px; }
        .va-gallery-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 80px; padding: 0 16px; }
        .va-gallery-title { font-size: clamp(40px, 5vw, 72px); font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.06em; line-height: 0.9; margin: 0; }
        .va-gallery-sub { font-size: 11px; letter-spacing: 0.3em; font-weight: 800; color: #bdbdc4; text-transform: uppercase; margin-top: 8px; }
        .va-gallery-line { flex: 1; height: 1px; background: #ececef; margin: 0 48px 8px; }
        .va-gallery-count { font-size: 48px; font-weight: 900; font-style: italic; color: #e8e8ec; line-height: 1; text-align: right; }
        .va-gallery-count-sub { font-size: 9px; letter-spacing: 0.25em; font-weight: 900; color: #d0d0d6; text-transform: uppercase; text-align: right; margin-top: 4px; }
        .va-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 32px; }

        /* ── CARDS ── */
        .va-card { background: #fff; border: 1px solid #f0f0f3; border-radius: 40px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,.02); transition: box-shadow 0.8s, transform 0.8s cubic-bezier(.2,.8,.2,1), border-color 0.8s, opacity 0.8s; cursor: pointer; display: flex; flex-direction: column; gap: 24px; transform: translateY(60px) scale(0.96); opacity: 0; outline: none; }
        .va-card.va-in { transform: translateY(0) scale(1); opacity: 1; }
        .va-card:hover { box-shadow: 0 60px 100px -40px rgba(0,0,0,.12); transform: translateY(-6px) scale(1) !important; }
        .va-card:focus-visible { border-color: #000; box-shadow: 0 0 0 3px rgba(0,0,0,.15); }
        .va-card-thumb { height: 280px; background: #fafafa; border-radius: 28px; overflow: hidden; position: relative; }
        .va-card-index { position: absolute; top: 16px; left: 16px; background: #fff; color: #000; border: 1px solid #f0f0f3; padding: 6px 10px; border-radius: 8px; font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; z-index: 3; transition: background 0.5s, color 0.5s; }
        .va-card:hover .va-card-index { background: #000; color: #fff; }
        .va-card-canvas { width: 100%; height: 100%; }
        .va-card-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; background: repeating-linear-gradient(45deg, #f5f5f8 0 12px, #fafafe 12px 24px); }
        .va-card-glyph { width: 60px; height: 60px; border: 2px solid #000; transition: transform 1.2s cubic-bezier(.2,.8,.2,1); }
        .va-card:hover .va-card-glyph { transform: rotate(45deg) scale(1.15); }
        .va-card-glyph-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #a0a0a8; letter-spacing: 0.2em; text-transform: uppercase; }
        .va-reveal-cta { position: absolute; left: 16px; right: 16px; bottom: 16px; background: #000; color: #fff; padding: 14px; border-radius: 14px; font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; z-index: 3; transform: translateY(20px); opacity: 0; transition: transform 0.7s cubic-bezier(.2,.8,.2,1), opacity 0.7s; }
        .va-card:hover .va-reveal-cta { transform: translateY(0); opacity: 1; }
        .va-card-meta { padding: 0 8px; display: flex; flex-direction: column; gap: 16px; }
        .va-card-meta h4 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; line-height: 1.1; margin: 0; min-height: 60px; display: flex; align-items: flex-end; transition: color 0.5s; }
        .va-card:hover .va-card-meta h4 { color: #5b5b66; }
        .va-card-tags { display: flex; align-items: center; gap: 8px; border-top: 1px solid #f5f5f8; padding-top: 12px; flex-wrap: wrap; }
        .va-tag-loc { background: #000; color: #fff; padding: 5px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; line-height: 1; }
        .va-tag-date { font-size: 9px; font-weight: 900; color: #c0c0c8; letter-spacing: 0.18em; text-transform: uppercase; line-height: 1; padding-left: 8px; border-left: 1px solid #ececef; }

        /* ── HORIZONTAL SCROLL PROCESS ── */
        .va-feature { position: relative; height: 300vh; }
        .va-feature-pin { position: sticky; top: 0; height: 100vh; overflow: hidden; display: flex; align-items: center; background: #0b0b0d; color: #fff; }
        .va-feature-track { display: flex; gap: 48px; padding: 0 64px; will-change: transform; }
        .va-feature-card { flex: 0 0 auto; width: 520px; height: 64vh; border-radius: 32px; overflow: hidden; position: relative; background: #161618; border: 1px solid rgba(255,255,255,.06); display: flex; flex-direction: column; justify-content: flex-end; padding: 36px; }
        .va-feature-ph { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 18px, rgba(255,255,255,.06) 18px 36px); }
        .va-feature-ph::after { content: ""; position: absolute; inset: 30%; border: 2px solid rgba(255,255,255,.18); border-radius: 8px; }
        .va-feature-accent { background: #fff; color: #000; }
        .va-feature-accent .va-feature-ph { background: repeating-linear-gradient(45deg, #f5f5f8 0 18px, #fafafe 18px 36px); }
        .va-feature-accent .va-feature-ph::after { border-color: #000; }
        .va-feature-num { position: absolute; top: 24px; right: 24px; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.3em; color: #666; text-transform: uppercase; }
        .va-feature-accent .va-feature-num { color: #bdbdc4; }
        .va-feature-body { position: relative; z-index: 2; }
        .va-feature-eyebrow { font-size: 10px; letter-spacing: 0.3em; color: #a0a0a8; font-weight: 900; text-transform: uppercase; margin-bottom: 14px; }
        .va-feature-accent .va-feature-eyebrow { color: #9a9aa3; }
        .va-feature-body h5 { font-size: 42px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.95; margin: 0 0 16px; }
        .va-feature-body p { font-size: 14px; color: #9a9aa3; line-height: 1.55; font-style: italic; margin: 0; max-width: 380px; }
        .va-feature-accent .va-feature-body p { color: #5b5b66; }
        .va-feature-header { position: absolute; top: 0; left: 0; right: 0; padding: 96px 64px 0; display: flex; justify-content: space-between; align-items: flex-start; z-index: 3; pointer-events: none; }
        .va-feature-header h3 { font-size: clamp(36px, 5vw, 80px); font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.06em; line-height: 0.9; margin: 0; max-width: 560px; color: #fff; }
        .va-feature-meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.3em; color: #555; text-transform: uppercase; text-align: right; padding-top: 8px; }
        .va-feature-progress { position: absolute; bottom: 48px; left: 64px; right: 64px; height: 1px; background: rgba(255,255,255,.1); z-index: 3; }
        .va-feature-fill { height: 100%; background: #fff; width: 0%; }

        /* ── CTA STRIP ── */
        .va-cta-strip { background: #000; color: #fff; padding: 160px 32px; text-align: center; position: relative; overflow: hidden; border-radius: 48px 48px 0 0; }
        .va-cta-display { color: #fff; }
        .va-stroke { -webkit-text-stroke: 2px #fff; color: transparent; }
        .va-magnet-wrap { margin-top: 60px; display: flex; justify-content: center; }
        .va-magnet { background: #fff; color: #000; padding: 24px 48px; border-radius: 999px; font-size: 12px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; cursor: pointer; border: none; font-family: 'Inter', Helvetica, Arial, sans-serif; transition: box-shadow 0.3s; }
        .va-magnet:hover { box-shadow: 0 20px 60px rgba(255,255,255,.2); }

        /* ── FOOTER ── */
        .va-footer { background: #000; color: #fff; padding: 64px 32px 40px; }
        .va-foot-inner { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .va-foot-inner > div > h2 { font-size: clamp(32px, 4vw, 56px); font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.06em; line-height: 0.9; margin: 0; }
        .va-foot-ghost { color: #333; }
        .va-foot-inner > div > p { color: #666; font-size: 14px; font-weight: 600; font-style: italic; line-height: 1.5; max-width: 380px; margin: 24px 0 0; }
        .va-foot-right { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 32px; }
        .va-foot-label { font-size: 9px; letter-spacing: 0.5em; font-weight: 900; color: #444; text-transform: uppercase; text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
        .va-ig { width: 56px; height: 56px; border-radius: 18px; background: #111; border: 1px solid #1f1f24; display: flex; align-items: center; justify-content: center; color: #fff; transition: background 0.6s, color 0.6s, transform 0.6s; }
        .va-ig:hover { background: #fff; color: #000; transform: scale(1.08) rotate(-6deg); }
        .va-v-badge { font-size: 9px; letter-spacing: 0.3em; font-weight: 900; color: #666; text-transform: uppercase; border: 1px solid #1f1f24; background: rgba(20,20,24,.5); padding: 10px 20px; border-radius: 999px; }
        .va-foot-bottom { max-width: 1400px; margin: 32px auto 0; border-top: 1px solid #1f1f24; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; color: #444; letter-spacing: 0.3em; text-transform: uppercase; }
        .va-foot-links { display: flex; gap: 32px; color: #333; }

        /* ── GENERIC REVEAL ── */
        .va-reveal { opacity: 0; transform: translateY(40px); transition: opacity 1s cubic-bezier(.2,.8,.2,1), transform 1s cubic-bezier(.2,.8,.2,1); }
        .va-reveal.va-in { opacity: 1; transform: translateY(0); }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .va-nav { padding: 0 20px; }
          .va-hero-section { padding: 96px 20px 80px; }
          .va-display { font-size: clamp(44px, 12vw, 72px); line-height: 0.92; }
          .va-hero-quote { padding: 28px; border-radius: 28px; }
          .va-hero-quote p { font-size: 15px; }
          .va-marquee-item { font-size: 40px; }
          .va-gallery { padding: 60px 16px 80px; }
          .va-gallery-head { flex-direction: column; align-items: flex-start; gap: 12px; padding: 0; }
          .va-gallery-line { display: none; }
          .va-gallery-count { text-align: left; }
          .va-grid-cards { grid-template-columns: 1fr 1fr; gap: 12px; }
          .va-card { border-radius: 24px; padding: 14px; gap: 14px; }
          .va-card-thumb { height: 180px; border-radius: 16px; }
          .va-card-meta h4 { font-size: 16px; min-height: 40px; }
          .va-feature-card { width: 82vw; height: 60vh; }
          .va-feature-header { padding: 64px 24px 0; }
          .va-feature-track { padding: 0 24px; gap: 24px; }
          .va-cta-strip { padding: 80px 20px; border-radius: 28px 28px 0 0; }
          .va-magnet { padding: 18px 32px; font-size: 10px; }
          .va-foot-inner { grid-template-columns: 1fr; gap: 32px; }
          .va-foot-right { align-items: flex-start; }
          .va-map-content p { display: none; }
        }
      `}</style>
    </>
  );
}
