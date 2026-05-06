import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Dynamic imports for performance and SSR safety

const ModelPreview = dynamic(() => import('../components/ModelPreview'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse flex items-center justify-center text-gray-400 rounded-xl">Initializing 3D Viewer...</div>
});

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [collections, setCollections] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    location: '',
    date: '',
    modelPath: '',
    scale: 1,
    intensity: 1.5,
    rotationY: 0,
    autoRotateSpeed: 2,
    coordinates: [35.6762, 139.6503],
    travelNote: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const router = useRouter();

  // Load initial data and handle Localhost Auth
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { locationInfo } = await import('../data/collections');
        setCollections(locationInfo);

        const res = await fetch('/api/getModels');
        const data = await res.json();
        setAvailableModels(data.models || []);

        setIsLoading(false);
      } catch (err) {
        console.error('Initial load failed:', err);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const checkPassword = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        setAuthorized(true);
      } else {
        alert('Access Denied: Incorrect Security Key.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert('Authentication failed.');
    }
  };

  // --- Biometric (WebAuthn) Logic ---
  const [hasBiometrics, setHasBiometrics] = useState(false);

  const authenticateBiometrics = async () => {
    try {
      if (typeof window === 'undefined') return;
      const credIdBase64 = localStorage.getItem('voyage_cred_id');
      if (!credIdBase64) return;

      console.log('Attempting Biometric Auth with ID:', credIdBase64);

      let credentialId;
      try {
        // Robust base64 to Uint8Array decoding
        const binaryString = atob(credIdBase64);
        credentialId = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          credentialId[i] = binaryString.charCodeAt(i);
        }
      } catch (e) {
        console.error('Stored Biometric ID is malformed. Clearing it.', e);
        localStorage.removeItem('voyage_cred_id');
        setHasBiometrics(false);
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertionOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: "required",
          timeout: 60000
        }
      };

      const assertion = await navigator.credentials.get(assertionOptions);
      if (assertion) {
        setAuthorized(true);
      }
    } catch (err) {
      console.error('Biometric auth failed:', err);
      // We don't alert here to avoid annoying popups if the system dialog is dismissed
    }
  };

  useEffect(() => {
    // Check if device already has a registered credential
    if (typeof window !== 'undefined') {
      const credId = localStorage.getItem('voyage_cred_id');
      if (credId) {
        setHasBiometrics(true);
        // Automatically trigger biometric login if not authorized
        if (!authorized) {
          authenticateBiometrics();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerBiometrics = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userID = Uint8Array.from("voyage-admin-user", c => c.charCodeAt(0));

      const createCredentialOptions = {
        publicKey: {
          challenge: challenge,
          rp: { name: "Voyage Artifacts", id: window.location.hostname },
          user: {
            id: userID,
            name: "admin@voyage.travel",
            displayName: "Adam Liu"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: { userVerification: "preferred" },
          timeout: 60000,
          attestation: "direct"
        }
      };

      const credential = await navigator.credentials.create(createCredentialOptions);
      if (credential) {
        // Robust Uint8Array to Base64 encoding
        const binary = String.fromCharCode(...new Uint8Array(credential.rawId));
        const base64 = btoa(binary);

        localStorage.setItem('voyage_cred_id', base64);
        setHasBiometrics(true);
        alert('FaceID / TouchID registered successfully on this device!');
      }
    } catch (err) {
      console.error('Biometric registration failed:', err);
      alert('Registration failed: ' + err.message);
    }
  };

  // Location search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationSearch && locationSearch.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/geocode?query=${encodeURIComponent(locationSearch)}`);
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();
          setSearchResults(data.results || []);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  const handleSelectLocation = (result) => {
    setNewItem({
      ...newItem,
      location: result.name.split(',')[0],
      coordinates: result.coordinates
    });
    setLocationSearch('');
    setSearchResults([]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert(`⚠️ 檔案過大 (${(file.size / 1024 / 1024).toFixed(1)}MB)\n\nGitHub API 單檔上限為 50MB。`);
      return;
    }

    if (!confirm(`Confirm upload ${file.name} to GitHub cloud?`)) return;

    setIsSyncing(true);

    // Promisify the file reading process
    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64 = result.split(',')[1];
          if (!base64) reject(new Error('Failed to parse file content as base64'));
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    };

    try {
      console.log('Step 1: Reading file as Base64...');
      const base64Content = await readFileAsBase64(file);

      console.log('Step 2: Uploading via server-side GitHub sync...');
      const pushRes = await fetch('/api/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: base64Content,
          path: `public/models/${file.name}`,
          message: `Upload new 3D model: ${file.name}`,
          isBinary: true,
        }),
      });

      const data = await pushRes.json();

      if (pushRes.ok) {
        console.log('Cloud Sync Successful:', data);
        alert('Model uploaded to GitHub! Vercel will rebuild soon.');
        const newModelPath = `/models/${file.name}`;

        setAvailableModels(prev => {
          const updated = [...prev];
          if (!updated.includes(newModelPath)) updated.push(newModelPath);
          return updated;
        });
        setNewItem(prev => ({ ...prev, modelPath: newModelPath }));
      } else {
        console.error('Upload API Error:', data);
        const detailedError = data.message ? `\n\nDetails: ${data.message}` : '';
        throw new Error(`GitHub API Error (${pushRes.status})${detailedError}`);
      }
    } catch (err) {
      console.error('File Upload Logic Error:', err);
      // Log the stack trace to help pinpoint the exact line
      console.error('Stack Trace:', err.stack);

      let msg = err.message;
      if (msg.includes('The string did not match the expected pattern')) {
        msg += '\n\n(這通常是 atob/btoa 處理異常。請打開開發者工具 Console 查看詳細堆棧日誌)';
      }
      alert('Upload failed: ' + msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCollectionsToCloud = async () => {
    if (!confirm('Synchronize all changes to production? This will trigger a site rebuild.')) return;
    setIsSyncing(true);
    try {
      const content = `export const locationInfo = ${JSON.stringify(collections, null, 2)};`;
      const res = await fetch('/api/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'data/collections.js',
          content: content,
          message: 'Update artifact manifest via CMS'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Manifest synchronized! Site rebuild started (takes ~1 min).');
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      setCollections(prev => prev.map(item => item.id === editId ? { ...newItem, id: editId } : item));
      setEditMode(false);
      setEditId(null);
    } else {
      setCollections(prev => [...prev, { ...newItem, id: Date.now() }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      location: '',
      date: '',
      modelPath: '',
      scale: 1,
      intensity: 1.5,
      rotationY: 0,
      autoRotateSpeed: 2,
      coordinates: [35.6762, 139.6503],
      travelNote: ''
    });
    setLocationSearch('');
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans p-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-900 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse delay-700"></div>

        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl relative z-10 backdrop-blur-3xl">
          <div className="text-center mb-12">
            <h1 className="text-white text-3xl font-black tracking-tighter italic mb-2">VOYAGE SECURE</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Authorization Required</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Protocol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                placeholder="Enter Access Key..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold tracking-widest focus:border-white/40 focus:bg-white/10 outline-none transition-all placeholder:text-gray-700"
              />
            </div>
            <button
              onClick={checkPassword}
              className="w-full bg-white text-black font-black py-4 rounded-full text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Verify Identity
            </button>

            {hasBiometrics && (
              <div className="pt-4 mt-4 border-t border-white/5">
                <button
                  onClick={authenticateBiometrics}
                  className="w-full bg-zinc-900 text-white border border-white/10 font-bold py-4 rounded-full text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11V6a3 3 0 0 1 6 0v5" /><rect x="5" y="11" width="14" height="10" rx="2" /></svg>
                  FaceID Login
                </button>
              </div>
            )}
          </div>
          <p className="mt-10 text-center text-[8px] text-gray-600 font-black uppercase tracking-[0.3em]">System Version: CURATOR_ENGINE_ALPHA</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-medium animate-pulse">Syncing with repository...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 pt-24">
      {/* Header - Voyage Clean Style */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-black z-40 flex items-center justify-between px-8 sm:px-12 backdrop-blur-md bg-opacity-95">
        <div className="flex flex-col">
          <h1 className="text-white font-bold tracking-tight text-xl leading-none">VOYAGE CMS</h1>
          <p className="text-gray-400 text-[10px] tracking-widest mt-1 uppercase">Curated Travel Collections</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={registerBiometrics}
            className="text-[9px] font-black text-white px-4 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
            Setup FaceID
          </button>
          <button
            disabled={isSyncing}
            onClick={syncCollectionsToCloud}
            className={`text-xs font-bold bg-white text-black px-6 py-3 rounded-full hover:bg-gray-100 transition-all shadow-xl shadow-black/20 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? 'Syncing...' : 'Commit & Deploy Changes'}
          </button>
        </div>
      </header>

      <main className="px-6 sm:px-12 max-w-[1000px] mx-auto space-y-12">
        {/* Main Content: Form */}
        <div className="space-y-8">
          <section className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-black rounded-full"></span>
                  {editMode ? 'Edit Artifact Information' : 'Catalog New Artifact'}
                </h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-4 italic">Artifact ID: {editMode ? editId : 'NEW_ENTRY'}</p>
              </div>

              {/* Integrated Form 3D Preview */}
              <div className="w-full md:w-48 h-48 bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden shadow-sm relative group">
                <div className="absolute inset-0 z-10 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                  <span className="text-[8px] font-black text-white px-3 py-1 bg-black rounded-full uppercase tracking-widest">Live Engine</span>
                </div>
                {newItem.modelPath ? (
                  <ModelPreview
                    modelPath={newItem.modelPath}
                    scale={1}
                    intensity={newItem.intensity}
                    rotationY={newItem.rotationY}
                    autoRotateSpeed={newItem.autoRotateSpeed}
                    adjustCamera={1.8}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-200 font-bold uppercase tracking-[0.2em] text-center px-4 italic">Awaiting Asset</div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Artifact Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. Vintage Postcard"
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Extraction Date</label>
                  <input
                    type="text"
                    value={newItem.date}
                    onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                    placeholder="YYYY-MM (e.g. 2024-10)"
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-200"
                    required
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Geographic Locale</label>
                  <input
                    type="text"
                    value={locationSearch || newItem.location}
                    onChange={e => setLocationSearch(e.target.value)}
                    placeholder="Search city, country..."
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-200"
                    required
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[60]">
                      {searchResults.map(res => (
                        <div
                          key={res.id}
                          onClick={() => handleSelectLocation(res)}
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer text-sm font-semibold border-b border-gray-50 last:border-none transition-colors"
                        >
                          {res.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Object Scale Factor</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItem.scale}
                    onChange={e => setNewItem({ ...newItem, scale: parseFloat(e.target.value) })}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">3D Asset Source (.glb)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={newItem.modelPath}
                    onChange={e => setNewItem({ ...newItem, modelPath: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="">Select from library...</option>
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m.replace('/models/', '')}</option>
                    ))}
                  </select>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl px-5 py-3.5 font-bold flex items-center justify-center gap-2 group-hover:bg-gray-100 transition-all text-xs text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Direct Cloud Upload
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Brief Description</label>
                <textarea
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900 resize-none placeholder:text-gray-200"
                  required
                />
              </div>

              {/* 3D Display Engine Control Panel */}
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  Display Engine Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brightness</label>
                      <span className="text-[10px] font-black text-black">{newItem.intensity}x</span>
                    </div>
                    <input
                      type="range" min="0.5" max="4" step="0.1"
                      value={newItem.intensity}
                      onChange={e => setNewItem({ ...newItem, intensity: parseFloat(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initial Angle</label>
                      <span className="text-[10px] font-black text-black">{newItem.rotationY}°</span>
                    </div>
                    <input
                      type="range" min="0" max="360" step="1"
                      value={newItem.rotationY}
                      onChange={e => setNewItem({ ...newItem, rotationY: parseInt(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spin Speed</label>
                      <span className="text-[10px] font-black text-black">{newItem.autoRotateSpeed}</span>
                    </div>
                    <input
                      type="range" min="0" max="10" step="0.5"
                      value={newItem.autoRotateSpeed}
                      onChange={e => setNewItem({ ...newItem, autoRotateSpeed: parseFloat(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Travel Memoirs</label>
                <textarea
                  value={newItem.travelNote}
                  onChange={e => setNewItem({ ...newItem, travelNote: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3.5 focus:border-black focus:bg-white outline-none transition-all font-semibold text-gray-900 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-black/5 active:scale-[0.99]">
                  {editMode ? 'Update Database Entry' : 'Add to Collection'}
                </button>
                {editMode && (
                  <button type="button" onClick={() => { setEditMode(false); resetForm(); }} className="px-8 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Repository Dashboard Summary */}
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group flex items-center justify-between">
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Active Repository</p>
              <p className="text-xl font-bold tracking-tight text-gray-900 group-hover:underline">VOYAGE-ARTIFACTS / <span className="text-gray-400 font-medium">main</span></p>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Current Items</p>
              <p className="text-3xl font-black text-black leading-none">{collections.length}</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700"></div>
          </section>

          {/* Collection Inventory */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Collection Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map(item => (
                <div key={item.id} className="group bg-white border border-gray-100 p-6 rounded-3xl flex flex-col justify-between hover:shadow-xl hover:shadow-black/[0.02] transition-all">
                  <div className="space-y-4">
                    <div className="w-full h-40 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center relative group/inner">
                      {item.modelPath ? (
                        <div className="w-full h-full opacity-60 group-hover/inner:opacity-100 transition-opacity">
                          <ModelPreview
                            modelPath={item.modelPath}
                            scale={1}
                            intensity={item.intensity || 1.5}
                            rotationY={item.rotationY || 0}
                            autoRotateSpeed={item.autoRotateSpeed || 2}
                            adjustCamera={1.8}
                          />
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-200 font-bold">NO MODEL</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-black transition-colors">{item.name}</h4>
                      <p className="text-[11px] text-gray-400 font-black tracking-widest uppercase mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-600">{item.location}</span>
                        <span className="opacity-50">/</span>
                        <span>{item.date}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button onClick={() => { setEditMode(true); setEditId(item.id); setNewItem({ ...item }); }} className="flex-1 py-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-600 hover:bg-black hover:text-white transition-all">
                      EDIT
                    </button>
                    <button onClick={() => { if (confirm('Delete artifact?')) setCollections(prev => prev.filter(i => i.id !== item.id)) }} className="flex-1 py-2.5 bg-transparent border border-gray-100 rounded-xl font-bold text-xs text-gray-400 hover:border-red-100 hover:text-red-500 transition-all">
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Global CSS Overrides */}
      <style jsx global>{`
        input::placeholder { color: #e2e8f0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        body { background-color: #f8fafc; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}