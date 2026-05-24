import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { tooltipDirective } from './directives/tooltip.js'

const app = createApp(App)
app.use(createPinia())
app.directive('tooltip', tooltipDirective)
app.mount('#app')
