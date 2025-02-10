export const validators = {
  required: (value) => !!value,
  
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value)
  },
  
  minLength: (value, min) => value.length >= min,
  
  maxLength: (value, max) => value.length <= max
}

export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field]
    const value = data[field]
    
    fieldRules.forEach(rule => {
      if (!validators[rule.type](value, rule.value)) {
        errors[field] = rule.message
      }
    })
  })
  
  return errors
}