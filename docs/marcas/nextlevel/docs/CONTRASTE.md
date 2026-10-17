# Contraste — NextLevel v2

Cálculo sRGB dos pares de tokens entregues. Razão `(Lmaior + 0,05) / (Lmenor + 0,05)`, com linearização sRGB. Alvos: 4,5:1 para texto comum e 3:1 para foco/bordas de controle sobre a superfície. Isso verifica os pares estáticos, não todos os estados e overlays da futura aplicação.

| Tema | Primeiro plano | Fundo | Razão | Alvo | Resultado |
|---|---|---|---:|---:|---|
| light | text | surface | 19.08:1 | 4.5:1 | PASSOU |
| light | textMuted | surface | 6.71:1 | 4.5:1 | PASSOU |
| light | text | surfaceMuted | 17.63:1 | 4.5:1 | PASSOU |
| light | textMuted | surfaceMuted | 6.2:1 | 4.5:1 | PASSOU |
| light | text | surfaceElevated | 19.08:1 | 4.5:1 | PASSOU |
| light | textMuted | surfaceElevated | 6.71:1 | 4.5:1 | PASSOU |
| light | textOnAction | action | 6.51:1 | 4.5:1 | PASSOU |
| light | textOnAction | actionHover | 8.14:1 | 4.5:1 | PASSOU |
| light | textOnAction | actionActive | 10:1 | 4.5:1 | PASSOU |
| light | link | surface | 6.51:1 | 4.5:1 | PASSOU |
| light | focus | surface | 6.51:1 | 3:1 | PASSOU |
| light | focus | surfaceMuted | 6.02:1 | 3:1 | PASSOU |
| light | focus | surfaceElevated | 6.51:1 | 3:1 | PASSOU |
| light | borderStrong | surface | 3.86:1 | 3:1 | PASSOU |
| light | borderStrong | surfaceElevated | 3.86:1 | 3:1 | PASSOU |
| light | success | surface | 6.52:1 | 4.5:1 | PASSOU |
| light | warning | surface | 6.79:1 | 4.5:1 | PASSOU |
| light | danger | surface | 6.49:1 | 4.5:1 | PASSOU |
| light | info | surface | 7.06:1 | 4.5:1 | PASSOU |
| dark | text | surface | 17.63:1 | 4.5:1 | PASSOU |
| dark | textMuted | surface | 10.46:1 | 4.5:1 | PASSOU |
| dark | text | surfaceMuted | 15.34:1 | 4.5:1 | PASSOU |
| dark | textMuted | surfaceMuted | 9.1:1 | 4.5:1 | PASSOU |
| dark | text | surfaceElevated | 13.63:1 | 4.5:1 | PASSOU |
| dark | textMuted | surfaceElevated | 8.09:1 | 4.5:1 | PASSOU |
| dark | textOnAction | action | 5.13:1 | 4.5:1 | PASSOU |
| dark | textOnAction | actionHover | 4.63:1 | 4.5:1 | PASSOU |
| dark | textOnAction | actionActive | 6.51:1 | 4.5:1 | PASSOU |
| dark | link | surface | 9.29:1 | 4.5:1 | PASSOU |
| dark | focus | surface | 8.35:1 | 3:1 | PASSOU |
| dark | focus | surfaceMuted | 7.26:1 | 3:1 | PASSOU |
| dark | focus | surfaceElevated | 6.45:1 | 3:1 | PASSOU |
| dark | borderStrong | surface | 5.24:1 | 3:1 | PASSOU |
| dark | borderStrong | surfaceElevated | 4.05:1 | 3:1 | PASSOU |
| dark | success | surface | 12.41:1 | 4.5:1 | PASSOU |
| dark | warning | surface | 12.25:1 | 4.5:1 | PASSOU |
| dark | danger | surface | 10.04:1 | 4.5:1 | PASSOU |
| dark | info | surface | 9.29:1 | 4.5:1 | PASSOU |

Todos os pares listados passaram. Bordas decorativas não integram este critério; controles usam borderStrong. Não usar texto branco sobre todo o gradiente royal–turquesa: o contraste varia por posição. O mesmo vale para texto pequeno em turquesa sobre branco. Revalidar links, disabled, overlays, transparências e foco em telas reais.

