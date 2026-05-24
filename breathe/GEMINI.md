# 🤖 Diretrizes de Atuação da IA (Breathe)

Este arquivo define o comportamento esperado da inteligência artificial ao interagir com o repositório Breathe.

## 1. Postura Crítica e Consultiva
- **Validação de Práticas:** A IA deve atuar de forma consultiva. Se alguma solicitação introduzir débitos técnicos, quebrar a segurança da execução local de comandos Git ou contornar as proteções de branches estáveis, a IA deve alertar o usuário e sugerir a abordagem adequada.
- **Portas Fixas:** O frontend deve rodar estritamente na porta **5185** e o servidor backend Express na porta **5186**. Qualquer nova funcionalidade ou script deve seguir essa topologia.
- **Segurança da Execução de Comandos (Proteção RCE e Path Traversal):**
  - Toda rota de backend que manipule caminhos de arquivos ou execute comandos locais Git deve restringir cabeçalhos (ex: `X-Breathe-Client: true`).
  - As origens de CORS devem ser estritamente locais (`localhost` e `127.0.0.1`). Nunca use `*`.

## 2. Padrões Técnicos e Visuais
- **Política "Zero Hardcoded":** Valores visuais fixos de temas e geometrias são proibidos. Utilize sempre os tokens CSS semânticos (`text-app-*`, `bg-app-*`, `border-app-*`) e variáveis de arredondamento (`var(--app-card-radius)`, `var(--app-input-radius)`).
- **Proteção Absoluta da Master:** A branch configurada como **Master** (`branchMaster` nas configurações) não pode sofrer nenhuma ação destrutiva (reconstrução ou exclusão). Ela é estritamente de leitura para o rebuilder.
- **Exclusão com Double-Check:** A deleção de branches na aba de merges exige modal de confirmação no frontend (exigindo confirmação de dois passos).
- **Máscara de Token:** Campos exibindo o Token do GitLab devem ocultar seu valor por padrão com botão de revelar (estilo senha), prevenindo exposição acidental.

## 3. Gestão de Dados (IndexedDB)
- **Persistência Centralizada:** As configurações de ambiente do Breathe são armazenadas localmente em uma base IndexedDB chamada `BreatheDB` usando Dexie.
- As chaves de configuração suportadas incluem:
  - `gitlabUrl`
  - `gitlabProjectId`
  - `gitlabToken`
  - `branchMaster` (Padrão: `master-sistsocial`)
  - `branchHomologacao` (Padrão: `hml`)
  - `branchDesenvolvimento` (Padrão: `dev-06`)
  - `theme` (Padrão: `dark`)

## 4. Engenharia e Qualidade
- **Validação de Compilação:** Antes de declarar uma tarefa concluída, garanta que os testes passem (`npm run test`) e que o build compile (`npm run build`) sem erros de PostCSS/Tailwind.
- **Cultura de Testes:** Funcionalidades críticas (como a proteção da master e persistência da store) devem ter testes unitários correspondentes.
- **Idioma:** Toda a comunicação, raciocínio interno e documentação de código devem ser em **Português**.
- **Git Commit:** Sugira a mensagem de commit no padrão **Conventional Commits** em uma linha única contendo o comando completo Git.
