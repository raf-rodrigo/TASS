import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import RadioModal from "../src/components/RadioModal.vue";
import BaseModal from "../src/components/BaseModal.vue";

// Mock radioStore
vi.mock("../src/stores/radioStore", () => {
  return {
    useRadioStore: () => ({
      addRadio: vi.fn(),
      updateRadio: vi.fn(),
      volume: 0.5,
      radios: []
    })
  };
});

// Mock settingsStore
vi.mock("../src/stores/settingsStore", () => {
  return {
    useSettingsStore: () => ({
      opacityTargets: {
        modals: true
      },
      theme: 'dark'
    })
  };
});

// Mock notificationService
vi.mock("../src/services/notificationService", () => {
  return { notificationService: { toast: vi.fn() } };
});

describe("RadioModal.vue", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(RadioModal, {
      props: { radioToEdit: null },
      global: { 
        components: { BaseModal }
      },
    });
  });

  it("uses custom layout for custom header", () => {
    const baseModal = wrapper.findComponent({ name: "BaseModal" });
    expect(baseModal.props("layout")).toBe("custom");
  });

  it("renders small size action buttons", () => {
    const actionButtons = wrapper.findAll("button").filter(btn => {
      const txt = btn.text();
      return txt === "Cancelar" || txt.includes("Salvar") || txt.includes("Atualizar");
    });
    expect(actionButtons).toHaveLength(2);
    actionButtons.forEach(btn => {
      expect(btn.classes()).toContain("text-[10px]");
    });
  });
});
