const fs = require("fs");
const markdownItAnchor = require("markdown-it-anchor");
const languages = require('./languages.json')

function fixPath(path) {
  return path.replace('//', '/')
}

module.exports = function(eleventyConfig) {
  const PATH_PREFIX = process.env.B4D_PATH_PREFIX ?? '/'
  const OUTPUT_DIR = 'dist'
  const INPUT_DIR = 'prebuilt'

  const LANGUAGES = languages.map(function (language, idx) {
    return {
      ...language,
      path: fixPath(idx === 0 ? `/${PATH_PREFIX}` : `/${PATH_PREFIX}/${language.code}`)
    }
  })

  function getLanguageCodeByURL(url) {
    const urlPath = fixPath(`/${PATH_PREFIX}/${url}`)
    let matchedLanguageCode = LANGUAGES[0].code

    for (let i = 1; i < LANGUAGES.length; i++) {
      console.log(urlPath, LANGUAGES[i].path)
      if (urlPath.indexOf(LANGUAGES[i].path) > -1) {
        matchedLanguageCode = LANGUAGES[i].code
        break
      }
    }

    return matchedLanguageCode
  }

  eleventyConfig.addPlugin(require("@11ty/eleventy-navigation"));

  eleventyConfig.addTransform("minification", function(content) {
    if (this.outputPath.endsWith('.html')) {
      return require('html-minifier').minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
      })
    }
  });

  eleventyConfig.on('beforeBuild', () => {
    fs.mkdirSync(`${INPUT_DIR}/css/`, { recursive: true })
    fs.readFile(`${INPUT_DIR}/css/main.css`, (err, css) => {
      require('postcss')([
        require('postcss-import'),
        require('tailwindcss/nesting'),
        require('tailwindcss')(`${INPUT_DIR}/tailwind.config.js`),
        require('autoprefixer')
      ])
        .process(css, { from: `${INPUT_DIR}/css/main.css`, to: `${OUTPUT_DIR}/css/main.min.css` })
        .then(result => {
          fs.mkdirSync(`${OUTPUT_DIR}/css/`, { recursive: true })
          fs.writeFile(`${OUTPUT_DIR}/css/main.min.css`, result.css, (err) => {
            if (err) throw err;
          });
        })
    })
  })

  eleventyConfig.addPassthroughCopy(`${INPUT_DIR}/img`);

  let markdownLibrary = require("markdown-it")({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      space: true,
      placement: "after",
      class: "no-underline opacity-50 hover:opacity-100",
      symbol: "#",
      level: 1,
    }),
    slugify: eleventyConfig.getFilter("slug")
  });

  eleventyConfig.setLibrary("md", markdownLibrary);

  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync(`${OUTPUT_DIR}/404.html`);

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

  eleventyConfig.addFilter("multiLangNav", function(value, url) {
    const pageLanguage = getLanguageCodeByURL(url)

    return value.filter(function(navRecord) {
      const linkLanguage = getLanguageCodeByURL(navRecord.url)

      return linkLanguage === pageLanguage
    })
  });

  eleventyConfig.addFilter("onlyOtherLanguages", function(value, url) {
    const pageLanguage = getLanguageCodeByURL(url)

    return value.filter(function(language) {
      return language.code !== pageLanguage
    })
  });

  eleventyConfig.addGlobalData("languages", LANGUAGES);

  return {
    templateFormats: [ "md", "njk", "html" ],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: PATH_PREFIX,
    dir: {
      input: INPUT_DIR,
      includes: "includes",
      data: "data",
      output: OUTPUT_DIR,
    }
  };
};
