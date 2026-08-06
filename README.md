# LifeHub · Rhayanne

Life Operating System / Second Brain pessoal e profissional.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Lucide Icons
- Recharts
- Motion (`motion/react`)

## Sync (PC + iPhone)

O app usa Supabase Auth + uma tabela `lifehub_snapshots` (JSON). Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (veja `.env.example`). Rode o SQL em `supabase/schema.sql` no SQL Editor do projeto.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (geralmente `http://localhost:5173`).

## Módulos

1. Dashboard
2. Finanças & Poupança (7 abas)
3. Agenda
4. Hábitos
5. Trabalho (Lista + Kanban)
6. Metas & OKRs
7. Estudos (Pomodoro + Flashcards)
8. Saúde
9. Desenvolvimento Pessoal
10. Estatísticas
11. Conteúdo / Redes Sociais
