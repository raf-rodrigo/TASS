<script setup>
import { computed } from 'vue';
import { Play, Square, Clock } from 'lucide-vue-next';

const props = defineProps({
  isRunning: {
    type: Boolean,
    default: false
  },
  // Destination: Start
  departureCountry: {
    type: String,
    default: 'Task'
  },
  departureAcronym: {
    type: String,
    default: 'TSK'
  },
  departureTime: {
    type: String,
    default: '00:00'
  },
  
  // Destination: End
  arrivalCountry: {
    type: String,
    default: 'Done'
  },
  arrivalAcronym: {
    type: String,
    default: 'DNE'
  },
  arrivalTime: {
    type: String,
    default: '--:--'
  },
  
  // Data
  ticketId: {
    type: String,
    default: '000000'
  },
  passenger: {
    type: String,
    default: ''
  },
  flight: {
    type: String,
    default: 'TASS'
  },
  gate: {
    type: String,
    default: '--'
  },
  seat: {
    type: String,
    default: '--'
  }
});

const emit = defineEmits(['toggle-timer', 'adjust-time']);
</script>

<template>
  <div class="container-cards-ticket">
    <div class="card-ticket" :class="{ 'is-running': isRunning }">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="150"
        viewBox="0 0 64 150"
        fill="black"
        class="ticket-barcode"
      >
        <!-- Barcode Path (Truncado por concisão no template, usando o original) -->
        <path d="M44 138V136.967H20V138H44Z"></path>
        <path d="M44 13.0328V12H20V13.0328H44Z"></path>
        <path d="M44 14.0656V13.5492H20V14.0656H44Z"></path>
        <path d="M44 15.6148V15.0984H20V15.6148H44Z"></path>
        <path d="M44 18.1967V17.6803H20V18.1967H44Z"></path>
        <path d="M44 20.2623V19.2295H20V20.2623H44Z"></path>
        <path d="M44 22.8443V22.3279H20V22.8443H44Z"></path>
        <path d="M44 23.877V23.3607H20V23.877H44Z"></path>
        <path d="M44 26.9754V24.9098H20V26.9754H44Z"></path>
        <path d="M44 28.0082V27.4918H20V28.0082H44Z"></path>
        <path d="M44 29.5574V29.041H20V29.5574H44Z"></path>
        <path d="M44 32.6557V30.5902H20V32.6557H44Z"></path>
        <path d="M44 33.6885V33.1721H20V33.6885H44Z"></path>
        <path d="M44 35.2376V34.7213H20V35.2376H44Z"></path>
        <path d="M44 36.2705V35.7541H20V36.2705H44Z"></path>
        <path d="M44 39.3689V37.3033H20V39.3689H44Z"></path>
        <path d="M44 40.918V40.4015H20V40.918H44Z"></path>
        <path d="M44 43.5001V41.4345H20V43.5001H44Z"></path>
        <path d="M44 45.0492V44.5327H20V45.0492H44Z"></path>
        <path d="M44 47.631V46.0819H20V47.631H44Z"></path>
        <path d="M44 49.1804V48.664H20V49.1804H44Z"></path>
        <path d="M44 51.2458V50.2131H20V51.2458H44Z"></path>
        <path d="M44 52.2787V51.7622H20V52.2787H44Z"></path>
        <path d="M44 54.3443V52.7952H20V54.3443H44Z"></path>
        <path d="M44 56.4099V55.377H20V56.4099H44Z"></path>
        <path d="M44 57.959V57.4426H20V57.959H44Z"></path>
        <path d="M44 60.0247V58.4753H20V60.0247H44Z"></path>
        <path d="M44 62.09V61.0573H20V62.09H44Z"></path>
        <path d="M44 63.6394V63.123H20V63.6394H44Z"></path>
        <path d="M44 66.7377V64.6721H20V66.7377H44Z"></path>
        <path d="M44 68.2868V67.7704H20V68.2868H44Z"></path>
        <path d="M44 69.3198V68.8033H20V69.3198H44Z"></path>
        <path d="M44 72.4181V71.3851H20V72.4181H44Z"></path>
        <path d="M44 73.4508V72.9345H20V73.4508H44Z"></path>
        <path d="M44 76.5493V74.4837H20V76.5493H44Z"></path>
        <path d="M44 77.5819V77.0655H20V77.5819H44Z"></path>
        <path d="M44 79.1311V78.6146H20V79.1311H44Z"></path>
        <path d="M44 80.6802V80.164H20V80.6802H44Z"></path>
        <path d="M44 82.2294V81.1967H20V82.2294H44Z"></path>
        <path d="M44 83.7788V83.2623H20V83.7788H44Z"></path>
        <path d="M44 86.3606V85.8441H20V86.3606H44Z"></path>
        <path d="M44 87.9097V87.3935H20V87.9097H44Z"></path>
        <path d="M44 91.0083V88.9427H20V91.0083H44Z"></path>
        <path d="M44 92.041V91.5245H20V92.041H44Z"></path>
        <path d="M44 94.623V92.5574H20V94.623H44Z"></path>
        <path d="M44 96.1722V95.6557H20V96.1722H44Z"></path>
        <path d="M44 97.7213V97.2048H20V97.7213H44Z"></path>
        <path d="M44 99.2704V98.2378H20V99.2704H44Z"></path>
        <path d="M44 100.82V100.303H20V100.82H44Z"></path>
        <path d="M44 103.402V102.885H20V103.402H44Z"></path>
        <path d="M44 105.467V104.434H20V105.467H44Z"></path>
        <path d="M44 108.049V106.5H20V108.049H44Z"></path>
        <path d="M44 109.082V108.566H20V109.082H44Z"></path>
        <path d="M44 112.18V111.148H20V112.18H44Z"></path>
        <path d="M44 113.213V112.697H20V113.213H44Z"></path>
        <path d="M44 114.762V114.246H20V114.762H44Z"></path>
        <path d="M44 118.377V116.311H20V118.377H44Z"></path>
        <path d="M44 119.41V118.893H20V119.41H44Z"></path>
        <path d="M44 120.442V119.926H20V120.442H44Z"></path>
        <path d="M44 122.508V120.959H20V122.508H44Z"></path>
        <path d="M44 124.574V123.541H20V124.574H44Z"></path>
        <path d="M44 127.672V125.607H20V127.672H44Z"></path>
        <path d="M44 128.705V128.188H20V128.705H44Z"></path>
        <path d="M44 130.254V129.738H20V130.254H44Z"></path>
        <path d="M44 132.32V131.287H20V132.32H44Z"></path>
        <path d="M44 135.418V133.869H20V135.418H44Z"></path>
        <path d="M44 136.451V135.934H20V136.451H44Z"></path>
      </svg>
      <div class="separator">
        <span class="span-lines"></span>
      </div>
      <div class="content-ticket">
        <div class="content-data">
          <div class="destination">
            <div class="dest start">
              <p class="country">{{ departureCountry }}</p>
              <p class="acronym">{{ departureAcronym }}</p>
              <p class="hour cursor-pointer hover:text-indigo-500 transition-colors" @click.stop="emit('adjust-time')" title="Ajustar tempo">
                <Clock class="w-3 h-3 inline-block mr-1" />
                {{ departureTime }}
              </p>
            </div>
            <svg
              style="flex-shrink: 0;"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="#aeaeae"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="m18 8l4 4l-4 4M2 12h20"
              ></path>
            </svg>
            <div class="dest end">
              <p class="country">{{ arrivalCountry }}</p>
              <p class="acronym">{{ arrivalAcronym }}</p>
              <p class="hour">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 1024 1024"
                >
                  <path
                    fill="currentColor"
                    d="M352 768a32 32 0 1 0 0 64h448a32 32 0 0 0 32-32V352a32 32 0 0 0-64 0v416z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="M777.344 822.656a32 32 0 0 0 45.312-45.312l-544-544a32 32 0 0 0-45.312 45.312z"
                  ></path>
                </svg>
                {{ arrivalTime }}
              </p>
            </div>
          </div>
          <div style="border-bottom: 2px solid #e8e8e8"></div>
          <div class="data-flex-col">
            <div class="data-flex">
              <div class="data">
                <p class="title">ID</p>
                <p class="subtitle">{{ ticketId }}</p>
              </div>
              <div class="data passenger">
                <p class="title">Passenger</p>
                <p class="subtitle">{{ passenger }}</p>
              </div>
            </div>
            <div class="data-flex">
              <div class="data">
                <p class="title">Flight</p>
                <p class="subtitle">{{ flight }}</p>
              </div>
              <div class="data">
                <p class="title">Gate</p>
                <p class="subtitle">{{ gate }}</p>
              </div>
              <div class="data">
                <p class="title">Seat</p>
                <p class="subtitle">{{ seat }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="container-icons">
          <!-- Ícone de Play/Stop -->
          <div 
            class="icon cursor-pointer hover:scale-110 transition-transform p-1 rounded-full" 
            :class="isRunning ? 'bg-red-500/20 text-white' : 'hover:bg-white/20 text-white'"
            @click.stop="emit('toggle-timer')"
            title="Play/Stop"
          >
            <Square v-if="isRunning" class="w-5 h-5 fill-current animate-pulse" />
            <Play v-else class="w-5 h-5 fill-current ml-0.5" />
          </div>
          
          <div class="icon uiverse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              height="20"
              width="20"
            >
              <path
                fill="currentColor"
                d="M38.0481 4.82927C38.0481 2.16214 40.018 0 42.4481 0H51.2391C53.6692 0 55.6391 2.16214 55.6391 4.82927V40.1401C55.6391 48.8912 53.2343 55.6657 48.4248 60.4636C43.6153 65.2277 36.7304 67.6098 27.7701 67.6098C18.8099 67.6098 11.925 65.2953 7.11548 60.6663C2.37183 56.0036 3.8147e-06 49.2967 3.8147e-06 40.5456V4.82927C3.8147e-06 2.16213 1.96995 0 4.4 0H13.2405C15.6705 0 17.6405 2.16214 17.6405 4.82927V39.1265C17.6405 43.7892 18.4805 47.2018 20.1605 49.3642C21.8735 51.5267 24.4759 52.6079 27.9678 52.6079C31.4596 52.6079 34.0127 51.5436 35.6268 49.4149C37.241 47.2863 38.0481 43.8399 38.0481 39.0758V4.82927Z"
              ></path>
              <path
                fill="currentColor"
                d="M86.9 61.8682C86.9 64.5353 84.9301 66.6975 82.5 66.6975H73.6595C71.2295 66.6975 69.2595 64.5353 69.2595 61.8682V4.82927C69.2595 2.16214 71.2295 0 73.6595 0H82.5C84.9301 0 86.9 2.16214 86.9 4.82927V61.8682Z"
              ></path>
              <path
                fill="currentColor"
                d="M2.86102e-06 83.2195C2.86102e-06 80.5524 1.96995 78.3902 4.4 78.3902H83.6C86.0301 78.3902 88 80.5524 88 83.2195V89.1707C88 91.8379 86.0301 94 83.6 94H4.4C1.96995 94 0 91.8379 0 89.1707L2.86102e-06 83.2195Z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* From Uiverse.io by Cobp */ 
.container-cards-ticket {
  perspective: 1000px;
}

.card-ticket {
  position: relative;
  height: 150px;
  width: 320px;
  display: flex;
  color: #2d2d2d;
  background-color: #ffffff;
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25);
  z-index: 10;
  gap: 1rem;
  overflow: hidden;
  /* Animação default desligada */
  animation: animation-card 10s infinite;
  animation-play-state: paused;
}

/* Quando está isRunning, habilitamos a animação principal e a dos pseudo-elementos */
.card-ticket.is-running {
  animation-play-state: running;
}
.card-ticket.is-running .content-ticket::after,
.card-ticket.is-running .content-ticket::before,
.card-ticket.is-running .container-icons {
  animation-play-state: running;
}

/* O hover pausa a animação mesmo se estiver rodando */
.card-ticket:hover {
  animation-play-state: paused !important;
  transform: translateY(-5px);
}
.card-ticket:hover .content-ticket::after,
.card-ticket:hover .content-ticket::before,
.card-ticket:hover .container-icons {
  animation-play-state: paused !important;
}

.ticket-barcode {
  flex-shrink: 0;
  height: 100%;
}

.separator {
  position: absolute;
  top: 0;
  left: 50px;
  width: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 10;
}

.separator .span-lines {
  position: relative;
  display: flex;
  height: 100%;
  border-left: 2px dashed #e8e8e8;
}
.separator .span-lines::after {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  border-radius: 16px;
  background-color: #e8e8e8;
}
.separator .span-lines::before {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  border-radius: 1rem;
  background-color: #e8e8e8;
}

.content-ticket {
  position: relative;
  justify-content: space-between;
  width: 100%;
  display: flex;
}

.content-ticket::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  background-image: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0.8)
  );
  transform: translateX(200px) scale(1.5);
  filter: blur(10px);
  width: 200px;
  height: 100%;
  animation: shadow-card 10s infinite;
  animation-play-state: paused;
}

.content-ticket::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100px;
  background-image: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0),
    #ffffff,
    rgba(0, 0, 0, 0)
  );
  transform: translateX(-100px) scale(1.5) rotate(20deg);
  width: 80px;
  height: 100%;
  animation: light-card 10s infinite;
  animation-play-state: paused;
}

.content-data {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 0.75rem;
  gap: 0.25rem;
  z-index: 10; /* Para ficar em cima das luzes */
}

.content-data .data-flex,
.content-data .data-flex-col {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;
}

.content-data .data-flex-col {
  padding-bottom: 0.25rem;
  flex-direction: column;
}

.data {
  font-size: 10px;
  line-height: 12px;
}
.data .title {
  color: #aeaeae;
}
.data .subtitle {
  font-weight: 500;
  color: #212121;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.data.passenger .subtitle {
  max-width: 120px;
}

.destination {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.destination .dest {
  display: flex;
  flex-direction: column;
}

.destination .dest .country {
  font-size: 10px;
  line-height: 1;
  color: #aeaeae;
}

.destination .dest .acronym {
  font-weight: 700;
  color: #2d2d2d;
}

.destination .dest .hour {
  font-size: 10px;
  line-height: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2d2d2d;
}

.container-icons {
  width: fit-content;
  padding: 0.625rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  animation: color-card 10s infinite;
  animation-play-state: paused;
  z-index: 1; /* Atrás dos dados, mas compõe a faixa da direita */
}

.container-icons .icon {
  color: #ffffff;
}

@keyframes animation-card {
  0% {
    transform: translateZ(0px);
  }

  25% {
    transform: translateX(-10px) rotateY(-20deg);
  }

  75% {
    transform: translateX(10px) rotateY(20deg);
  }

  100% {
    transform: translateZ(0px);
  }
}

@keyframes light-card {
  25% {
    transform: translateX(450px) scale(1.5) rotate(25deg);
  }

  50% {
    transform: translateX(-100px) scale(1.5) rotate(25deg);
  }
}

@keyframes shadow-card {
  35% {
    transform: translateX(200px) scale(1.5);
  }

  75% {
    transform: translateX(0px) scale(1.5);
  }
}

@keyframes color-card {
  0% {
    background-color: #ffbd44;
  }

  10% {
    background-color: #fb6902;
  }

  15%,
  25% {
    background-color: #ff4141;
  }

  35% {
    background-color: #fb6902;
  }

  40% {
    background-color: #ffbd44;
  }

  50% {
    background-color: #fb6902;
  }

  55%,
  75% {
    background-color: #ff4141;
  }

  75% {
    background-color: #fb6902;
  }

  100% {
    background-color: #ffbd44;
  }
}
</style>
