import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Esconde o selo de rota do modo dev (o "N" no canto). Erros de compilação
  // e de runtime continuam aparecendo normalmente.
  devIndicators: false,
};

export default nextConfig;
