import { gitlabService } from './gitlab.js';
import { githubService } from './github.js';

export const gitProviderService = {
  getService(settings) {
    if (settings && settings.gitProvider === 'github') {
      return githubService;
    }
    return gitlabService;
  },

  getBranchName(task, settings) {
    return this.getService(settings).getBranchName(task);
  },

  async deleteLocalBranchLink(task, settings) {
    return await this.getService(settings).deleteLocalBranchLink(task);
  },

  async handleGitFlow(task, settings) {
    return await this.getService(settings).handleGitFlow(task, settings);
  },

  async analyzeAndMerge(task, settings, targetBranch) {
    return await this.getService(settings).analyzeAndMerge(task, settings, targetBranch);
  },

  async breezeGetBranches(settings, targetBranch, searchQuery, branchesOrder) {
    return await this.getService(settings).breezeGetBranches(settings, targetBranch, searchQuery, branchesOrder);
  },

  async breezeCheckMergeStatus(settings, source, target) {
    return await this.getService(settings).breezeCheckMergeStatus(settings, source, target);
  },

  async breezeCloseMergeRequest(settings, mrIid) {
    return await this.getService(settings).breezeCloseMergeRequest(settings, mrIid);
  },

  async breezeExecuteMergeRequest(settings, mrIid) {
    return await this.getService(settings).breezeExecuteMergeRequest(settings, mrIid);
  },

  async breezeCreateBranch(settings, newBranchName, baseRef) {
    return await this.getService(settings).breezeCreateBranch(settings, newBranchName, baseRef);
  },

  async breezeDeleteBranch(settings, branchName) {
    return await this.getService(settings).breezeDeleteBranch(settings, branchName);
  },

  // Helpers visuais baseados no provedor
  getProviderName(settings) {
    return settings && settings.gitProvider === 'github' ? 'GitHub' : 'GitLab';
  },

  hasBranch(task, settings) {
    if (settings && settings.gitProvider === 'github') {
      return !!task.githubBranchUrl;
    }
    return !!task.branchUrl;
  },

  getBranchUrl(task, settings) {
    if (settings && settings.gitProvider === 'github') {
      return task.githubBranchUrl;
    }
    return task.branchUrl;
  }
};
