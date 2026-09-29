import { ArrowRight, Flower2, Leaf, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { getTodaysTasks } from '../lib/schedule'

interface Props {
  onEnter: () => void
}

export function LandingCover({ onEnter }: Props) {
  const [isEntering, setIsEntering] = useState(false)
  const { plants } = useStore()
  const todaysTasks = getTodaysTasks(plants)

  const handleStart = () => {
    if (isEntering) return
    setIsEntering(true)
    setTimeout(() => {
      onEnter()
    }, 650)
  }

  return (
    <div
      className={`landing-wrapper ${isEntering ? 'landing-exiting' : ''}`}
      onClick={handleStart}
    >
      {/* Ambient background glow & light beam */}
      <div className="landing-ambient-sun" />
      <div className="landing-sunbeam" />

      {/* Floating pollen & spore particles */}
      <div className="landing-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="landing-spore"
            style={{
              left: `${(i * 17 + 8) % 94}%`,
              animationDelay: `${(i * 0.45) % 5}s`,
              animationDuration: `${5 + ((i * 1.3) % 4)}s`,
              width: `${(i % 3) + 3}px`,
              height: `${(i % 3) + 3}px`,
              opacity: 0.35 + (i % 5) * 0.12,
            }}
          />
        ))}
      </div>

      {/* Botanical SVG Foilage Layer - Left Monstera & Fern */}
      <div className="landing-foliage landing-foliage-left">
        <svg viewBox="0 0 450 700" className="foliage-svg" fill="none">
          <defs>
            <linearGradient id="monstera-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#416632" />
              <stop offset="50%" stopColor="#2e4c23" />
              <stop offset="100%" stopColor="#1e3416" />
            </linearGradient>
            <linearGradient id="stem-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1c3114" />
              <stop offset="100%" stopColor="#4f7a3c" />
            </linearGradient>
            <linearGradient id="leaf-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7ba864" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2e4c23" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Deep back leaf */}
          <path
            d="M-50 650 Q 80 420 180 260 Q 220 200 280 180 Q 240 260 210 340 Q 140 500 -50 650 Z"
            fill="#233a1b"
            opacity="0.6"
            className="sway-back"
          />

          {/* Main Giant Monstera */}
          <g className="sway-monstera">
            {/* Stem */}
            <path
              d="M-40 700 Q 60 520 160 380 Q 220 280 290 200"
              stroke="url(#stem-grad)"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* Monstera Body with organic Fenestrations */}
            <path
              d="M 290 200 
                 C 320 220, 360 280, 350 340 
                 C 340 370, 320 380, 290 370 
                 C 320 400, 330 440, 300 480 
                 C 270 510, 240 490, 220 460 
                 C 210 510, 180 540, 140 550 
                 C 100 560, 60 520, 80 480 
                 C 10 520, -20 490, -40 450
                 C -60 400, -20 350, 40 330
                 C 0 300, 20 240, 70 210
                 C 120 180, 170 210, 190 240
                 C 200 170, 250 160, 290 200 Z"
              fill="url(#monstera-grad)"
              filter="drop-shadow(0 14px 28px rgba(18, 35, 12, 0.28))"
            />
            {/* Monstera leaf highlights */}
            <path
              d="M 290 200 C 260 270, 200 350, 140 430"
              stroke="#6b9b54"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Fenestration holes */}
            <ellipse cx="230" cy="300" rx="14" ry="32" fill="#faf8f1" opacity="0.9" transform="rotate(-30 230 300)" />
            <ellipse cx="260" cy="360" rx="12" ry="26" fill="#faf8f1" opacity="0.9" transform="rotate(-15 260 360)" />
            <ellipse cx="170" cy="360" rx="13" ry="30" fill="#faf8f1" opacity="0.9" transform="rotate(-45 170 360)" />
          </g>

          {/* Foreground fresh young leaf */}
          <g className="sway-front">
            <path
              d="M -30 680 Q 90 600 170 510 Q 210 460 200 420 Q 150 440 100 500 Q 20 600 -30 680 Z"
              fill="#527d3e"
              opacity="0.92"
            />
            <path
              d="M -30 680 Q 90 600 170 510"
              stroke="#7fb364"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Botanical SVG Foliage Layer - Right Bamboo / Palm & Vine */}
      <div className="landing-foliage landing-foliage-right">
        <svg viewBox="0 0 450 700" className="foliage-svg" fill="none">
          <defs>
            <linearGradient id="palm-grad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5d8847" />
              <stop offset="60%" stopColor="#3d602c" />
              <stop offset="100%" stopColor="#253e1a" />
            </linearGradient>
          </defs>

          {/* Bamboo & Palm Frond cascading from top right */}
          <g className="sway-palm">
            <path
              d="M 500 -20 Q 380 120 220 200 Q 110 260 20 280"
              stroke="#2e4c23"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Frond leaves */}
            {[
              { d: "M 380 120 Q 300 110 240 140 Q 290 160 370 135 Z", c: "#4f7a3c" },
              { d: "M 340 140 Q 250 145 190 190 Q 250 200 330 160 Z", c: "#5a8846" },
              { d: "M 300 165 Q 200 180 150 240 Q 210 240 290 185 Z", c: "#477035" },
              { d: "M 250 190 Q 160 220 110 290 Q 170 280 240 210 Z", c: "#5b8b46" },
              { d: "M 200 215 Q 120 260 80 330 Q 140 310 190 235 Z", c: "#40662f" },
              { d: "M 150 240 Q 80 290 40 370 Q 100 340 140 260 Z", c: "#53813e" },
              { d: "M 100 260 Q 40 310 10 400 Q 60 360 90 280 Z", c: "#3c612b" },
              { d: "M 50 275 Q 10 320 -15 390 Q 25 350 45 290 Z", c: "#4c7739" },
            ].map((leaf, idx) => (
              <path
                key={idx}
                d={leaf.d}
                fill={leaf.c}
                opacity="0.9"
                filter="drop-shadow(0 6px 14px rgba(22, 42, 16, 0.18))"
              />
            ))}
          </g>

          {/* Lower delicate Ivy spray */}
          <g className="sway-ivy">
            <path
              d="M 480 340 Q 360 420 280 500 Q 220 580 180 660"
              stroke="#385829"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {[
              { cx: 370, cy: 420, r: 24, rot: 15 },
              { cx: 320, cy: 470, r: 28, rot: -20 },
              { cx: 270, cy: 520, r: 25, rot: 35 },
              { cx: 230, cy: 580, r: 22, rot: -10 },
              { cx: 190, cy: 640, r: 20, rot: 25 },
            ].map((item, idx) => (
              <g key={idx} transform={`rotate(${item.rot} ${item.cx} ${item.cy})`}>
                <ellipse
                  cx={item.cx}
                  cy={item.cy}
                  rx={item.r * 1.1}
                  ry={item.r * 0.75}
                  fill="url(#palm-grad)"
                  opacity="0.94"
                />
                <line
                  x1={item.cx - item.r * 0.8}
                  y1={item.cy}
                  x2={item.cx + item.r * 0.8}
                  y2={item.cy}
                  stroke="#7db162"
                  strokeWidth="1.6"
                  opacity="0.75"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Artistic Core Centerpiece */}
      <main className="landing-center" onClick={(e) => e.stopPropagation()}>
        {/* Breathing Botanical Emblem */}
        <div className="landing-emblem-wrap">
          <div className="landing-emblem-halo" />
          <div className="landing-emblem">
            <div className="emblem-petals">
              <Flower2 size={44} className="emblem-flower" />
            </div>
            <Leaf size={22} className="emblem-leaf-orbit" />
          </div>
        </div>

        {/* Title & Brand */}
        <div className="landing-brand-group">
          <div className="landing-pill-tag">
            <Sparkles size={13} className="text-leaf" />
            <span>自然生长手记 · Botanical Journal</span>
          </div>

          <h1 className="landing-title">Petalog</h1>
          <p className="landing-tagline">
            聆听每一片绿叶的呼吸，珍藏四季的成长节律
          </p>
        </div>

        {/* Poetic quote card */}
        <blockquote className="landing-quote">
          “生如草木，向阳而生。在温润的泥土与晨光里，找回内心的宁静与生机。”
        </blockquote>

        {/* Status chip if plants exist */}
        <div className="landing-stats-badge">
          {plants.length > 0 ? (
            <>
              <span className="stats-dot" />
              <span>
                园中已有 <strong>{plants.length}</strong> 株绿意生机
                {todaysTasks.length > 0 && ` · 今日有 ${todaysTasks.length} 项养护待办`}
              </span>
            </>
          ) : (
            <>
              <span className="stats-dot empty" />
              <span>静候第一颗种子萌发 · 开启你的绿意物语</span>
            </>
          )}
        </div>

        {/* Enter Garden Button */}
        <button
          className="landing-enter-btn"
          onClick={handleStart}
          aria-label="进入花园"
        >
          <span className="btn-glow" />
          <span className="btn-leaf-icon">
            <Leaf size={18} />
          </span>
          <span className="btn-text">踏入花园 · 开启记录</span>
          <span className="btn-arrow">
            <ArrowRight size={18} />
          </span>
        </button>

        {/* Subtle hint */}
        <span className="landing-tap-hint">点击按钮或屏幕任意处步入花园</span>
      </main>

      {/* Bottom organic water reflection / fog layer */}
      <div className="landing-fog" />
    </div>
  )
}
