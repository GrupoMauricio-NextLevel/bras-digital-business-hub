# Mapa de instalação

O arquivo `brand.config.json` é um contrato de referência, não pressupõe framework. Adapte-o ao registro de marcas já existente no projeto.

## Destino recomendado

Copie a pasta completa `bras-digital-club/` para uma destas convenções, escolhendo a que o repositório já utiliza:

- `public/brands/bras-digital-club/`
- `public/assets/brands/bras-digital-club/`
- `src/assets/brands/bras-digital-club/`

Não espalhe os PNGs em pastas genéricas. Mantenha uma raiz única por marca e exponha os caminhos por meio do registro central de marcas/tenants.

## Ordem de implementação

1. Copiar os ativos.
2. Registrar tokens e caminhos.
3. Implementar o seletor de logo por contraste/tema.
4. Aplicar o tema no painel.
5. Aplicar o tema na página pública.
6. Instalar favicons e PWA.
7. Executar testes e revisão visual.

O campo `canonicalUrl` permanece `null` até que a extensão final do domínio seja confirmada.
