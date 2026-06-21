/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desativado: o StrictMode (dev) monta/desmonta os componentes duas vezes, o que
  // dispara um erro interno do react-apexcharts (runMaskReveal lendo nó nulo) durante
  // a animação. É comportamento só de desenvolvimento (no build não há impacto).
  reactStrictMode: false,
  images: {
    // Placeholders de produto vêm de um serviço externo; libere o host aqui.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      // Imagens temáticas de moto (placeholder por palavra-chave).
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "*.staticflickr.com" },
      // Uploads servidos pela API local (imagens de produto salvas no servidor).
      { protocol: "http", hostname: "localhost", port: "3001" },
    ],
  },
};

export default nextConfig;
