import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaInstagram, FaArrowRight } from 'react-icons/fa';
import { locationInfo as defaultLocationInfo } from '../data/collections';
import Head from 'next/head';
import Link from 'next/link';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Dynamic imports for performance and SSR safety
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 rounded-[2rem] animate-pulse flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs">Initializing Map Engine...</div>
});

const ModelPopup = dynamic(() => import('../components/ModelPopup'), {
  ssr: false
});

const ModelPreview = dynamic(() => import('../components/ModelPreview'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center text-gray-200 text-[8px] font-black uppercase tracking-widest">Warping Asset...</div>
});


const ParallaxHero = () => {
  const [scrollY, setScrollY] = useState(0);


  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="max-w-[1400px] mx-auto px-8 pt-6 sm:pt-20 pb-12 sm:pb-40 flex flex-col items-center text-center relative pointer-events-none">
      <div
        className="bg-black text-white px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-3 sm:mb-12 animate-fade-in shadow-xl shadow-black/5 pointer-events-auto whitespace-nowrap"
        style={{
          transform: `translate3d(0, ${scrollY * 0.1}px, 0)`,
          willChange: 'transform'
        }}
      >
        Now Live: Interactive Collection v2.1
      </div>

      <h2 className="text-5xl sm:text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tightest leading-[1] sm:leading-[0.8] text-black mb-6 sm:mb-12 max-w-6xl italic uppercase relative">
        <span
          className="block relative z-20"
          style={{
            transform: `translate3d(${scrollY * -0.15}px, 0, 0)`,
            willChange: 'transform'
          }}
        >
          Explore the stories
        </span>
        <span
          className="block text-gray-400 mt-2 sm:mt-4 opacity-70"
          style={{
            transform: `translate3d(${scrollY * 0.25}px, 0, 0)`,
            willChange: 'transform'
          }}
        >
          left behind by time.
        </span>
      </h2>

      <div
        className="max-w-3xl bg-white border border-gray-100 p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl shadow-black/[0.03] mt-6 sm:mt-12 relative overflow-hidden group pointer-events-auto"
        style={{
          transform: `translate3d(0, ${scrollY * -0.05}px, 0)`,
          willChange: 'transform'
        }}
      >
        <p className="text-gray-600 text-sm md:text-xl leading-snug md:leading-relaxed font-semibold italic relative z-10 transition-colors group-hover:text-black duration-500">
          &ldquo;Every journey leaves behind meaningful treasures. This digital vault showcases objects from my travels, each holding a fragment of the destination, the culture, and the moment.&rdquo;
        </p>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gray-50 rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
      </div>
    </section>
  );
};

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [locationInfo, setLocationInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSelectedLocation(null);
    }, 800);
  }, []);

  const handleSelectLocation = useCallback((location) => {
    setSelectedLocation(location);
  }, []);


  // Load initial data
  useEffect(() => {
    setLocationInfo(defaultLocationInfo);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing Voyage...</p>
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

      <main className="relative bg-[#fafafe] min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden">

        {/* Unified Navigation */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-black z-[100] flex items-center justify-between px-6 sm:px-10 shadow-2xl shadow-black/20">
          <div className="flex flex-col">
            <h1 className="text-white font-black tracking-tighter text-lg leading-none italic">VOYAGE ARTIFACTS</h1>
            <p className="text-gray-500 text-[8px] tracking-[0.3em] mt-1 uppercase font-bold">Curated By Adam Liu</p>
          </div>
          <Link
            href="/admin"
            className="text-[9px] font-black bg-white text-black px-4 py-2 rounded-full hover:bg-gray-100 transition-all uppercase tracking-widest shadow-xl shadow-black/10"
          >
            Management
          </Link>
        </header>

        <div className="h-16"></div>
        {/* Premium Hero Section with Parallax */}
        <ParallaxHero />

        {/* Global Map Display - Full Bleed Design */}
        <section className="w-full mb-40 overflow-hidden relative">
          <div className="h-[600px] md:h-[850px] bg-black relative group">
            <div className="absolute top-6 sm:top-10 left-6 sm:left-10 z-20 bg-black/95 backdrop-blur-2xl text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-2 sm:gap-3 group-hover:-translate-y-1 transition-transform duration-700 pointer-events-none max-w-[calc(100vw-3rem)]">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse shrink-0"></div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-px truncate">Tactical Archive</p>
            </div>

            <div className="w-full h-full grayscale-[0.3] contrast-[1.05] hover:grayscale-0 transition-all duration-1000">
              <Map
                locations={locationInfo}
                onSelectLocation={handleSelectLocation}
              />
            </div>

            {/* Artistic Overlays */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#fafafe] to-transparent pointer-events-none z-10"></div>
          </div>
        </section>

        {/* Gallery Section - Horizontal Exhibition for Mobile */}
        <section className="max-w-[1400px] mx-auto px-6 sm:px-8 pb-12 sm:pb-40">
          <div className="flex items-end justify-between mb-10 sm:mb-20 px-2 sm:px-4">
            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none italic">Manifest</h3>
              <p className="text-[8px] sm:text-xs text-gray-400 font-bold tracking-[0.3em] uppercase">Archive Records</p>
            </div>
            <div className="h-px flex-1 mx-6 sm:mx-12 bg-gray-100 mb-2 hidden md:block"></div>
            <div className="text-right">
              <p className="text-2xl sm:text-4xl font-black italic text-gray-200">{locationInfo.length}</p>
              <p className="text-[7px] sm:text-[10px] font-black uppercase text-gray-300 tracking-widest">Total</p>
            </div>
          </div>

          <div className="flex overflow-x-auto pb-8 sm:pb-0 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 -mx-6 px-6 sm:mx-0 sm:px-0">
            {locationInfo.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSelectLocation(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectLocation(item);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${item.name}`}
                className="group flex-shrink-0 w-[240px] sm:w-auto bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-2xl hover:shadow-black/[0.04] transition-all duration-700 cursor-pointer flex flex-col justify-between snap-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10 focus-visible:border-black text-left"
              >
                <div className="space-y-4 sm:space-y-6">
                  <div className="h-48 sm:h-72 bg-gray-50/50 rounded-[1.2rem] sm:rounded-[2rem] overflow-hidden relative group/canvas">
                    {/* Artifact Index */}
                    <div className="absolute top-3 left-3 sm:top-5 left-5 bg-white shadow-xl px-2 py-1 rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest z-10 border border-gray-50 text-black group-hover:bg-black group-hover:text-white transition-colors duration-500">
                      R-0{index + 1}
                    </div>

                    {/* Live 3D Preview inside Card */}
                    <div className="w-full h-full relative z-0 opacity-90 group-hover:opacity-100 transition-opacity duration-700">
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
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-200 font-bold uppercase tracking-widest italic">Syncing...</div>
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-700 z-10 pointer-events-none">
                      <div className="w-full bg-black text-white py-3 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl shadow-black/20">
                        View <FaArrowRight size={8} />
                      </div>
                    </div>
                  </div>

                  <div className="px-1 sm:px-2">
                    {/* Fixed height title container for vertical alignment */}
                    <div className="h-16 sm:h-24 md:h-28 flex flex-col justify-end mb-3 sm:mb-4">
                      <h4 className="text-base sm:text-2xl md:text-3xl font-black uppercase tracking-tightest leading-[1.1] text-black line-clamp-2 sm:line-clamp-3 transition-colors group-hover:text-gray-600">
                        {item.name}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-50">
                      <p className="text-[7px] sm:text-[9px] font-black text-white bg-black px-2 py-1 rounded-md sm:rounded-lg uppercase tracking-widest leading-none shadow-lg shadow-black/5 whitespace-nowrap">
                        {item.location}
                      </p>
                      <p className="text-[7px] sm:text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none pl-2 border-l border-gray-100 whitespace-nowrap">
                        {item.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Global Footer - Compacted */}
        <footer className="bg-black text-white pt-6 sm:pt-16 pb-4 sm:pb-10 rounded-t-[1.5rem] sm:rounded-t-[3rem] relative z-10">
          <div className="max-w-[1400px] mx-auto px-8 sm:px-12">
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-20 mb-4 sm:mb-16">
              <div className="flex items-center justify-between sm:block space-y-0 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-4xl font-black tracking-tightest uppercase italic leading-none">VOYAGE <span className="sm:hidden text-gray-700">ARTIFACTS</span><br className="hidden sm:block" /><span className="hidden sm:inline text-gray-700">ARTIFACTS</span></h2>
                  <p className="hidden sm:block text-gray-600 text-[9px] font-bold tracking-[0.4em] mt-3 uppercase">Digital Journey Record</p>
                </div>

                <div className="flex sm:hidden items-center gap-4">
                  <a
                    href="https://www.instagram.com/adam.liou/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white"
                    aria-label="Instagram"
                  >
                    <FaInstagram size={14} />
                  </a>
                  <div className="text-[6px] font-black text-gray-600 uppercase tracking-[0.2em] border border-zinc-900 px-2 py-1 rounded-full bg-zinc-900/50">
                    v2.3
                  </div>
                </div>

                <p className="hidden sm:block text-gray-500 leading-relaxed font-semibold text-lg max-w-md italic opacity-80">
                  Documenting curated artifacts from global expeditions, blending interactive 3D visualization with personal storytelling.
                </p>
              </div>

              <div className="hidden sm:flex flex-col md:items-end justify-between">
                <div className="space-y-6 md:text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-700 underline decoration-2 underline-offset-4 mb-4">Transmission</p>
                  <div className="flex md:justify-end">
                    <a
                      href="https://www.instagram.com/adam.liou/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:bg-white hover:text-black hover:scale-110 transition-all duration-700 shadow-2xl group"
                      aria-label="Instagram"
                    >
                      <FaInstagram size={20} className="group-hover:rotate-12 transition-transform duration-500" />
                    </a>
                  </div>
                </div>
                <div className="mt-0 text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] border border-zinc-900 px-6 py-3 rounded-full bg-zinc-900/50">
                  System Revision v2.3
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 sm:pt-8 flex flex-row justify-between items-center gap-4">
              <p className="text-[7px] sm:text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em]">
                &copy; {new Date().getFullYear()} VOYAGE <span className="hidden sm:inline">ARTIFACTS</span>
              </p>
              <div className="flex gap-4 sm:gap-8 text-[6px] sm:text-[8px] font-black text-gray-800 uppercase tracking-[0.4em]">
                <span className="hover:text-white transition-colors cursor-default select-none">Entry Log</span>
                <span className="hover:text-white transition-colors cursor-default select-none">Adam Liou</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Dynamic Popup Engine */}
        {selectedLocation && (
          <ModelPopup
            selectedLocation={selectedLocation}
            isClosing={isClosing}
            onClose={handleClose}
          />
        )}

        <SpeedInsights />
      </main >

      <style jsx global>{`
        @font-face {
          font-family: 'Inter';
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        }
        body { background-color: #fafafe; cursor: crosshair; }
        ::selection { background: #000; color: #fff; }
        ::-webkit-scrollbar { width: 0; }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .tracking-tightest { letter-spacing: -0.06em; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
