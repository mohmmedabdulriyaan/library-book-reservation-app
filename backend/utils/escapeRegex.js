// Makes user text safe to use inside a search RegExp
// e.g. "C++" would otherwise break the search
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = escapeRegex;
