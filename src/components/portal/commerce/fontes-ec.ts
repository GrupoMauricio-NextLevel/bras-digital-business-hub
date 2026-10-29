import localFont from "next/font/local";
import "./tech.css";

// Tipografia de tecnologia da NextLevel E-commerce (D222, OFL): Space Grotesk nos títulos, Geist no texto, Geist Mono em rótulos e números.
// Usada no portal público e nas telas de entrada/cadastro da E-commerce (D223).
const ecTitulo = localFont({ src: "../../../app/fonts/space-grotesk-latin.woff2", variable: "--ec-font-titulo", display: "swap", weight: "300 700" });
const ecTexto = localFont({ src: "../../../app/fonts/geist-latin.woff2", variable: "--ec-font-texto", display: "swap", weight: "100 900" });
const ecMono = localFont({ src: "../../../app/fonts/geist-mono-latin.woff2", variable: "--ec-font-mono", display: "swap", weight: "100 900" });

/** Classe que liga o visual de tecnologia (fontes + `tech.css`) num trecho da página. */
export const EC_TECH = `ec-tech ${ecTitulo.variable} ${ecTexto.variable} ${ecMono.variable}`;
