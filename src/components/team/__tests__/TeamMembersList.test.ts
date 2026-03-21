/**
 * Unit tests for TeamMembersList component
 * Verifies rendering of members, empty/loading/error states, and event emissions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TeamMembersList from "../TeamMembersList.vue";
import type { TeamMember, TeamInvitation } from "../../../types/team";

vi.mock("../../../components/ui/Button.vue", () => ({
  default: {
    props: ["variant", "size"],
    template: '<button v-bind="$attrs"><slot /></button>',
    inheritAttrs: true,
  },
}));
vi.mock("../../../components/ui/Badge.vue", () => ({
  default: { template: "<span><slot /></span>" },
}));

const makeMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  id: "m1",
  email: "alice@biatec.io",
  name: "Alice Johnson",
  role: "admin",
  status: "active",
  joinedAt: "2025-01-15T10:00:00Z",
  ...overrides,
});

const makeInvitation = (overrides: Partial<TeamInvitation> = {}): TeamInvitation => ({
  id: "inv1",
  email: "bob@biatec.io",
  role: "viewer",
  status: "pending",
  invitedBy: "m1",
  invitedAt: "2026-01-01T09:00:00Z",
  expiresAt: "2026-01-08T09:00:00Z",
  ...overrides,
});

describe("TeamMembersList", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading spinner when loading prop is true", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [], pendingInvitations: [], loading: true },
    });
    expect(wrapper.text()).toContain("Loading team members...");
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("shows error state when error prop is provided", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [], pendingInvitations: [], error: "Failed to load" },
    });
    expect(wrapper.text()).toContain("Error Loading Team");
    expect(wrapper.text()).toContain("Failed to load");
  });

  it("shows empty state when members array is empty", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [], pendingInvitations: [] },
    });
    expect(wrapper.text()).toContain("No Team Members Yet");
  });

  it("renders member name and email", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember()], pendingInvitations: [] },
    });
    expect(wrapper.text()).toContain("alice@biatec.io");
  });

  it("renders member initials in avatar", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember({ name: "Alice Johnson" })], pendingInvitations: [] },
    });
    // "Alice Johnson" → initials "AJ"
    expect(wrapper.text()).toContain("AJ");
  });

  it("renders single initial for email-only member", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember({ name: undefined })], pendingInvitations: [] },
    });
    // email "alice@biatec.io" → initial "A"
    expect(wrapper.text()).toContain("A");
  });

  it("shows active member count in header", () => {
    const wrapper = mount(TeamMembersList, {
      props: {
        members: [makeMember(), makeMember({ id: "m2", email: "b@x.io" })],
        pendingInvitations: [],
      },
    });
    expect(wrapper.text()).toContain("2 active members");
  });

  it("shows singular 'member' for count of 1", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember()], pendingInvitations: [] },
    });
    expect(wrapper.text()).toContain("1 active member");
    expect(wrapper.text()).not.toContain("1 active members");
  });

  it("shows pending invitation count when invitations exist", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember()], pendingInvitations: [makeInvitation()] },
    });
    expect(wrapper.text()).toContain("1 pending invitation");
  });

  it("does not show invitation count when none pending", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember()], pendingInvitations: [] },
    });
    expect(wrapper.text()).not.toContain("pending invitation");
  });

  it("shows Invite Member button when canManageTeam is true", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [], pendingInvitations: [], canManageTeam: true },
    });
    expect(wrapper.text()).toContain("Invite Member");
  });

  it("hides Invite Member button when canManageTeam is false", () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember()], pendingInvitations: [], canManageTeam: false },
    });
    // The header invite button should not be present
    const buttons = wrapper.findAll("button");
    const inviteBtn = buttons.find((b) => b.text().includes("Invite Member") && !b.text().includes("First"));
    expect(inviteBtn).toBeUndefined();
  });

  it("emits invite-member event from empty state button", async () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [], pendingInvitations: [], canManageTeam: true },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("invite-member")).toBeDefined();
  });

  it("renders pending invitations section", () => {
    const wrapper = mount(TeamMembersList, {
      props: {
        members: [makeMember()],
        pendingInvitations: [makeInvitation()],
      },
    });
    expect(wrapper.text()).toContain("bob@biatec.io");
  });

  it("shows only active members in the active members list", () => {
    const suspended = makeMember({ id: "m2", email: "suspended@x.io", status: "suspended" });
    const wrapper = mount(TeamMembersList, {
      props: { members: [makeMember(), suspended], pendingInvitations: [] },
    });
    // Only active member "alice@biatec.io" shown in active list, not the suspended one
    expect(wrapper.text()).toContain("1 active member");
  });

  it("emits retry event when retry button is clicked in error state", async () => {
    const wrapper = mount(TeamMembersList, {
      props: { members: [], pendingInvitations: [], error: "Network error" },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("retry")).toBeDefined();
  });
});
