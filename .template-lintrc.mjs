export default {
  extends: 'recommended',
  checkHbsTemplateLiterals: false,
  overrides: [
    {
      // the marker & popup components take a `@MapboxGl` argument
      files: ['tests/**/*'],
      rules: { 'no-capital-arguments': false },
    },
  ],
};
