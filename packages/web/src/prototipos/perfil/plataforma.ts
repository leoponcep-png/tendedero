// La capa de plataforma (navegador / Steam) vive ahora en src/plataforma. Este archivo se queda para que el perfil
// la siga importando desde aquí. Los ids de Steam de cada logro están en logros.ts (campo `steam`) y deben
// coincidir con los del panel de Steamworks.
export { plataforma, usarPlataforma, usePlataforma } from "../../plataforma";
export type { AmigoPlataforma, Plataforma } from "../../plataforma";
