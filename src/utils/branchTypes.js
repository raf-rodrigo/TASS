export const branchTypes = [
  { value: 'feat', description: 'Nova funcionalidade.' },
  { value: 'fix', description: 'Correção de erro.' },
  { value: 'docs', description: 'Criação ou atualização de documentação.' },
  { value: 'refactor', description: 'Reorganização do código sem mudar seu comportamento.' },
  { value: 'test', description: 'Criação ou ajuste de testes.' },
  { value: 'chore', description: 'Manutenção, dependências e configurações.' },
  { value: 'perf', description: 'Melhoria de desempenho.' },
  { value: 'style', description: 'Formatação do código sem alterar a lógica.' },
  { value: 'build', description: 'Ajustes no processo de compilação e empacotamento.' },
  { value: 'ci', description: 'Ajustes em pipelines de integração e entrega.' },
  { value: 'revert', description: 'Reversão de uma alteração anterior.' }
].map(type => ({ ...type, label: `${type.value} — ${type.description}` }));

export const withBranchType = (name, type) =>
  branchTypes.some(option => option.value === type) ? `${type}/${name}` : name;
