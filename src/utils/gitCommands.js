const quoteShellArgument = (value) => (
  `'${String(value).replace(/'/g, `'"'"'`)}'`
);

export const buildBranchCheckoutCommand = (branchName) => {
  const branch = String(branchName || '').trim();
  if (!branch) return '';

  const fetchRefspec = quoteShellArgument(`+${branch}:refs/remotes/origin/${branch}`);
  const localRef = quoteShellArgument(`refs/heads/${branch}`);
  const localBranch = quoteShellArgument(branch);
  const remoteBranch = quoteShellArgument(`origin/${branch}`);

  return `git fetch origin ${fetchRefspec} && if git show-ref --verify --quiet ${localRef}; then git checkout ${localBranch}; else git checkout -b ${localBranch} --track ${remoteBranch}; fi`;
};
