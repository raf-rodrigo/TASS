import { 
  Plus, Clock, CloudLightning, Headphones, 
  FileText, Sun, Settings, Filter, Calendar
} from 'lucide-vue-next';

export const DOCK_ITEMS = [
  { 
    id: 'addTask', 
    label: 'Nova Tarefa', 
    icon: Plus, 
    desc: 'Botão rápido para adicionar uma nova tarefa.' 
  },
  { 
    id: 'workedHours', 
    label: 'Horas Trabalhadas', 
    icon: Clock, 
    desc: 'Exibe o tempo trabalhado acumulado na Sprint e na data de hoje.' 
  },
  { 
    id: 'sprints', 
    label: 'Sprints', 
    icon: Calendar, 
    desc: 'Atalho para o gerenciador de Sprints do workspace.' 
  },
  { 
    id: 'weather', 
    label: 'Clima', 
    icon: CloudLightning, 
    desc: 'Widget com a temperatura e precipitação da região.' 
  },
  { 
    id: 'filters', 
    label: 'Filtros de Status', 
    icon: Filter, 
    desc: 'Filtros do Kanban: Todas, Ativas e Concluídas.' 
  },
  { 
    id: 'gitRebuilder', 
    label: 'Breeze (Git Rebuilder)', 
    icon: CloudLightning, 
    desc: 'Ferramenta para reconstrução rápida de branches.' 
  },
  { 
    id: 'radio', 
    label: 'Rádio Lofi', 
    icon: Headphones, 
    desc: 'Player de áudio com as estações integradas.' 
  },
  { 
    id: 'notes', 
    label: 'Notas Rápidas', 
    icon: FileText, 
    desc: 'Atalho para o painel de anotações e interface CLI.' 
  },
  { 
    id: 'themeToggle', 
    label: 'Alternar Tema', 
    icon: Sun, 
    desc: 'Alterna a aplicação entre os temas escuro e claro.' 
  },
  { 
    id: 'settings', 
    label: 'Configurações', 
    icon: Settings, 
    desc: 'Acesso às configurações globais do sistema.' 
  }
];
