export default function truncateText(text, maxLen) {
	return text.length > maxLen ?
		text.slice(0, maxLen - 3) + '...'
		: text;
}