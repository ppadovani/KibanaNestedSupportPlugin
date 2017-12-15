# nested-fields-support

> This plugin adds support for nested fields to Kibana. This is a work in progress, and is based off of the 
work from my fork of [Kibana](https://github.com/homeaway/kibana).

See this issue for updates/screenshots: [Status updates and Screenshots](https://github.com/ppadovani/KibanaNestedSupportPlugin/issues/8)

---

## development

See the [kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md) for instructions setting up your development environment. Once you have completed that, use the following npm tasks.

  - `npm start`

    Start kibana and have it include this plugin

  - `npm start -- --config kibana.yml`

    You can pass any argument that you would normally send to `bin/kibana` by putting them after `--` when running `npm start`

  - `npm run build`

    Build a distributable archive

  - `npm run test:browser`

    Run the browser tests in a real web browser

  - `npm run test:server`

    Run the server tests using mocha

For more information about any of these commands run `npm run ${task} -- --help`.

