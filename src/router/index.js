import Vue from 'vue'
import VueRouter from 'vue-router'
import GoGoAPI from '@/views/GoGoAPI.vue'
import OfflineDatalog from '@/views/OfflineDatalog.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/gogoapi'
  },
  {
    path: '/gogoapi',
    name: 'GoGoAPI',
    component: GoGoAPI
  },
  {
    path: '/offline-datalog',
    name: 'OfflineDatalog',
    component: OfflineDatalog
  },
  {
    path: '*',
    redirect: '/gogoapi'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
