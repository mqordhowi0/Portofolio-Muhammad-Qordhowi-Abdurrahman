import { useState, useEffect, Suspense, useRef, useMemo, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Environment, Html, useTexture, useProgress } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { motion as motionDom, AnimatePresence } from 'framer-motion' 
import * as THREE from 'three'

// --- IMPORTS KOMPONEN ---
import ProfileCard from './ProfileCard'
import Aurora from './Aurora'
import Navbar from './Navbar'
import ScrollReveal from './ScrollReveal'

// Pastikan file firebase.js sudah dibuat sesuai instruksi sebelumnya
import { auth, provider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- DATA ---
const SKILLS = [
  { name: 'Scikit-Learn', color: '#F7931E', icon: '/assets/tools/scikit.png', desc: "Machine Learning" }, 
  { name: 'CSS', color: '#1572B6', icon: '/assets/tools/css.png', desc: "Styling" },
  { name: 'JS', color: '#F7DF1E', icon: '/assets/tools/js.png', desc: "Logic" },
  { name: 'TS', color: '#3178C6', icon: '/assets/tools/ts.png', desc: "Type Safe" },
  { name: 'React', color: '#61DAFB', icon: '/assets/tools/reactjs.png', desc: "Frontend" },
  { name: 'Next', color: '#ffffff', icon: '/assets/tools/nextjs.png', desc: "Framework" },
  { name: 'Tailwind', color: '#06B6D4', icon: '/assets/tools/tailwind.png', desc: "Styling" },
  { name: 'PostgreSQL', color: '#336791', icon: '/assets/tools/postgresql.png', desc: "Advanced Database" },
  { name: 'PHP', color: '#777BB4', icon: '/assets/tools/php.png', desc: "Server" },
  { name: 'Laravel', color: '#FF2D20', icon: '/assets/tools/laravel.png', desc: "PHP Framework" },
  { name: 'MySQL', color: '#4479A1', icon: '/assets/tools/mysql.png', desc: "Database" },
  { name: 'Firebase', color: '#FFCA28', icon: '/assets/tools/firebase.png', desc: "BaaS" },
  { name: 'Figma', color: '#F24E1E', icon: '/assets/tools/figma.png', desc: "Design" },
  { name: 'Git', color: '#F05032', icon: '/assets/tools/github.png', desc: "Version Control" },
  { name: 'Python', color: '#3776AB', icon: '/assets/tools/python.png', desc: "AI & Data Science" },
]

const PROJECTS = [
  {
    title: "Todotify Pro",
    desc: "Lightweight task management app with DOM Manipulation. Features persistent storage (LocalStorage) and dynamic theme switching.",
    tags: ["JavaScript ES6", "CSS3", "LocalStorage", "DOM API"], 
    color: "purple",
    link: "https://mqordhowi0.github.io/CodingCamp-131025-Muhammad-Qordhowi-Abdurrahman/"
  },
  {
    title: "Predixi",
    desc: "End-to-end retail forecasting engine. Orchestrates Laravel API with Python microservices for time-series predictions.",
    tags: ["Laravel", "Python", "Scikit-Learn", "PostgreSQL"],
    color: "blue",
    link: "https://github.com/mqordhowi0/RetailIntelligence"
  },
  {
    title: "CS AI Hybrid",
    desc: "Smart support agent powered by OpenAI (LLM). Features RAG for document-based answers and automated handoff to human operators.",
    tags: ["Laravel", "OpenAI API", "RAG", "Real-time"],
    color: "green",
    link: "https://github.com/mqordhowi0/sistem-layanan-cerdas"
  },
  {
    title: "Sistem Sertifikasi",
    desc: "Enterprise-grade certification platform for LSP Elektronika. Features Role-Based Access Control (RBAC) and automated PDF generation.",
    tags: ["Laravel", "MySQL", "Bootstrap", "DomPDF"],
    color: "red",
    link: "https://be-simsertif.karyakreasi.id/"
  }
]

// --- COMPONENT: CUSTOM CURSOR ---
const CustomCursor = () => {
  const cursorRef = useRef(null)
  const trailerRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const trailer = trailerRef.current
    if(!cursor || !trailer) return

    let mouseX = 0, mouseY = 0
    let trailerX = 0, trailerY = 0
    
    // Deteksi jika device touch (HP) untuk hide cursor custom
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouch) {
        cursor.style.display = 'none'
        trailer.style.display = 'none'
        return
    }

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if(cursor) cursor.style.transform = `translate3d(${mouseX - 8}px, ${mouseY - 8}px, 0)`
    }

    const animateTrailer = () => {
      trailerX += (mouseX - trailerX) * 0.1
      trailerY += (mouseY - trailerY) * 0.1
      if(trailer) trailer.style.transform = `translate3d(${trailerX - 20}px, ${trailerY - 20}px, 0)`
      requestAnimationFrame(animateTrailer)
    }

    window.addEventListener('mousemove', onMouseMove)
    const animId = requestAnimationFrame(animateTrailer)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full mix-blend-difference pointer-events-none z-[9999]" />
      <div ref={trailerRef} className="fixed top-0 left-0 w-10 h-10 border border-cyan-400 rounded-full pointer-events-none z-[9998] opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
      <style>{`@media (pointer: fine) { body { cursor: none; } a, button { cursor: pointer; } }`}</style>
    </>
  )
}

// --- COMPONENT: LOADING SCREEN ---
const LoadingScreen = ({ started, setStarted }) => {
  const { progress } = useProgress()
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (progress > displayProgress) {
      const timeout = setTimeout(() => setDisplayProgress(prev => Math.min(prev + 5, progress)), 20)
      return () => clearTimeout(timeout)
    }
    if (displayProgress >= 100) {
      setTimeout(() => setStarted(true), 500)
    }
  }, [progress, displayProgress, setStarted])

  return (
    <AnimatePresence>
      {!started && (
        <motionDom.div 
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white"
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <div className="text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            {Math.round(displayProgress)}%
          </div>
          <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motionDom.div 
              className="h-full bg-cyan-400" 
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
            />
          </div>
          <p className="mt-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Initialising Environment...</p>
        </motionDom.div>
      )}
    </AnimatePresence>
  )
}

// --- 3D KEYCAP (Mobile Support) ---
const Keycap = memo(({ index, position, data, isActive, onActive, onInactive, animationState }) => {
  const texture = useTexture(data.icon)
  const meshRef = useRef()
  const { viewport } = useThree()
  const isMobile = viewport.width < 6 // Breakpoint mobile sedikit dinaikkan
  
  const physics = useMemo(() => ({
    position: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5),
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.02),
    rotVelocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02)
  }), [])

  useFrame((state) => {
    if (!meshRef.current) return

    if (animationState === 'hero' || animationState === 'profile') {
      const { width, height } = state.viewport
      physics.position.add(physics.velocity)
      if (physics.position.x > width / 2 || physics.position.x < -width / 2) physics.velocity.x *= -1
      if (physics.position.y > height / 2 || physics.position.y < -height / 2) physics.velocity.y *= -1
      if (physics.position.z > 2 || physics.position.z < -5) physics.velocity.z *= -1

      const mouseVec = new THREE.Vector3(state.pointer.x * width / 2, state.pointer.y * height / 2, 0)
      if (physics.position.distanceTo(mouseVec) < 3) {
        physics.velocity.add(new THREE.Vector3().subVectors(physics.position, mouseVec).normalize().multiplyScalar(0.015))
      }

      meshRef.current.position.copy(physics.position)
      meshRef.current.rotation.x += physics.rotVelocity.x
      meshRef.current.rotation.y += physics.rotVelocity.y
    } else {
      meshRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.1)
      meshRef.current.rotation.set(THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1), THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1), THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.1))
    }
  })

  // FAKTOR SKALA MOBILE (0.65 agar tidak mepet)
  const mFactor = isMobile ? 0.65 : 1

  return (
    <motion.group animate={animationState} variants={{
      hero: { x: 0, y: 0, z: 0, scale: 0.5 },
      profile: { x: -3, y: 1, z: -4, scale: 0.5 },
      // Update posisi dan scale berdasarkan mobile factor
      skills: { 
        x: position[0] * mFactor, 
        y: position[1] * mFactor, 
        z: position[2] * mFactor, 
        scale: 1 * mFactor 
      },
      projects: { x: position[0] * mFactor, y: position[1] * mFactor, z: position[2] * mFactor, scale: 1 * mFactor },
      guestbook: { x: position[0] * mFactor, y: position[1] * mFactor, z: position[2] * mFactor, scale: 1 * mFactor }
    }} transition={{ duration: 1.0 }}>
      <group ref={meshRef}>
        <mesh 
          // Event PC (Hover)
          onPointerOver={(e) => { e.stopPropagation(); if(animationState === 'skills') onActive() }} 
          onPointerOut={() => onInactive()} 
          // Event Mobile (Click/Tap)
          onClick={(e) => { e.stopPropagation(); if(animationState === 'skills') onActive() }}
          position={[0, isActive ? -0.15 : 0, 0]}
        >
          <RoundedBox args={[0.85, 0.4, 0.85]} radius={0.1} smoothness={1}> 
            <meshStandardMaterial color="#222" roughness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial map={texture} transparent opacity={0.9} emissive={data.color} emissiveIntensity={isActive ? 2 : 0.3} />
          </mesh>
        </mesh>
      </group>
    </motion.group>
  )
})

const KeyboardChassis = memo(({ animationState }) => {
  const { viewport } = useThree()
  const isMobile = viewport.width < 6
  const mobileScale = 0.65 

  return (
    <motion.group animate={animationState} variants={{
      hero: { scale: 0, opacity: 0 },
      profile: { scale: 0, opacity: 0 },
      skills: { scale: isMobile ? mobileScale : 1, opacity: 1 },
      projects: { scale: isMobile ? mobileScale : 1, opacity: 1 },
      guestbook: { scale: isMobile ? mobileScale : 1, opacity: 1 }
    }} transition={{ duration: 1 }} position={[0, -0.3, 0]}>
      <RoundedBox args={[4.8, 0.5, 3.0]} radius={0.2} smoothness={1}>
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.9} />
      </RoundedBox>
      <mesh position={[0, -0.15, 1.51]}>
        <boxGeometry args={[4.5, 0.05, 0.05]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </motion.group>
  )
})

const BongoCat = memo(({ animationState }) => {
  const { viewport } = useThree()
  const isMobile = viewport.width < 6
  // Penyesuaian posisi kucing di Mobile agar pas di atas keyboard yang mengecil
  const pos = isMobile ? [0, 0.45, 0.8] : [0, 0.63, 1.3]

  return (
    <group position={pos} rotation={[0, 0, -0.23]}>
      <Html transform occlude pointerEvents="none" scale={isMobile ? 0.7 : 1}>
        <motionDom.div
           animate={{ 
             opacity: (animationState === 'projects' || animationState === 'guestbook') ? 1 : 0, 
             scale: (animationState === 'projects' || animationState === 'guestbook') ? 1 : 0 
           }}
           transition={{ duration: 0.5 }} style={{ width: '150px', height: '93px' }} 
        >
          <img src="/assets/bongo-cat.gif" alt="cat" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))', transform: 'scaleX(-1)' }} />
        </motionDom.div>
      </Html>
    </group>
  )
})

const SceneContent = memo(({ setHoveredSkill, animationState }) => {
  const [activeKeyIndex, setActiveKeyIndex] = useState(null)
  const { viewport } = useThree()
  const isMobile = viewport.width < 6

  // --- FITUR: AUTO HOVER UNTUK MOBILE ---
  useEffect(() => {
    // Hanya jalan jika Mobile DAN sedang di section Skills
    if (isMobile && animationState === 'skills') {
      const interval = setInterval(() => {
        const randomIdx = Math.floor(Math.random() * SKILLS.length);
        setActiveKeyIndex(randomIdx);
        setHoveredSkill(SKILLS[randomIdx]);
      }, 1500); // Ganti acak setiap 1.5 detik
      return () => clearInterval(interval);
    }
  }, [isMobile, animationState, setHoveredSkill])

  return (
    <motion.group animate={animationState} variants={{
      hero: { scale: 1, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 },
      profile: { scale: 1, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }, 
      
      // SKILLS: 
      // Mobile: X=0 (Tengah), Y=-1.8 (Turun ke Bawah), Rotasi SAMA dengan PC agar estetik
      skills: { 
        scale: 1, 
        x: isMobile ? 0 : 2.5, 
        y: isMobile ? -1.8 : -1.0, 
        z: 0, 
        rotateX: 0.6, 
        rotateY: -0.2, // Rotasi disamakan
        rotateZ: isMobile ? 0 : 0.1 
      },

      projects: { 
        scale: 0.6, 
        x: isMobile ? 0 : 3.5, 
        y: isMobile ? -1.5 : -0.8, 
        z: 0, 
        rotateX: 0.1, 
        rotateY: Math.PI - 0.4, 
        rotateZ: 0 
      },

      guestbook: { 
        scale: 0.7, 
        x: isMobile ? 0 : -3.5, 
        y: isMobile ? -2 : -0.5, 
        z: 0, 
        rotateX: 0.2, 
        rotateY: 0.4, 
        rotateZ: 0 
      } 
    }} transition={{ duration: 0.8, ease: "easeInOut" }}>
      {SKILLS.map((skill, index) => {
        const col = index % 5
        const row = Math.floor(index / 5)
        return (
          <Keycap 
            key={index} index={index} position={[(col - 2) * 0.9, 0, (row - 1) * 0.9]} 
            data={skill} isActive={activeKeyIndex === index}
            onActive={() => { setActiveKeyIndex(index); setHoveredSkill(skill) }}
            onInactive={() => { if (!isMobile && activeKeyIndex === index) { setActiveKeyIndex(null); setHoveredSkill(null) }}}
            animationState={animationState}
          />
        )
      })}
      <KeyboardChassis animationState={animationState} />
      <BongoCat animationState={animationState} />
    </motion.group>
  )
})

// --- VIEW 3D WRAPPER ---
const View3D = memo(({ started, animationState, setHoveredSkill }) => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 35 }} performance={{ min: 0.5 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Environment preset="city" />
        <Suspense fallback={null}>
          {started && <SceneContent setHoveredSkill={setHoveredSkill} animationState={animationState} />}
        </Suspense>
      </Canvas>
    </div>
  )
})

// --- APP UTAMA ---
function App() {
  const [hoveredSkill, setHoveredSkill] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const [animationState, setAnimationState] = useState('hero')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrollY(y)
      const viewportHeight = window.innerHeight
      let newState = 'hero'
      
      if (y > viewportHeight * 0.5) newState = 'profile'
      if (y > viewportHeight * 1.5) newState = 'skills'
      if (y > viewportHeight * 3.5) newState = 'projects'
      if (y > viewportHeight * 6.5) newState = 'guestbook'
      
      setAnimationState(prev => prev !== newState ? newState : prev)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative w-full bg-[#050505] min-h-[750vh] font-sans">
      <CustomCursor />
      <LoadingScreen started={started} setStarted={setStarted} />
      <Aurora colorStops={["#2b1055", "#7597de", "#000000"]} blend={0.6} amplitude={1.2} />
      <Navbar hidden={!started} />

      <View3D started={started} animationState={animationState} setHoveredSkill={setHoveredSkill} />

      {started && <HtmlOverlay hoveredSkill={hoveredSkill} scrollY={scrollY} />}
    </div>
  )
}

// --- HTML OVERLAY ---
const HtmlOverlay = memo(({ hoveredSkill, scrollY }) => {
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  
  const showHero = scrollY < viewportHeight * 0.5
  const showProfile = scrollY > viewportHeight * 0.5 && scrollY < viewportHeight * 1.5
  const showSkills = scrollY > viewportHeight * 1.8 && scrollY < viewportHeight * 3.5
  const showProjects = scrollY > viewportHeight * 3.5 && scrollY < viewportHeight * 6.2
  const showGuestbook = scrollY > viewportHeight * 6.2

  return (
    <div className="absolute top-0 left-0 w-full z-10 pointer-events-none">
      
      {/* HERO SECTION */}
      <section id="hero" className="h-screen w-full flex flex-col justify-center items-center text-center px-4">
        <motionDom.div animate={{ opacity: showHero ? 1 : 0, y: showHero ? 0 : -30 }} transition={{ duration: 0.8 }}>
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-[1px] w-12 bg-gray-500/50"></span>
            <ScrollReveal textClassName="text-sm tracking-[0.4em] text-gray-400 font-medium uppercase">
              2026 Portfolio
            </ScrollReveal>
            <span className="h-[1px] w-12 bg-gray-500/50"></span>
          </div>
          <ScrollReveal 
            textClassName="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 leading-[1.1] mb-6"
            baseRotation={2} blurStrength={5}
          >
            DIGITAL ARTISAN
          </ScrollReveal>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
            Turning <span className="text-cyan-400 font-medium">ideas</span> <br/>
            into meaningful <span className="text-cyan-400 font-medium">web experiences.</span> <br/>
          </p>
          <div className="mt-12 animate-bounce">
            <svg className="w-6 h-6 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </motionDom.div>
      </section>

      {/* PROFILE SECTION */}
      <section id="about" className="h-screen w-full flex items-center px-6 md:px-20 pointer-events-auto">
        <motionDom.div 
          className="w-full flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto"
          animate={{ opacity: showProfile ? 1 : 0 }} transition={{ duration: 0.5 }}
        >
          <div className="w-full md:w-1/2 text-white z-20 pt-10 md:pt-0">
             <ScrollReveal textClassName="text-sm font-bold text-cyan-400 tracking-widest mb-4">HI, I AM</ScrollReveal>
             <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Muhammad Qordhowi<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Abdurrahman</span>
             </h2>
             <ScrollReveal textClassName="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
              Informatics Undergraduate at Universitas Negeri Surabaya. Specializing in Enterprise Architecture and AI Integration. Often serving as the "Technical Backbone (Penggendong Handal)" of the team, I merge Fullstack Development with Generative AI to craft intelligent ecosystems that deliver results.             </ScrollReveal>
             <div className="flex gap-4">
                <a href="/assets/CV.pdf" download className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-cyan-400 hover:scale-105 transition-all">CV</a>
                <a href="https://github.com/mqordhowi0" target="_blank" rel="noreferrer" className="px-8 py-3 border border-gray-600 text-white font-bold rounded-full hover:border-white hover:bg-white/10 transition-all">Github</a>
             </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center items-center z-20 mt-10 md:mt-0">
             {showProfile && <ProfileCard />} 
          </div>
        </motionDom.div>
      </section>

      {/* SKILLS SECTION - REVISED LAYOUT FOR MOBILE */}
      <section id="skills" className="h-[200vh] w-full relative">
        <div className={`sticky top-0 h-screen w-full flex flex-col md:flex-row md:items-center px-6 md:px-20 transition-all duration-700 ${showSkills ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Mobile: Teks Pindah ke Atas (pt-24), Desktop: Normal */}
          <div className="w-full max-w-lg relative z-10 pointer-events-none mt-24 md:mt-0 text-center md:text-left">
             <ScrollReveal textClassName="text-sm font-bold text-gray-500 tracking-widest mb-2">ARSENAL</ScrollReveal>
             {hoveredSkill ? (
               <motionDom.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={hoveredSkill.name} className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden mt-2 mx-auto md:mx-0">
                  <div className="absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full opacity-30 pointer-events-none" style={{ backgroundColor: hoveredSkill.color }}></div>
                  <h1 className="text-5xl font-black text-white mb-2 tracking-tight">{hoveredSkill.name}</h1>
                  <div className="h-1.5 w-16 rounded-full mb-6 mx-auto md:mx-0" style={{ backgroundColor: hoveredSkill.color }}></div>
                  <p className="text-lg text-gray-300 font-light">{hoveredSkill.desc}</p>
               </motionDom.div>
             ) : (
               <div className="mt-2 md:mt-6">
                 <h1 className="text-4xl md:text-6xl font-bold text-zinc-800">Select a Key</h1>
                 <p className="text-zinc-600 mt-2">Explore the technologies I use.</p>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section id="projects" className="min-h-[300vh] w-full flex flex-col justify-start px-6 md:px-20 pointer-events-auto bg-gradient-to-b from-transparent to-[#050505] relative pt-[20vh]">
         <motionDom.div className="w-full max-w-4xl mx-auto mt-20" animate={{ opacity: showProjects ? 1 : 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-16 text-center">
            <ScrollReveal textClassName="text-sm font-bold text-purple-400 tracking-widest mb-4">SELECTED WORKS</ScrollReveal>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">FEATURED PROJECTS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-40">
            {PROJECTS.map((project, i) => (
              <a key={i} href={project.link} target="_blank" rel="noreferrer" className="block h-full">
                <ProjectCardComp title={project.title} desc={project.desc} color={project.color} tags={project.tags} />
              </a>
            ))}
          </div>
        </motionDom.div>
      </section>

      {/* GUESTBOOK SECTION */}
      <section id="contact" className="min-h-screen w-full flex items-center px-6 md:px-20 pointer-events-auto bg-[#050505] relative z-20">
        <motionDom.div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center" animate={{ opacity: showGuestbook ? 1 : 0 }}>
          <div className="w-full md:w-1/2 bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span>💬</span> Kata-kata hari ini puh..
            </h2>
            <GuestBookComponent />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-right">
             <ScrollReveal textClassName="text-6xl md:text-8xl font-black text-white mb-6 leading-none">
                LET'S <br/> TALK
             </ScrollReveal>
             <p className="text-gray-400 text-xl mb-10">Have an idea? Let's build it together.</p>
             <a href="mailto:mqordhowi0@gmail.com" className="text-2xl md:text-3xl font-light text-cyan-400 hover:text-white transition-colors border-b border-cyan-400/30 pb-1">mqordhowi0@gmail.com</a>
             <div className="flex justify-center md:justify-end gap-8 mt-12">
               <SocialLink name="LinkedIn" href="https://www.linkedin.com/in/muhammad-qordhowi-abdurrahman" />
               <SocialLink name="Instagram" href="https://www.instagram.com/macchiatoberaskencur/" />
               <SocialLink name="GitHub" href="https://github.com/mqordhowi0" />
             </div>
          </div>
        </motionDom.div>
      </section>

      <footer className="w-full py-10 text-center text-gray-700 text-xs pointer-events-auto bg-[#050505] relative z-20">
        <p>&copy; 2026 MUHAMMAD QORDHOWI ABDURRAHMAN. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  )
})

// --- UTILITIES: GUESTBOOK DENGAN FIREBASE ---
const GuestBookComponent = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMessages(msgs)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Login gagal:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || !user) return

    try {
      await addDoc(collection(db, "guestbook"), {
        text: input,
        name: user.displayName, 
        uid: user.uid,
        photo: user.photoURL, 
        createdAt: serverTimestamp() 
      })
      setInput("") 
    } catch (error) {
      console.error("Gagal kirim pesan:", error)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now"
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date)
  }

  return (
    <div className="flex flex-col h-[350px]">
      {user && (
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-2">
            <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full border border-cyan-400" />
            <span className="text-xs text-gray-400">Signed in as {user.displayName}</span>
          </div>
          <button onClick={() => signOut(auth)} className="text-xs text-red-400 hover:text-red-300 transition">Logout</button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 custom-scrollbar">
        {loading ? (
          <p className="text-center text-gray-500 text-xs animate-pulse">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 text-xs">No messages yet. Be the first! 🚀</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {msg.photo ? (
                    <img src={msg.photo} alt={msg.name} className="w-5 h-5 rounded-full opacity-70 group-hover:opacity-100 transition" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-400 font-bold">{msg.name?.charAt(0)}</div>
                  )}
                  <span className="font-bold text-cyan-400 text-sm">{msg.name}</span>
                </div>
                <span className="text-[10px] text-gray-600">{formatDate(msg.createdAt)}</span>
              </div>
              <p className="text-gray-300 text-sm leading-snug pl-7">{msg.text}</p>
            </div>
          ))
        )}
      </div>
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type a message..." 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600 text-sm" 
          />
          <button type="submit" disabled={!input.trim()} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-2 rounded-xl transition-all">
            Send
          </button>
        </form>
      ) : (
        <button onClick={handleLogin} className="w-full py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition" alt="G" /> 
          <span>Sign in with Google to write</span>
        </button>
      )}
    </div>
  )
}

const ProjectCardComp = ({ title, desc, color, tags }) => {
  const colors = {
    purple: { text: 'group-hover:text-purple-400', bg: 'bg-purple-500/10', border: 'group-hover:border-purple-500/50' },
    blue: { text: 'group-hover:text-blue-400', bg: 'bg-blue-500/10', border: 'group-hover:border-blue-500/50' },
    green: { text: 'group-hover:text-green-400', bg: 'bg-green-500/10', border: 'group-hover:border-green-500/50' },
    red: { text: 'group-hover:text-red-400', bg: 'bg-red-500/10', border: 'group-hover:border-red-500/50' }
  }
  const c = colors[color] || colors.purple
  return (
    <div className={`group relative bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-8 rounded-3xl overflow-hidden hover:bg-zinc-800/60 transition-all cursor-pointer h-full ${c.border}`}>
      <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[60px] rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 ${c.bg}`}></div>
      <div className="relative z-10 flex flex-col h-full">
        <h4 className={`text-3xl font-bold text-white mb-3 transition-colors ${c.text}`}>{title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{desc}</p>
        <div className="flex gap-2 flex-wrap mt-auto">
          {tags.map((tag, i) => (<span key={i} className="text-xs font-mono px-3 py-1 rounded-full border border-white/10 text-gray-300 bg-white/5">{tag}</span>))}
        </div>
      </div>
    </div>
  )
}

const SocialLink = ({ name, href }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-500 hover:text-white cursor-pointer transition uppercase tracking-widest">{name}</a>
)

export default App