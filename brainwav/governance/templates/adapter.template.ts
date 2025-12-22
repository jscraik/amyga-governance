import { z } from 'zod';

/**
 * Schema validation for the charge creation request.
 * Ensures strict typing for amount, currency, source, and idempotency key.
 */
const RequestSchema = z.object({
	amountCents: z.number().int().nonnegative(),
	currency: z.string().length(3),
	sourceToken: z.string(),
	idempotencyKey: z.string().min(16).max(255),
});

/**
 * Represents the valid input for creating a charge.
 * Derived from the Zod schema validation.
 */
export type CreateChargeInput = z.infer<typeof RequestSchema>;

/**
 * Interface for the external Payments SDK.
 * Provides the contract for interacting with payment provider services.
 */
export interface PaymentsSdk {
	/**
	 * Creates a charge transaction in the payment system.
	 *
	 * @param {unknown} payload - The raw payload required by the payment provider.
	 * @returns {Promise<unknown>} A promise resolving to the payment provider's response.
	 */
	createCharge: (payload: unknown) => Promise<unknown>;
}

/**
 * Creates an adapter function for processing payments.
 * Validates the input against the schema and delegates the call to the provided SDK.
 *
 * @param {PaymentsSdk} sdk - The initialized Payments SDK instance.
 * @returns {function(CreateChargeInput): Promise<unknown>} An async function that accepts validated input and performs the charge.
 */
export const createChargeAdapter = (sdk: PaymentsSdk) => async (input: CreateChargeInput) => {
	const payload = RequestSchema.parse(input);
	/**
	 * DOC: payments.createCharge
	 * @docsnap: docs/docsnap/payments-createCharge.docsnap.md
	 * @openapi: docs/vendor/openapi/payments-v1.json#/paths/~1charges/post
	 */
	return sdk.createCharge({
		amount: payload.amountCents,
		currency: payload.currency,
		source: payload.sourceToken,
		idempotency_key: payload.idempotencyKey,
	});
};
