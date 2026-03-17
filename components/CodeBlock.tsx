// components/CodeBlock.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock = ({ code, language }: CodeBlockProps) => {
  return (
    <SyntaxHighlighter 
      language={language} 
      style={atomDark}
      customStyle={{ 
        padding: '1rem', 
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        margin: 0
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;