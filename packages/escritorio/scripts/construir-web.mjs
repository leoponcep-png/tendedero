// Construye la web del juego (packages/web/dist) para la aplicación de escritorio:
// con VITE_INICIO=/prototipos/e, para que abra directamente el menú del juego.
import { spawnSync } from "node:child_process";

const r = spawnSync("npm run build -w @tendedero/web", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, VITE_INICIO: "/prototipos/e" },
});
process.exit(r.status ?? 1);
