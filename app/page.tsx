"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from "sonner";
import { Sprout, Ticket, Trophy, Vote, Flame, Play, Pause, Volume2, Search, Coffee, Book, Music } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket } from '@fortawesome/free-solid-svg-icons';
import Head from 'next/head';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { useInView } from 'react-intersection-observer';
import WaveSurfer from 'wavesurfer.js';

// Particle background component 
const ParticleBackground = () => {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'fixed inset-0 z-0 pointer-events-none';
    document.querySelector('.bg-container')?.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to cover the entire viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Center point for particles to originate from (vanishing point)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Particle properties for 3D starfield effect
    const particles: {
      x: number;
      y: number;
      z: number;
      size: number;
      speedZ: number;
    }[] = [];
    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000, // Depth position (0 is closest, 1000 is farthest)
        size: Math.random() * 3 + 2, // Larger base size (2-5 range) for variation
        speedZ: Math.random() * 10 + 5, // Speed toward the viewer
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        // Update particle position (move toward viewer)
        p.z -= p.speedZ;
        if (p.z <= 0) {
          // Reset particle to far distance when it gets too close
          p.z = 1000;
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.size = Math.random() * 3 + 2; // Reset size for variation
        }

        // Calculate perspective projection
        const scale = 1000 / (1000 - p.z); // Perspective scaling
        const x2d = (p.x - centerX) * scale + centerX;
        const y2d = (p.y - centerY) * scale + centerY;
        const size = p.size * scale;

        // Draw particle as a streak
        ctx.beginPath();
        const prevX = (p.x - centerX) * (1000 / (1000 - (p.z + p.speedZ))) + centerX;
        const prevY = (p.y - centerY) * (1000 / (1000 - (p.z + p.speedZ))) + centerY;
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x2d, y2d);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - p.z / 1000)})`; // White particles with fading opacity
        ctx.lineWidth = size;
        ctx.stroke();
      });
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.remove();
    };
  }, []);

  return null;
};

const MainPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMusicBar, setShowMusicBar] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const MINT_URL = "https://www.launchmynft.io/collections/5qFEDDbxE1qdgpGooZnimt9Snxt1pntuuygywF1fQXoe/ojXqlXcUJRSM3ZxxvhGl";
  const MARKETPLACE_URL = "https://magiceden.io/marketplace/cryptoufos";
  const WHITEPAPER_URL = "https://www.cryptoufos.com/whitepaper";
  const SOLDOUT_EVENT_CHECKER_URL = "/soldouteventchecker";

  const AUDIO_TRACKS = [
    { src: "/audio/track1.mp3", title: "Cosmic Drift" },
    { src: "/audio/track2.mp3", title: "Stellar Waves" },
    { src: "/audio/track3.mp3", title: "Galactic Pulse" },
    { src: "/audio/track4.mp3", title: "Nebula Dance" },
    { src: "/audio/track5.mp3", title: "Astro Voyage" },
    { src: "/audio/track6.mp3", title: "Lunar Echoes" },
    { src: "/audio/track7.mp3", title: "Orbiting Light" },
    { src: "/audio/track8.mp3", title: "Solar Flare" },
    { src: "/audio/track9.mp3", title: "Cosmic Dance" },
    { src: "/audio/track10.mp3", title: "Exploding Stars" },
    { src: "/audio/track11.mp3", title: "Interstellar Haze" },
    { src: "/audio/track12.mp3", title: "Quantum Rift" },
    { src: "/audio/track13.mp3", title: "Nebular Whispers" },
    { src: "/audio/track14.mp3", title: "Starlight Surge" },
    { src: "/audio/track15.mp3", title: "Void Symphony" },
    { src: "/audio/track16.mp3", title: "Pulsar Glow" },
    { src: "/audio/track17.mp3", title: "Astral Currents" },
    { src: "/audio/track18.mp3", title: "Meteor Cascade" },
    { src: "/audio/track19.mp3", title: "Galactic Horizon" },
  ];

  // Initialize WaveSurfer when music bar is shown
  useEffect(() => {
    if (showMusicBar && waveformRef.current) {
      try {
        const ws = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#00f7ff',
          progressColor: '#ff00ff',
          cursorColor: '#ffffff',
          barWidth: 1,
          height: 12,
        });
        setWaveSurfer(ws);
        return () => {
          ws.destroy();
          setWaveSurfer(null);
        };
      } catch (error) {
        console.error('WaveSurfer initialization failed:', error);
      }
    } else if (!showMusicBar && waveSurfer) {
      waveSurfer.destroy();
      setWaveSurfer(null);
    }
  }, [showMusicBar]);

  // Load and manage audio playback
  useEffect(() => {
    if (waveSurfer) {
      const readyListener = () => {
        setDuration(waveSurfer.getDuration());
        if (isPlaying) {
          waveSurfer.play().catch((error) => {
            console.error('Playback failed:', error);
          });
        }
      };

      const audioprocessListener = () => {
        setCurrentTime(waveSurfer.getCurrentTime());
      };

      const finishListener = () => {
        changeTrack('next');
      };

      const errorListener = (error: any) => {
        console.error('WaveSurfer error:', error);
      };

      waveSurfer.load(AUDIO_TRACKS[currentTrack].src).catch((error) => {
        console.error('Failed to load audio:', error);
      });

      waveSurfer.on('ready', readyListener);
      waveSurfer.on('audioprocess', audioprocessListener);
      waveSurfer.on('finish', finishListener);
      waveSurfer.on('error', errorListener);

      return () => {
        waveSurfer.un('ready', readyListener);
        waveSurfer.un('audioprocess', audioprocessListener);
        waveSurfer.un('finish', finishListener);
        waveSurfer.un('error', errorListener);
      };
    }
  }, [waveSurfer, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    if (waveSurfer) {
      waveSurfer.setVolume(volume / 100);
      waveSurfer.setMuted(volume === 0);
    }
  }, [volume, waveSurfer]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(event.target.value);
    setVolume(newVolume);
  };

  const handleVolumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVolumeOpen(!isVolumeOpen);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (waveSurfer) {
      if (waveSurfer.isPlaying()) {
        waveSurfer.pause();
        setIsPlaying(false);
      } else {
        waveSurfer.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('WaveSurfer playback failed:', error);
          if (audioRef.current) {
            audioRef.current.src = AUDIO_TRACKS[currentTrack].src;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((err) => console.error('Audio fallback failed:', err));
          }
        });
      }
    } else {
      console.error('WaveSurfer not initialized');
      if (audioRef.current) {
        audioRef.current.src = AUDIO_TRACKS[currentTrack].src;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => console.error('Audio fallback failed:', err));
      }
    }
  };

  const changeTrack = (direction: 'next' | 'prev') => {
    const newTrack = direction === 'next'
      ? (currentTrack + 1) % AUDIO_TRACKS.length
      : (currentTrack - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length;
    setCurrentTrack(newTrack);
    setIsPlaying(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <img src="/ufo-loading.png" alt="Loading UFO" className="w-full h-full" />
          </motion.div>
          <p className="text-lg font-semibold text-sky-blue font-orbitron">Initializing Galaxy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden bg-container font-orbitron">
      <Head>
        <title>Crypto UFOs Whitepaper</title>
        <meta
          name="description"
          content="Explore the Crypto UFOs whitepaper to learn about the blockchain-based strategy game on Solana, including gameplay, economy, and rewards."
        />
        <meta property="og:title" content="Crypto UFOs Whitepaper" />
        <meta
          property="og:description"
          content="Discover the Crypto UFOs whitepaper, detailing the Solana-based strategy game's mechanics, economy, and play-to-earn features."
        />
        <meta property="og:image" content="https://www.cryptoufos.com/whitepaper.png" />
        <meta property="og:image:alt" content="Crypto UFOs Whitepaper Preview" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.cryptoufos.com/whitepaper" />
        <meta property="og:site_name" content="Crypto UFOs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Crypto UFOs Whitepaper" />
        <meta
          name="twitter:description"
          content="Discover the Crypto UFOs whitepaper, detailing the Solana-based strategy game's mechanics, economy, and play-to-earn features."
        />
        <meta name="twitter:image" content="https://www.cryptoufos.com/whitepaper-screenshot.png" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <ParticleBackground />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900/50 to-black/50 z-10"></div>
      <div className="relative z-20 flex flex-col min-h-screen">
        <Toaster richColors position="top-right" />
        <header className="p-4 md:p-8 text-center">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 tracking-tight flex items-center justify-center gap-4"
          >
            <span>CRYPTO UFOs</span>
            <FontAwesomeIcon icon={faRocket} className="w-12 h-12 text-cyan-400 animate-pulse" />
          </motion.h1>
        </header>
        {/* Show/Hide Music Bar Button */}
        <AnimatePresence>
          {!showMusicBar && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-4 right-4 z-100"
            >
              <Button
                onClick={() => setShowMusicBar(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-full p-2 hover:scale-110 transition-transform"
                aria-label="Show music bar"
              >
                <Music className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Music Bar */}
        <AnimatePresence>
          {showMusicBar && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
              className="fixed bottom-0 left-0 right-0 z-100 bg-gray-900/90 backdrop-blur-md rounded-t-lg p-2 shadow-md shadow-cyan-500/30 cypherpunk-border flex justify-center items-center music-bar"
            >
              <div className="flex items-center gap-2 max-w-4xl w-full">
                <Button
                  onClick={() => setShowMusicBar(false)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-xs font-semibold py-1 px-2 rounded-md"
                  aria-label="Hide music bar"
                >
                  Hide
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => changeTrack("prev")}
                    className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full hover:scale-110 transition-transform"
                    aria-label="Previous track"
                  >
                    ⏮
                  </Button>
                  <Button
                    onClick={togglePlayPause}
                    className="p-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-full hover:scale-110 transition-transform"
                    aria-label={isPlaying ? "Pause music" : "Play music"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => changeTrack("next")}
                    className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full hover:scale-110 transition-transform"
                    aria-label="Next track"
                  >
                    ⏭
                  </Button>
                  <Button
                    onClick={handleVolumeClick}
                    className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full hover:scale-110 transition-transform"
                    aria-label="Toggle volume control"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <div className="text-xs text-cyan-400 truncate flex-1" title={AUDIO_TRACKS[currentTrack].title}>
                    {AUDIO_TRACKS[currentTrack].title} ({formatTime(currentTime)} / {formatTime(duration)})
                  </div>
                  <div ref={waveformRef} className="w-24 h-3" />
                  {isVolumeOpen && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-8 bg-gray-900/90 backdrop-blur-md rounded-lg p-1 shadow-md shadow-cyan-500/30 cypherpunk-border"
                    >
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-4 rotate-[-90deg] translate-x-[-25%] accent-cyan-500"
                        aria-label="Volume control"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <audio ref={audioRef} />
        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0, 247, 255, 0.2) 0%, rgba(0, 0, 0, 0.9) 70%)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
                <motion.div
                  ref={modalRef}
                  initial={{ scale: 0.8, opacity: 0, rotateX: 10 }}
                  animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotateX: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative bg-gray-900/90 backdrop-blur-md rounded-xl p-8 max-w-md w-full mx-4 shadow-[0_0_20px_rgba(0,247,255,0.5)] cypherpunk-border"
                >
                  <Button
                    onClick={() => {
                      setIsModalOpen(false);
                      sessionStorage.setItem('soldOutModalClosed', 'true');
                    }}
                    className="absolute top-2 right-2 bg-transparent hover:bg-cyan-500/50 text-cyan-400 p-2 rounded-full transition-transform hover:scale-110"
                    aria-label="Close modal"
                  >
                    ✕
                  </Button>
                  <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    id="modal-title"
                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-4 text-center"
                  >
                    🚀 SOLD OUT EVENT! 🚀
                  </motion.h2>
                  <motion.p
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-200 text-base mb-4 text-center"
                  >
                    Join our exclusive galactic event with a{' '}
                    <span className="font-semibold text-cyan-400">$500 prize pool</span> split among 3 winners!
                  </motion.p>
                  <motion.ul
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-300 mb-4 space-y-2 text-center"
                  >
                    {[
                      { icon: Trophy, color: 'text-yellow-500', text: '1st Place: $300', delay: 0.4 },
                      { icon: Trophy, color: 'text-gray-400', text: '2nd Place: $150', delay: 0.5 },
                      { icon: Trophy, color: 'text-amber-600', text: '3rd Place: $50', delay: 0.6 },
                    ].map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: item.delay }}
                        className="flex items-center gap-2 justify-center"
                      >
                        <item.icon className={`w-5 h-5 ${item.color} animate-pulse`} />
                        <span>{item.text}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                  <motion.p
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-gray-300 text-sm mb-2 text-center"
                  >
                    Requires <span className="font-semibold text-pink-500 animate-pulse">1 NFT</span> minted from{' '}
                    <span className="font-semibold text-pink-500 animate-pulse">#8060 to #10000</span>.
                  </motion.p>
                  <motion.p
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-cyan-400 text-sm font-bold mb-6 text-center"
                  >
                    <Ticket className="inline-block w-5 h-5 mr-1 animate-pulse" />
                    1 NFT = 1 Ticket
                  </motion.p>
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col sm:flex-row justify-center gap-3 flex-wrap"
                  >
                    <Button
                      onClick={() => window.open(MINT_URL, '_blank')}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                      aria-label="Mint NFT on LaunchMyNFT"
                    >
                      <img
                        src="https://pbs.twimg.com/profile_images/1592614814764916738/ZT5r2Qlk_400x400.jpg"
                        alt="LaunchMyNFT"
                        className="w-5 h-5 rounded-full"
                        loading="lazy"
                      />
                      Mint on LaunchMyNFT
                    </Button>
                    <Button
                      onClick={() => window.open(MARKETPLACE_URL, '_blank')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                      aria-label="Trade on Magic Eden"
                    >
                      <img
                        src="https://smithii.io/wp-content/uploads/2023/04/VZwAgvrL_400x400.jpeg"
                        alt="Magic Eden"
                        className="w-5 h-5 rounded-full"
                        loading="lazy"
                      />
                      Trade on Magic Eden
                    </Button>
                    <Button
                      onClick={() => (window.location.href = SOLDOUT_EVENT_CHECKER_URL)}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                      aria-label="Check Sold-Out Event Wallet"
                    >
                      <Search className="w-5 h-5" />
                      Wallet Checker
                    </Button>
                  </motion.div>
                </motion.div>
              </Tilt>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Main Content */}
        <main className="p-4 flex-grow">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-8 mb-8 shadow-lg shadow-cyan-500/30 cypherpunk-border"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-4 text-center">
                Welcome to Crypto UFOs
              </h2>
              <p className="text-gray-200 text-lg md:text-xl mb-4 text-center max-w-2xl mx-auto">
                Embark on an interstellar NFT adventure! Farm resources, join raffles, compete on leaderboards, shape our DAO, and burn NFTs for $UFOS rewards.
              </p>
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 mb-8 shadow-lg shadow-purple-500/30 cypherpunk-border"
            >
              <h3 className="text-2xl font-semibold text-purple-400 mb-4 text-center">Get Your Crypto UFOs</h3>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.open(MARKETPLACE_URL, '_blank')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                  aria-label="Trade on Magic Eden"
                >
                  <img
                    src="https://smithii.io/wp-content/uploads/2023/04/VZwAgvrL_400x400.jpeg"
                    alt="Magic Eden"
                    className="w-5 h-5 rounded-full"
                    loading="lazy"
                  />
                  Trade on Magic Eden
                </Button>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {[
                { icon: Sprout, color: 'cyan', title: 'Farm Game', desc: 'Grow your UFO empire and earn rewards.', href: '/farm', delay: 0.3 },
                { icon: Ticket, color: 'purple', title: 'Raffle', desc: 'Enter to win exclusive NFTs and prizes.', href: '/raffles', delay: 0.4 },
                { icon: Trophy, color: 'green', title: 'Leaderboard', desc: 'See where you rank among players.', href: '/leaderboard', delay: 0.5 },
                { icon: Vote, color: 'yellow', title: 'DAO', desc: 'Vote on the future of Crypto UFOs.', href: '/DAO', delay: 0.6 },
                { icon: Flame, color: 'red', title: 'Burner', desc: 'Burn NFTs for $UFOS rewards.', href: '/burn', delay: 0.7 },
                { icon: Book, color: 'teal', title: 'Whitepaper', desc: 'Learn more about Crypto UFOs.', href: WHITEPAPER_URL, external: true, delay: 0.8 },
                { icon: Search, color: 'indigo', title: 'NFT Scanner', desc: 'Analyze and explore your Crypto UFOs NFTs.', href: '/nftscanner', delay: 0.9 },
                { icon: Coffee, color: 'orange', title: 'GM Generator', desc: 'Create your unique GM greetings!', href: '/gmgenerator', delay: 1.0 },
              ].map((item, index) => {
                const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
                const colorClasses: { [key: string]: { icon: string; button: string } } = {
                  cyan: { icon: 'text-cyan-400', button: 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700' },
                  purple: { icon: 'text-purple-400', button: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' },
                  green: { icon: 'text-green-400', button: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' },
                  yellow: { icon: 'text-yellow-400', button: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' },
                  red: { icon: 'text-red-400', button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' },
                  teal: { icon: 'text-teal-400', button: 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700' },
                  indigo: { icon: 'text-indigo-400', button: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700' },
                  orange: { icon: 'text-orange-400', button: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' },
                };

                return (
                  <motion.div
                    key={index}
                    ref={ref}
                    initial={{ y: 50, opacity: 0 }}
                    animate={inView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
                    transition={{ duration: 0.5, delay: item.delay }}
                  >
                    <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
                      <div className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 hover:shadow-lg hover:shadow-cyan-500/30 transition-all cypherpunk-border">
                        <item.icon className={`w-10 h-10 ${colorClasses[item.color].icon} mb-4 animate-pulse`} />
                        <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">{item.desc}</p>
                        <Button
                          onClick={() => (item.external ? window.open(item.href, '_blank') : (window.location.href = item.href))}
                          className={`text-white font-semibold py-2 rounded-lg w-full ${colorClasses[item.color].button}`}
                          aria-label={`Navigate to ${item.title}`}
                        >
                          {item.title.includes('Farm')
                            ? 'Play Now'
                            : item.title.includes('Raffle')
                            ? 'Win Now'
                            : item.title.includes('Leaderboard')
                            ? 'Enter Now'
                            : item.title.includes('DAO')
                            ? 'Vote Now'
                            : item.title.includes('Burner')
                            ? 'Burn Now'
                            : item.title.includes('Whitepaper')
                            ? 'Read Now'
                            : item.title.includes('NFT Scanner')
                            ? 'Scan Now'
                            : item.title.includes('GM Generator')
                            ? 'Generate Now'
                            : 'Go'}
                        </Button>
                      </div>
                    </Tilt>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </main>
        <footer className="p-4 text-center text-gray-400 text-sm">
          <div className="flex justify-center gap-4 mb-4">
            <a
              href="https://twitter.com/0xCryptoUFOs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="Follow Crypto UFOs on Twitter"
            >
              <img
                src="https://resizer.glanacion.com/resizer/v2/elon-musk-cambio-el-logo-de-WHTIWEV47VHEHDV4QYC6PRXVBE.jpg?auth=29e4042f48af310deb7e46ab9afc31d8ef98589c3c1c1c29d6be7ce335477df1&width=1280&height=854&quality=70&smart=true"
                alt="Twitter"
                className="w-6 h-6 rounded-full object-cover"
                loading="lazy"
              />
            </a>
            <a
              href="https://discord.gg/h8zFssQDWx"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="Join Crypto UFOs on Discord"
            >
              <img
                src="https://static.vecteezy.com/system/resources/previews/006/892/625/non_2x/discord-logo-icon-editorial-free-vector.jpg"
                alt="Discord"
                className="w-6 h-6 rounded-full object-cover"
                loading="lazy"
              />
            </a>
          </div>
          <div className="w-32 h-px bg-gray-500 mx-auto my-4"></div>
          <p>© 2025 Crypto UFOs. All rights reserved.</p>
        </footer>
      </div>
      <Analytics />
      <SpeedInsights />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

        body {
          font-family: 'Orbitron', sans-serif;
        }

        .cypherpunk-border {
          border: 2px solid transparent;
          border-image: linear-gradient(45deg, #00f7ff, #ff00ff, #00ff00, #ff00ff, #00f7ff) 1;
          box-shadow: 0 0 8px rgba(0, 247, 255, 0.4), 0 0 16px rgba(255, 0, 255, 0.2);
          animation: cypherpunk-flicker 2s linear infinite;
        }

        @keyframes cypherpunk-flicker {
          0%, 100% {
            border-image-source: linear-gradient(45deg, #00f7ff, #ff00ff, #00ff00, #ff00ff, #00f7ff);
            box-shadow: 0 0 8px rgba(0, 247, 255, 0.4), 0 0 16px rgba(255, 0, 255, 0.2);
            opacity: 1;
          }
          50% {
            border-image-source: linear-gradient(45deg, #00f7ff80, #ff00ff80, #00ff0080, #ff00ff80, #00f7ff80);
            box-shadow: 0 0 4px rgba(0, 247, 255, 0.2), 0 0 8px rgba(255, 0, 255, 0.1);
            opacity: 0.8;
          }
        }

        .music-bar {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 100 !important;
        }

        button {
          font-family: 'Orbitron', sans-serif !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .cypherpunk-border, .animate-pulse, .animate-flicker {
            animation: none !important;
            box-shadow: 0 0 8px rgba(0, 247, 255, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default MainPage;