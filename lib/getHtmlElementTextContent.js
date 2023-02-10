import LINE_BREAK_ELEMENT_TYPE from './lineBreakElementType.js'

/**
 * Converts an HTML Node to text.
 * I don't know why simply `.textContent` wasn't used instead.
 * @param  {Node} element
 * @return {string}
 */
export default function getHtmlElementTextContent(element) {
	let text = ''
	let i = 0
	while (i < element.childNodes.length) {
		const node = element.childNodes[i]
		// `node.nodeType === 1` means "DOM element".
		if (node.nodeType === 1) {
			if (node.tagName.toLowerCase() === LINE_BREAK_ELEMENT_TYPE.tag) {
				text += LINE_BREAK_ELEMENT_TYPE.createElement()
			} else {
				text += getHtmlElementTextContent(node)
			}
		}
		// `node.nodeType === 3` means "text node".
		else if (node.nodeType === 3) {
			text += node.nodeValue
		}
		i++
	}
	return text
}
