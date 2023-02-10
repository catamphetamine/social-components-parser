import extractLineBreakContentElementsFromText from './extractLineBreakContentElementsFromText.js'

describe('extractLineBreakContentElementsFromText', function() {
	it('should extract line break content parts from text', function() {
		extractLineBreakContentElementsFromText('text text').should.equal('text text')
		extractLineBreakContentElementsFromText('text \n text').should.deep.equal([
			'text ',
			'\n',
			' text'
		])
		extractLineBreakContentElementsFromText('text \n text \n end').should.deep.equal([
			'text ',
			'\n',
			' text ',
			'\n',
			' end'
		])
		extractLineBreakContentElementsFromText('\n text \n text \n').should.deep.equal([
			'\n',
			' text ',
			'\n',
			' text ',
			'\n'
		])
	})
})

function expectToEqual(a, b) {
	return expect(a).to.deep.equal(b)
}