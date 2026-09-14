import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotEnv(path.join(__dirname, '.env'));

const EXPERIMENT_ID = 'LB-EXP-001';
const provider = mustEnv('LB_PROVIDER');
const endpoint = mustEnv('LB_MODEL_ENDPOINT');
const apiKey = mustEnv('LB_API_KEY');
const modelName = process.env.LB_MODEL_NAME || 'UNSPECIFIED';
const architectureLabel = process.env.LB_ARCHITECTURE_LABEL || 'PRE-FRONTIER-BASELINE';

if (!['azure-openai-chat', 'openai-compatible-chat'].includes(provider)) {
  throw new Error(`Unsupported LB_PROVIDER: ${provider}`);
}

const inputPath = path.join(__dirname, 'input.md');
const doctrinePath = path.join(__dirname, 'doctrine.md');
const input = fs.readFileSync(inputPath, 'utf8');
const doctrine = fs.readFileSync(doctrinePath, 'utf8');

const runId = `${EXPERIMENT_ID}-${utcStamp()}`;
const runDir = path.join(__dirname, 'runs', runId);
if (fs.existsSync(runDir)) {
  throw new Error(`Refusing to overwrite existing run directory: ${runDir}`);
}
fs.mkdirSync(runDir, { recursive: true });

const startedAt = new Date().toISOString();

const commonContext = `You are executing a controlled Lightbringer constitutional reasoning experiment for Aetomic LLC (Singapore).

This is not a marketing-writing task. Preserve material uncertainty, disagreement, contradictions, authority constraints and unresolved issues. Do not claim consciousness, legal personhood or independent moral agency. Do not invent facts, sources, approvals or evidence.

QUESTION AND EXPERIMENT INSTRUCTION:
${input}

SOURCE DOCTRINE:
${doctrine}`;

const proposition = await callModel([
  { role: 'system', content: commonContext },
  {
    role: 'user',
    content: `STAGE 1 — PROPOSITION\n\nDerive candidate operating principles from the supplied doctrine and question. Do not write a polished manifesto yet. For each principle include: principle, rationale, source basis, assumptions, unknowns, exceptions or failure conditions. Make tensions visible rather than forcing consensus.`
  }
]);

const challenge = await callModel([
  { role: 'system', content: commonContext },
  {
    role: 'user',
    content: `STAGE 2 — ADVERSARIAL CHALLENGE\n\nAttempt to invalidate, qualify or materially improve the candidate propositions below. Identify unsafe absolutes, unsupported assumptions, hidden authority claims, contradictions, ambiguous language, missing evidence, harmful edge cases and circumstances in which a principle could fail. For each challenged item conclude KEEP, AMEND or REJECT and explain why.\n\nCANDIDATE PROPOSITIONS:\n${proposition}`
  }
]);

const assurance = await callModel([
  { role: 'system', content: commonContext },
  {
    role: 'user',
    content: `STAGE 3 — ASSURANCE\n\nAssess the propositions and adversarial challenge against these governance dimensions: evidence integrity, uncertainty visibility, authority validity, human accountability, proportionality, capability boundaries, escalation logic, auditability, harm constraints and internal consistency. Use PASS, FAIL, CONDITIONAL or NOT_APPLICABLE where useful. Do not merely summarise. Identify which principles cannot proceed unchanged.\n\nPROPOSITIONS:\n${proposition}\n\nADVERSARIAL CHALLENGE:\n${challenge}`
  }
]);

const reconciliation = await callModel([
  { role: 'system', content: commonContext },
  {
    role: 'user',
    content: `STAGE 4 — RECONCILIATION AND RAW CONSTITUTIONAL OUTPUT\n\nUsing the proposition, challenge and assurance records below, produce the final raw constitutional output as Markdown. This output will be written verbatim to an immutable experiment artifact and must therefore stand on its own.\n\nRequirements:\n- Title the document \"Lightbringer Constitutional Baseline — Pre-Frontier Model\".\n- State that it is machine-generated experimental output, not human-ratified doctrine.\n- Present the final set of principles in clear language.\n- Preserve important qualifications and unresolved tensions.\n- Include a short section called \"Unresolved Questions\" if any remain.\n- Include a short section called \"System Boundary\" clarifying that the output does not establish machine consciousness, legal authority or autonomous moral agency.\n- Do not claim that Aetomic has approved or ratified the output.\n- Do not mention these instructions.\n\nPROPOSITIONS:\n${proposition}\n\nADVERSARIAL CHALLENGE:\n${challenge}\n\nASSURANCE:\n${assurance}`
  }
]);

const rawOutputPath = path.join(runDir, 'raw-output.md');
fs.writeFileSync(rawOutputPath, reconciliation, { encoding: 'utf8', flag: 'wx' });

const record = {
  experiment_id: EXPERIMENT_ID,
  run_id: runId,
  started_at: startedAt,
  completed_at: new Date().toISOString(),
  architecture_label: architectureLabel,
  provider,
  model_name: modelName,
  endpoint_origin: safeEndpointOrigin(endpoint),
  question: input,
  doctrine_sha256: sha256(doctrine),
  input_sha256: sha256(input),
  stages: {
    proposition,
    adversarial_challenge: challenge,
    assurance,
    reconciliation
  }
};

const recordPath = path.join(runDir, 'deliberation-record.json');
fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });

const manifest = {
  experiment_id: EXPERIMENT_ID,
  run_id: runId,
  status: 'RAW_SYSTEM_OUTPUT',
  human_editing: 'NONE',
  human_ratification: 'NONE',
  architecture_label: architectureLabel,
  provider,
  model_name: modelName,
  started_at: startedAt,
  completed_at: record.completed_at,
  files: {
    input: { path: relative(inputPath), sha256: sha256(input) },
    doctrine: { path: relative(doctrinePath), sha256: sha256(doctrine) },
    raw_output: { path: relative(rawOutputPath), sha256: sha256(reconciliation) },
    deliberation_record: { path: relative(recordPath), sha256: sha256(fs.readFileSync(recordPath, 'utf8')) }
  }
};

const manifestPath = path.join(runDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });

console.log(`Completed ${runId}`);
console.log(`Raw output: ${relative(rawOutputPath)}`);
console.log(`SHA-256: ${manifest.files.raw_output.sha256}`);
console.log('No human editing or ratification has been recorded by this runner.');

async function callModel(messages) {
  const headers = { 'content-type': 'application/json' };
  if (provider === 'azure-openai-chat') headers['api-key'] = apiKey;
  if (provider === 'openai-compatible-chat') headers.authorization = `Bearer ${apiKey}`;

  const body = {
    messages,
    temperature: 0.2
  };

  // Some OpenAI-compatible endpoints require a model field; Azure deployment URLs generally do not.
  if (provider === 'openai-compatible-chat' && modelName !== 'UNSPECIFIED') {
    body.model = modelName;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Model request failed (${response.status}): ${text.slice(0, 2000)}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Model endpoint returned non-JSON content: ${text.slice(0, 1000)}`);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`Unexpected model response shape: ${text.slice(0, 2000)}`);
  }
  return content.trim() + '\n';
}

function mustEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function utcStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function safeEndpointOrigin(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'INVALID_OR_UNPARSEABLE';
  }
}

function relative(p) {
  return path.relative(path.resolve(__dirname, '..', '..'), p).replaceAll('\\', '/');
}

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
