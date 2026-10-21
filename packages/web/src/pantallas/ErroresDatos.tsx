export function ErroresDatos({ errores }: { errores: string[] }) {
  return (
    <main className="pagina">
      <h1>Hay errores en los archivos de datos</h1>
      <p>Corrígelos en la carpeta <code>data/</code>; la página se recarga sola al guardar.</p>
      <ul className="lista-errores">
        {errores.map((e, i) => (
          <li key={i}>
            <code>{e}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
