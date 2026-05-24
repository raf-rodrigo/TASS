let tooltipEl = null;

const createTooltip = () => {
  if (tooltipEl) return tooltipEl;
  
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'breathe-global-tooltip';
  tooltipEl.className = 'tass-global-tooltip';
  document.body.appendChild(tooltipEl);
  return tooltipEl;
};

const showTooltip = (target, text) => {
  if (!text) return;
  const tooltip = createTooltip();
  tooltip.textContent = text;
  
  const rect = target.getBoundingClientRect();
  const x = rect.left + (rect.width / 2);
  const y = rect.top - 8;

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
