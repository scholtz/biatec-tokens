import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ProjectSetupStep from "../ProjectSetupStep.vue";
import { useTokenDraftStore } from "../../../../stores/tokenDraft";

// Mock the token draft store
vi.mock("../../../../stores/tokenDraft", () => ({
  useTokenDraftStore: vi.fn(),
}));

describe("ProjectSetupStep", () => {
  let mockTokenDraftStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockTokenDraftStore = {
      currentDraft: null,
    };

    vi.mocked(useTokenDraftStore).mockReturnValue(mockTokenDraftStore);
  });

  describe("Component Rendering", () => {
    it("should render the wizard step with correct title and description", () => {
      const wrapper = mount(ProjectSetupStep);

      expect(wrapper.text()).toContain("Project Setup");
      expect(wrapper.text()).toContain("Tell us about your project and organization.");
    });

    it("should render all form sections", () => {
      const wrapper = mount(ProjectSetupStep);

      expect(wrapper.text()).toContain("Project Information");
      expect(wrapper.text()).toContain("Issuer Organization");
      expect(wrapper.text()).toContain("Compliance Contact");
    });

    it("should render all required form fields", () => {
      const wrapper = mount(ProjectSetupStep);

      // Required fields should have asterisks
      expect(wrapper.text()).toContain("Project Name *");
      expect(wrapper.text()).toContain("Project Description *");
      expect(wrapper.text()).toContain("Token Purpose *");
      expect(wrapper.text()).toContain("Organization Name *");
    });

    it("should render optional fields without asterisks", () => {
      const wrapper = mount(ProjectSetupStep);

      expect(wrapper.text()).toContain("Registration/Tax ID Number");
      expect(wrapper.text()).toContain("Jurisdiction");
      expect(wrapper.text()).toContain("Contact Person Name");
      expect(wrapper.text()).toContain("Contact Email");
      expect(wrapper.text()).toContain("Contact Phone");
    });
  });

  describe("Form Data Binding", () => {
    it("should bind form data to input fields", async () => {
      const wrapper = mount(ProjectSetupStep);

      const projectNameInput = wrapper.find("#project-name");
      const projectDescriptionTextarea = wrapper.find("#project-description");
      const tokenPurposeSelect = wrapper.find("#token-purpose");
      const organizationNameInput = wrapper.find("#organization-name");

      await projectNameInput.setValue("Test Project");
      await projectDescriptionTextarea.setValue("Test Description");
      await tokenPurposeSelect.setValue("utility");
      await organizationNameInput.setValue("Test Organization");

      expect(projectNameInput.element.value).toBe("Test Project");
      expect(projectDescriptionTextarea.element.value).toBe("Test Description");
      expect(tokenPurposeSelect.element.value).toBe("utility");
      expect(organizationNameInput.element.value).toBe("Test Organization");
    });

    it("should load data from token draft store on mount", () => {
      mockTokenDraftStore.currentDraft = {
        projectSetup: {
          projectName: "Loaded Project",
          projectDescription: "Loaded Description",
          tokenPurpose: "asset",
          organizationName: "Loaded Organization",
        },
      };

      const wrapper = mount(ProjectSetupStep);

      const projectNameInput = wrapper.find("#project-name");
      const projectDescriptionTextarea = wrapper.find("#project-description");

      expect(projectNameInput.element.value).toBe("Loaded Project");
      expect(projectDescriptionTextarea.element.value).toBe("Loaded Description");
    });
  });

  describe("Field Validation", () => {
    it("should validate required project name field", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Empty field should be invalid
      expect(component.validateField("projectName")).toBe(false);
      expect(component.fieldErrors.projectName).toBe("Project name is required");

      // Short name should be invalid
      await wrapper.find("#project-name").setValue("AB");
      expect(component.validateField("projectName")).toBe(false);
      expect(component.fieldErrors.projectName).toBe("Project name must be at least 3 characters");

      // Valid name should pass
      await wrapper.find("#project-name").setValue("Valid Project Name");
      expect(component.validateField("projectName")).toBe(true);
      expect(component.fieldErrors.projectName).toBe("");
    });

    it("should validate required project description field", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Empty field should be invalid
      expect(component.validateField("projectDescription")).toBe(false);
      expect(component.fieldErrors.projectDescription).toBe("Project description is required");

      // Short description should be invalid
      await wrapper.find("#project-description").setValue("Short");
      expect(component.validateField("projectDescription")).toBe(false);
      expect(component.fieldErrors.projectDescription).toBe("Please provide a more detailed description (at least 20 characters)");

      // Valid description should pass
      await wrapper.find("#project-description").setValue("This is a valid project description that meets the minimum length requirement for testing purposes.");
      expect(component.validateField("projectDescription")).toBe(true);
      expect(component.fieldErrors.projectDescription).toBe("");
    });

    it("should validate required token purpose field", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Empty field should be invalid
      expect(component.validateField("tokenPurpose")).toBe(false);
      expect(component.fieldErrors.tokenPurpose).toBe("Please select a token purpose");

      // Valid selection should pass
      await wrapper.find("#token-purpose").setValue("utility");
      expect(component.validateField("tokenPurpose")).toBe(true);
      expect(component.fieldErrors.tokenPurpose).toBe("");
    });

    it("should validate required organization name field", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Empty field should be invalid
      expect(component.validateField("organizationName")).toBe(false);
      expect(component.fieldErrors.organizationName).toBe("Organization name is required");

      // Valid name should pass
      await wrapper.find("#organization-name").setValue("Valid Organization Name");
      expect(component.validateField("organizationName")).toBe(true);
      expect(component.fieldErrors.organizationName).toBe("");
    });

    it("should validate email format when provided", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Empty email should pass (optional field)
      expect(component.validateField("complianceContactEmail")).toBe(true);

      // Invalid email should fail
      await wrapper.find("#compliance-contact-email").setValue("invalid-email");
      expect(component.validateField("complianceContactEmail")).toBe(false);
      expect(component.fieldErrors.complianceContactEmail).toBe("Please enter a valid email address");

      // Valid email should pass
      await wrapper.find("#compliance-contact-email").setValue("valid@example.com");
      expect(component.validateField("complianceContactEmail")).toBe(true);
      expect(component.fieldErrors.complianceContactEmail).toBe("");
    });
  });

  describe("Form Validation", () => {
    it("should validate all required fields correctly", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Initially should be invalid (empty form)
      expect(component.validateAll()).toBe(false);
      expect(component.errors).toContain("Please fill in all required fields correctly");
      expect(component.showErrors).toBe(true);

      // Fill in all required fields
      await wrapper.find("#project-name").setValue("Test Project");
      await wrapper.find("#project-description").setValue("This is a comprehensive test project description that meets all validation requirements.");
      await wrapper.find("#token-purpose").setValue("utility");
      await wrapper.find("#organization-name").setValue("Test Organization");

      // Should now be valid
      expect(component.validateAll()).toBe(true);
      expect(component.errors).toEqual([]);
      expect(component.showErrors).toBe(false);
    });

    it("should handle invalid email in validation", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Fill required fields
      await wrapper.find("#project-name").setValue("Test Project");
      await wrapper.find("#project-description").setValue("This is a comprehensive test project description that meets all validation requirements.");
      await wrapper.find("#token-purpose").setValue("utility");
      await wrapper.find("#organization-name").setValue("Test Organization");

      // Add invalid email
      await wrapper.find("#compliance-contact-email").setValue("invalid-email");

      // Should be invalid due to email
      expect(component.validateAll()).toBe(false);
      expect(component.errors).toContain("Please fill in all required fields correctly");
    });
  });

  describe("Step Validation", () => {
    it("should compute isValid correctly", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Initially should be invalid
      expect(component.isValid).toBe(false);

      // Fill required fields one by one
      await wrapper.find("#project-name").setValue("Test Project");
      expect(component.isValid).toBe(false); // Still missing other required fields

      await wrapper.find("#project-description").setValue("This is a comprehensive test project description that meets all validation requirements.");
      expect(component.isValid).toBe(false); // Still missing token purpose

      await wrapper.find("#token-purpose").setValue("utility");
      expect(component.isValid).toBe(false); // Still missing organization name

      await wrapper.find("#organization-name").setValue("Test Organization");
      expect(component.isValid).toBe(true); // All required fields filled
    });

    it("should expose isValid and validateAll methods", () => {
      const wrapper = mount(ProjectSetupStep);

      expect(typeof wrapper.vm.isValid).toBe("boolean");
      expect(typeof wrapper.vm.validateAll).toBe("function");
    });
  });

  describe("Data Persistence", () => {
    it("should save form data to token draft store on changes", async () => {
      mockTokenDraftStore.currentDraft = {};

      const wrapper = mount(ProjectSetupStep);

      await wrapper.find("#project-name").setValue("Test Project");
      await wrapper.find("#project-description").setValue("Test Description");
      await wrapper.find("#token-purpose").setValue("utility");

      expect(mockTokenDraftStore.currentDraft.projectSetup).toEqual({
        projectName: "Test Project",
        projectDescription: "Test Description",
        tokenPurpose: "utility",
        organizationName: "",
        organizationType: "",
        registrationNumber: "",
        jurisdiction: "",
        complianceContactName: "",
        complianceContactEmail: "",
        complianceContactPhone: "",
      });
    });

    it("should not save to store when no draft exists", async () => {
      mockTokenDraftStore.currentDraft = null;

      const wrapper = mount(ProjectSetupStep);

      await wrapper.find("#project-name").setValue("Test Project");

      // Should not throw error and should not save
      expect(mockTokenDraftStore.currentDraft).toBeNull();
    });
  });

  describe("UI Elements", () => {
    it("should display data protection notice", () => {
      const wrapper = mount(ProjectSetupStep);

      expect(wrapper.text()).toContain("Data Protection");
      expect(wrapper.text()).toContain("All information provided is encrypted and stored securely");
    });

    it("should mark compliance contact section as optional", () => {
      const wrapper = mount(ProjectSetupStep);

      expect(wrapper.text()).toContain("Optional");
    });

    it("should render all token purpose options", () => {
      const wrapper = mount(ProjectSetupStep);
      const options = wrapper.find("#token-purpose").findAll("option");

      expect(options.length).toBe(7); // Empty option + 6 purpose options
      expect(options[1].text()).toContain("Utility Token");
      expect(options[2].text()).toContain("Asset Token");
      expect(options[3].text()).toContain("Security Token");
      expect(options[4].text()).toContain("Governance Token");
      expect(options[5].text()).toContain("Reward/Loyalty Token");
      expect(options[6].text()).toContain("Other");
    });

    it("should render all organization type options", () => {
      const wrapper = mount(ProjectSetupStep);
      const options = wrapper.find("#organization-type").findAll("option");

      expect(options.length).toBe(7); // Empty option + 6 type options
      expect(options[1].text()).toBe("Corporation");
      expect(options[2].text()).toBe("Limited Liability Company (LLC)");
      expect(options[3].text()).toBe("Partnership");
      expect(options[4].text()).toBe("Non-Profit Organization");
      expect(options[5].text()).toBe("Government Entity");
      expect(options[6].text()).toBe("Individual/Sole Proprietor");
    });
  });

  describe("Error Display", () => {
    it("should display field errors when validation fails", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // Trigger validation error
      component.validateField("projectName");

      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Project name is required");
    });

    it("should clear field errors when validation passes", async () => {
      const wrapper = mount(ProjectSetupStep);
      const component = wrapper.vm as any;

      // First create an error
      component.validateField("projectName");
      expect(component.fieldErrors.projectName).toBe("Project name is required");

      // Then fix it
      await wrapper.find("#project-name").setValue("Valid Project Name");
      component.validateField("projectName");

      expect(component.fieldErrors.projectName).toBe("");
    });
  });
});
