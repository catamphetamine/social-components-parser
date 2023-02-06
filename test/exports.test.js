import {
	parseHtmlContent
} from '../index.js'

describe('exports', () => {
	it('should export functions', () => {
		parseHtmlContent.should.be.a('function')
	})
})