import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import InviteMemberModal from '../InviteMemberModal.vue'

// Stub heavy child components
vi.mock('../../ui/Modal.vue', () => ({
  default: {
    template: '<div v-if="show"><slot /><slot name="footer" /></div>',
    props: ['show'],
  },
}))
vi.mock('../../ui/Input.vue', () => ({
  default: {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\')" />',
    props: ['modelValue'],
    emits: ['update:modelValue', 'blur'],
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

function mountModal(props: { isOpen?: boolean; loading?: boolean; apiError?: string | null } = {}) {
  return mount(InviteMemberModal, {
    props: {
      isOpen: true,
      loading: false,
      apiError: null,
      ...props,
    },
  })
}

describe('InviteMemberModal', () => {
  it('renders form fields when open', () => {
    const w = mountModal()
    expect(w.find('input').exists()).toBe(true)
  })

  it('does not render when closed', () => {
    const w = mountModal({ isOpen: false })
    expect(w.find('input').exists()).toBe(false)
  })

  it('shows apiError when provided', () => {
    const w = mountModal({ apiError: 'Server error occurred' })
    expect(w.text()).toContain('Server error occurred')
  })

  it('emits close on handleClose when not loading', async () => {
    const w = mountModal()
    ;(w.vm as any).handleClose()
    expect(w.emitted('close')).toBeTruthy()
  })

  it('does not emit close when loading=true', async () => {
    const w = mountModal({ loading: true })
    ;(w.vm as any).handleClose()
    expect(w.emitted('close')).toBeFalsy()
  })

  it('validates email - shows error for empty email', async () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = ''
    const result = vm.validateEmail()
    expect(result).toBe(false)
    expect(vm.errors.email).toBeTruthy()
  })

  it('validates email - shows error for invalid format', async () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = 'notanemail'
    const result = vm.validateEmail()
    expect(result).toBe(false)
    expect(vm.errors.email).toBeTruthy()
  })

  it('validates email - returns true for valid email', async () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = 'user@example.com'
    const result = vm.validateEmail()
    expect(result).toBe(true)
    expect(vm.errors.email).toBeFalsy()
  })

  it('isFormValid is false when email is empty', () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = ''
    expect(vm.isFormValid).toBeFalsy()
  })

  it('isFormValid is true when email is valid and role set', async () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = 'user@example.com'
    vm.errors.email = ''
    expect(vm.isFormValid).toBeTruthy()
  })

  it('emits submit with correct data on valid form', async () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = 'user@example.com'
    vm.formData.role = 'admin'
    vm.formData.note = 'Welcome'
    await vm.handleSubmit()
    const submitted = w.emitted('submit')
    expect(submitted).toBeTruthy()
    expect((submitted as any)[0][0].email).toBe('user@example.com')
    expect((submitted as any)[0][0].role).toBe('admin')
  })

  it('does not emit submit when email is invalid', async () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = 'bad'
    await vm.handleSubmit()
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('resetForm clears form data', () => {
    const w = mountModal()
    const vm = w.vm as any
    vm.formData.email = 'test@test.com'
    vm.resetForm()
    expect(vm.formData.email).toBe('')
    expect(vm.formData.role).toBe('viewer')
    expect(vm.errors).toEqual({})
    expect(vm.successMessage).toBeNull()
  })

  it('roleOptions excludes owner role', () => {
    const w = mountModal()
    const vm = w.vm as any
    const opts = vm.roleOptions as Array<{ value: string; label: string }>
    expect(opts.some((o) => o.value === 'owner')).toBe(false)
    expect(opts.length).toBeGreaterThan(0)
  })
})
