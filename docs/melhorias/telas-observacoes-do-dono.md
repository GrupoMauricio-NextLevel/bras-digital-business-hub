# Observações do dono sobre as telas (fila de melhorias)

Memória permanente das avaliações de tela do dono (prints e comentários). Cada item entra aqui assim que chega e é resolvido durante as próximas fases. Ao resolver, marque com a data, o commit e a decisão.

| # | Data | Tela / endereço | O que o dono viu | O que fazer | Situação |
|---|---|---|---|---|---|
| 1 | 2026-10-09 | Login da Cargas e demais logins | Foto de moda em login de sistema; "Quer uma loja?" na Cargas | Foto só da própria marca; convite por marca | Resolvido (D109, 6d0a78d) |
| 2 | 2026-11-17 | Cadastro de produto da loja (`/merchant/catalogo/[id]`), PC e celular | Não exclui foto no PC; não edita grade de sapatos; só arquiva, não exclui produto; edição limitada | Auditoria e prompt em `docs/prompts/cadastro-produto-auditoria-e-melhorias.md` (fases P1 a P4) | Resolvido (D328), aguardando a conferência do dono |
| 3 | 2026-11-17 | Todos os painéis (referência: `prints/2026-11-17-referencia-painel-com-vida.jpg`) | Quer vida: cores, gráficos, números principais em destaque, imagem de fundo em blocos certos, efeitos e movimento, do Master ao cliente final; "o que mais estou esquecendo?" | Prompt mestre `docs/prompts/paineis-com-vida-prompt-mestre.md` (PV0 a PV10) e imagens em `imagens-paineis-com-vida-gpt.md`; ponto de partida em `docs/design/capturas/paineis-com-vida/` | Aberto: proposta registrada (D331), aguardando as respostas da seção A6 |

## Como registrar
- Print recebido: salvar em `docs/melhorias/prints/AAAA-MM-DD-<tela>.png` (sem dado pessoal real) e abrir uma linha na tabela.
- Prioridade: o que quebra a confiança do cliente (marca errada, texto errado, dado vazando) vem antes do acabamento.
