import { mount } from '@vue/test-utils';
import UpdateFormModal from './UpdateFormModal.vue';
import { validateUpdateForm } from './functions/validation';

describe('UpdateFormModal', () => {
  const defaultProps = {
    updateForm: {
      title: 'Atualização teste',
      description: 'Descrição teste',
      version: '1.0.0',
      importance: 'media'
    },
    loading: false
  };

  test('renderiza corretamente', () => {
    const wrapper = mount(UpdateFormModal, {
      props: defaultProps
    });
    
    expect(wrapper.find('h3').text()).toBe('Nova Atualização');
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('textarea').exists()).toBe(true);
  });
  
  test('mostra "Editar Atualização" quando editando', () => {
    const wrapper = mount(UpdateFormModal, {
      props: {
        ...defaultProps,
        editingUpdate: { id: 1, title: 'Teste' }
      }
    });
    
    expect(wrapper.find('h3').text()).toBe('Editar Atualização');
  });
  
  test('emite evento close ao clicar em cancelar', async () => {
    const wrapper = mount(UpdateFormModal, {
      props: defaultProps
    });
    
    await wrapper.find('button[type="button"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
  
  test('emite evento save ao submeter formulário', async () => {
    const wrapper = mount(UpdateFormModal, {
      props: defaultProps
    });
    
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted('save')).toBeTruthy();
  });
  
  test('desativa botão de salvar quando loading é true', () => {
    const wrapper = mount(UpdateFormModal, {
      props: {
        ...defaultProps,
        loading: true
      }
    });
    
    const saveButton = wrapper.find('button[type="submit"]');
    expect(saveButton.attributes('disabled')).toBeDefined();
  });
});

// Testes para a função de validação
describe('validateUpdateForm', () => {
  test('retorna isValid true para dados válidos', () => {
    const formData = {
      title: 'Título teste',
      description: 'Descrição teste',
      version: '1.0.0'
    };
    
    const result = validateUpdateForm(formData);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });
  
  test('detecta título vazio', () => {
    const formData = {
      title: '',
      description: 'Descrição teste'
    };
    
    const result = validateUpdateForm(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });
  
  test('detecta descrição vazia', () => {
    const formData = {
      title: 'Título teste',
      description: ''
    };
    
    const result = validateUpdateForm(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.description).toBeDefined();
  });
  
  test('valida formato da versão', () => {
    const formData = {
      title: 'Título teste',
      description: 'Descrição teste',
      version: 'a.b.c'
    };
    
    const result = validateUpdateForm(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.version).toBeDefined();
  });
});