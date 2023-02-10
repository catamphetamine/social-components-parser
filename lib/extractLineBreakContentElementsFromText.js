import LINE_BREAK_ELEMENT from './lineBreakElement.js'
import LINE_BREAK_CHARACTER_IN_TEXT from './lineBreakCharacterInText.js'

/**
 * Extracts any '\n' characters into their own content blocks.
 * @param  {string} text
 * @return {string|string[]} If there're no '\n' characters then it returns an array with the original string as its only element. Otherwise, it returns an array where every '\n' character is replaced by a '\n' content block.
 */
export default function extractLineBreakContentElementsFromText(text) {
	const indexOfLineBreak = text.indexOf(LINE_BREAK_CHARACTER_IN_TEXT)
	if (indexOfLineBreak < 0) {
		return text
	}
	const result = []
	if (indexOfLineBreak > 0) {
		const beforeText = text.slice(0, indexOfLineBreak)
		result.push(beforeText)
	}
	result.push(LINE_BREAK_ELEMENT)
	const afterText = text.slice(indexOfLineBreak + LINE_BREAK_CHARACTER_IN_TEXT.length)
	if (!afterText) {
		return result
	}
	const after = extractLineBreakContentElementsFromText(afterText)
	if (Array.isArray(after)) {
		return result.concat(after)
	}
	result.push(after)
	return result
}
