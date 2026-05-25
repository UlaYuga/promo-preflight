alter table runs
  add column if not exists policy_rule_versions_json jsonb not null default '{"paymentCompatibility":1,"cryptoDisclosure":1,"jurisdictionalRisk":1}'::jsonb;

update idempotency_keys
set response_snapshot = jsonb_set(
  response_snapshot,
  '{policyRuleVersions}',
  '{"paymentCompatibility":1,"cryptoDisclosure":1,"jurisdictionalRisk":1}'::jsonb,
  true
)
where status = 'completed'
  and not response_snapshot ? 'policyRuleVersions';
