# 🚀 TASS - Task & Advanced Support System
*Elite Productivity for High-Performance Developers*

O **TASS** é um ecossistema de suporte avançado projetado para desenvolvedores que buscam o máximo em produtividade e organização. Combinando uma estética refinada com engenharia de precisão, o TASS transforma a gestão de tarefas em uma experiência fluida, segura e visualmente impactante.

---

## ✨ Diferenciais Premium

### 🎨 Design Engine: O Workspace é Seu
O TASS não é apenas uma ferramenta; é um **Ambiente de Trabalho Imersivo** que se molda à sua identidade. Através de uma engine de design dinâmica e poderosa, você tem controle total sobre a estética do seu espaço produtivo com **Live Preview** instantâneo.

| Recurso | Detalhes da Experiência |
| :--- | :--- |
| **Radius Harmony** | Geometria inteligente com ajuste unificado de arredondamento de cantos. Mantém a harmonia matemática entre cards, inputs e modais em tempo real. |
| **Opacidade Granular** | Controle absoluto da transparência. Ajuste níveis de opacidade de forma independente para Cards, Menus, Barra Superior e Dock Inferior. |
| **Task Styles Profiles** | Construção avançada de **Perfis de Tarefas**. Customize o padding, dimensões, fontes, contornos e cores das tarefas. Aplique os perfis individualmente a cada card ou force-os em colunas inteiras do seu Kanban. |
| **Galeria Premium** | Slots curados para wallpapers de alta definição, permitindo transformar o clima do seu ambiente com um único clique. |
| **Ajuste Dinâmico** | Altere o brilho, contraste e desfoque do workspace para se adaptar ao seu momento, seja para foco total ou inspiração criativa. |

*O conceito de **Glassmorphism Aprimorado** do TASS entrega efeitos de desfoque e camadas que mantêm a profundidade e a clareza, proporcionando uma interface "viva" e sofisticada.*

### ⚡ Agilidade Adaptável (Kanban & Sprints)
O TASS redefine a agilidade com um sistema que se molda ao seu ritmo, e não o contrário. Uma abordagem fluida para quem precisa de ordem sem a rigidez dos sistemas tradicionais.

| Recurso | A Experiência TASS |
| :--- | :--- |
| **Quadro Mutável** | O sistema se adapta ao "tamanho do seu dia". Alterne instantaneamente entre **1 e 4 colunas** para simplificar ou expandir seu fluxo de trabalho conforme a carga cognitiva do momento. |
| **Sprints de Foco** | Sprints no TASS não são obrigações burocráticas, mas **ciclos de clareza**. Organize tarefas por prazos ou use-as como "pastas" dinâmicas para organizar o ciclo de vida dos seus projetos. |
| **Foco no Agora** | Elimine o ruído visual com precisão cirúrgica. Escolha focar em uma Sprint específica para máxima concentração ou visualize o panorama completo com a visão global. |
| **Nomenclatura Livre** | Liberdade total para definir seu método. Personalize o nome das colunas (**Backlog, Fazendo, Revisando**, etc.) para refletir exatamente sua metodologia ou preferência pessoal. |

### ☁️ Sincronização Google Drive Cloud
Seus dados estão sempre seguros e acessíveis através da integração nativa com o ecossistema Google.
- **Sync Automático:** Backup transparente em segundo plano, garantindo que você nunca perca seu progresso.
- **Restauração de Versões:** Sistema de snapshots que permite recuperar estados anteriores das suas tarefas em formato JSON.
- **Perfil Integrado:** Visualização direta da sua conta Google (nome e foto) na interface, proporcionando um toque pessoal e profissional.

### 🦊 Workflow GitLab de Alta Performance
Integração profunda projetada para quem vive no ciclo de desenvolvimento moderno.
- **Merge Rápido:** Gestão inteligente de Merge Requests com análise prévia de conflitos.
- **Automação de Branches:** Criação e navegação de branches via API oficial do GitLab, automatizando padrões de nomenclatura e fluxos de trabalho.

### 📻 Sistema de Rádio Evoluído
Mantenha o estado de *flow* com a trilha sonora ideal sem sair do ambiente de trabalho.
- **Player Online Estável:** Streaming de rádio integrado com baixo consumo de memória.
- **Gestão de Favoritos:** Sistema de estrelas para favoritar suas estações preferidas e acessá-las rapidamente pelo Global Dock.

### 🌿 Bem-estar (Wellness Whispers)
Produtividade sustentável através de inteligência de suporte.
- **Sussurros de Bem-estar:** Lembretes inteligentes e sutis de postura e hidratação, garantindo que sua saúde acompanhe seu desempenho técnico.

### 📝 Notes Panel (Painel de Notas Rápidas)
Um painel lateral minimalista e focado, projetado para capturar insights e anotações ricas sem distrações.
- **Rich Text Inteligente:** Área livre e limpa para registro de notas rápidas contendo quebras de linha nativas.
- **Persistência Total:** Gravação automática em tempo real via **Dexie.js**, garantindo que suas notas estejam seguras mesmo após fechar o navegador.
- **Versatilidade Adaptativa:** Painel flutuante de vidro que pode ser fixado à esquerda ou direita, com suporte a redimensionamento dinâmico.
- **Acesso Ultra-rápido:** Projetado para o teclado — utilize o atalho de mouse ou clique simples para abrir/fechar instantaneamente.

### 🛡️ Integridade de Dados & Merge Seguro
Segurança de dados de nível empresarial, de ponta a ponta.
- **Merge Seguro:** Algoritmo avançado de importação que preserva dados locais recentes, limpa referências órfãs e garante a integridade estrutural do banco de dados (Dexie migrations nativas).
- **Offline-First:** Funcionamento resiliente via **Dexie.js (IndexedDB)**, garantindo que o sistema funcione perfeitamente sem nenhuma conexão de internet.

---

## ⚙️ Arquitetura Técnica (100% Serverless)

O TASS foi construído com foco em precisão, leveza e performance extremas. **A aplicação não necessita de banco de dados SQL ou servidor backend ativo (Node.js/Express) para funcionar**. Todo o motor roda do lado do cliente (Frontend-only):

- **Arquitetura Client-Side:** Baixo consumo de memória e total isolamento (sandbox) local. Não há polling de rede invisível consumindo sua bateria.
- **Web Workers (Virtual Hardware Precision):** O cronômetro das tarefas opera em uma thread isolada via Web Worker nativo, garantindo que a contagem de tempo seja imune a restrições de economia de bateria aplicadas pelo navegador em abas de segundo plano.
- **Modularidade Avançada:** Arquitetura baseada em serviços desacoplados (`src/services/`) e stores reativas do Pinia (`src/stores/`) para máxima escalabilidade.
- **Estilização Semântica:** Uso rigoroso de Tailwind CSS e variáveis de CSS puro, garantindo zero hardcoding em estilos e permitindo customização infinita.

---

## 🛠️ Tecnologias de Ponta

- **[Vue 3](https://vuejs.org/)**: Reatividade e componentes com Composition API.
- **[Pinia](https://pinia.vuejs.org/)**: Gestão de estado global de alta performance.
- **[Tailwind CSS](https://tailwindcss.com/)**: Design atômico e responsivo.
- **[Lucide Vue Next](https://lucide.dev/)**: Iconografia premium e consistente.
- **[Vitest](https://vitest.dev/)**: Suite de testes moderna e ultra-rápida.
- **[Dexie.js](https://dexie.org/)**: Persistência robusta no cliente.

---

## 🚀 Desenvolvimento

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão recomendada: >= 18)

### Setup e Execução
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor local de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:5175`

### Qualidade e CI
```bash
# Executar testes unitários
npm test

# Gerar build final de produção (SPA)
npm run build
```

---

## 📄 Licença

Desenvolvido para transformar a produtividade em uma forma de arte. Uso livre para entusiastas de tecnologia e eficiência.
