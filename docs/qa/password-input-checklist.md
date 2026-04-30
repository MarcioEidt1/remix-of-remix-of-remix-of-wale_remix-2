# Checklist de Testes — Toggle de Visibilidade de Senha

Componente: `src/components/admin/PasswordInput.tsx`
Páginas afetadas: `/admin/login`, `/admin/users` (criar usuário e resetar senha)

## Pré-requisitos
- Build atualizado e preview carregado
- Conta admin de testes (não usar produção)
- Chrome ≥ 120
- Pelo menos 1 gerenciador de senhas instalado

## Páginas a testar
| # | Rota | Campo |
|---|------|-------|
| A | `/admin/login` | Senha de login |
| B | `/admin/users` → "Novo Usuário" | Senha do novo usuário |
| C | `/admin/users` → ícone 🔑 em um usuário | Nova senha (reset) |

---

## Cenário 1 — Chrome Anônimo (Ctrl+Shift+N)
Para cada página A, B, C:
- [ ] Campo inicia com `type="password"` (●●●)
- [ ] Ícone inicial é **EyeOff** (riscado)
- [ ] Digitar `Teste@123` → apenas máscara
- [ ] Clicar no ícone → texto fica visível, ícone vira **Eye**
- [ ] Clicar de novo → volta a mascarar, ícone vira **EyeOff**
- [ ] Tab não foca o botão do olho
- [ ] Sem erros no Console

## Cenário 2 — Chrome Normal + Autofill
- [ ] `/admin/users` NÃO é preenchido automaticamente (usa `new-password`)
- [ ] `/admin/login` aceita autofill e toggle ainda funciona
- [ ] Senha sugerida pelo Chrome respeita o toggle

## Cenário 3 — Bitwarden ativo
- [ ] Overlay do Bitwarden não bloqueia o ícone do olho
- [ ] Toggle funciona após autofill
- [ ] `/admin/users` não recebe sugestão da extensão

## Cenário 4 — LastPass / 1Password / Dashlane
Repetir Cenário 3 com cada extensão. Confirmar que nenhuma força `type=password` de volta após o toggle.

## Cenário 5 — Mobile (375x812)
- [ ] Ícone visível e clicável
- [ ] Tap funciona
- [ ] Layout colapsa sem cortar o ícone

## Cenário 6 — Acessibilidade
- [ ] Tooltip muda: "Mostrar senha" / "Ocultar senha"
- [ ] `aria-label` muda conforme estado
- [ ] Leitor de tela anuncia corretamente
- [ ] Contraste ≥ 4.5:1 nos 3 contextos (`bg-secondary`, `bg-background`)

## Cenário 7 — Edge cases
- [ ] Colar (Ctrl+V) respeita o estado do toggle
- [ ] Senha vazia + toggle não quebra
- [ ] Múltiplos campos têm estado independente
- [ ] Fechar/reabrir formulário reseta o toggle

## Critério de aprovação
Cenários **1, 2, 6** obrigatórios + ao menos um dentre **3 ou 4**.

## Como reportar falha
1. Cenário e página
2. Navegador + versão + extensões
3. Screenshot + DevTools mostrando atributo `type`
4. Print do Console
