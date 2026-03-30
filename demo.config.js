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
    email:          "player@example.com",
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
  // MOMENTSCIENCE SDK
  // ---------------------------------------------------------------------------
  momentscience: {
    accountId:    "6e2e1fc0dd47d6e4",         // Your MS account ID
    placement:    "order_confirmation",         // Placement identifier
    maxOffers:    3,                            // Max offers to show
    devMode:      true,                         // true = no tracking, all offers returned (local testing only)
    cdnUrl:       "https://cdn-staging.pubtailer.com/launcher.js",
    // Production CDN: "https://cdn.pubtailer.com/launcher.js"
  },

};
