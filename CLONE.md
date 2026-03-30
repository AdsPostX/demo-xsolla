# Moments Checkout — Spin-Up Guide

**Time to demo-ready: ~10 minutes**

---

## Step 1 — Copy the template

```bash
cp -r _templates/moments-checkout demo-[partner]
```

Replace `[partner]` with the partner name (e.g. `demo-stubhub`).

---

## Step 2 — Fill in `demo.config.js`

Open `demo.config.js`. This is the **only file you need to edit**.

### Partner brand

```js
partner: {
  name:           "PARTNER NAME",    // Full name shown in header/footer
  namePrimary:    "PARTNER",         // Bold portion of text logo
  nameSecondary:  ".COM",            // Light portion of text logo

  logoType:       "text",            // "text" | "image"
  logoUrl:        "./assets/logo.png", // Only matters if logoType = "image"

  primaryColor:   "#000000",         // Nav bar background
  accentColor:    "#ff8c00",         // Status dot + highlights

  supportEmail:   "support@partner.com",
  supportPhone:   "800-000-0000",
  copyright:      "2026 Partner Inc.",
  pageTitle:      "Order Confirmation",
},
```

**Using a logo image?** Drop the file into `./assets/`, set `logoType: "image"`, and update `logoUrl`.

### Order details (demo data)

```js
order: {
  orderNumber:   "#12345678",
  customerName:  "Jane Smith",
  email:         "jane@example.com",
  address:       "123 Main Street, Los Angeles CA 90001",
  zipcode:       "90001",

  itemName:      "Los Angeles Dodgers vs. San Francisco Giants",
  itemDate:      "April 15, 2026 7:10 PM",
  itemVenue:     "Dodger Stadium - Los Angeles, CA",
  itemSection:   "Field Level, Section 28",
  itemRow:       "Row C",
  itemQuantity:  2,
  itemTotal:     "$248.50",
  itemDelivery:  "Mobile Transfer",

  payment:       "Visa •••• •••• •••• 4242",
},
```

### MomentScience SDK

```js
momentscience: {
  accountId:  "YOUR_ACCOUNT_ID",     // Get from your MS dashboard
  placement:  "order_confirmation",
  maxOffers:  3,
  devMode:    false,                 // true = local testing only (no tracking, all offers)
  cdnUrl:     "https://cdn-staging.pubtailer.com/launcher.js",
  // Production: "https://cdn.pubtailer.com/launcher.js"
},
```

> **devMode warning:** `devMode: false` is the default. Only set `true` when testing locally — it disables tracking and forces all offers to return regardless of targeting. Never demo with `devMode: true` on a live account.

---

## Step 3 — Open in browser

Just double-click `index.html` or serve locally:

```bash
cd demo-[partner]
python3 -m http.server 8080
# open http://localhost:8080
```

---

## Step 4 — Toggle modal vs embedded

- Default view: `?mode=modal` (overlay)
- Embedded unit: `?mode=embed` (inline below confirmation)
- Use the toggle buttons in the nav bar during the demo

---

## Step 5 — Go live checklist

Before demoing (local or deployed):

- [ ] `devMode: false`
- [ ] `cdnUrl` set to production CDN
- [ ] `accountId` confirmed for the correct partner environment
- [ ] Order details look realistic for the partner's industry
- [ ] Tested in the same browser you'll use for the demo

**To deploy to a live URL:** see [`DEPLOY.md`](../_templates/../DEPLOY.md) for the Render + Cloudflare setup.

---

## Quick Claude prompt

Paste this into Claude Cowork to auto-populate the config from a partner's website:

```
I'm building a demo for [PARTNER NAME] using the moments-checkout template.
Their website is [URL].

Extract their brand from the site and fill in demo.config.js:
- primaryColor and accentColor from their visual brand
- namePrimary / nameSecondary matching their logo text style
- supportEmail and supportPhone if visible on site
- copyright text matching their footer

Make up realistic order details for their core product category
(tickets, travel, e-commerce, etc.) — something that would look
natural in a live sales demo.

Output the complete updated demo.config.js.
```
