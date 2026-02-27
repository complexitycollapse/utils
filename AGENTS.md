# Monorepo
This is a monorepo holding all of my smaller projects. The projects are found in different folders
(sometimes nested).

## Javascript Coding Style
- Vite will be used as the development server
- Vitest will be used for testing
- Use ES6 style modules
- Use the latest Javascript features. Older browsers are not supported.
- JDOC will be used for typing. Shared types will be defined in separate files.
- Use double quotes for strings
- Max line length: 100 chars
- Avoid importing unnecessary technologies
- Use two spaces for indentation
- Don't use classes or interfaces
- Use undefined rather than null
- Always add semi-colons to the end of lines
- Generally put exported definitions towards the top of the file with others below. Keep helper
functions near where they are used. (If a helper function uses other helper functions, apply this
rule recursively).
