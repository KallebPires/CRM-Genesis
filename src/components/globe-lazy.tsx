"use client";

import dynamic from "next/dynamic";

/**
 * A geometria do globo pesa ~112 KB. Carregar sob demanda tira esse peso do
 * bundle inicial, então o formulário de login aparece na hora e o globo entra
 * logo depois.
 *
 * Sem placeholder de propósito: o globo é fundo posicionado em absolute, então
 * a ausência dele não desloca nada — e um esqueleto piscando atrás do card
 * chamaria mais atenção do que a espera.
 */
export const GlobeLazy = dynamic(
  () => import("@/components/globe").then((m) => m.Globe),
  { ssr: false, loading: () => null }
);
