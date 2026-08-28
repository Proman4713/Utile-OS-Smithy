import { CodeSnippet } from '@canonical/react-components';
import { useEffect, useState } from 'react';
import JSXParse from 'html-react-parser';

import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import markdown from 'highlight.js/lib/languages/markdown'
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('markdown', markdown);

export default function Codeblock({ title='', code='', isString=false, language='javascript', ...props }) {
	const [highlightedCode, setHighlightedCode] = useState('');

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (code) setHighlightedCode(JSXParse(hljs.highlight(code, { language }).value));
	}, [code]);
	
	return (
		<>
			{code && <CodeSnippet
				className={`language-${language}`}
				blocks={[
					{
						title: title,
						code: highlightedCode
					}
				]}
				{...props}
			/>}
		</>
	);
}