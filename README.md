See [KNQL Plugin](https://ppadovani.github.io/knql_plugin/overview/) for official documentation, installation instructions etc.

Open any issues here that you might have with the plugin, as well as requests for new versions.

---

## Development



See the [kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md) for instructions setting up your development environment. Once you have completed that, use the following npm tasks.

  - `npm install jison-gho -g`
     
     Install the jison parser tooling

  - `npm install`
  
    Install required dependencies

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

## Grammer changes

Changes to the grammer must be made in the knql.jison file. Once those changes are made the knql.js 
file must be rebuilt using the command:

`jison knql.jison -p slr`
