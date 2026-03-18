// components/CodeBlock.tsx
'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '@/lib/theme-context';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const { theme } = useTheme();
  const style = theme === 'dark' ? atomDark : oneLight;

  return (
    <SyntaxHighlighter 
      language={language} 
      style={style}
      customStyle={{ 
        padding: '1rem', 
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        margin: 0,
      }}
      codeTagProps={{
        style: {
          fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;