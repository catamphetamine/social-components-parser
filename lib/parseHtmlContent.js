import parseDocument from 'social-components-parser/DOMParser'

import splitContentIntoBlocksByMultipleLineBreaks from 'social-components/utility/post/splitContentIntoBlocksByMultipleLineBreaks.js'

import getHtmlElementTextContent from './getHtmlElementTextContent.js'
import getOuterHtml from './getOuterHtml.js'
import extractLineBreakContentElementsFromText from './extractLineBreakContentElementsFromText.js'

import LINE_BREAK_ELEMENT_TYPE from './lineBreakElementType.js'
import LINE_BREAK_CHARACTER_IN_TEXT from './lineBreakCharacterInText.js'

/**
 * Parses comment's HTML content into `Content` (see `social-components` docs).
 * Returns an array of Content paragraphs.
 * @param  {string} commentContent — HTML markup.
 * @param  {object[]} options.syntax — Content block type descriptions.
 * @param  {object} [options.context] — An optional object that gets passed to content block constructor functions.
 * @param  {function} [options.onUnknownElementType] — Is called when an unsupported DOM element is found.
 * @param  {function} [options.getContentElementsForUnknownElementType] — Returns a list of content elements for an unknown tag. By default just returns the children of the unknown element.
 * @return {any[][]} An array of Content paragraphs.
 */
export default function parseHtmlContent(comment, parameters) {
	return new CommentParser(parameters).parse(comment)
}

class CommentParser {
	constructor({
		syntax,
		context,
		onUnknownElementType,
		getContentElementsForUnknownElementType
	}) {
		this.syntax = syntax
		this.context = context
		this.onUnknownElementType = onUnknownElementType || onUnknownElementTypeDefault
		this.getContentElementsForUnknownElementType = getContentElementsForUnknownElementType || getContentElementsForUnknownElementTypeDefault
	}

	parse(html) {
		// // `this.debugOriginalHtml` is only used for debug output.
		// this.debugOriginalHtml = html

		const result = this.parseContent(parseDocument(html).childNodes, { topLevel: true, isCode: false })

		if (!result) {
			return
		}

		if (typeof result === 'string') {
			return result
		}

		const content = []

		let block = []

		const finalizeCurrentBlock = () => {
			// Finalize the current block.
			if (block.length > 0) {
				content.push(block)
				block = []
			}
		}

		const addElement = (element) => {
			if (element instanceof BlockElement) {
				finalizeCurrentBlock()
				content.push(element.element)
			} else {
				block.push(element)
			}
		}

		if (Array.isArray(result)) {
			for (const element of result) {
				addElement(element)
			}
		} else {
			addElement(result)
		}

		finalizeCurrentBlock()

		return splitContentIntoBlocksByMultipleLineBreaks(content)
	}

	doesDomElementMatchContentElementType(element, contentElementType) {
		if (element.tagName.toLowerCase() !== contentElementType.tag) {
			return
		}
		// `attributes` could have been implemented as an object
		// rather than an array: that would result in cleaner code
		// but at the same time also in 2x slower performance
		// of this `for of` loop (the test is at the bottom of the page).
		if (contentElementType.attributes) {
			for (const attribute of contentElementType.attributes) {
				if (!element.hasAttribute(attribute.name)) {
					return
				}
				const value = element.getAttribute(attribute.name)
				if (attribute.value instanceof RegExp) {
					if (!attribute.value.test(value)) {
						return
					}
				} else {
					if (value !== attribute.value) {
						return
					}
				}
			}
		}
		return true
	}

	/**
	 * Parses text.
	 * @param  {string} text
	 * @return {string|string[]}
	 */
	parseText = (text, { isCode }) => {
		// Don't attempt to extract `\n`s from text inside "code" elements.
		// The reason is that the contents of such elements should stay untouched.
		if (isCode) {
			return text
		}
		return extractLineBreakContentElementsFromText(text)
	}

	/**
	 * Parses an HTML text node.
	 * @param  {Node} node
	 * @return {string|string[]}
	 */
	parseTextNode = (node, { isCode }) => {
		return this.parseText(node.textContent, { isCode })
	}

	/**
	 * Parses an HTML element.
	 * @param  {Element} element
	 * @return {(null|string|object|any[])}
	 */
	parseElement = (element, { topLevel, isCode }) => {
		if (element.tagName.toLowerCase() === LINE_BREAK_ELEMENT_TYPE.tag) {
			return LINE_BREAK_ELEMENT_TYPE.createElement()
		}
		for (const contentElementType of this.syntax) {
			if (this.doesDomElementMatchContentElementType(element, contentElementType)) {
				if (!isCode) {
					isCode = element.tagName.toLowerCase() === 'pre'
				}
				let content
				// Sometimes, there're HTML tags whose content, when being parsed, can simply
				// be converted to a textual representation of the corresponding HTML markup.
				//
				// For example, if such HTML tag is assumed to be `<pre/>` then
				// `<pre>some <b>bold</b> text</pre>` would be parsed as `<pre>some bold text</pre>`.
				//
				// Why would anyone do that?
				// An example are `<pre/>` tags that're used for code in `/g/` on `4chan.org`:
				// `<pre class="prettyprint prettyprinted" style=""><span class="pln">bootrec </span><span class="pun">/</span><span class="pln">rebuildbcd</span><br></pre>`.
				// That `<pre/>` tag could simply be converted to `<pre>bootrec /rebuildbcd</pre>` and that would be enough.
				// Yes, that would discard all syntax highlighting info, but it's a quick and simple solution, and it works.
				//
				// To enable such behavior, `convertContentToText: true` flag should be set on a `contentElementType`.
				//
				if (contentElementType.convertContentToText) {
					content = this.parseText(
						getHtmlElementTextContent(element).trim(),
						{ isCode }
					)
				} else {
					content = element.childNodes.length > 0
						? this.parseContent(element.childNodes, {
							topLevel: false,
							isCode
						})
						: undefined
				}
				if (content && contentElementType.content === false) {
					console.error('Content element type is declared as not having any content but in reality it does have content.')
					console.log('Content element type:')
					console.log(contentElementType)
					console.log('DOM Element:')
					console.log(getOuterHtml(element))
				}
				// Empty elements are skipped unless the content element type
				// is marked as not meant to contain any content (`content: false`).
				if (!content && contentElementType.content !== false) {
					return null
				}
				const contentElement = contentElementType.createElement(
					content,
					{
						// Returns a value of an HTML attribute of the tag.
						getAttribute: (name) => element.getAttribute(name)
					},
					// Sometimes `createElement()` functions could use some additional helper functions or constants.
					// If `context` parameter is passed to `parseHtmlContent()` function then that `context` object
					// will be available as the third argument of `createElement()` functions.
					this.context
				)
				if (contentElementType.block) {
					if (!topLevel) {
						console.error('A `block: true` element was found on a non-top level. The element was discarded.')
						console.log('Content element type:')
						console.log(contentElementType)
						return null
					}
					return new BlockElement(contentElement)
				}
				return contentElement
			}
		}
	}

	parseContent(childNodes, { topLevel, isCode }) {
		let content = []

		childNodes = Array.prototype.slice.call(childNodes)

		for (const node of childNodes) {
			// `node.nodeType === 3` means "text node".
			if (node.nodeType === 3 && node.textContent === LINE_BREAK_CHARACTER_IN_TEXT) {
				content.push(LINE_BREAK_ELEMENT_TYPE.createElement())
			} else {
				let result
				// `node.nodeType === 3` means "text node".
				if (node.nodeType === 3) {
					result = this.parseTextNode(node, { isCode })
				}
				// `node.nodeType === 1` means "DOM element".
				else if (node.nodeType === 1) {
					result = this.parseElement(node, { topLevel })
				}
				// Any other types of DOM nodes (I don't think there're any) are discarded.
				else {
					result = null
				}

				if (result) {
					// The `result` of calling `this.parseElement()` or `this.parseText()` could be an array:
					// * An array could be returned when some words are put under a "spoiler"
					//   and a string is transformed into an array of strings and `spoiler`s.
					// * `8ch.net` comment syntax has an implicit convention that every line of text
					//   should be assumed to terminate with an `\n` by default, so in such cases
					//   an array `[text, '\n']` is returned from `this.parseElement()` instead of just `text`.
					// * When a piece of text is encountered with an '\n's in it, those '\n's are extracted
					//   as standalone '\n' content blocks in `this.parseText()`.
					if (Array.isArray(result)) {
						content = content.concat(result)
					} else {
						content.push(result)
					}
				} else if (result === undefined) {
					const contentElements = this.getContentElementsForUnknownElementType({
						element: node,
						getContentElements: () => {
							const content = this.parseContent(node.childNodes, { topLevel: false, isCode })
							if (Array.isArray(content)) {
								return content
							}
							if (content) {
								return [content]
							}
							return []
						}
					})
					content = content.concat(contentElements)
				}
			}
		}

		// If there's no child content.
		if (content.length === 0) {
			return
		}
		// If the only child is a simple text element then return it
		// without wrapping it into an array.
		if (content.length === 1 && typeof content[0] === 'string') {
			return content[0]
		}
		// Return child content.
		return content
	}
}

class BlockElement {
	constructor(element) {
		this.element = element
	}
}

function onUnknownElementTypeDefault({ element, elementMarkup }) {
	// Outputting `console.warn('[social-components-parser] Unsupported markup found:', element)`
	// is too lengthy in Node.js because it prints the DOM Element
	// as a javascript object with all of its various properties.
	//
	// Instead, print the `outerHTML` of it.
	// (`.outerHTML` is not available in Node.js when using `xmldom` package)
	//
	// Writing this as a one-liner because the tests expect
	// a single `console.warn()` call here.
	//
	console.warn('[social-components-parser] Unsupported HTML element found:', elementMarkup)
}

function getContentElementsForUnknownElementTypeDefault({ element, getContentElements }) {
	return getContentElements()
}