import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import './mobile.css'
import App from './App.vue'

import { tooltipDirective } from './directives/tooltip.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('tooltip', tooltipDirective)
app.mount('#app')
