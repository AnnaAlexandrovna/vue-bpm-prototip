import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import PanelView from '../views/PanelView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: PanelView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
