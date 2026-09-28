import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "process.env.REACT_APP_APILINK": JSON.stringify(
        env.VITE_APILINK || env.REACT_APP_APILINK || ""
      ),
      "process.env.REACT_APP_MEDIA_LINK": JSON.stringify(
        env.VITE_MEDIA_LINK || env.REACT_APP_MEDIA_LINK || ""
      ),
    },
  };
});
