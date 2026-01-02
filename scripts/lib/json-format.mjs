#!/usr/bin/env node
/**
 * @fileoverview Shared JSON formatting helpers.
 * @license Apache-2.0
 */

/**
 * Format JSON with canonical indentation and trailing newline.
 * @param {unknown} value - JSON value.
 * @param {number} [indent=2] - Indent size.
 * @returns {string} Formatted JSON string.
 */
export function formatJson(value, indent = 2) {
	return `${JSON.stringify(value, null, indent)}\n`;
}

/**
 * Check whether a JSON string matches the canonical format.
 * @param {string} raw - Raw JSON string.
 * @param {number} [indent=2] - Indent size.
 * @returns {{ok: boolean, formatted: string}} Result and formatted string.
 */
export function isPrettyJson(raw, indent = 2) {
	const parsed = JSON.parse(raw);
	const formatted = formatJson(parsed, indent);
	return { ok: raw === formatted, formatted };
}
