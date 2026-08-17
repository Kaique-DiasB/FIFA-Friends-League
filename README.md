# FIFA Friends League

App pra organizar um campeonato de FIFA entre amigos: grupos, confrontos, placares, mata-mata e pódio — sem planilha no meio da cerveja.

---

## PT br

### Por que existe

Foi criado pra um campeonato de FIFA num dia típico: bebendo com os amigos e jogando. A ideia era ter um lugar simples pra cadastrar a galera, lançar resultado e acompanhar classificação sem virar confusão no grupo do WhatsApp.

### O que o app faz

- **Wizard de configuração inicial**: de 2 a 24 jogadores, com ou sem times, formato "rápido" ou "completo" (ou personalizado)
- Fase de grupos opcional (1 ou 2 grupos), com rodadas e bye gerados automaticamente pra qualquer tamanho de grupo
- Classificação automática (pontos, saldo, etc.)
- Mata-mata gerado a partir da quantidade de jogadores — oitavas/quartas/semis/final conforme o caso, com rodada preliminar automática quando o número não fecha uma chave redonda
- Jogo único ou ida e volta no mata-mata, e disputa de 3º lugar opcional
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

3. Na primeira vez, o app abre um **wizard**: cadastre os participantes (e times, se quiser), escolha o formato do campeonato e confirme — a fase de grupos e o mata-mata são gerados automaticamente.

4. No dia do campeonato:
   - Aba **Participantes** → ajuste nomes e times a qualquer momento
   - Abas de fase/rodada → vá lançando os placares das partidas
   - Cada fase do mata-mata é liberada assim que a anterior fecha
   - Use **Reiniciar** se quiser apagar tudo e configurar um campeonato novo pelo wizard

5. Quer só mostrar a tabela/chave pra galera? Abra `/classificacao`.

### Como editar / contribuir

| O quê | Onde |
| --- | --- |
| Motor do torneio (algoritmos de chave, fixtures, regras de classificação) | `src/utils/tournamentHelpers.ts` |
| Tipos (`Participant`, `Match`, `ChampionshipConfig`, estado do torneio) | `src/types/tournament.ts` |
| Wizard de criação do campeonato | `src/app/onboarding/`, `src/components/onboarding/` |
| Tela principal e abas | `src/app/page.tsx` |
| UI dos jogos, bracket, tabelas | `src/components/` |
| API + SQLite | `src/app/api/tournament/`, `src/utils/db.ts` |
| Página de classificação | `src/app/classificacao/page.tsx` |
| Testes do motor do torneio | `src/utils/tournamentHelpers.test.ts` |


> `tournament.db` é local e está no `.gitignore`. Cada máquina gera o próprio banco ao rodar.

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build |
| `npm run lint` | ESLint |
| `npm test` | Testes (Vitest) |

---

## 🇺🇸 English

### Why it exists

Built for a FIFA tournament on a typical hangout day: drinks with friends and matches on the console. The goal was a dead-simple place to register players, enter scores, and track the table without chaos in the WhatsApp group.

### What it does

- **Setup wizard** on first run: 2 to 24 players, teams optional, "fast" or "complete" presets (or fully custom)
- Optional group stage (1 or 2 groups), with rounds and byes auto-generated for any group size
- Automatic standings
- Knockout bracket generated from the player count — round of 16/quarters/semis/final as applicable, with an automatic preliminary round when the count doesn't fill a clean bracket
- Single-leg or two-leg knockout, and an optional 3rd-place decider
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

3. On first run, the app opens a **setup wizard**: register participants (and teams, optionally), pick the tournament format, and confirm — the group stage and knockout bracket are generated automatically.

4. On tournament day:
   - **Participants** → adjust names/teams anytime
   - Stage/round tabs → enter match scores
   - Each knockout stage unlocks as soon as the previous one is complete
   - Use **Reset** to wipe everything and set up a new tournament via the wizard

5. Display-only view: `/classificacao`.

### How to edit / contribute

| What | Where |
| --- | --- |
| Tournament engine (bracket algorithms, fixtures, standings rules) | `src/utils/tournamentHelpers.ts` |
| Types (`Participant`, `Match`, `ChampionshipConfig`, tournament state) | `src/types/tournament.ts` |
| Setup wizard | `src/app/onboarding/`, `src/components/onboarding/` |
| Main screen & tabs | `src/app/page.tsx` |
| Match UI, bracket, tables | `src/components/` |
| API + SQLite | `src/app/api/tournament/`, `src/utils/db.ts` |
| Standings page | `src/app/classificacao/page.tsx` |
| Tournament engine tests | `src/utils/tournamentHelpers.test.ts` |

> `tournament.db` is local and gitignored. Each machine creates its own DB on first run.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest) |

---

Stack: **Next.js**, **React**, **Tailwind**, **better-sqlite3**, **Vitest**.
