export default function truncateText(text='', maxLen=50) {
	return text?.length > maxLen ?
		text.slice(0, maxLen - 3).trimEnd() + '...'
		: text;
}