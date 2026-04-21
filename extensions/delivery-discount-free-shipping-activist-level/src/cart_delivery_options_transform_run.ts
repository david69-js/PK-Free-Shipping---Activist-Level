// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsTransformRunResult} CartDeliveryOptionsTransformRunResult
 */

const NO_CHANGES = {operations: []};

/**
 * @param {RunInput} input
 * @returns {CartDeliveryOptionsTransformRunResult}
 */
export function cartDeliveryOptionsTransformRun(input) {
  const customer = input.cart?.buyerIdentity?.customer;
  const hasTags = customer?.hasTags ?? [];

  // ¿Tiene algún tag con hasTag === true y tag === "tier: Activist"?
  const activistTag = hasTags.find(
    (t) => t.hasTag && t.tag === "tier: Activist",
  );
  if (!activistTag) {
    return NO_CHANGES;
  }

  // Leer la misma config JSON que usas en la función de descuentos
  const config = input.deliveryCustomization?.metafield?.jsonValue;
  // Si quieres usarla para más lógica, puedes hacerlo aquí. Ej:
  // const tiers = config?.tiers ?? [];
  // ...

  const operations = [];

  for (const group of input.cart.deliveryGroups ?? []) {
      console.log("GROUP", JSON.stringify(group));
    for (const option of group.deliveryOptions ?? []) {
      if (!option.title) continue;

      // Replicar behavior del Script: renombrar si incluye "Standard Shipping"
      if (option.title.includes("usa prop")) {
        operations.push({
          deliveryOptionRename: {
            deliveryOptionHandle: option.handle,
            title: "FREE VIP GROUND SHIPPING (USPS Priority Express)",
          },
        });
      }
    }
  }

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return {operations};
}