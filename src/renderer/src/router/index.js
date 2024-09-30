import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: '默认',
            redirect: { name: 'login' }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/Login.vue')
        },
        {
            path: '/image',
            name: 'image',
            component: () => import('@/views/ImageView.vue')
        },
        {
            path: '/log',
            name: 'log',
            component: () => import('@/views/Log.vue')
        },
        {
            path: '/update',
            name: 'update',
            component: () => import('@/views/Update.vue')
        },
        {
            path: '/excel',
            name: 'excel',
            component: () => import('@/views/Excel.vue')
        },
        {
            path: '/home',
            name: 'home',
            redirect: { name: 'payment' },
            component: () => import('@/views/Home.vue'),
            children: [
                {
                    path: '/payment',
                    name: 'payment',
                    redirect: { name: 'blank' },
                    component: () => import('@/views/Payment.vue'),
                    children: [
                        {
                            path: '/payment/blank',
                            name: 'blank',
                            component: () => import('@/views/BlankPage.vue'),
                            props: route => ({ type: route.query?.type })
                        },
                        {
                            path: '/payment/:id',
                            name: 'paymentInfo',
                            component: () => import('@/views/PaymentInfo.vue')
                        }
                    ]
                },
                {
                    path: '/fundInTransit',
                    name: 'fundInTransit',
                    component: () => import('@/views/FundInTransit.vue')
                },
                {
                    path: '/bankTransfer',
                    name: 'bankTransfer',
                    component: () => import('@/views/BankTransfer.vue')
                },
                {
                    path: '/bankAccount',
                    name: 'bankAccount',
                    component: () => import('@/views/BankAccount.vue')
                },
                {
                    path: '/creditCard',
                    name: 'creditCard',
                    component: () => import('@/views/CreditCard.vue')
                },
                {
                    path: '/user',
                    name: 'user',
                    component: () => import('@/views/User.vue')
                },
                {
                    path: '/setting',
                    name: 'setting',
                    component: () => import('@/views/Setting.vue')
                }
            ]
        },
        {
            path: '/airwallex/:id',
            name: 'airwallex',
            component: () => import('@/views/Airwallex.vue')
        }
    ]
})

export default router