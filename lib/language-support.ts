// lib/language-support.ts
export const languageOptions = [
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript', prism: 'javascript' },
  { value: 'typescript', label: 'TypeScript', monaco: 'typescript', prism: 'typescript' },
  { value: 'python', label: 'Python', monaco: 'python', prism: 'python' },
  { value: 'java', label: 'Java', monaco: 'java', prism: 'java' },
  { value: 'html', label: 'HTML', monaco: 'html', prism: 'markup' },
  { value: 'css', label: 'CSS', monaco: 'css', prism: 'css' },
  { value: 'json', label: 'JSON', monaco: 'json', prism: 'json' },
  { value: 'yaml', label: 'YAML', monaco: 'yaml', prism: 'yaml' },
  { value: 'markdown', label: 'Markdown', monaco: 'markdown', prism: 'markdown' },
  { value: 'bash', label: 'Bash/Shell', monaco: 'shell', prism: 'bash' },
  { value: 'sql', label: 'SQL', monaco: 'sql', prism: 'sql' },
  { value: 'go', label: 'Go', monaco: 'go', prism: 'go' },
  { value: 'rust', label: 'Rust', monaco: 'rust', prism: 'rust' },
  { value: 'php', label: 'PHP', monaco: 'php', prism: 'php' },
  { value: 'csharp', label: 'C#', monaco: 'csharp', prism: 'csharp' },
  { value: 'cpp', label: 'C++', monaco: 'cpp', prism: 'cpp' },
  { value: 'c', label: 'C', monaco: 'c', prism: 'c' },
  { value: 'kotlin', label: 'Kotlin', monaco: 'kotlin', prism: 'kotlin' },
  { value: 'swift', label: 'Swift', monaco: 'swift', prism: 'swift' },
  { value: 'ruby', label: 'Ruby', monaco: 'ruby', prism: 'ruby' },
  { value: 'scala', label: 'Scala', monaco: 'scala', prism: 'scala' },
  { value: 'perl', label: 'Perl', monaco: 'perl', prism: 'perl' },
  { value: 'r', label: 'R', monaco: 'r', prism: 'r' },
  { value: 'dart', label: 'Dart', monaco: 'dart', prism: 'dart' },
  { value: 'elixir', label: 'Elixir', monaco: 'elixir', prism: 'elixir' },
  { value: 'erlang', label: 'Erlang', monaco: 'erlang', prism: 'erlang' },
  { value: 'haskell', label: 'Haskell', monaco: 'haskell', prism: 'haskell' },
  { value: 'lua', label: 'Lua', monaco: 'lua', prism: 'lua' },
  { value: 'powershell', label: 'PowerShell', monaco: 'powershell', prism: 'powershell' },
  { value: 'dockerfile', label: 'Dockerfile', monaco: 'dockerfile', prism: 'dockerfile' },
  { value: 'xml', label: 'XML', monaco: 'xml', prism: 'markup' },
  { value: 'graphql', label: 'GraphQL', monaco: 'graphql', prism: 'graphql' },
  { value: 'toml', label: 'TOML', monaco: 'toml', prism: 'toml' },
  { value: 'text', label: '纯文本', monaco: 'plaintext', prism: 'plain' },
];

export const getLanguageByValue = (value: string) => {
  return languageOptions.find(lang => lang.value === value) || 
         languageOptions.find(lang => lang.value === 'text')!;
};

export const getMonacoLanguage = (value: string) => {
  return getLanguageByValue(value).monaco;
};

export const getPrismLanguage = (value: string) => {
  return getLanguageByValue(value).prism;
};