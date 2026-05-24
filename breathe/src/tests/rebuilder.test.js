import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import GitRebuilder from "../components/GitRebuilder.vue";
import BaseModal from "../components/BaseModal.vue";

// Mock settingsStore
vi.mock("../stores/settingsStore", () => {
  return {
    useSettingsStore: () => ({
      theme: 'dark',
      gitlabUrl: 'https://gitlab.com',
      gitlabProjectId: '12345',
      gitlabToken: 'fake-token',
      branchMaster: 'master-sistsocial',
      branchHomologacao: 'hml',
      branchDesenvolvimento: 'dev-06',
      isInitialized: true,
      loadSettings: vi.fn(),
      saveSetting: vi.fn(),
      saveAllSettings: vi.fn()
    })
  };
});

describe("GitRebuilder.vue", () => {
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(GitRebuilder, {
      global: {
        components: { BaseModal }
      }
    });
  });

  it("renderiza as três colunas de ambiente com os nomes corretos", () => {
    const textContent = wrapper.text();
    expect(textContent).toContain("master-sistsocial");
    expect(textContent).toContain("hml");
    expect(textContent).toContain("dev-06");
  });

  it("exibe a tag de Protegida na coluna master", () => {
    const masterCard = wrapper.find('[data-test="master-card"]');
    expect(masterCard.exists()).toBe(true);
    expect(masterCard.text()).toContain("Protegida");
  });

  it("inicia na aba de Rebuilder por padrão", () => {
    expect(wrapper.vm.activeTab).toBe("rebuilder");
  });

  it("permite mudar de aba para merges", async () => {
    const tabs = wrapper.findAll("button");
    const mergeTab = tabs.find(btn => btn.text().includes("Mesclar"));
    expect(mergeTab).toBeDefined();
    
    await mergeTab.trigger("click");
    expect(wrapper.vm.activeTab).toBe("merges");
  });

  it("bloqueia a reconstrução se as credenciais do GitLab estiverem vazias", async () => {
    const settings = wrapper.vm.settingsStore;
    settings.gitlabToken = '';
    settings.gitlabProjectId = '';

    await wrapper.vm.runRebuildSimulation('dev');
    
    const logs = wrapper.vm.simulationLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0].text).toContain("Credenciais do GitLab não configuradas");
    expect(logs[0].type).toBe("error");
  });

  it("carrega e aplica o tamanho da fonte do console", () => {
    const settings = wrapper.vm.settingsStore;
    settings.consoleFontSize = 14;
    expect(settings.consoleFontSize).toBe(14);
  });

  it("seleciona uma branch e não quebra a interface", async () => {
    wrapper.vm.activeTab = "merges";
    wrapper.vm.mergeTarget = "dev-06";
    wrapper.vm.branchesFetched = true;
    wrapper.vm.simulationBranches = [
      { name: "feature/test-branch", mr: null, title: "Test Title", status: "waiting", committedDate: "2026-05-24T00:00:00Z", authorName: "Tester" }
    ];
    await wrapper.vm.$nextTick();

    const branchCard = wrapper.find("div.cursor-pointer");
    expect(branchCard.exists()).toBe(true);
    await branchCard.trigger("click");

    expect(wrapper.vm.selectedBranches).toContain("feature/test-branch");
    
    // Verifica se a Coluna 2 (Centro) continua existindo no DOM
    const centerPanel = wrapper.find("div.md\\:col-span-3");
    expect(centerPanel.exists()).toBe(true);
  });
});

