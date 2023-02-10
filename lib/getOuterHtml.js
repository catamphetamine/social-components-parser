import stringifyDomElement from './stringifyDomElement.js'

export default function getOuterHtml(node) {
	return node.outerHTML || stringifyDomElement(node)
}