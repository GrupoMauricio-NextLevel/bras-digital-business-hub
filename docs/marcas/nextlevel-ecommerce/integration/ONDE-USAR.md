# Mapa de aplicação

| Local | Arquivo relativo à pasta do kit |
|---|---|
| Header/sidebar clara | logos/flat/logo-clara.png |
| Header/sidebar dark | logos/flat/logo-escura.png |
| Marca de destaque clara | logos/prisma/logo-clara.png |
| Marca de destaque dark | logos/prisma/logo-escura.png |
| Navegação recolhida | logos/monogramas/monograma-flat.png |
| Apresentação vertical | logos/vertical/logo-vertical-clara.png ou logo-vertical-escura.png |
| Uma tinta | logos/monocromaticas/logo-positiva.png ou logo-negativa.png |
| Aba de navegador | logos/favicons/favicon.ico |
| Apple touch | logos/app-icons/apple-touch-icon-180.png |
| PWA | logos/app-icons/icon-192.png e icon-512.png |
| Maskable | logos/app-icons/icon-maskable-512.png |

Para tamanhos compactos, prefira logos/responsive. Paths finais podem ser prefixados com /brands/nextlevel-ecommerce/. A configuração é uma sugestão de integração, não um mapeamento já aplicado no repositório.

A prancha em referencias é apenas referência. Não usar como logo no cabeçalho.

O símbolo colorido é compartilhado entre claro e dark: não há necessidade de duplicar o mesmo PNG com outro nome. As assinaturas com lettering têm arquivos próprios de tema.

O arquivo integration/site.webmanifest é um modelo para instalação na raiz pública da marca, por exemplo /brands/nextlevel-ecommerce/site.webmanifest. Seus caminhos relativos logos/... pressupõem essa posição de destino; não servi-lo diretamente da subpasta integration sem ajustar os caminhos. Adaptar start_url e scope somente depois de confirmar as rotas reais.
