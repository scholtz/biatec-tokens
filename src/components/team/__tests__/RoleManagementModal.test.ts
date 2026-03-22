import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import RoleManagementModal from '../RoleManagementModal.vue'
import type { TeamMember } from '../../../types/team'

// Stub heavy child components
vi.mock('../../ui/Modal.vue', () => ({
  default: {
    template: '<div v-if="show"><slot /><slot name="footer" /></div>',
    props: ['show'],
  },
}))
vi.mock('../../ui/Select.vue', () => ({
  default: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
  },
}))
vi.mock('../../ui/Button.vue', () => ({
  default: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'loading', 'variant', 'type'],
    emits: ['click'],
  },
}))
vi.mock('../../ui/Badge.vue', () => ({
  default: { template: '<span><slot /></span>', props: ['variant'] },
}))

function makeMember(role: TeamMember['role'] = 'viewer'): TeamMember {
  return {
    id: 'member-1',
    email: 'jane@biatec.io',
    name: 'Jane Doe',
    role,
    status: 'active',
  }
}

function mountModal(props: { isOpen?: boolean; member?: TeamMember | null; loading?: boolean; apiError?: string | null } = {}) {
  return mount(RoleManagementModal, {
    props: {
      isOpen: true,
      member: makeMember(),
      loading: false,
      apiError: null,
      ...props,
    },
  })
}

describe('RoleManagementModal', () => {
  it('renders member info when open', () => {
    const w = mountModal()
    expect(w.text()).toContain('jane@biatec.io')
  })

  it('does not render when closed', () => {
    const w = mountModal({ isOpen: false })
    expect(w.find('select').exists()).toBe(false)
  })

  it('shows apiError when provided', () => {
    const w = mountModal({ apiError: 'Failed to update role' })
    expect(w.text()).toContain('Failed to update role')
  })

  it('initialises selectedRole from member.role', () => {
    const w = mountModal({ member: makeMember('admin') })
    expect((w.vm as any).selectedRole).toBe('admin')
  })

  it('hasRoleChanged is false when role unchanged', () => {
    const w = mountModal({ member: makeMember('viewer') })
    expect((w.vm as any).hasRoleChanged).toBeFalsy()
  })

  it('hasRoleChanged is true after role change', async () => {
    const w = mountModal({ member: makeMember('viewer') })
    const vm = w.vm as any
    vm.selectedRole = 'admin'
    await w.vm.$nextTick()
    expect(vm.hasRoleChanged).toBe(true)
  })

  it('emits submit with memberId and new role', async () => {
    const member = makeMember('viewer')
    const w = mountModal({ member })
    const vm = w.vm as any
    vm.selectedRole = 'admin'
    await w.vm.$nextTick()
    vm.handleSubmit()
    const emitted = w.emitted('submit') as any[]
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['member-1', 'admin'])
  })

  it('does not emit submit when role unchanged', () => {
    const w = mountModal({ member: makeMember('viewer') })
    ;(w.vm as any).handleSubmit()
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('emits close when not loading', () => {
    const w = mountModal()
    ;(w.vm as any).handleClose()
    expect(w.emitted('close')).toBeTruthy()
  })

  it('does not emit close when loading=true', () => {
    const w = mountModal({ loading: true })
    ;(w.vm as any).handleClose()
    expect(w.emitted('close')).toBeFalsy()
  })

  // getInitials branch coverage
  it('getInitials extracts first char from email', () => {
    const w = mountModal()
    expect((w.vm as any).getInitials('john@example.com')).toBe('J')
  })

  it('getInitials extracts two initials from full name', () => {
    const w = mountModal()
    expect((w.vm as any).getInitials('Jane Doe')).toBe('JD')
  })

  it('getInitials returns first 2 chars for single-word name', () => {
    const w = mountModal()
    expect((w.vm as any).getInitials('Alice')).toBe('AL')
  })

  // warningMessage / showWarning branches
  it('shows warning when downgrading from admin', async () => {
    const w = mountModal({ member: makeMember('admin') })
    const vm = w.vm as any
    vm.selectedRole = 'viewer'
    await w.vm.$nextTick()
    expect(vm.showWarning).toBe(true)
    expect(vm.warningMessage).toContain('lose the ability to manage team members')
  })

  it('shows warning when upgrading to admin', async () => {
    const w = mountModal({ member: makeMember('viewer') })
    const vm = w.vm as any
    vm.selectedRole = 'admin'
    await w.vm.$nextTick()
    expect(vm.showWarning).toBe(true)
    expect(vm.warningMessage).toContain('gain the ability to manage team members')
  })

  it('shows warning when downgrading from compliance_officer to viewer', async () => {
    const w = mountModal({ member: makeMember('compliance_officer') })
    const vm = w.vm as any
    vm.selectedRole = 'viewer'
    await w.vm.$nextTick()
    expect(vm.warningMessage).toContain('lose the ability to export compliance reports')
  })

  it('shows warning when upgrading from viewer to non-admin', async () => {
    const w = mountModal({ member: makeMember('viewer') })
    const vm = w.vm as any
    vm.selectedRole = 'compliance_officer'
    await w.vm.$nextTick()
    expect(vm.warningMessage).toContain('gain additional permissions')
  })

  it('roleOptions excludes owner role', () => {
    const w = mountModal()
    const opts = (w.vm as any).roleOptions as Array<{ value: string; label: string }>
    expect(opts.some((o) => o.value === 'owner')).toBe(false)
  })

  it('renders null state gracefully when member is null', () => {
    const w = mountModal({ member: null })
    // Should not throw and modal should render
    expect(w.exists()).toBe(true)
  })
})
