/**
 * Sync Stripe products, list prices, and the site-wide 50% promo coupon.
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-stripe-catalog.mjs          # dry-run
 *   node --env-file=.env.local scripts/sync-stripe-catalog.mjs --apply  # write to Stripe
 *
 * Requires STRIPE_SECRET_KEY in the environment. Prints env lines to paste into .env.local.
 */
import Stripe from "stripe";

import {
  CATALOG_PRODUCTS,
  FOUNDER_ANNUAL_ALIAS,
  PROMO_COUPON,
} from "./stripe-catalog-config.mjs";

const apply = process.argv.includes("--apply");
const secret = process.env.STRIPE_SECRET_KEY?.trim();

if (!secret) {
  console.error("Missing STRIPE_SECRET_KEY. Add it to .env.local and re-run.");
  process.exit(1);
}

const stripe = new Stripe(secret, { typescript: false });

/** @type {Record<string, string>} */
const envUpdates = {};

function log(msg) {
  console.log(apply ? msg : `[dry-run] ${msg}`);
}

/**
 * @param {import('stripe').Stripe.Product} product
 * @param {import('./stripe-catalog-config.mjs').CatalogPrice} spec
 */
async function ensurePrice(product, spec) {
  const existing = (
    await stripe.prices.list({ product: product.id, active: true, limit: 100 })
  ).data.filter((p) => p.metadata?.ae_env_key === spec.envKey);

  const match = existing.find(
    (p) =>
      p.unit_amount === spec.unitAmountCents &&
      p.currency === "usd" &&
      p.recurring?.interval === (spec.cadence === "monthly" ? "month" : "year"),
  );

  if (match) {
    log(`  price OK  ${spec.envKey} → ${match.id} ($${spec.unitAmountCents / 100})`);
    envUpdates[spec.envKey] = match.id;
    return match.id;
  }

  const stale = existing.filter((p) => p.id !== match?.id);
  const nickname =
    spec.cadence === "monthly"
      ? `$${spec.unitAmountCents / 100}/mo list`
      : `$${spec.unitAmountCents / 100}/yr list`;

  if (!apply) {
    log(
      `  would create price ${spec.envKey} on ${product.name} — $${spec.unitAmountCents / 100} (${spec.cadence})`,
    );
    if (stale.length) log(`  would archive ${stale.length} stale price(s) for ${spec.envKey}`);
    envUpdates[spec.envKey] = `price_NEW_${spec.envKey}`;
    return null;
  }

  for (const p of stale) {
    await stripe.prices.update(p.id, { active: false });
    log(`  archived stale price ${p.id}`);
  }

  const created = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: spec.unitAmountCents,
    recurring: { interval: spec.cadence === "monthly" ? "month" : "year" },
    nickname,
    metadata: {
      ae_env_key: spec.envKey,
      ae_cadence: spec.cadence,
      ae_list_price: "true",
    },
  });

  log(`  created price ${spec.envKey} → ${created.id}`);
  envUpdates[spec.envKey] = created.id;
  return created.id;
}

/** @param {import('./stripe-catalog-config.mjs').CatalogProduct} spec */
async function ensureProduct(spec) {
  const listed = await stripe.products.list({ active: true, limit: 100 });
  let product = listed.data.find((p) => p.metadata?.ae_catalog_slug === spec.slug);

  if (!product) {
    product = listed.data.find((p) => p.name === spec.name);
  }

  if (!product) {
    if (!apply) {
      log(`would create product: ${spec.name}`);
      for (const priceSpec of spec.prices) {
        await ensurePrice({ id: "prod_NEW", name: spec.name }, priceSpec);
      }
      return;
    }

    product = await stripe.products.create({
      name: spec.name,
      description: spec.description,
      metadata: { ae_catalog_slug: spec.slug },
    });
    log(`created product ${product.name} → ${product.id}`);
  } else if (apply) {
    await stripe.products.update(product.id, {
      name: spec.name,
      description: spec.description,
      metadata: { ae_catalog_slug: spec.slug },
    });
    log(`product ${spec.slug} → ${product.id}`);
  } else {
    log(`product ${spec.slug} → ${product.id}`);
  }

  for (const priceSpec of spec.prices) {
    await ensurePrice(product, priceSpec);
  }
}

async function ensureFounderAliasProduct() {
  const spec = FOUNDER_ANNUAL_ALIAS;
  const listed = await stripe.products.list({ active: true, limit: 100 });
  let product = listed.data.find((p) => p.metadata?.ae_catalog_slug === spec.slug);
  if (!product) product = listed.data.find((p) => p.name === spec.name);

  if (!product && !apply) {
    log(`would ensure founder alias product: ${spec.name}`);
    await ensurePrice({ id: "prod_NEW", name: spec.name }, {
      envKey: spec.envKey,
      cadence: "annual",
      unitAmountCents: spec.unitAmountCents,
    });
    return;
  }

  if (!product && apply) {
    product = await stripe.products.create({
      name: spec.name,
      description: spec.description,
      metadata: { ae_catalog_slug: spec.slug },
    });
    log(`created product ${product.name} → ${product.id}`);
  } else if (product) {
    log(`founder alias product → ${product.id}`);
  }

  if (product) {
    await ensurePrice(product, {
      envKey: spec.envKey,
      cadence: "annual",
      unitAmountCents: spec.unitAmountCents,
    });
  }
}

async function ensurePromoCoupon() {
  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(PROMO_COUPON.id);
  } catch (err) {
    if (err?.code !== "resource_missing") throw err;
  }

  if (
    coupon &&
    coupon.percent_off === PROMO_COUPON.percentOff &&
    coupon.duration === PROMO_COUPON.duration &&
    coupon.valid
  ) {
    log(`coupon OK ${PROMO_COUPON.id} → ${coupon.id} (${coupon.percent_off}% off)`);
    envUpdates[PROMO_COUPON.envKey] = coupon.id;
    return;
  }

  if (!apply) {
    log(
      `would create coupon ${PROMO_COUPON.id} — ${PROMO_COUPON.percentOff}% off, duration ${PROMO_COUPON.duration}`,
    );
    envUpdates[PROMO_COUPON.envKey] = PROMO_COUPON.id;
    return;
  }

  if (coupon && !coupon.valid) {
    log(`warning: coupon ${PROMO_COUPON.id} exists but is invalid; create a new coupon id in config`);
  }

  const created = await stripe.coupons.create({
    id: PROMO_COUPON.id,
    name: PROMO_COUPON.name,
    percent_off: PROMO_COUPON.percentOff,
    duration: PROMO_COUPON.duration,
    metadata: { ae_promo: "founder_launch" },
  });

  log(`created coupon → ${created.id}`);
  envUpdates[PROMO_COUPON.envKey] = created.id;
}

async function main() {
  console.log(apply ? "Applying Stripe catalog sync…\n" : "Dry run — pass --apply to write to Stripe\n");

  for (const product of CATALOG_PRODUCTS) {
    await ensureProduct(product);
  }

  await ensureFounderAliasProduct();
  await ensurePromoCoupon();

  console.log("\n--- Paste into .env.local (if values changed) ---\n");
  for (const [key, value] of Object.entries(envUpdates)) {
    console.log(`${key}=${value}`);
  }
  console.log("\nThen restart `npm run dev` so checkout picks up new price IDs.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
