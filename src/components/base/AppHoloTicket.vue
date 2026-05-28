<script setup>
import { computed } from 'vue';

const props = defineProps({
  isRunning: {
    type: Boolean,
    default: false
  },
  ticketTitle: {
    type: String,
    default: 'TICKET'
  },
  subtitle: {
    type: String,
    default: 'Task'
  },
  dateOrStatus: {
    type: String,
    default: 'In Progress'
  },
  description: {
    type: String,
    default: '...'
  },
  priorityLabel: {
    type: String,
    default: 'Normal'
  }
});

const emit = defineEmits(['toggle-timer', 'adjust-time']);
</script>

<template>
  <div class="card cursor-pointer" :class="{ 'is-running': isRunning }" @click.stop="emit('toggle-timer')" title="Play/Stop">
    <div class="notes">♪♪♪♪♪</div>
    <div class="notes">♪♪♪♪</div>
    <div class="notes">♪♪♪♪♪</div>

    <div class="header">
      <span class="title-text">{{ ticketTitle }}</span>
      <div class="symbol">✁</div>
    </div>
    <div class="body">
      <em>{{ subtitle }}</em><br />
      <span class="font-bold">{{ dateOrStatus }}</span><br />
      <div class="line-clamp-3 text-[11px] leading-tight mt-1 font-medium whitespace-pre-wrap break-words" :title="description">{{ description }}</div>
    </div>
    <div class="footer">
      <div class="number">Priority <span class="bold">{{ priorityLabel }}</span></div>
      <div class="barcode"></div>
    </div>

    <div class="bg holographic"></div>
    <svg class="filter">
      <filter id="bump">
        <feTurbulence
          result="noise"
          numOctaves="3"
          baseFrequency="0.7"
          type="fractalNoise"
        ></feTurbulence>
        <feSpecularLighting
          in="noise"
          result="specular"
          lighting-color="#fffffc"
          specularExponent="25"
          specularConstant="0.8"
          surfaceScale="0.15"
        >
          <fePointLight z="210" y="100" x="100"></fePointLight>
        </feSpecularLighting>
        <feComposite
          result="noise2"
          operator="in"
          in="specular"
          in2="SourceGraphic"
        ></feComposite>
        <feBlend mode="screen" in2="noise2" in="SourceGraphic"></feBlend>
      </filter>
    </svg>
  </div>
</template>

<style scoped>
/* From Uiverse.io by dexter-st */ 
.card {
  --width: 180px;
  --height: 320px;
  --perforation-size: 12px;
  --cutouts-adjust: 70px;

  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  grid-template-areas:
    "header"
    "body"
    "footer";

  width: var(--width);
  height: var(--height);
  padding: var(--perforation-size) 0;

  font-family: "Inter", sans-serif;
  font-size: 1rem;
  user-select: none;
  overflow: hidden;

  filter: drop-shadow(0 2px 1px #00000025) drop-shadow(0 4px 3px #00000025)
    drop-shadow(0 10px 9px #00000025) drop-shadow(0 20px 20px #00000025)
    drop-shadow(0 40px 40px #00000025);
    
  /* Animation only when running */
  animation-play-state: paused;
  will-change: transform, filter;
  transition: transform 0.2s ease;
}

.card:active {
  transform: scale(0.95) !important;
}

.card.is-running {
  animation: hover 3s ease infinite;
}

@keyframes hover {
  50% {
    filter: drop-shadow(0 4px 3px #00000015) drop-shadow(0 6px 6px #00000015)
      drop-shadow(0 16px 14px #00000015) drop-shadow(0 30px 28px #00000015)
      drop-shadow(0 60px 60px #00000015);
    transform: translateY(-7px) scale(1.02);
  }
}

.filter {
  position: absolute;
  width: 0;
  height: 0;
}

.bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: #fff;
  filter: url(#bump);
  mask:
    radial-gradient(circle at 50% 0, #fff0 calc(var(--perforation-size) - 5px), #000 calc(var(--perforation-size) - 4px)),
    radial-gradient(circle at 50% 100%, #fff0 calc(var(--perforation-size) - 5px), #000 calc(var(--perforation-size) - 4px)),
    radial-gradient(circle 8px at left center, #000 98%, #0000 100%),
    radial-gradient(circle 8px at right center, #000 98%, #0000 100%),
    repeating-linear-gradient(90deg, #000 10px, #000 15px, #0000 16px, #0000 24px);

  mask-repeat: repeat-x, repeat-x, no-repeat, no-repeat, repeat-x;
  mask-size: calc(var(--perforation-size) * 2) 100%, calc(var(--perforation-size) * 2) 100%, 16px 16px, 16px 16px, 10px 2px;
  mask-position: calc(0.5 * var(--perforation-size)) top, calc(0.5 * var(--perforation-size)) bottom, left var(--cutouts-adjust), right var(--cutouts-adjust), 0 calc(var(--cutouts-adjust) + 7px);
  mask-composite: intersect, exclude, add, add;
}

.holographic {
  background-image: linear-gradient(to bottom, #fe58, 90%, #0002),
    conic-gradient(at 60% 50%, #ccc, #ff6bfe, #00f9f8, #ddd, #0081fd, #eef0bc, #0081fd, #ff6bfe, #0002, #0081fd, #ddd, #01fefb, #ccc);
}
.holographic::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 70% 20%, #f0f, #0000),
    repeating-radial-gradient(circle at 30% 80%, #fff, #f4a 48px, #eeeeee 150px);
  mix-blend-mode: color-burn;
}
.holographic::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(to bottom, #f205, #f00, #0f0, #f205);
  mix-blend-mode: difference;
  
  /* Animation only when running */
  animation-play-state: paused;
  background-position: 0 0;
  background-size: 100% 300%;
  background-repeat: repeat;
}

.card.is-running .holographic::after {
  animation: bg-pos 3s ease-in-out infinite alternate;
}

@keyframes bg-pos {
  to {
    background-position: 0 500px;
  }
}

.header {
  position: relative;
  grid-area: header;
  margin: 0 8px;
  text-align: center;
  z-index: 1;
  font-family: "Impact", sans-serif;
  color: #ffffff9f;
  text-shadow: 0 0 0 #000;
  -webkit-text-stroke: #fff 0.5px;
  mix-blend-mode: difference;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 40px;
}

.title-text {
  font-size: 1.8rem;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.body {
  grid-area: body;
  margin: 0 1em;
  padding: 0.5em;
  font-weight: 200;
  z-index: 1;
}

.footer {
  grid-area: footer;
  z-index: 1;
  margin: 0 1em 1em 1em;
}

.number {
  margin-bottom: 0.75rem;
  text-align: center;
  border-radius: 999px 0;
  color: #000;
  font-weight: 200;
}
.number .bold {
  font-weight: 600;
}

.barcode {
  justify-self: center;
  width: 0;
  height: 32px;
  box-shadow:
    0px 0 0 1px #000, 5px 0 0 1px #000, 7px 0 0 1px #000, 11px 0 0 1px #000,
    15px 0 0 1px #000, 16px 0 0 1px #000, 22px 0 0 1px #000, 27px 0 0 1px #000,
    30px 0 0 1px #000, 35px 0 0 1px #000, 36px 0 0 1px #000, 39px 0 0 1px #000,
    43px 0 0 1px #000, 47px 0 0 1px #000, 50px 0 0 1px #000, 55px 0 0 1px #000,
    59px 0 0 1px #000, 60px 0 0 1px #000, 64px 0 0 1px #000, 69px 0 0 1px #000,
    70px 0 0 1px #000, 74px 0 0 1px #000;
  transform: translateX(37px);
}

.symbol {
  position: absolute;
  right: -5px;
  rotate: 185deg;
  font-size: 1.5rem;
  color: #fff;
  opacity: 0.2;
}
.notes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-size: 5rem;
  color: #e7e7e7;
  mix-blend-mode: color-burn;
  transform: translateY(20%);
  z-index: 1;
}
.notes:nth-child(2) {
  transform: translateY(40%);
}
.notes:nth-child(3) {
  transform: translateY(60%);
}
</style>
