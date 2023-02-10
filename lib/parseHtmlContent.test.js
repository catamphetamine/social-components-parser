import parseHtmlContent from './parseHtmlContent.js'

import getContentElementsForUnknownElementType from './parseHtmlContent.test.getContentElementsForUnknownElementType.js'

function parseContentTest(markup, expected, {
	expectedWarnings = [],
	getContentElementsForUnknownElementType
} = {}) {
	const consoleWarn = console.warn
	const warnings = []
	console.warn = (text) => warnings.push(text)

	const result = parseHtmlContent(markup, {
		syntax: [
			{
				tag: 'strong',
				createElement(content) {
					return {
						type: 'text',
						style: 'bold',
						content
					}
				}
			}
		],
		getContentElementsForUnknownElementType
	})

	console.warn = consoleWarn

	expectToEqual(warnings, expectedWarnings)
	expectToEqual(result, expected)
}

describe('parseHtmlContent', () => {
	it('should parse blank strings (no content)', () => {
		parseContentTest(
			' ',
			undefined
		)
	})

	it('should parse just text', () => {
		expectToEqual(
			parseHtmlContent(
				'<div>Just text</div>',
				{
					syntax: [{
						tag: 'div',
						createElement(content) {
							return content
						}
					}]
				}
			),
			'Just text'
		)
	})

	it('should skip unknown tags', () => {
		parseContentTest('<div>Text</div>', 'Text')
	})

	it('should skip unknown tags (add elements to children)', () => {
		parseContentTest(
			'<div>' +
				'<h1>Heading</h1>' +
				'<p>Text <strong>bold</strong> regular</p>' +
			'</div>' +
			'<br>' +
			'Rest text',
			[
				[
					'Heading'
				],
				[
					'Text ',
					{
						type: 'text',
						style: 'bold',
						content: 'bold'
					},
					' regular'
				],
				[
					'Rest text'
				]
			],
			{
				expectedWarnings: [
					// "[social-components-parser] Unsupported HTML node found:",
					// "[social-components-parser] Unsupported HTML node found:",
					// "[social-components-parser] Unsupported HTML node found:"
				],
				// "\n"s will be removed after splitting content into blocks by multiple "\n"s.
				getContentElementsForUnknownElementType
			}
		)
	})

	it('should match HTML tag attributes', () => {
		expectToEqual(
			parseHtmlContent(
				'<div class="a">b</div>',
				{
					syntax: [
						{
							tag: 'div',
							attributes: [{
								name: 'class',
								value: 'a'
							}],
							createElement(content) {
								return {
									type: 'text',
									style: 'a',
									content
								}
							}
						}
					]
				}
			),
			[
				[
					{
						type: 'text',
						style: 'a',
						content: 'b'
					}
				]
			]
		)
	})

	it('should match HTML tag attributes using regular expressions', () => {
		expectToEqual(
			parseHtmlContent(
				'<div class="a a1 a2">b</div>',
				{
					syntax: [
						{
							tag: 'div',
							attributes: [{
								name: 'class',
								value: /^a\s?/
							}],
							createElement(content) {
								return {
									type: 'text',
									style: 'a',
									content
								}
							}
						}
					]
				}
			),
			[
				[
					{
						type: 'text',
						style: 'a',
						content: 'b'
					}
				]
			]
		)
	})

	it('should retain "\\n"s in HTML <pre/> tags', () => {
		expectToEqual(
			parseHtmlContent(
				'<pre>a\n\n\n\nb</pre>',
				{
					syntax: [
						{
							tag: 'pre',
							createElement(content) {
								return {
									type: 'code',
									content
								}
							}
						}
					]
				}
			),
			[
				[
					{
						type: 'code',
						content: 'a\n\n\n\nb'
					}
				]
			]
		)
	})

	it('should remove "\\n"s in tags when not using `convertContentToText` feature', () => {
		expectToEqual(
			parseHtmlContent(
				'<div><span>a</span>\n\n\n\n<b>b</b></div>',
				{
					syntax: [
						{
							tag: 'div',
							convertContentToText: true,
							createElement(content) {
								return {
									type: 'code',
									content
								}
							}
						}
					]
				}
			),
			[
				[
					{
						type: 'code',
						content: 'a'
					}
				],
				[
					{
						type: 'code',
						content: 'b'
					}
				]
			]
		)
	})

	it('should retain "\\n"s in `<pre/>` tags when using `convertContentToText` feature', () => {
		expectToEqual(
			parseHtmlContent(
				'<pre><span>a</span>\n\n\n\n<b>b</b></pre>',
				{
					syntax: [
						{
							tag: 'pre',
							convertContentToText: true,
							createElement(content) {
								return {
									type: 'code',
									content
								}
							}
						}
					]
				}
			),
			[
				[
					{
						type: 'code',
						content: 'a\n\n\n\nb'
					}
				]
			]
		)
	})
})

function expectToEqual(a, b) {
	return expect(a).to.deep.equal(b)
}