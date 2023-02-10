# `social-components-parser`

Utility functions for parsing markup into [Content](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/Content.md).

## API

### `parseHtmlContent`

```js
import { parseHtmlContent } from 'social-components-parser'
```

Parses HTML markup into [Content](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/Content.md).

```js
parseHtmlContent(html: string, {
  syntax,
  // Optional parameters:
  context,
  onUnknownElementType,
  getContentElementsForUnknownElementType
}): Content?
```

Options:

* `syntax: object[]` — A set of rules for parsing HTML markup. See the [Syntax](#syntax) section of this document.
* `context?: object` — An optional object that gets passed to `createElement()` functions (see `syntax`).
* `onUnknownElementType?: ({ element: Element, elementMarkup: string }) => void` — A function that gets called when an unsupported DOM element is found.
* `getContentElementsForUnknownElementType?: ({ element: Element, getContentElements: ContentElement[] }) => ContentElement[]` — A function that could be used to modify the default behavior when encountering an unsupported DOM element. The default behavior is to return the child content elements (`getContentElements()`).

#### Examples

<details>
<summary>Parse by HTML tag name</summary>

#####

```js
import { parseHtmlContent } from 'social-components-parser'

const content = parseHtmlContent('Some <b>emphasized</b> text', {
  syntax: [{
    tag: 'b',
    createElement(content) {
      return {
        type: 'text',
        style: 'bold',
        content
      }
    }
  }]
})

// `content` is a list of block elements (paragraphs).
// The first paragraph is a list of inline elements.
content === [
  [
    'Some ',
    {
      type: 'text',
      style: 'bold',
      content: 'emphasized'
    },
    ' text'
  ]
]
```
</details>

<details>
<summary>Parse by HTML tag name and attributes</summary>

#####

```js
import { parseHtmlContent } from 'social-components-parser'

const content = parseHtmlContent('Some <span class="red">emphasized</span> text', {
  syntax: [{
    tag: 'span',
    attributes: {
      name: 'class',
      value: 'red'
    },
    createElement(content) {
      return {
        type: 'text',
        style: 'bold',
        content
      }
    }
  }]
})

// `content` is a list of block elements (paragraphs).
// The first paragraph is a list of inline elements.
content === [
  [
    'Some ',
    {
      type: 'text',
      style: 'bold',
      content: 'emphasized'
    },
    ' text'
  ]
]
```
</details>

<details>
<summary>Parse nested tags</summary>

#####

```js
import { parseHtmlContent } from 'social-components-parser'

const content = parseHtmlContent('Some <b><i>heavily</i> emphasized</b> text', {
  syntax: [{
    tag: 'b',
    createElement(content) {
      return {
        type: 'text',
        style: 'bold',
        content
      }
    }
  }, {
    tag: 'i',
    createElement(content) {
      return {
        type: 'text',
        style: 'italic',
        content
      }
    }
  }]
})

// `content` is a list of block elements (paragraphs).
// The first paragraph is a list of inline elements.
content === [
  [
    'Some ',
    {
      type: 'text',
      style: 'bold',
      content: [
        {
          type: 'text',
          style: 'italic',
          content: 'heavily'
        },
        ' emphasized'
      ]
    },
    ' text'
  ]
]
```
</details>

#### Syntax

The `syntax` parameter should be a list of definitions for each possible type of a content block.

A content block type is defined by properties:

* `tag: string` — An HTML tag.
* `attributes?: object[]` — An optional set of attributes the HTML tag must have. Each attribute object should be of shape:
  * `name: string` — HTML attribute name.
  * `value: string | RegExp` — HTML attribute value.
* `convertContentToText?: boolean` — One could set this flag to `true` to instruct the parser to convert the contents of the HTML tag from HTML markup to simple text, effectively stripping any HTML tags from the child nodes and leaving just the text content. Example: `<pre>some <b>bold</b> text</pre>` → `<pre>some bold text</pre>`. This feature could be used to simplify parsing certain HTML tags having too complex internal structure.
* `content?: boolean` — By default, empty HTML tags get skipped unless `content: false` flag is specified for a certain content block type.
* `block?: boolean` — Set this flag to `true` if the content element is a ["block element"](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/Content.md#block-element) rather than an ["inline element"](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/Content.md#inline-content), otherwise it won't be parsed correctly.
* `createElement: (childContent?: Content, utility, options) => Content` — Returns the `Content` representing the parsed HTML tag. Receives the parsed `Content` of the child elements as an argument.
  * `utility: object` — An object providing utility functions:
    * `getAttribute(name: string)? string` — Returns an attribute of the HTML tag.
  * `context?: object` — The `context` parameter of the `parseHtmlContent()` function.

## Other

#### `splitContentIntoParagraphsByMultipleLineBreaks`

Sometimes, the markup could contain multiple line breaks in the midst of some deeply-nested part of content.

```
Some <b><i>multiline<br/><br/>heavily</i> emphasized</b> text
```

When parsed using `parseHtmlContent()`, it will return the content where `<br/>`s w:

```js
[
  [
    'Some ',
    {
      type: 'text',
      style: 'bold',
      content: [
        {
          type: 'text',
          style: 'italic',
          content: [
            'multiline',
            '\n',
            '\n',
            'heavily'
          ]
        },
        ' emphasized'
      ]
    },
    ' text'
  ]
]
```

In order to convert those multiple "line breaks" into a "paragraph break", one could use the `splitContentIntoParagraphsByMultipleLineBreaks()` function that is exported from `social-components` package.

```js
import splitContentIntoParagraphsByMultipleLineBreaks from 'social-components/utility/post/splitContentIntoParagraphsByMultipleLineBreaks.js'

const normalizedContent = splitContentIntoParagraphsByMultipleLineBreaks(content)

normalizedContent === [
  [
    'Some ',
    {
      type: 'text',
      style: 'bold',
      content: [
        {
          type: 'text',
          style: 'italic',
          content: 'multiline'
        }
      ]
    }
  ],
  [
    {
      type: 'text',
      style: 'bold',
      content: [
        {
          type: 'text',
          style: 'italic',
          content: 'heavily'
        },
        ' emphasized'
      ]
    },
    ' text'
  ]
]
```

## Test

```
npm test
```

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/social-components-parser) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/social-components-parser). Issues can be reported in any repo.

## License

[MIT](LICENSE)