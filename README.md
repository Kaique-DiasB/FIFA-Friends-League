# FIFA Friends League

App pra organizar um campeonato de FIFA entre amigos: grupos, confrontos, placares, mata-mata e pódio — sem planilha no meio da cerveja.

---

## PT br

### Por que existe

Foi criado pra um campeonato de FIFA num dia típico: bebendo com os amigos e jogando. A ideia era ter um lugar simples pra cadastrar a galera, lançar resultado e acompanhar classificação sem virar confusão no grupo do WhatsApp.

### O que o app faz

- **10 jogadores** em **2 grupos** (A e B, 5 cada)
- Fase de grupos com rodadas e bye
- Classificação automática (pontos, saldo, etc.)
- Quartas, semis (ida e volta), 3º lugar e final
- Placar com pênaltis quando precisar
- Persistência em **SQLite** (`tournament.db`)
- Página de classificação em `/classificacao` (boa pra TV / share)

### Como usar

1. Instale as dependências e suba o servidor:

```bash
npm install
npm run dev
```

2. Abra [http://localhost:3000](http://localhost:3000).

3. No dia do campeonato:
   - Aba **Participantes** → troque os nomes padrão pelos nomes reais
   - Aba **Grupos** → vá lançando os placares das partidas
   - Aba **Classificação** → veja quem avança
   - Quando a fase de grupos fechar, o app libera as **quartas**
   - Siga **semis → 3º lugar → final** até sair o campeão
   - Use **Reset** se quiser recomeçar do zero

4. Quer só mostrar a tabela/chave pra galera? Abra `/classificacao`.

### Como editar / contribuir

| O quê | Onde |
| --- | --- |
| Nomes padrão, fixtures, regras de classificação | `src/utils/tournamentHelpers.ts` |
| Tipos (`Participant`, `Match`, estado do torneio) | `src/types/tournament.ts` |
| Tela principal e abas | `src/app/page.tsx` |
| UI dos jogos, bracket, tabelas | `src/components/` |
| API + SQLite | `src/app/api/tournament/`, `src/utils/db.ts` |
| Página de classificação | `src/app/classificacao/page.tsx` |


> `tournament.db` é local e está no `.gitignore`. Cada máquina gera o próprio banco ao rodar.

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build |
| `npm run lint` | ESLint |

---

## 🇺🇸 English

### Why it exists

Built for a FIFA tournament on a typical hangout day: drinks with friends and matches on the console. The goal was a dead-simple place to register players, enter scores, and track the table without chaos in the WhatsApp group.

### What it does

- **10 players** in **2 groups** (A and B, 5 each)
- Group stage with rounds and byes
- Automatic standings
- Quarters, semis (home & away), 3rd place, and final
- Penalty shootouts when needed
- Persistence via **SQLite** (`tournament.db`)
- Standings/bracket page at `/classificacao` (nice for TV / sharing)

### How to use

1. Install and run:

```bash
npm install
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000).

3. On tournament day:
   - **Participants** → replace default names
   - **Groups** → enter match scores
   - **Standings** → see who advances
   - When groups finish, **quarterfinals** unlock
   - Continue through **semis → 3rd place → final**
   - Use **Reset** to start over

4. Display-only view: `/classificacao`.

### How to edit / contribute

| What | Where |
| --- | --- |
| Default names, fixtures, standings rules | `src/utils/tournamentHelpers.ts` |
| Types (`Participant`, `Match`, tournament state) | `src/types/tournament.ts` |
| Main screen & tabs | `src/app/page.tsx` |
| Match UI, bracket, tables | `src/components/` |
| API + SQLite | `src/app/api/tournament/`, `src/utils/db.ts` |
| Standings page | `src/app/classificacao/page.tsx` |

> `tournament.db` is local and gitignored. Each machine creates its own DB on first run.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |

---

Stack: **Next.js**, **React**, **Tailwind**, **better-sqlite3**.
