# Fila do dono

Pontos que o dono pediu para não esquecer. Cada item entra assim que ele fala, com a data. Ao concluir, marque `[x]` e cite a decisão (Dnnn).

## Para fazer

- [x] **Domínio novo `nextlevelcommerce.com.br`** (D287, no ar em 13/11) (11/11/2026): ligar no Render e no registro.br, depois trocar o endereço principal da E-commerce (passo a passo em `docs/infra/DOMINIO-NOVO-ECOMMERCE.md`, código pronto no D281).
- [x] **Lembrete das parcelas do contrato** (D284) (sugerido em 11/11/2026): e-mail ao cliente 2 dias antes e no dia; aviso ao dono quando vencer sem "Já fiz o Pix". O restante do Anderson vence em 16/11.
- [x] **Endereço padrão do domínio próprio dos lojistas** (D284) (pendência antiga): o código ainda cai no serviço de Treino se a configuração do Render sumir (`src/lib/domain/dominio-proprio.ts`).
- [x] **E-mail de verdade (Resend)** (D285, no ar em 12/11): o dono adiciona o domínio no Resend e manda o print do DNS; depois `RESEND_API_KEY` (o dono cola no Render), `EMAIL_FROM` e `EMAIL_REPLY_TO`.
- [ ] **Ler o texto dos termos de uso (D279):** já está no ar desde 12/11; se mudar algo, sai uma versão nova e todos aceitam de novo.
- [ ] **Isca da janela de saída (D280)**: se o dono tiver um material (por exemplo, um guia "Como montar sua loja em 1 dia"), trocar a oferta da janela por ele.

- [ ] **Temas para Nuvemshop e Nossos clientes (D282, D283), no ar:** o que falta é opcional. O dono manda:
  - a prévia com semijoias;
  - a cidade da iRest e da CCV;
  - os logotipos dos clientes;
  - um depoimento real.

  Quando um cliente migrar para a plataforma, ligar o selo "Na NextLevel Commerce".
- [ ] **Personalização com nome e número na camisa** (ideia vinda da Futcollection, 12/11/2026): a plataforma ainda não tem esse recurso; avaliar.
- [ ] **CT4 dos contratos:** aditivos e outros modelos (migração, marketing).
- [ ] **Série do YouTube:** vídeo 5 (o último).
- [ ] **Render:** filtros de montagem (`docs/**`, `**/*.md`); apagar os domínios `hubcreators` e `brasdigitalclub` e o banco do Treino depois de conferir.

- [ ] **Remover `superdrop.com.br` do Render** depois de uns dias sem uso (D287), e apagar o DNS de `bras` e `cargas`.
- [ ] **Google Search Console:** cadastrar `nextlevelcommerce.com.br` e pedir a mudança de endereço (plano de busca S0).
- [ ] **Materiais e QR codes** (série do YouTube, PDFs) com o domínio novo.

- [ ] **Logos da NextLevel Commerce** (D288): gerar no GPT com os prompts de `docs/marcas/nextlevel-commerce-logo-racional.md` e mandar aqui.

- [ ] **DMARC mais rígido** (D289): em 2 a 4 semanas, passar `_dmarc` de `p=none` para `p=quarantine`.
- [ ] **Correio Agêntico** (D289): e-mails de suporte@ viram atendimento no Master (webhook da Hostinger).

## Feito

- [x] Páginas Temas para Nuvemshop (D282) e Nossos clientes (D283), no ar em 12/11/2026.
- [x] Contratos no painel, Pix manual, cortesia, termos de uso e janela de saída (D276 a D280), salvos para a publicação de 11/11/2026.
