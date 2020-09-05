import { extractLibraries } from "../src/index";

describe("versionExtractor", () => {
  test("version string", () => {
    const strings = [
      "There might be multiple conflicting versions of aws-amplify or amplify packages in your node_modules",
      "wasn't supplied to CSSTransitionGroup: this can cause unreliable animations and won't be supported in a future version of React.",
      "/*!\n * Bootstrap v4.3.1 (https://getbootstrap.com/)\n * Copyright 2011-2019 The Bootstrap Authors\n * Copyright 2011-2019 Twitter, Inc.\n * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)\n",
      "decimal.js-light v2.5.0",
      "@license React v16.5.2",
      "@license URI.js v4.2.1",
      " @license\nPapa Parse\nv4.6.2\nhttps://github.com/mholt/PapaParse\nLicense: MIT",
      "! https://mths.be/punycode v1.3.2 by @mathias ",
      "! moment-timezone.js\n! version : 0.5.23\n! Copyright (c) JS Foundation and other contributors\n! license : MIT",
      " * JavaScript Cookie v2.2.1\n* https://github.com/js-cookie/js-cookie",
      " * @license\n* Lodash <https://lodash.com/>"
    ]
    for (const string of strings) {
      expect(extractLibraries(string)).toMatchSnapshot();
    }
  })
})