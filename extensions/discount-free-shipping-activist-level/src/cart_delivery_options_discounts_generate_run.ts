import {
  DeliveryDiscountSelectionStrategy,
  DeliveryInput,
  CartDeliveryOptionsDiscountsGenerateRunResult,
} from "../generated/api";

type TierConfig = {
  customerTag: string;
  minimumSubtotal: number;
  shippingDiscountPercent: number;
};

type LoyaltyShippingConfig = {
  tiers: TierConfig[];
};

export function cartDeliveryOptionsDiscountsGenerateRun(
  input: DeliveryInput,
): CartDeliveryOptionsDiscountsGenerateRunResult {
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    return {operations: []};
  }

  const metafield = input.discount.metafield;
  if (!metafield || !metafield.jsonValue) {
    return {operations: []};
  }

  const config = metafield.jsonValue as LoyaltyShippingConfig;
  const tiers = config.tiers ?? [];

  const customer = input.cart.buyerIdentity?.customer;
  const hasTags = customer?.hasTags ?? [];

  const activeTag = hasTags.find(t => t.hasTag === true);

  if (!activeTag) {
    return {operations: []};
  }

  const matchingTier = tiers.find(tier => tier.customerTag === activeTag.tag);
  const discountPercent = matchingTier?.shippingDiscountPercent ?? 100;

  if (discountPercent <= 0) {
    return {operations: []};
  }

  const message =
    discountPercent === 100
      ? "VIP Customer Reward"
      : `${discountPercent}% off shipping`;

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message,
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id,
                  },
                },
              ],
              value: {
                percentage: {
                  value: discountPercent,
                },
              },
            },
          ],
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}