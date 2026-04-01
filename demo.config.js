// =============================================================================
// DEMO CONFIG — THE ONLY FILE YOU NEED TO EDIT
// =============================================================================
// Fill this in before opening the demo. Everything else reads from here.

window.DEMO_CONFIG = {

  // ---------------------------------------------------------------------------
  // PARTNER BRAND
  // ---------------------------------------------------------------------------
  partner: {
    name:           "Hero Wars",          // Displayed in header + footer
    namePrimary:    "Hero",               // Bold part of logo text
    nameSecondary:  " Wars",              // Light part of logo text

    // Use "text" for text-based logos (above), "image" to use a logo file
    logoType:       "text",               // "text" | "image"
    logoUrl:        "./assets/logo.png",  // Only used if logoType = "image"

    primaryColor:   "#1a1208",            // Dark game UI brown (matches Hero Wars aesthetic)
    accentColor:    "#f5a623",            // Gold — matches Hero Wars' star/gem UI

    supportEmail:   "support@hero-wars.com",
    supportPhone:   "",
    copyright:      "2026 Nexters Global Ltd.",

    // Browser tab title
    pageTitle:      "Payment Successful",
  },

  // ---------------------------------------------------------------------------
  // ORDER DETAILS (demo data shown on the confirmation page)
  // ---------------------------------------------------------------------------
  order: {
    orderNumber:    "#1978322789",
    customerName:   "Alex",
    email:          "player@gmail.com",
    address:        "",
    zipcode:        "90210",

    // What was purchased (in-game bundle)
    itemName:       "Great Power Bundle",
    itemDate:       "March 28, 2026",
    itemVenue:      "",
    itemSection:    "",
    itemRow:        "",
    itemQuantity:   1,
    itemTotal:      "US$1.49",
    itemDelivery:   "Instant delivery to your account",

    payment:        "Google Pay",
  },

  // ---------------------------------------------------------------------------
  // MOMENTSCIENCE — REST API (MomentPerks API)
  // ---------------------------------------------------------------------------
  // API key: Dashboard → Profile Settings → API Keys → "Ads/Offers" permission
  // Uses direct POST to https://api.adspostx.com/native/v2/offers.json
  momentscience: {
    apiKey:    "fd49c407-3adb-4982-91ce-d0a37bcdc1f5",  // PerksWallet-enabled key
    placement: "order_confirmation",
    maxOffers: 3,
    devMode:   false,               // false = live offers, impression tracking enabled
  },

};
