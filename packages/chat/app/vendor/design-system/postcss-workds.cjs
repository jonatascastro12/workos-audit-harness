const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

// Build a list of breakpoints from "@custom media" rules in "breakpoints.css"
const breakpointsFile = path.resolve(__dirname, "breakpoints.css");
const breakpointsCss = fs.readFileSync(breakpointsFile, "utf-8");
const breakpoints = postcss
  .parse(breakpointsCss)
  .nodes.map((node) => {
    if (node.type === "atrule" && node.name === "custom-media") {
      const [_match, name, params] = node.params.match(/--(\w+)\s+(.+)/);
      return { name, params };
    }

    return null;
  })
  .filter(Boolean);

module.exports = () => ({
  postcssPlugin: "postcss-workds",
  AtRule(atrule) {
    if (atrule.name === "breakpoints") {
      atrule.name = "media all";

      breakpoints.forEach((breakpoint) => {
        const media = new postcss.AtRule({
          name: "media",
          params: breakpoint.params,
        });

        atrule.each((child) => {
          const clone = child.clone();
          addPrefix(clone, breakpoint.name);
          media.append(clone);
        });

        atrule.parent.append(media);
      });
    }
  },
});

module.exports.postcss = true;

function addPrefix(node, prefix) {
  if (node.type === "atrule") {
    node.each((child) => addPrefix(child, prefix));
  }

  /**
   * Should match:
   * ```
   * .gray
   * .size-1
   * .-m-2
   * .Button.size-1
   * ```
   *
   * Should not match:
   * .Button
   */
  const classNameRegexp = /\.(-*[a-z][\w-]*)/g;

  // Check for rules that handle compound props (e.g. ".Button.size-2.gray")
  if (/\.-*[a-z][\w-]*\.-*[a-z]/.test(node.selector)) {
    throw Error(`
      "${node.selector}" looks like it uses a compound prop.
      "@breakpoints" does not support compound props yet.
    `);
  }

  if (classNameRegexp.test(node.selector)) {
    node.selector = node.selector.replace(classNameRegexp, `.${prefix}\\:$1`);
  }
}
