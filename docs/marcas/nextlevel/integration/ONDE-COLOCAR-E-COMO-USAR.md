# Mapa de instalação e aplicação

## Arquivos

Destino sugerido para recursos públicos: `public/brands/nextlevel/`. Preserve caminhos e adapte apenas a raiz se o projeto já usa outra convenção. Não misture logos NextLevel com a pasta de outra marca.

Copie `logos/`, `3d/` e `social/` para o destino de assets. `referencias/` e `previews/` servem à conferência. Documentos não precisam ficar expostos no site público.

Os tokens CSS/JSON e o contrato `brand.config.json` devem entrar na fonte única de temas/marcas. Não importe o CSS em um `:root` que afete todas as marcas; mantenha o escopo explícito.

## Matriz de uso

| Local | Recurso | Observação |
|---|---|---|
| Hero institucional navy | prisma escura + hero metal | título e CTA como HTML |
| Header público claro | flat clara | preservar legibilidade em escala real |
| Footer navy | prisma escura ou variante com slogan | escolher pelo espaço disponível |
| Login Master | prisma conforme card/fundo | a superfície do card define a versão |
| Sidebar expandida dark | flat escura | sem brilho adicional em CSS |
| Sidebar recolhida | monograma flat | fornecer nome acessível ao link |
| Cards dentro do Master | identidade da marca-filho no card | shell do Master continua NextLevel |
| Documento claro | monocromática positiva ou flat clara | não reconstruir com uma fonte similar |
| PWA/navegador | ícones e favicons entregues | manter recorte e zona segura |
| Compartilhamento | OG 1200×630 | URL absoluta validada nos metadados |

## Nomenclatura

`logo-clara.png` é para fundo claro; `logo-escura.png` é para fundo dark. Ambas têm alpha. `flat` é simplificação de interface; `prisma` contém o acabamento de marca aprovado.

`brand-assets.ts` é um exemplo de resolução de caminhos independente de framework. Leia a matriz suportada antes de integrar: o pacote não contém todas as combinações matemáticas entre layout, cor, slogan e material. Escolha o arquivo existente em vez de simular um export por CSS.

## Domínio e manifest

O briefing cita `nextlevelgroup.com.br`. `canonicalUrl` permanece nulo no contrato até a configuração real do projeto ser conferida. `site.webmanifest` pressupõe uma aplicação na raiz; adapte `id`, `start_url` e `scope` se o Master estiver em subrota ou domínio próprio.

O exemplo de assinatura de e-mail usa caminhos absolutos propostos, que só funcionarão depois de publicar os ativos no domínio configurado. Substitua os campos de contato por dados reais.
