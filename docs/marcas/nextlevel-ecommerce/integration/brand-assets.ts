// Adapte o prefixo à estrutura pública real do projeto.
const base = '/brands/nextlevel-ecommerce/';
export const ecommerceBrandAssets = {
  name: 'NextLevel E-commerce',
  logoLight: base + 'logos/flat/logo-clara.png',
  logoDark: base + 'logos/flat/logo-escura.png',
  prismaLight: base + 'logos/prisma/logo-clara.png',
  prismaDark: base + 'logos/prisma/logo-escura.png',
  symbol: base + 'logos/monogramas/monograma-flat.png',
  favicon: base + 'logos/favicons/favicon.ico',
} as const;
