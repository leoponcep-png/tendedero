import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const CARPETA = fileURLToPath(new URL("../../configuraciones/", import.meta.url));

// Lista, guarda y borra las configuraciones con nombre en /configuraciones.
// Solo existe mientras se usa en local; el modo online tendrá su propio servidor.
function configuraciones(): Plugin {
  return {
    name: "tendedero-configuraciones",
    configureServer(server) {
      server.middlewares.use("/api/configuraciones", async (req, res) => {
        try {
          await fs.mkdir(CARPETA, { recursive: true });
          const archivo = decodeURIComponent((req.url ?? "/").replace(/^\//, ""));
          if (req.method === "GET") {
            const nombres = (await fs.readdir(CARPETA)).filter((n) => n.endsWith(".json")).sort();
            const lista = await Promise.all(
              nombres.map(async (n) => ({ archivo: n, ...JSON.parse(await fs.readFile(path.join(CARPETA, n), "utf8")) })),
            );
            return enviar(res, 200, lista);
          }
          if (req.method === "POST") {
            const { nombre, ajustes } = JSON.parse(await leerCuerpo(req));
            const limpio = String(nombre ?? "").trim();
            if (!limpio) return enviar(res, 400, { error: "Falta el nombre." });
            const destino = `${aArchivo(limpio)}.json`;
            await fs.writeFile(path.join(CARPETA, destino), JSON.stringify({ nombre: limpio, ajustes }, null, 2) + "\n");
            return enviar(res, 200, { archivo: destino });
          }
          if (req.method === "DELETE" && /^[a-z0-9-]+\.json$/.test(archivo)) {
            await fs.unlink(path.join(CARPETA, archivo));
            return enviar(res, 200, {});
          }
          enviar(res, 405, { error: "Operación no admitida." });
        } catch (e) {
          enviar(res, 500, { error: String(e) });
        }
      });
    },
  };
}

const BOCETOS = fileURLToPath(new URL("../../bocetos/", import.meta.url));

// Guarda en /bocetos los dibujos de la pizarra de los prototipos, para poder enseñárselos a Claude.
// Solo existe en local, como las configuraciones.
function bocetos(): Plugin {
  return {
    name: "tendedero-bocetos",
    configureServer(server) {
      server.middlewares.use("/api/bocetos", async (req, res) => {
        try {
          if (req.method !== "POST") return enviar(res, 405, { error: "Operación no admitida." });
          const { nombre, png } = JSON.parse(await leerCuerpo(req));
          const datos = String(png ?? "").replace(/^data:image\/png;base64,/, "");
          if (!datos) return enviar(res, 400, { error: "Falta el dibujo." });
          await fs.mkdir(BOCETOS, { recursive: true });
          const fecha = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
          const destino = `${fecha}-${aArchivo(String(nombre ?? "")) || "boceto"}.png`;
          await fs.writeFile(path.join(BOCETOS, destino), Buffer.from(datos, "base64"));
          enviar(res, 200, { archivo: `bocetos/${destino}` });
        } catch (e) {
          enviar(res, 500, { error: String(e) });
        }
      });
    },
  };
}

function aArchivo(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "configuracion";
}

function leerCuerpo(req: IncomingMessage): Promise<string> {
  return new Promise((resolver, fallar) => {
    let cuerpo = "";
    req.on("data", (trozo) => (cuerpo += trozo));
    req.on("end", () => resolver(cuerpo));
    req.on("error", fallar);
  });
}

function enviar(res: ServerResponse, estado: number, datos: unknown) {
  res.statusCode = estado;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(datos));
}

export default defineConfig({
  plugins: [react(), configuraciones(), bocetos()],
  server: { port: 5180 },
  // Rutas relativas: la web publicada funciona en cualquier carpeta (p. ej. usuario.github.io/tendedero/).
  base: "./",
});
