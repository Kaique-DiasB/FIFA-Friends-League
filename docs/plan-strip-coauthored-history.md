# Plano: remover trailers Co-authored-by do histórico

## Objetivo

Tirar atribuição de ferramentas de AI das mensagens de commit **já gravadas**. Commits novos já ficam limpos pelo hook em `.githooks/`.

## Commits afetados (já estão em `origin/main`)

| SHA curto | Mensagem | Trailer |
| --- | --- | --- |
| `6f7ab0d` | Add FIFA friends league tournament app. | `Co-authored-by: Cursor <cursoragent@cursor.com>` |
| `2850354` | feat: generic tournament engine + setup wizard… | `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` |
| `f9323e9` | docs: update README for the wizard-driven flow | `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` |

Não dá para editar só o texto: mudar a mensagem muda o SHA do commit e de **todos os descendentes**. O `6f7ab0d` é o segundo commit do repo, então quase todo o histórico muda.

## Riscos

- Exige **force push na `main`**.
- Clones locais, PRs abertas e o remoto do Dinihz ficam dessincronizados.
- Issues/PRs que apontam para SHA antigo quebram o link.

Só seguir se o dono do repo autorizar force push na `main` e avisar quem tem o clone.

## Procedimento (local, numa branch de rewrite)

1. Instalar [`git-filter-repo`](https://github.com/newren/git-filter-repo) (`pipx install git-filter-repo` ou o pacote da distro).
2. A partir de `main` atualizada:

```bash
git checkout -b rewrite/strip-coauthored-by
git filter-repo --force --message-callback '
import re
msg = message.decode("utf-8")
msg = re.sub(r"(?im)^Co-authored-by:.*\n?", "", msg)
msg = re.sub(r"\n{3,}", "\n\n", msg)
msg = msg.rstrip() + "\n"
return msg.encode("utf-8")
'
```

`--force` é necessário porque este repo já tem `origin`. O callback só mexe na mensagem; trees e authors permanecem.

3. Conferir que os trailers sumiram e que o código não mudou:

```bash
git log --all --format='%h %s%n%b' | grep -i 'Co-authored-by' || echo 'nenhum trailer'
git diff origin/main --stat
```

O `--stat` deve ficar vazio (mesmo conteúdo, SHAs diferentes). O log dos 3 commits deve manter o texto humano e perder só o trailer.

4. Publicar **somente depois de autorização explícita**:

```bash
git push --force-with-lease origin rewrite/strip-coauthored-by:main
```

Não usar `--force` puro se houver commits novos na `main` remota.

## Depois do push

Quem tiver clone local:

```bash
git fetch origin
git checkout main
git reset --hard origin/main
```

Só fazer isso se não houver trabalho local não publicado em cima da `main` antiga.

## Fora de escopo

- Não reescrever author/committer.
- Não apagar commits, só o trailer da mensagem.
- Não filtrar menções a AI no corpo da mensagem (ex.: um commit futuro sobre “remover Copilot”).
