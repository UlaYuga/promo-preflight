insert into check_definitions (
  check_id,
  public_name,
  description,
  core_value,
  enabled
) values
  (
    'channel_consistency',
    'Channel consistency',
    'Compares campaign channels and terms excerpts for conflicting amounts, timing, eligibility, currency, CTA, and offer claims.',
    true,
    true
  ),
  (
    'terms_robustness',
    'Terms robustness',
    'Checks whether required terms are present and clear, including limits, eligibility, expiry, contribution, cooldown, and responsible-use wording.',
    true,
    true
  ),
  (
    'offer_math_sanity',
    'Offer math sanity',
    'Checks numeric offer logic such as minimum deposit, percentage, maximum bonus, turnover burden, maximum cashout, and maximum bet.',
    true,
    true
  ),
  (
    'jurisdictional_risk_signals',
    'Jurisdictional risk signals',
    'Reviews geography and locale risk signals, including unsafe claims, age or responsible-use wording, and region-specific cautions.',
    true,
    true
  ),
  (
    'localization_qa',
    'Localization QA',
    'Checks language, currency, date and time format, decimal separators, local payment mentions, and country terminology.',
    true,
    true
  ),
  (
    'launch_ownership',
    'Launch ownership',
    'Checks owner coverage and sign-off readiness across Product, CRM, Legal, Risk, Localization, and Analytics.',
    true,
    true
  ),
  (
    'link_qa',
    'Link QA',
    'Checks CTA, landing, and deep links for valid URL shape, safe scheme, expected domain, and required tracking metadata.',
    true,
    true
  ),
  (
    'format_qa',
    'Format QA',
    'Checks channel length and format limits for push, email, SMS, CTA labels, and banner text.',
    true,
    true
  )
on conflict (check_id) do update set
  public_name = excluded.public_name,
  description = excluded.description,
  core_value = excluded.core_value,
  enabled = excluded.enabled;

insert into worked_examples (
  id,
  public_label,
  pattern_note,
  promo_type,
  geo,
  locale,
  bundle,
  expected_results
) values
  (
    'EX01',
    'Operator A - Reload bundle mismatch',
    'public reload/freebet promo pattern',
    'reload',
    'MGA generic',
    'en-GB',
    $json$
    {
      "metadata": {
        "campaignName": "Operator A Reload May",
        "operatorLabel": "Operator A",
        "promoType": "reload",
        "geo": "MGA generic",
        "locale": "en-GB",
        "currency": "EUR",
        "launchDate": "2026-05-10",
        "channelsIncluded": ["email", "push", "onsite", "landing"]
      },
      "offer": {
        "minDeposit": 50,
        "bonusPercentage": 50,
        "maxBonus": 300,
        "wageringRequirement": "35x bonus",
        "maxCashout": 1000,
        "maxBet": 5
      },
      "assets": [
        {
          "channel": "email",
          "fieldName": "subject",
          "text": "Operator A reload: 100% up to 500 EUR"
        },
        {
          "channel": "landing",
          "fieldName": "hero",
          "text": "Reload offer details: 50% up to 300 EUR"
        }
      ],
      "links": [
        {
          "label": "Landing CTA",
          "url": "https://promo.example/operator-a/reload?utm_source=email&utm_medium=crm&utm_campaign=operator_a_reload",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "product",
          "name": "Product owner",
          "status": "pending"
        },
        {
          "role": "legal",
          "name": "Legal owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: reload award is 50% up to 300 EUR; 35x bonus requirement; maximum action amount 5 EUR; valid for seven days.",
      "notes": "Synthetic rewritten demo bundle. Store only compact excerpts."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "channel_consistency",
          "status": "FAIL",
          "severity": "HIGH"
        },
        {
          "checkId": "offer_math_sanity",
          "status": "WARN",
          "severity": "MEDIUM"
        }
      ],
      "readinessBlockerRoles": ["product", "legal"]
    }
    $json$::jsonb
  ),
  (
    'EX02',
    'Operator B - Missing max bet',
    'welcome bonus terms pattern',
    'welcome',
    'Curacao generic',
    'en',
    $json$
    {
      "metadata": {
        "campaignName": "Operator B Welcome Review",
        "operatorLabel": "Operator B",
        "promoType": "welcome",
        "geo": "Curacao generic",
        "locale": "en",
        "currency": "EUR",
        "launchDate": "2026-05-11",
        "channelsIncluded": ["email", "landing"]
      },
      "offer": {
        "minDeposit": 20,
        "bonusPercentage": 100,
        "maxBonus": 200,
        "wageringRequirement": "30x bonus",
        "maxCashout": 800,
        "eligibilityRules": "New accounts only."
      },
      "assets": [
        {
          "channel": "landing",
          "fieldName": "terms_summary",
          "text": "Synthetic summary lists eligibility and expiry but omits maximum action amount and household/payment restriction."
        }
      ],
      "links": [
        {
          "label": "Terms page",
          "url": "https://promo.example/operator-b/welcome?utm_source=landing&utm_medium=owned&utm_campaign=operator_b_welcome",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "product",
          "name": "Product owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: 100% up to 200 EUR; 30x bonus requirement; expires in 14 days; no maximum action amount stated; no one-per-household/IP/payment clause stated."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "terms_robustness",
          "status": "FAIL",
          "severity": "HIGH"
        }
      ],
      "readinessBlockerRoles": ["risk", "legal"]
    }
    $json$::jsonb
  ),
  (
    'EX03',
    'Operator C - Math burden issue',
    'cashback/wagering pattern',
    'cashback',
    'generic',
    'en',
    $json$
    {
      "metadata": {
        "campaignName": "Operator C Cashback Math",
        "operatorLabel": "Operator C",
        "promoType": "cashback",
        "geo": "generic",
        "locale": "en",
        "currency": "EUR",
        "launchDate": "2026-05-12",
        "channelsIncluded": ["email", "landing"]
      },
      "offer": {
        "minDeposit": 100,
        "bonusAmount": 150,
        "maxBonus": 150,
        "wageringRequirement": "35x deposit plus award",
        "maxCashout": 100,
        "maxBet": 4
      },
      "assets": [
        {
          "channel": "email",
          "fieldName": "body",
          "text": "Synthetic copy says the award can be used after meeting the requirement."
        }
      ],
      "links": [],
      "owners": [
        {
          "role": "product",
          "name": "Product owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: 150 EUR award; maximum cashout 100 EUR; requirement base says deposit plus award in one sentence and award only in another."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "offer_math_sanity",
          "status": "FAIL",
          "severity": "HIGH"
        }
      ],
      "readinessBlockerRoles": ["product"]
    }
    $json$::jsonb
  ),
  (
    'EX04',
    'Operator D - Jurisdiction copy risk',
    'regulated promo pattern',
    'freebet',
    'UKGC-like',
    'en-GB',
    $json$
    {
      "metadata": {
        "campaignName": "Operator D Regulated Copy Review",
        "operatorLabel": "Operator D",
        "promoType": "freebet",
        "geo": "UKGC-like",
        "locale": "en-GB",
        "currency": "GBP",
        "launchDate": "2026-05-13",
        "channelsIncluded": ["push", "landing"]
      },
      "offer": {
        "bonusAmount": 20,
        "maxBonus": 20,
        "wageringRequirement": "None"
      },
      "assets": [
        {
          "channel": "push",
          "fieldName": "body",
          "text": "Guaranteed win wording appears in this synthetic review copy."
        },
        {
          "channel": "landing",
          "fieldName": "disclaimer",
          "text": "Synthetic landing excerpt omits age and responsible-use wording."
        }
      ],
      "links": [
        {
          "label": "Landing CTA",
          "url": "https://promo.example/operator-d/reg-copy?utm_source=push&utm_medium=crm&utm_campaign=operator_d_copy",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "legal",
          "name": "Legal owner",
          "status": "pending"
        },
        {
          "role": "risk",
          "name": "Risk owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: short regulated-market review text; no age gate wording; no responsible-use statement included."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "jurisdictional_risk_signals",
          "status": "FAIL",
          "severity": "CRITICAL"
        }
      ],
      "readinessBlockerRoles": ["legal", "risk"]
    }
    $json$::jsonb
  ),
  (
    'EX05',
    'Operator E - Localization mismatch',
    'Brazil launch pattern',
    'reactivation',
    'Brazil',
    'pt-BR',
    $json$
    {
      "metadata": {
        "campaignName": "Operator E Brazil Reactivation",
        "operatorLabel": "Operator E",
        "promoType": "reactivation",
        "geo": "Brazil",
        "locale": "pt-BR",
        "currency": "BRL",
        "launchDate": "2026-05-14",
        "channelsIncluded": ["email", "push", "landing"]
      },
      "offer": {
        "minDeposit": 50,
        "bonusPercentage": 25,
        "maxBonus": 100,
        "wageringRequirement": "10x award",
        "maxBet": 5
      },
      "assets": [
        {
          "channel": "email",
          "fieldName": "subject",
          "text": "Operator E reactivation offer for June 05"
        },
        {
          "channel": "push",
          "fieldName": "body",
          "text": "English copy with EUR amount for a pt-BR campaign."
        },
        {
          "channel": "landing",
          "fieldName": "hero",
          "text": "Synthetic landing shows 05/06 and EUR 100 while metadata expects BRL and pt-BR."
        }
      ],
      "links": [
        {
          "label": "Landing CTA",
          "url": "https://promo.example/operator-e/br-reactivation?utm_source=email&utm_medium=crm&utm_campaign=operator_e_br",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "localization",
          "name": "Localization owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: campaign metadata is Brazil and pt-BR; the visible review excerpts remain English and include EUR plus ambiguous US-style date."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "localization_qa",
          "status": "FAIL",
          "severity": "HIGH"
        }
      ],
      "readinessBlockerRoles": ["localization"]
    }
    $json$::jsonb
  ),
  (
    'EX06',
    'Operator F - Missing owners',
    'promo calendar handoff pattern',
    'loyalty',
    'generic',
    'en',
    $json$
    {
      "metadata": {
        "campaignName": "Operator F Loyalty Handoff",
        "operatorLabel": "Operator F",
        "promoType": "loyalty",
        "geo": "generic",
        "locale": "en",
        "currency": "EUR",
        "launchDate": "2026-05-15",
        "channelsIncluded": ["email", "onsite"]
      },
      "offer": {
        "bonusAmount": 25,
        "maxBonus": 25,
        "wageringRequirement": "None"
      },
      "assets": [
        {
          "channel": "onsite",
          "fieldName": "banner",
          "text": "Synthetic internal campaign banner copy for review."
        }
      ],
      "links": [
        {
          "label": "Analytics landing",
          "url": "https://promo.example/operator-f/loyalty?utm_source=onsite&utm_medium=owned&utm_campaign=operator_f_loyalty",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "product",
          "name": "Product owner",
          "status": "pending"
        },
        {
          "role": "crm",
          "name": "CRM owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: concise loyalty campaign rules with no Legal, Risk, or Analytics owner recorded in the handoff."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "launch_ownership",
          "status": "FAIL",
          "severity": "HIGH"
        }
      ],
      "readinessBlockerRoles": ["legal", "risk", "analytics"]
    }
    $json$::jsonb
  ),
  (
    'EX07',
    'Operator G - Link tracking issue',
    'multi-channel campaign pattern',
    'tournament',
    'MGA generic',
    'en',
    $json$
    {
      "metadata": {
        "campaignName": "Operator G Link QA",
        "operatorLabel": "Operator G",
        "promoType": "tournament",
        "geo": "MGA generic",
        "locale": "en",
        "currency": "EUR",
        "launchDate": "2026-05-16",
        "channelsIncluded": ["email", "push", "landing"]
      },
      "offer": {
        "bonusAmount": 0,
        "wageringRequirement": "None"
      },
      "assets": [
        {
          "channel": "email",
          "fieldName": "cta",
          "text": "Synthetic CTA label for link review."
        }
      ],
      "links": [
        {
          "label": "Email CTA",
          "url": "promo.example/operator-g",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        },
        {
          "label": "Deep link",
          "url": "https://deep.example/operator-g",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "crm",
          "name": "CRM owner",
          "status": "pending"
        },
        {
          "role": "analytics",
          "name": "Analytics owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: link review example; primary CTA lacks a valid absolute URL and tracking metadata; deep link domain differs from expected landing domain."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "link_qa",
          "status": "FAIL",
          "severity": "HIGH"
        }
      ],
      "readinessBlockerRoles": ["crm", "analytics"]
    }
    $json$::jsonb
  ),
  (
    'EX08',
    'Operator H - Format overflow',
    'push/email pattern',
    'welcome',
    'generic',
    'en',
    $json$
    {
      "metadata": {
        "campaignName": "Operator H Format QA",
        "operatorLabel": "Operator H",
        "promoType": "welcome",
        "geo": "generic",
        "locale": "en",
        "currency": "EUR",
        "launchDate": "2026-05-17",
        "channelsIncluded": ["email", "push"]
      },
      "offer": {
        "minDeposit": 10,
        "bonusPercentage": 50,
        "maxBonus": 100,
        "wageringRequirement": "20x award",
        "maxBet": 5
      },
      "assets": [
        {
          "channel": "push",
          "fieldName": "title",
          "text": "Operator H welcome campaign update with very long mobile push title.",
          "softLimit": 40,
          "hardLimit": 56
        },
        {
          "channel": "email",
          "fieldName": "subject",
          "text": "Operator H welcome campaign subject requires CRM review before launch now",
          "softLimit": 50,
          "hardLimit": 70
        }
      ],
      "links": [
        {
          "label": "Email CTA",
          "url": "https://promo.example/operator-h/welcome?utm_source=email&utm_medium=crm&utm_campaign=operator_h_format",
          "expectedDomain": "promo.example",
          "requiresUtm": true
        }
      ],
      "owners": [
        {
          "role": "crm",
          "name": "CRM owner",
          "status": "pending"
        }
      ],
      "termsText": "Synthetic terms excerpt: format QA example only; short rewritten terms summary retained without long source text."
    }
    $json$::jsonb,
    $json$
    {
      "expectedChecks": [
        {
          "checkId": "format_qa",
          "status": "FAIL",
          "severity": "MEDIUM"
        },
        {
          "checkId": "format_qa",
          "status": "WARN",
          "severity": "LOW"
        }
      ],
      "readinessBlockerRoles": ["crm"]
    }
    $json$::jsonb
  )
on conflict (id) do update set
  public_label = excluded.public_label,
  pattern_note = excluded.pattern_note,
  promo_type = excluded.promo_type,
  geo = excluded.geo,
  locale = excluded.locale,
  bundle = excluded.bundle,
  expected_results = excluded.expected_results;
