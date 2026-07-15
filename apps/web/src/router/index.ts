import { createRouter, createWebHistory } from "vue-router";
import AdminView from "@/views/AdminView.vue";
import LeaderboardView from "@/views/LeaderboardView.vue";
import VoteView from "@/views/VoteView.vue";
import { readStoredActiveEventSlug } from "@/composables/useActiveEvent";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: () => `/vote/${readStoredActiveEventSlug()}` },
    { path: "/vote", redirect: () => `/vote/${readStoredActiveEventSlug()}` },
    { path: "/vote/:slug", name: "vote", component: VoteView, props: true },
    { path: "/leaderboard", redirect: () => `/leaderboard/${readStoredActiveEventSlug()}` },
    { path: "/leaderboard/:slug", name: "leaderboard", component: LeaderboardView, props: true },
    { path: "/admin", name: "admin", component: AdminView },
  ],
});
