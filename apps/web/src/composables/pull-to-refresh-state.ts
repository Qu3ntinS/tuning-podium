import { reactive } from "vue";

export const pullToRefreshState = reactive({
  offset: 0,
  refreshing: false,
  visible: false,
});
