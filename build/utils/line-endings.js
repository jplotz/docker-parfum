"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLineEndings = void 0;
function normalizeLineEndings(content) {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
exports.normalizeLineEndings = normalizeLineEndings;
//# sourceMappingURL=line-endings.js.map