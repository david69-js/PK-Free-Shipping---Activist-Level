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
  const metafield = input.discount.metafield;
  if (!metafield || !metafield.jsonValue) {
    return {operations: []};
  }

  const config = metafield.jsonValue as LoyaltyShippingConfig;
  const tiers = config.tiers ?? [];

  const isUS = input.cart.deliveryGroups.some(
    g => g.deliveryAddress?.countryCode === "US",
  );
  if (!isUS) {
    return {operations: []};
  }

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
      ? "FREE VIP GROUND SHIPPING (USPS Priority Express)"
      : `${discountPercent}% off shipping`;

  const candidates = input.cart.deliveryGroups.flatMap(group =>
    group.deliveryOptions
      .filter(option => option.title?.includes("Standard Shipping") || option.title?.includes("FREE VIP GROUND SHIPPING"))
      .map(option => ({
        message,
        targets: [
          {
            deliveryOption: {
              handle: option.handle,
            },
          },
        ],
        value: {
          percentage: {
            value: discountPercent,
          },
        },
      })),
  );

  if (candidates.length === 0) {
    return {operations: []};
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates,
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}