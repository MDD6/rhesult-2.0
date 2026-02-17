import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assets • RHesult",
};

const items = [
  {
    title: "Logos de clientes",
    path: "/assets/logos/",
    desc: "Coloque aqui os arquivos usados no carrossel da home (ex.: 1.png, 2.png...).",
  },
  {
    title: "Imagens da equipe",
    path: "/assets/images/",
    desc: "Armazene fotos do time, vídeos e demais mídias locais da landing.",
  },
  {
    title: "Logo principal",
    path: "/Rhesult.png",
    desc: "Logo usada no header, footer e login.",
  },
];

export default function AssetsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 px-5 py-14">
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">Assets</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight">Biblioteca de arquivos</h1>
        <p className="mt-4 text-slate-600 max-w-3xl">
          Esta página centraliza os caminhos de mídia usados no projeto para facilitar manutenção e organização.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {items.map((item) => (
            <article key={item.path} className="premium-card p-6">
              <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              <p className="mt-4 pill px-3 py-2 text-xs text-slate-700 break-all">{item.path}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
