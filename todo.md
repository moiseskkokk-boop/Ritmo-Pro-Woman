# Ritmo Pro Woman — checklist final

## Regra de preservação
- Não reconstruir o site.
- Não alterar os 4 treinos atuais, divisão, exercícios, séries, repetições, ordem ou imagens.

## Funcionalidades implementadas
- [x] Nome do site atualizado para **Ritmo Pro Woman**.
- [x] Logo enviada aplicada no cabeçalho, rodapé, PWA e notificações.
- [x] Consentimento obrigatório antes do acompanhamento personalizado.
- [x] Perfil com idioma PT/EN/ES e preferência persistida.
- [x] Histórico de avaliações preservado.
- [x] Fotos padronizadas de frente, lateral e costas em armazenamento privado.
- [x] Dados informados e medidos separados de estimativas IA.
- [x] Análise visual transparente, com confiança calculada pela qualidade dos dados.
- [x] Comparação com avaliação anterior da própria cliente.
- [x] Prioridades musculares dinâmicas.
- [x] Avaliação semanal dentro do quadro de acompanhamento existente — sem segundo quadro.
- [x] Sete perguntas semanais: objetivo, carga de membros superiores, carga do agachamento, cardio diário, sono, recuperação e fadiga ao fim dos quatro dias.
- [x] Avaliação identificada por semana e substituída quando refeita na mesma semana.
- [x] Botão **Limpar informações e começar novamente**, com confirmação e limpeza apenas do formulário atual.
- [x] Prompt da IA alinhado aos sete indicadores e ao 5º dia adaptativo, evitando definir o perfil apenas pela carga.
- [x] 5º dia temporário e complementar, podendo ser recuperação ativa, cardio/condicionamento, core/estabilidade, mobilidade, treino complementar, estímulo adicional ou descanso.
- [x] Notificações personalizadas com preferências, horários, dias, resumo semanal, check-in mensal e teste no navegador.
- [x] Aviso discreto de segurança durante o treino.
- [x] Respostas da análise IA no idioma selecionado.

## Critérios de aceite
- O treino base atual permanece intacto.
- Nenhuma análise apresenta estimativa visual como medição clínica.
- Fotos e dados pessoais ficam protegidos por autenticação e armazenamento privado.
- A avaliação semanal não reutiliza respostas antigas quando o formulário é limpo; uma nova gravação na mesma semana substitui o registro semanal anterior.

## Validação executada
- Migração `0007_bent_gargoyle.sql` revisada e aplicada: somente `weekKey` em `body_assessments`.
- `pnpm check` passou.
- `pnpm test` passou: 1 arquivo, 1 teste.
- `pnpm build` passou.
- Revisão visual full-page realizada no preview.
- Verificação estrutural: 4 dias, 26 prescrições de 3 séries e assets originais preservados.
