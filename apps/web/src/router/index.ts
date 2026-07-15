import { createRouter, createWebHistory } from "vue-router";
import AdminView from "@/views/AdminView.vue";
import LeaderboardView from "@/views/LeaderboardView.vue";
import VoteView from "@/views/VoteView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/vote" },
    { path: "/vote", name: "vote", component: VoteView },
    { path: "/leaderboard", name: "leaderboard", component: LeaderboardView },
    { path: "/admin", name: "admin", component: AdminView },
  ],
});
