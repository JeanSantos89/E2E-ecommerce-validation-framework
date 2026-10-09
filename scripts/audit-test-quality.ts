/**
 * Gate estático que audita a QUALIDADE dos testes, não roda a suíte.
 *
 * Varre tests/**\/*.spec.ts procurando "verde mentiroso": teste que passa mas
 * não prova nada. Falha (exit 1) quando encontra:
 *   1. bloco test(...)/it(...) sem nenhuma chamada expect(...) dentro
 *   2. assert tautológico óbvio: expect(X).toBe(X) com X idêntico nos dois
 *      lados, ou expect(true).toBe(true) / expect(true).toBeTruthy() com
 *      literal booleano
 *
 * Não depende de rede nem de nenhum site externo — só lê arquivos locais.
 * Por isso roda sempre, diferente do job de E2E real (bloqueado pelo
 * Cloudflare do site demo nopCommerce).
 */

import * as fs from 'fs';
import * as path from 'path';

interface Finding {
  file: string;
  line: number;
  message: string;
}

// Resolvido a partir do diretório de trabalho (o script roda via npm script
// na raiz do repo), não de __dirname — que muda conforme o compilado é
// gerado (ex.: para um diretório temporário de build).
const ROOT_DIR = process.cwd();
const TESTS_DIR = path.join(ROOT_DIR, 'tests');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');

function listFiles(dir: string, suffix: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, suffix));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      out.push(full);
    }
  }
  return out;
}

function listSpecFiles(dir: string): string[] {
  return listFiles(dir, '.spec.ts');
}

/**
 * Projeto usa o padrão Page Object: o `test(...)` só chama métodos de
 * pages/*.ts, e é dentro desses métodos que mora o expect(...) real. Por
 * isso, além de checar expect() direto no corpo do teste, construímos o
 * conjunto de nomes de método que, em algum arquivo de pages/, têm expect()
 * no próprio corpo — e tratamos uma chamada a um desses métodos como prova
 * válida.
 */
function collectAssertiveMethodNames(pagesDir: string): Set<string> {
  const names = new Set<string>();
  const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;

  for (const file of listFiles(pagesDir, '.ts')) {
    const content = fs.readFileSync(file, 'utf-8');
    let match: RegExpExecArray | null;
    while ((match = methodRegex.exec(content)) !== null) {
      const name = match[1];
      if (name === 'constructor' || name === 'if' || name === 'for' || name === 'while') continue;
      const openParenIndex = match.index + match[0].indexOf('(');
      const extracted = extractTestBody(content, openParenIndex);
      if (extracted && /expect\s*\(/.test(extracted.body)) {
        names.add(name);
      }
    }
  }
  return names;
}

function lineAt(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

/**
 * A partir do índice logo após "test(" ou "it(", encontra o corpo da função
 * de teste procurando o primeiro "{" e capturando até a chave de fechamento
 * balanceada correspondente.
 */
function extractTestBody(content: string, searchFromIndex: number): { body: string; endIndex: number } | null {
  // Pula um eventual "=> " de arrow function para não confundir o "{" do
  // corpo com o "{" de um parâmetro desestruturado, ex.: async ({ page }) => {
  const arrowMatch = /=>\s*/.exec(content.slice(searchFromIndex, searchFromIndex + 200));
  const braceSearchStart = arrowMatch
    ? searchFromIndex + arrowMatch.index + arrowMatch[0].length
    : searchFromIndex;

  const braceStart = content.indexOf('{', braceSearchStart);
  if (braceStart === -1) return null;

  let depth = 0;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { body: content.slice(braceStart, i + 1), endIndex: i };
      }
    }
  }
  return null;
}

function normalizeExpr(expr: string): string {
  return expr.replace(/\s+/g, '').trim();
}

/**
 * Dado o corpo de um expect(...).metodo(...), decide se é tautológico óbvio.
 */
function findTautologies(body: string, file: string, content: string): Finding[] {
  const findings: Finding[] = [];

  // expect(ARG1).metodo(ARG2) — captura os dois argumentos de alto nível
  // (sem parênteses aninhados não balanceados, caso simples/comum).
  const expectCallRegex = /expect\(([^;]*?)\)\s*\.\s*(toBe|toEqual|toStrictEqual|toBeTruthy)\s*\(([^;]*?)\)/g;

  let match: RegExpExecArray | null;
  while ((match = expectCallRegex.exec(body)) !== null) {
    const [full, rawArg, method, rawParam] = match;
    const arg = normalizeExpr(rawArg);
    const param = normalizeExpr(rawParam);
    const index = match.index;
    const line = lineAt(content, content.indexOf(body) + index);

    if (method === 'toBeTruthy') {
      // expect(true).toBeTruthy() — literal booleano, sem comparar nada real
      if (arg === 'true') {
        findings.push({
          file,
          line,
          message: `assert tautológico: "${full.trim()}" — expect(true).toBeTruthy() não prova nada`,
        });
      }
      continue;
    }

    // toBe / toEqual / toStrictEqual
    if (arg === param) {
      findings.push({
        file,
        line,
        message: `assert tautológico: "${full.trim()}" — os dois lados são idênticos (${arg})`,
      });
    } else if (arg === 'true' && param === 'true') {
      findings.push({
        file,
        line,
        message: `assert tautológico: "${full.trim()}" — expect(true).toBe(true)`,
      });
    }
  }

  return findings;
}

function bodyCallsAssertiveMethod(body: string, assertiveMethods: Set<string>): boolean {
  const callRegex = /\.(\w+)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = callRegex.exec(body)) !== null) {
    if (assertiveMethods.has(m[1])) return true;
  }
  return false;
}

function auditFile(file: string, assertiveMethods: Set<string>): Finding[] {
  const content = fs.readFileSync(file, 'utf-8');
  const findings: Finding[] = [];

  // Encontra cada chamada test(...) / it(...) com callback de função.
  const testCallRegex = /\b(?:test|it)\s*(?:\.\w+)?\s*\(\s*(['"`])(?:[^\\]|\\.)*?\1\s*,/g;

  let match: RegExpExecArray | null;
  while ((match = testCallRegex.exec(content)) !== null) {
    const callStart = match.index;
    const openParenIndex = match.index + match[0].length;
    const extracted = extractTestBody(content, openParenIndex);
    if (!extracted) continue;

    const { body } = extracted;
    const startLine = lineAt(content, callStart);

    const hasDirectExpect = /expect\s*\(/.test(body);
    const hasIndirectExpect = bodyCallsAssertiveMethod(body, assertiveMethods);

    if (!hasDirectExpect && !hasIndirectExpect) {
      findings.push({
        file,
        line: startLine,
        message: 'bloco de teste sem nenhuma chamada expect(...) (direta ou via Page Object) — não prova nada',
      });
    }

    findings.push(...findTautologies(body, file, content));
  }

  return findings;
}

function main(): void {
  if (!fs.existsSync(TESTS_DIR)) {
    console.log(`Diretório ${TESTS_DIR} não existe, nada para auditar.`);
    return;
  }

  const files = listSpecFiles(TESTS_DIR);
  const assertiveMethods = collectAssertiveMethodNames(PAGES_DIR);
  const allFindings: Finding[] = [];

  for (const file of files) {
    allFindings.push(...auditFile(file, assertiveMethods));
  }

  if (allFindings.length === 0) {
    console.log(`audit-test-quality: ok — ${files.length} arquivo(s) de teste auditado(s), nenhum "verde mentiroso" encontrado.`);
    return;
  }

  console.error(`audit-test-quality: ${allFindings.length} problema(s) encontrado(s):\n`);
  for (const f of allFindings) {
    console.error(`  ${path.relative(process.cwd(), f.file)}:${f.line} — ${f.message}`);
  }
  process.exitCode = 1;
}

main();
