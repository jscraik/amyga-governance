/**
 * Dependency-cruiser configuration for memory-related constraints.
 * Defines forbidden dependency rules to ensure architectural boundaries.
 *
 * NOTE: This config is monorepo-specific. In a neutral governance pack it should
 * be installed only by a monorepo/memory pack and must not be treated as global
 * governance policy for all consumer repos.
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
