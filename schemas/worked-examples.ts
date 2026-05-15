import type { CampaignBundleInput } from "./index";

// Synthetic worked examples matching spec section 18 (EX01-EX08).
// All data is artificial: no actual brands, no real T&C, no consumer account data.

export const workedExamples: Record<
  string,
  { id: string; publicLabel: string; bundle: CampaignBundleInput }
> = {
  EX01: {
    id: "EX01",
    publicLabel: "Welcome Bonus Audit – bundle mismatch",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Welcome bonus audit",
        operatorLabel: "Northstar Sandbox",
        promoType: "welcome",
        geo: "MGA generic",
        locale: "en-GB",
        currency: "EUR",
        launchDate: "2026-05-10",
        channelsIncluded: ["email", "push", "landing"]
      },
      offer: {
        minDeposit: 50,
        bonusPercentage: 50,
        maxBonus: 300,
        wageringRequirement: "35x bonus",
        maxCashout: 1000
        // intentionally missing maxBet → offer_math_sanity WARN
      },
      termsText:
        "Synthetic terms: 50% reload up to 300 EUR, eligible users only, 35x wagering on bonus, max cashout 1000 EUR, eligible games listed, contribution rules listed, one per household/IP/payment, once per week, valid until 10 June 2026. 18+. Responsible use wording included.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          // intentionally says 100% / 500 EUR → conflicts with offer 50% / 300 EUR
          text: "Welcome bonus: 100% up to 500 EUR"
        },
        {
          channel: "push",
          fieldName: "title",
          text: "Reload bonus"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/promo?utm_source=email&utm_medium=crm&utm_campaign=reload_may",
          expectedDomain: "example.com",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX02: {
    id: "EX02",
    publicLabel: "Welcome Bonus Terms Sweep – missing max bet",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Welcome terms sweep",
        operatorLabel: "Cinder Room Synthetic",
        promoType: "welcome",
        geo: "Curacao generic",
        locale: "en",
        currency: "USD",
        launchDate: "2026-05-15",
        channelsIncluded: ["email", "landing"]
      },
      offer: {
        minDeposit: 20,
        bonusPercentage: 100,
        maxBonus: 500,
        wageringRequirement: "35x bonus",
        maxCashout: 2000
        // intentionally no maxBet → terms_robustness FAIL
      },
      // intentionally minimal terms — missing max bet, wagering clause, max cashout phrase
      termsText:
        "100% welcome bonus up to 500 USD. Eligible new users only. Valid until 30 June 2026. 18+. Responsible use.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "Welcome: 100% up to 500 USD"
        },
        {
          channel: "landing",
          fieldName: "hero",
          text: "Double your first deposit up to 500 USD"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/welcome?utm_source=email&utm_medium=crm&utm_campaign=welcome",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX03: {
    id: "EX03",
    publicLabel: "Cashback Reconciliation – math contradiction",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Cashback reconciliation",
        operatorLabel: "Harbor Vault Demo",
        promoType: "cashback",
        geo: "generic",
        locale: "en",
        currency: "EUR",
        launchDate: "2026-06-01",
        channelsIncluded: ["email", "push"]
      },
      offer: {
        bonusAmount: 200,
        maxBonus: 200,
        maxCashout: 100, // intentionally lower than maxBonus → offer_math_sanity FAIL
        wageringRequirement: "20x bonus",
        maxBet: 5
      },
      // "wagering applies" without "bonus only" → vague wagering → additional WARN
      termsText:
        "200 EUR cashback bonus. Wagering applies. Valid until 30 June 2026. Eligible users only. 18+. Responsible use. Once per week.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "Claim your 200 EUR cashback"
        },
        {
          channel: "push",
          fieldName: "body",
          text: "Cashback bonus ready"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/cashback?utm_source=email&utm_medium=crm&utm_campaign=cashback_june",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX04: {
    id: "EX04",
    publicLabel: "UK Freebet Copy Review – jurisdiction copy risk",
    bundle: {
      metadata: {
        campaignName: "CRM QA - UK freebet copy review",
        operatorLabel: "Slate Harbor Sandbox",
        promoType: "freebet",
        geo: "UKGC-like",
        locale: "en-GB",
        currency: "GBP",
        launchDate: "2026-05-20",
        channelsIncluded: ["email", "landing"]
      },
      offer: {
        minDeposit: 10,
        bonusAmount: 10,
        maxBonus: 10,
        maxCashout: 50
      },
      // intentionally no RG wording → jurisdictional_risk_signals FAIL
      termsText:
        "10 GBP freebet. Eligible new users only. Valid until 30 June 2026. Min deposit 10 GBP.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "Your guaranteed freebet is waiting"
        },
        {
          channel: "landing",
          fieldName: "hero",
          // "guaranteed outcome" → jurisdictional_risk_signals FAIL
          text: "Guaranteed outcome. Claim your 10 GBP freebet today!"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/freebet?utm_source=email&utm_medium=crm&utm_campaign=freebet_uk",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX05: {
    id: "EX05",
    publicLabel: "Brazil Reactivation – locale mismatch",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Brazil reactivation",
        operatorLabel: "Aurora Desk Synthetic",
        promoType: "reactivation",
        geo: "Brazil",
        locale: "pt-BR",
        currency: "EUR", // intentionally EUR for pt-BR → localization_qa FAIL
        launchDate: "2026-05-25",
        channelsIncluded: ["push", "email"]
      },
      offer: {
        minDeposit: 20,
        bonusPercentage: 50,
        maxBonus: 100,
        wageringRequirement: "30x bonus",
        maxBet: 5
      },
      termsText:
        "50% reload up to 100 EUR. Eligible users only. 30x wagering on bonus. Max bet 5 EUR. Max cashout 500 EUR. One per household/IP/payment. Valid until 30 June 2026. 18+. Responsible use.",
      assets: [
        {
          channel: "push",
          // English copy for pt-BR locale, EUR for Brazil, ambiguous date 05/06
          fieldName: "body",
          text: "Claim today, valid until 05/06"
        },
        {
          channel: "email",
          fieldName: "subject",
          text: "Reload bonus – valid until 06/05"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/reactivation?utm_source=push&utm_medium=crm&utm_campaign=react_br",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX06: {
    id: "EX06",
    publicLabel: "VIP Reload Approval Gate – missing owners",
    bundle: {
      metadata: {
        campaignName: "CRM QA - VIP reload approval gate",
        operatorLabel: "Signal Ridge Demo",
        promoType: "reload",
        geo: "generic",
        locale: "en",
        currency: "USD",
        launchDate: "2026-06-05",
        channelsIncluded: ["email", "onsite"]
      },
      offer: {
        minDeposit: 100,
        bonusPercentage: 25,
        maxBonus: 250,
        wageringRequirement: "25x bonus",
        maxBet: 10,
        maxCashout: 500
      },
      termsText:
        "25% VIP reload up to 250 USD. Min deposit 100 USD. 25x wagering on bonus. Max bet 10 USD. Max cashout 500 USD. One per household/IP/payment. Eligible VIP users only. Valid until 30 June 2026. 18+. Responsible use.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "VIP reload review: 25% up to 250 USD"
        },
        {
          channel: "onsite",
          fieldName: "banner",
          text: "VIP reload flagged for approval"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/vip-reload?utm_source=email&utm_medium=crm&utm_campaign=vip_reload_review",
          requiresUtm: true
        }
      ],
      // intentionally only product owner → missing legal, risk, analytics → launch_ownership FAIL
      owners: [
        { role: "product", name: "Product owner", status: "pending" }
      ]
    }
  },

  EX07: {
    id: "EX07",
    publicLabel: "Weekend Tournament QA – link tracking issue",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Weekend tournament QA",
        operatorLabel: "Blue Mesa Synthetic",
        promoType: "tournament",
        geo: "MGA generic",
        locale: "en",
        currency: "EUR",
        launchDate: "2026-05-12",
        channelsIncluded: ["email", "push", "landing"]
      },
      offer: {
        bonusAmount: 500,
        maxBonus: 500,
        maxCashout: 1000
      },
      termsText:
        "Tournament prize pool 500 EUR. Top 10 players win. Valid 9-12 May 2026. Eligible users. One per household/IP/payment. 18+. Responsible use.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "Join the May tournament"
        },
        {
          channel: "landing",
          fieldName: "hero",
          text: "Compete for the 500 EUR prize pool"
        }
      ],
      links: [
        {
          label: "CTA",
          // intentionally invalid URL — no scheme → link_qa FAIL
          url: "promo-tournament-may-no-scheme",
          requiresUtm: true
        },
        {
          label: "Deep link",
          // valid format but different domain from landing → mismatch warning
          url: "https://app.other-example.com/tournament",
          expectedDomain: "example.com",
          requiresUtm: false
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX08: {
    id: "EX08",
    publicLabel: "Weekend Free Spins Push – format overflow",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Weekend free spins push",
        operatorLabel: "Ember Coast Demo",
        promoType: "welcome",
        geo: "generic",
        locale: "en",
        currency: "EUR",
        launchDate: "2026-05-18",
        channelsIncluded: ["email", "push"]
      },
      offer: {
        minDeposit: 10,
        bonusPercentage: 100,
        maxBonus: 200,
        wageringRequirement: "30x bonus",
        maxBet: 5,
        maxCashout: 400
      },
      termsText:
        "100% welcome bonus up to 200 EUR. 30x wagering on bonus. Max bet 5 EUR. Max cashout 400 EUR. One per household/IP/payment. Eligible new users only. Valid until 30 June 2026. 18+. Responsible use.",
      assets: [
        {
          channel: "push",
          fieldName: "title",
          // intentionally exceeds the 55-char hard limit threshold → format_qa FAIL
          text: "Weekend free spins push: 100% up to 200 EUR, launch window closes at midnight"
        },
        {
          channel: "email",
          fieldName: "subject",
          // 67 chars — soft limit 50, hard limit 78 → LOW (at soft limit)
          text: "Welcome to the platform: claim your 100% bonus up to 200 EUR today"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/welcome?utm_source=email&utm_medium=crm&utm_campaign=welcome_format",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX09: {
    id: "EX09",
    publicLabel: "Brazil Welcome Audit - domain rules",
    bundle: {
      metadata: {
        campaignName: "CRM QA - Brazil welcome audit",
        operatorLabel: "Lumen Bay Synthetic",
        promoType: "welcome",
        geo: "BR",
        locale: "pt-BR",
        currency: "BRL",
        launchDate: "2026-06-10",
        channelsIncluded: ["email", "landing"]
      },
      offer: {
        minDeposit: 30,
        bonusPercentage: 100,
        maxBonus: 300,
        wageringRequirement: "35x bonus",
        maxCashout: 900
      },
      termsText:
        "Termos sinteticos BR: 100% ate 300 BRL. Deposito minimo 30 BRL. 35x wagering on bonus. Eligible new users only. Valid until 30 June 2026.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "Oferta de boas-vindas: 100% ate 300 BRL"
        },
        {
          channel: "landing",
          fieldName: "hero",
          text: "Oferta de boas-vindas hoje"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/br-welcome?utm_source=email&utm_medium=crm&utm_campaign=br_welcome",
          expectedDomain: "example.com",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX10: {
    id: "EX10",
    publicLabel: "EU Free Spins Audit - domain rules",
    bundle: {
      metadata: {
        campaignName: "CRM QA - EU free spins audit",
        operatorLabel: "Granite Field Demo",
        promoType: "welcome",
        geo: "EU",
        locale: "en",
        currency: "EUR",
        launchDate: "2026-06-12",
        channelsIncluded: ["email", "landing"]
      },
      offer: {
        minDeposit: 20,
        bonusAmount: 50,
        wageringRequirement: "20x bonus",
        maxBet: 2,
        maxCashout: 200
      },
      termsText:
        "Synthetic EU free spins terms: receive 50 free spins after minimum deposit 20 EUR. Wagering 20x bonus. Max bet 2 EUR. Max cashout 200 EUR. Valid until 30 June 2026. Responsible use.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "50 free spins after deposit"
        },
        {
          channel: "landing",
          fieldName: "hero",
          text: "Free spins welcome offer"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/eu-free-spins?utm_source=email&utm_medium=crm&utm_campaign=eu_free_spins",
          expectedDomain: "example.com",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  },

  EX11: {
    id: "EX11",
    publicLabel: "VIP Cashback Audit - domain rules",
    bundle: {
      metadata: {
        campaignName: "CRM QA - VIP cashback audit",
        operatorLabel: "Iron Vale Sandbox",
        promoType: "cashback",
        geo: "CIS",
        locale: "en",
        currency: "USD",
        launchDate: "2026-06-14",
        channelsIncluded: ["email", "push", "landing"]
      },
      offer: {
        bonusPercentage: 10,
        maxBonus: 100,
        maxCashout: 300,
        wageringRequirement: "10x bonus",
        maxBet: 5
      },
      termsText:
        "Synthetic CIS VIP cashback terms: VIP cashback is 10% up to 100 USD. Wagering 10x bonus. Max bet 5 USD. Max cashout 300 USD. Valid until 30 June 2026. 18+. Responsible use.",
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "VIP cashback: 20% this week"
        },
        {
          channel: "push",
          fieldName: "body",
          text: "VIP cashback ready"
        },
        {
          channel: "landing",
          fieldName: "hero",
          text: "VIP cashback audit"
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/cis-vip-cashback?utm_source=email&utm_medium=crm&utm_campaign=cis_vip_cashback",
          expectedDomain: "example.com",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "product", name: "Product owner", status: "approved" },
        { role: "crm", name: "CRM owner", status: "approved" },
        { role: "legal", name: "Legal owner", status: "approved" },
        { role: "risk", name: "Risk owner", status: "approved" },
        { role: "localization", name: "Localization owner", status: "approved" },
        { role: "analytics", name: "Analytics owner", status: "approved" }
      ]
    }
  }
};
