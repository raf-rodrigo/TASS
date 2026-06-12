/**
 * =========================================================================
 * DIRETIVA: v-tooltip (Arquitetura Singleton Global Unificada)
 * =========================================================================
 * Propósito: Gerenciar um único elemento de tooltip no body.
 * Suporta tanto o uso via diretiva v-tooltip canto a detecção automática
 * de atributos [data-tip] para compatibilidade com componentes legados.
 */

let tooltipEl = null;

const createTooltip = () => {
  if (tooltipEl) return tooltipEl;
  
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'tass-global-tooltip';
  tooltipEl.className = 'tass-global-tooltip';
  document.body.appendChild(tooltipEl);
  return tooltipEl;
};

const showTooltip = (target, text) => {
  if (!text) return;
  
  // Ignora tooltips em dispositivos touch (celulares/tablets) para evitar bugs de hover fantasma
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const tooltip = createTooltip();
  tooltip.textContent = text;
  
  const rect = target.getBoundingClientRect();
  
  // Medimos o tooltip antes de posicionar para saber sua altura real
  const tooltipRect = tooltip.getBoundingClientRect();
  
  let x = rect.left + (rect.width / 2);
  let y = rect.top - 8;

  // Clamp X para não vazar pelas laterais da tela
  const halfWidth = tooltipRect.width / 2;
  const padding = 10;
  if (x - halfWidth < padding) {
    x = halfWidth + padding;
  } else if (x + halfWidth > window.innerWidth - padding) {
    x = window.innerWidth - halfWidth - padding;
  }

  // Se não houver espaço em cima (top), invertemos para baixo
  if (rect.top - tooltipRect.height - 8 < 10) {
    y = rect.bottom + 8;
    tooltip.classList.add('tooltip-bottom');
  } else {
    tooltip.classList.remove('tooltip-bottom');
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add('is-visible');
};

const hideTooltip = () => {
  if (tooltipEl) {
    tooltipEl.classList.remove('is-visible');
  }
};

// Delegador Global para elementos com [data-tip] manual
document.addEventListener('mouseover', (e) => {
  const target = e.target.closest('[data-tip]');
  if (target && !target._hasVTooltip) {
    showTooltip(target, target.getAttribute('data-tip'));
  }
});

document.addEventListener('mouseout', (e) => {
  const target = e.target.closest('[data-tip]');
  if (target) hideTooltip();
});

// Garante que qualquer toque na tela feche eventuais tooltips perdidos
document.addEventListener('touchstart', hideTooltip, { passive: true });

export const tooltipDirective = {
  mounted(el, binding) {
    el._hasVTooltip = true; // Evita conflito com o delegador global

    el._handleMouseEnter = () => showTooltip(el, binding.value);
    el._handleMouseLeave = hideTooltip;

    el.addEventListener('mouseenter', el._handleMouseEnter);
    el.addEventListener('mouseleave', el._handleMouseLeave);
    el.addEventListener('click', hideTooltip);
  },

  updated(el, binding) {
    if (el._handleMouseEnter && binding.value !== binding.oldValue) {
      if (tooltipEl && tooltipEl.classList.contains('is-visible')) {
        tooltipEl.textContent = binding.value;
      }
    }
  },

  unmounted(el) {
    el.removeEventListener('mouseenter', el._handleMouseEnter);
    el.removeEventListener('mouseleave', el._handleMouseLeave);
    el.removeEventListener('click', hideTooltip);
    if (tooltipEl) tooltipEl.classList.remove('is-visible');
  }
};
