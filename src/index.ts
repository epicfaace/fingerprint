import axios from 'axios';
import * as esprima from 'esprima';
import { writeFileSync, write, writeFile } from 'fs';
import * as cheerio from 'cheerio';
import { intersection } from 'lodash';

interface Version {
  name: string,
  source: string;
}

type VersionExtractor = (e: string) => Version | null;

export const extractLibraries: VersionExtractor = input => {
  const matchers = [
    {
      // version of React
      regex: /versions? of \b([\w-\.]+)\b/,
      name: "versionString"
    },
    {
      // React v1.2.3
      regex: /\b([\w-\.]+)\b\W+(?:v|version\W+)(\d[\.\d]+)/,
      name: "versionString2"
    }
  ];
  for (const { regex, name } of matchers) {
    const match = input.match(regex);
    if (match && match[1]) {
      return {
        name: match[1],
        version: match[2],
        source: name
      }
    }
  }
  return null;
}

const options = {
  transformResponse: e => e
}

const parseURL = async (URL) => {
  // console.log("parseURL", URL);
  const { data } = await axios.get(URL, options);
  
  const downloadJavascriptURL = async (src) => {
    var pathArray = URL.split( '/' );
    var protocol = pathArray[0];
    var host = pathArray[2];
    var domain = protocol + '//' + host;

    let url = "";
    if (src.startsWith("//")) {
      url = protocol + src;
    } else if (src.startsWith("http")) {
      url = src;
    } else if (!domain.endsWith("/") && !src.startsWith("/")) {
      url = `${domain}/${src}`;
    } else {
      url = `${domain}${src}`;
    }
    console.log(url, domain, src);
    let data = "";
    try {
      data += (await axios.get(url, options)).data;
    }
    catch (e) {
      console.error(e.message);
    }
    const match = data.match(/^\/\/# sourceMappingURL=(.*)/);
    if (match && match[1]) {
      let mapURL;
      if (match[1].startsWith("http") || match[1].startsWith("//")) {
        mapURL = match[1];
      } else {
        // Relative URL
        const split = src.split("/");
        split[split.length - 1] = match[1];
        mapURL = split.join("/");
      }
      data += "\n" + await downloadJavascriptURL(mapURL);
    }
    return data;
  }

  let scriptData;

  if (URL.endsWith(".js")) {
    scriptData = data;
  } else {
    // Full HTML page -- get all scripts.
    const $ = cheerio.load(data);
    const scriptDatas = await Promise.all($("script").toArray().map(async (e) => {
      const element = $(e);
      let src = element.attr("src");
      if (src && src.endsWith(".js")) {
        return await downloadJavascriptURL(src);
      }
      return element.html();
    }));
    scriptData = scriptDatas.join("\n");
  }

  let tokenized;
  try {
    tokenized = esprima.tokenize(scriptData, { comment: true });
  }
  catch (e) {
    console.error(e.message);
    tokenized = [];
  }
  const comments = (tokenized.filter(e => e.type === 'BlockComment' || e.type === 'LineComment').map(e => e.value));
  const strings = (tokenized.filter(e => e.type === 'String').map(e => e.value).filter(e => {
    // e = e.substring(1, e.length - 2);
    // const words = e.split(" ");
    return true;
    // return e.length > 5 && e.length <= 40; //  || e.length > 10;
  }));
  return { comments, strings };
}

// https://stackoverflow.com/a/53577159/1950269
function getStandardDeviation (array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

const main = async () => {

  // const comments = new Set();
  // let strings = new Set<string>();

    // await Promise.all(urls.map(async (url) => {
    //   const result = await parseURL(url);
    //   writeFileSync(`output/strings-${url.replace(/\//g, "-")}.txt`, [...result.strings].sort().join("\n"));

    // }));
    // return;
  
    // const page = "https://root.treehacks.com/dist/vendors~app.js";
    // const packageName = "lodash";
    //  // https://unpkg.com/lodash@4.17.20/lodash.min.js
    // const umdPath = "/lodash.min.js";

    const page = "https://staging.crossfeed.cyber.dhs.gov/static/js/4.0ce18064.chunk.js";
    // const packageName = "@trussworks/react-uswds";
    // const umdPath = "/lib/index.js";

    // const packageName = "aws-amplify";
    // const umdPath = "/dist/aws-amplify.min.js";

    // const packageName = "react";
    // const umdPath = "/umd/react.production.min.js";

    const packageName = "papaparse";
    const umdPath = "/papaparse.min.js";

    // const packageName = "@rjsf/core";
    // const umdPath = "/dist/react-jsonschema-form.js";

    // const versions = ["4.17.20", "4.17.19", "4.17.15", "4.17.14", "4.17.13", "4.17.12"];
    const { strings } = await parseURL(page);

    const { data: { versions: packageVersions } } = await axios.get(`https://replicate.npmjs.com/${encodeURIComponent(packageName)}`);

    // Sort version-dotted-number strings; remove alpha.
    const versions = Object.keys(packageVersions).filter(e => e.match(/^[\d\.]+$/)).sort((a, b) => {
      const splitA = a.split(".");
      const splitB = b.split(".");
      let i = 0;
      while (splitA[i] === splitB[i]) {
        i++;
      }
      return splitA[i].localeCompare(splitB[i]);
    }).reverse();

    let baseline = null;
    for (const version of versions) {
      let result;
      let common: string[] = [];
      let notCommon: string[] = [];
      let packageStrings;
      try {
        packageStrings = (await parseURL(`https://unpkg.com/${packageName}@${version}${umdPath}`)).strings;
        result = 0;
        let previousIndex = 0;
        // for (let i = 0; i < strings.length; i++) {
        //   if (packageStrings.indexOf(strings[i]) > -1) {
        //     // result += 1 / (Number(i) - previousIndex);
        //     result++;
        //     // common.push(strings[i]);
        //     previousIndex = i;
        //   }
        // }
        let indices: number[] = [];
        const strings2 = [...strings];
        for (let i = 0; i < packageStrings.length; i++) {
          const idx = strings2.indexOf(packageStrings[i]);
          if (idx > -1) {
            strings2.splice(idx, 1);
            indices.push(idx as number);
            result++;
          }
        }
        // So we penalize lines in the source code that are too far apart -- a single
        // library will likely be contiguously included in the source code.
        result /= getStandardDeviation(indices);
        // for (let packageString of packageStrings) {
        //   if (strings.indexOf(packageString) === -1) {
        //     notCommon.push(packageString);
        //   }
        // }

        // writeFileSync("common.txt", notCommon.join("\n"));
        
        // result = intersection(strings, packageStrings).length;
      } catch (e) {
        result = "package / umd file not found";
      }
      console.error(packageName, version, result, packageStrings?.length);
    }
  // const versions: Version[] = [];
  // for (let item of strings) {
  //   const extracted = extractLibraries(item);
  //   if (extracted) {
  //     versions.push(extracted);
  //   }
  // }


// versions of 
// version of 

// strings.in

// writeFileSync("versions.json", JSON.stringify(versions, null, 2));
  // writeFileSync("comments.txt", [...comments].sort((a, b) => b.length - a.length).join("\n"));
  // writeFileSync("strings.txt", [...strings].sort((a, b) => b.length - a.length).join("\n"));

};

if (typeof jest === 'undefined') {
  main();
}