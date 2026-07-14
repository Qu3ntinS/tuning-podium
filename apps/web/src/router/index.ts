import { createRouter, createWebHistory } from "vue-router";
import LeaderboardView from "@/views/LeaderboardView.vue";
import VoteView from "@/views/VoteView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/vote" },
    { path: "/vote", name: "vote", component: VoteView },
    { path: "/leaderboard", name: "leaderboard", component: LeaderboardView },
    {
      path: "/admin",
      redirect: (to) => ({
        path: "/vote",
        query: { ...to.query, admin: "1" },
      }),
    },
  ],
});
