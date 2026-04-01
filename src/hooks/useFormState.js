import { useState } from 'react';
import { INITIAL_FORM, MODE_OPTIONS } from '../constants.js';

export function useFormState() {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'maxDepth' ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const getActiveMode = () => {
    return MODE_OPTIONS.find((option) => option.value === form.mode) ?? MODE_OPTIONS[0];
  };

  return {
    form,
    handleInputChange,
    resetForm,
    getActiveMode,
  };
}
