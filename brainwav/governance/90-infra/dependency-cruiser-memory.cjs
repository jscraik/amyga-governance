/**
 * Dependency-cruiser configuration for memory-related constraints.
 * Defines forbidden dependency rules to ensure architectural boundaries.
 *
 * @module
 */
module.exports = {
	/**
	 * List of forbidden dependency rules.
	 */
	forbidden: [
		{
			/**
			 * Rule to prevent imports from the legacy 'packages/memories' path.
			 * Enforces the use of the new memory architecture.
			 */
			name: 'no-legacy-memories',
			severity: 'error',
			from: {},
			to: {
				path: 'packages/memories',
			},
		},
	],
};
