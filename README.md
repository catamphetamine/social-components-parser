# `social-components-parser`

Parses HTML markup into [Content](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/Content.md).

## Use

```js
import { parseHtmlContent } from 'social-components-parser'

parseHtmlContent('A text in <b>bold</b>', {
  plugins: [{
    tag: 'b',
    createBlock(content) {
      return {
        type: 'text',
        style: 'bold',
        content
      }
    }
  }]
})
```

## Plugins

A plugin might define properties:

* `tag: string` — An HTML tag this plugin parses.
* `attributes?: object[]` — An optional set of attribute the HTML tag must have in order to be parsed by this plugin. Each attribute object should be of shape:
  * `name: string` — HTML attribute name.
  * `value: string` — HTML attribute value.
* `createBlock: (childContent?: Content) => Content` — Returns the parsed `Content` of the HTML tag. Receives the parsed `Content` of the child elements as an argument.

## Testing

Unit tests:

```
npm test
```

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/social-components-parser) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/social-components-parser). Issues can be reported in any repo.

## License

[MIT](LICENSE)