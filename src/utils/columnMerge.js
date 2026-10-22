export const BOARD_COLUMN_LIMIT = 6;

const SUPPORTED_GIT_PROVIDERS = ['gitlab', 'github'];

const createEmptyProviderTargets = () => Array(BOARD_COLUMN_LIMIT).fill('');

export const createEmptyColumnMergeTargets = () => ({
  gitlab: createEmptyProviderTargets(),
  github: createEmptyProviderTargets()
});

export const normalizeColumnMergeTargets = (targets) => {
  const normalized = createEmptyColumnMergeTargets();

  SUPPORTED_GIT_PROVIDERS.forEach((provider) => {
    const providerTargets = Array.isArray(targets?.[provider]) ? targets[provider] : [];
    normalized[provider] = normalized[provider].map((_, index) => (
      String(providerTargets[index] || '').trim()
    ));
  });

  return normalized;
};

export const getColumnMergeEnvironment = ({
  targets,
  provider,
  columnId,
  environments
}) => {
  const columnIndex = Number(columnId) - 1;
  if (columnIndex < 0 || columnIndex >= BOARD_COLUMN_LIMIT) return null;

  const environmentId = normalizeColumnMergeTargets(targets)[provider]?.[columnIndex];
  if (!environmentId || !Array.isArray(environments)) return null;

  return environments.find(environment => environment.id === environmentId) || null;
};

const branchFromUrl = (branchUrl, marker) => {
  if (!branchUrl || !String(branchUrl).includes(marker)) return '';

  try {
    const pathname = new URL(String(branchUrl)).pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return '';
    return decodeURIComponent(pathname.slice(markerIndex + marker.length)).replace(/^\/+|\/+$/g, '');
  } catch {
    return '';
  }
};

export const getTaskMergeSourceBranch = (task, provider) => {
  if (!task) return '';

  if (provider === 'github') {
    return String(task.githubBranchName || '').trim()
      || branchFromUrl(task.githubBranchUrl, '/tree/');
  }

  return String(task.branchName || '').trim()
    || branchFromUrl(task.branchUrl, '/-/tree/');
};
