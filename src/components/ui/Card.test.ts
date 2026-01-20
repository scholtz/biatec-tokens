import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from './Card.vue';

describe('Card Component', () => {
  it('should render with default variant and padding', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Card content'
      }
    });
    
    expect(wrapper.text()).toContain('Card content');
    expect(wrapper.classes()).toContain('rounded-xl');
  });

  it('should render with glass variant', () => {
    const wrapper = mount(Card, {
      props: {
        variant: 'glass'
      },
      slots: {
        default: 'Glass card'
      }
    });
    
    expect(wrapper.classes()).toContain('backdrop-blur-xl');
    expect(wrapper.text()).toContain('Glass card');
  });

  it('should render with elevated variant', () => {
    const wrapper = mount(Card, {
      props: {
        variant: 'elevated'
      },
      slots: {
        default: 'Elevated card'
      }
    });
    
    expect(wrapper.classes()).toContain('shadow-lg');
  });

  it('should apply hover effect when hover prop is true', () => {
    const wrapper = mount(Card, {
      props: {
        hover: true
      }
    });
    
    expect(wrapper.classes()).toContain('hover:shadow-lg');
    expect(wrapper.classes()).toContain('hover:-translate-y-1');
  });

  it('should render header slot when provided', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h1>Card Header</h1>',
        default: 'Card content'
      }
    });
    
    expect(wrapper.html()).toContain('Card Header');
  });

  it('should render footer slot when provided', () => {
    const wrapper = mount(Card, {
      slots: {
        footer: '<div>Card Footer</div>',
        default: 'Card content'
      }
    });
    
    expect(wrapper.html()).toContain('Card Footer');
  });

  it('should apply correct padding based on prop', () => {
    const wrapperNone = mount(Card, {
      props: { padding: 'none' },
      slots: { default: 'Content' }
    });
    const wrapperSm = mount(Card, {
      props: { padding: 'sm' },
      slots: { default: 'Content' }
    });
    const wrapperLg = mount(Card, {
      props: { padding: 'lg' },
      slots: { default: 'Content' }
    });
    
    // Check the inner div with content, not the outer card div
    const htmlSm = wrapperSm.html();
    const htmlLg = wrapperLg.html();
    
    expect(htmlSm).toContain('p-4');
    expect(htmlLg).toContain('p-8');
  });

  it('should render all slots together', () => {
    const wrapper = mount(Card, {
      slots: {
        header: 'Header',
        default: 'Content',
        footer: 'Footer'
      }
    });
    
    expect(wrapper.text()).toContain('Header');
    expect(wrapper.text()).toContain('Content');
    expect(wrapper.text()).toContain('Footer');
  });
});
