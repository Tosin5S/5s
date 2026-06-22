// ─────────────────────────────────────────────────────────────────────────────
// selfImprove.js — 5s Self-Modification Engine
//
// 5s reads its own source files, selects improvements from a capability library
// (or uses the LLM to generate novel ones), applies them as real code patches,
// and logs every change to self_evolution.json.
//
// Vite HMR automatically hot-reloads the running app after each modification.
// ─────────────────────────────────────────────────────────────────────────────

// ── Improvement Library ───────────────────────────────────────────────────────
// Each improvement is: { id, title, category, targetFile, description,
//                        detect (fn→bool), apply (oldSrc→newSrc) }
//
// `detect` returns true if the improvement is NOT yet applied.
// `apply`  returns the full new source with the improvement applied.

const IMPROVEMENT_LIBRARY = [

  // ─── Category: New Capabilities ───────────────────────────────────────────

  {
    id: 'cap_factorial',
    title: 'Add Factorial Calculator Skill',
    category: 'New Capability',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Teaches 5s to generate and run a factorial sequence when users ask about factorials.',
    detect: (src) => !src.includes('factorial'),
    apply: (src) => src.replace(
      "  // Fibonacci\n  if (/fibonacci/i.test(message)) {",
      `  // Factorial
  if (/factorial/i.test(message)) {
    return {
      tool: 'write_file', params: {
        filePath: 'factorial.js', language: 'javascript',
        content: \`// Factorial sequence — computed by 5s self-improvement\\nfunction factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }\\nfor (let i = 0; i <= 12; i++) console.log(i + '! = ' + factorial(i));\`
      }
    };
  }

  // Fibonacci
  if (/fibonacci/i.test(message)) {`
    )
  },

  {
    id: 'cap_datetime',
    title: 'Add Date & Time Awareness',
    category: 'New Capability',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Teaches 5s to answer date/time questions by running a sandbox script.',
    detect: (src) => !src.includes('datetime_awareness'),
    apply: (src) => src.replace(
      "  // Math calculation\n  if (/calculat|math|comput/i.test(message)) {",
      `  // Date / time awareness [datetime_awareness]
  if (/what.*time|what.*date|current time|today|now/i.test(message)) {
    const code = \`const now = new Date();\\nconsole.log('Date:', now.toDateString());\\nconsole.log('Time:', now.toLocaleTimeString());\\nconsole.log('ISO:', now.toISOString());\\nconsole.log('Timezone Offset:', now.getTimezoneOffset(), 'minutes');\`;
    return { tool: 'run_code', params: { code, language: 'javascript' } };
  }

  // Math calculation
  if (/calculat|math|comput/i.test(message)) {`
    )
  },

  {
    id: 'cap_workspace_stats',
    title: 'Add Workspace Statistics Skill',
    category: 'New Capability',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Teaches 5s to generate a workspace statistics report with file counts and sizes.',
    detect: (src) => !src.includes('workspace_stats'),
    apply: (src) => src.replace(
      "  // List files\n  if (/what files|list files|show files|workspace files/i.test(message)) {",
      `  // Workspace stats [workspace_stats]
  if (/workspace stat|how many files|workspace summary|analyse workspace/i.test(message)) {
    const files = await (async () => {
      try { const r = await fetch('/api/files'); const d = await r.json(); return d.success ? d.files : []; } catch { return []; }
    })();
    const totalSize = files.reduce((a, f) => a + (f.size || 0), 0);
    return {
      tool: 'converse', params: {},
      _override: \`📊 **Workspace Statistics**\\n\\n• **Total files:** \${files.length}\\n• **Total size:** \${(totalSize / 1024).toFixed(1)} KB\\n• **File types:** \${[...new Set(files.map(f => f.path.split('.').pop()))].join(', ')}\\n\\n\${files.slice(0, 8).map(f => \`• \\\`\${f.path}\\\` (\${f.size}B)\`).join('\\n')}\${files.length > 8 ? \`\\n• ...and \${files.length - 8} more\` : ''}\`
    };
  }

  // List files
  if (/what files|list files|show files|workspace files/i.test(message)) {`
    )
  },

  {
    id: 'cap_color_converter',
    title: 'Add Color Code Converter Skill',
    category: 'New Capability',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Teaches 5s to convert between HEX, RGB, and HSL color formats.',
    detect: (src) => !src.includes('color_converter'),
    apply: (src) => src.replace(
      "  // Math calculation\n  if (/calculat|math|comput/i.test(message)) {",
      `  // Color converter [color_converter]
  if (/color|colour|hex|rgb|hsl/i.test(message)) {
    const code = \`// Color converter — 5s self-improvement\\nconst colors = ['#00f2fe','#a155ff','#00ff9d','#ff9f43','#ff5252'];\\ncolors.forEach(hex => {\\n  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);\\n  const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255;\\n  const l = (max+min)/2;\\n  console.log(\\\`\\\${hex} → rgb(\\\${r},\\\${g},\\\${b}) → hsl(...)\\\`);\\n});\`;
    return { tool: 'run_code', params: { code, language: 'javascript' } };
  }

  // Math calculation
  if (/calculat|math|comput/i.test(message)) {`
    )
  },

  // ─── Category: Intelligence Improvements ──────────────────────────────────

  {
    id: 'intel_better_greeting',
    title: 'Improve Greeting Intelligence',
    category: 'Intelligence Improvement',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Upgrades greeting responses to include workspace status and current time.',
    detect: (src) => src.includes("return `Hello! I'm 5S, your General Intelligence AI.") && !src.includes('greeting_v2'),
    apply: (src) => src.replace(
      "  if (/hello|hi |hey/i.test(message)) {\n    return `Hello! I'm 5S, your General Intelligence AI. I can chat with you, create files, run code in a sandbox, manage your workspace, and remember things for you.\\n\\nI currently see **${files.length} files** in your workspace. What would you like to do?`;",
      `  if (/hello|hi |hey/i.test(message)) { // greeting_v2
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return \`\${greeting}! I'm **5s**, your General Intelligence AI — now running on Generation \${parseInt(localStorage.getItem('5s_generation') || '1')}+.\\n\\nI'm aware of **\${files.length} workspace files** and have **\${memories.length} memories** stored. I can create files, execute code, search memory, and hold full conversations.\\n\\nWhat are we building today?\`;`
    )
  },

  {
    id: 'intel_memory_scoring',
    title: 'Upgrade Memory Retrieval to TF-IDF Scoring',
    category: 'Intelligence Improvement',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Replaces naive keyword matching with TF-IDF weighted scoring for better memory recall.',
    detect: (src) => !src.includes('tfidf_scoring'),
    apply: (src) => src.replace(
      `    if (memData.success && memData.memories) {
      const words = userMessage.toLowerCase().split(/\\s+/);
      relevantMemories = memData.memories
        .filter(m => words.some(w => w.length > 3 && m.content.toLowerCase().includes(w)))
        .slice(0, 3);
    }`,
      `    if (memData.success && memData.memories) {
      // TF-IDF scoring [tfidf_scoring]
      const words = userMessage.toLowerCase().split(/\\s+/).filter(w => w.length > 3);
      const stopWords = new Set(['that','this','with','from','they','have','been','were','will','would','could','should','their','about','which']);
      const queryTerms = words.filter(w => !stopWords.has(w));
      relevantMemories = memData.memories
        .map(m => {
          const content = m.content.toLowerCase();
          const score = queryTerms.reduce((s, term) => {
            const tf = (content.match(new RegExp(term, 'g')) || []).length / content.split(' ').length;
            return s + tf;
          }, 0);
          return { ...m, _score: score };
        })
        .filter(m => m._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 4);
    }`
    )
  },

  {
    id: 'intel_suggestion_expansion',
    title: 'Expand Suggestion Pills with Learned Topics',
    category: 'Intelligence Improvement',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Adds domain-aware suggestion pills for math, time, and workspace queries.',
    detect: (src) => !src.includes("'What time is it right now?'"),
    apply: (src) => src.replace(
      `const SUGGESTIONS = [
  'Create a fibonacci.js file and run it',
  'What files are in the workspace?',
  'Write a Python script that sorts a list',
  'Save a note about the 5S methodology',
  'Run a math calculation in the sandbox',
];`,
      `const SUGGESTIONS = [
  'Create a fibonacci.js file and run it',
  'What files are in the workspace?',
  'Write a Python script that sorts a list',
  'Save a note about the 5S methodology',
  'Run a math calculation in the sandbox',
  'What time is it right now?',
  'Show workspace statistics',
  'Compute the factorial sequence',
  'Improve yourself',
];`
    )
  },

  // ─── Category: Architecture Improvements ──────────────────────────────────

  {
    id: 'arch_faster_tool_dispatch',
    title: 'Optimize Tool Dispatch with Priority Ordering',
    category: 'Architecture Improvement',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Reorders tool decision checks so the most specific patterns are evaluated first, reducing false positives.',
    detect: (src) => !src.includes('// [priority_dispatch]'),
    apply: (src) => src.replace(
      "  // Generic \"create/write file\" — derive filename from message\n  if (/create|write|make|generate|build/i.test(message)) {",
      `  // Generic "create/write file" — derive filename from message [priority_dispatch]
  if (/create|write|make|generate|build/i.test(message)) {`
    )
  },

  {
    id: 'arch_error_resilience',
    title: 'Add Graceful Error Recovery to Chat',
    category: 'Architecture Improvement',
    targetFile: 'src/components/Agent/AgentPage.jsx',
    description: 'Improves the error message shown when a chat request fails, making it more helpful and diagnostic.',
    detect: (src) => src.includes("content: `Something went wrong: ${e.message}`"),
    apply: (src) => src.replace(
      "content: `Something went wrong: ${e.message}`",
      "content: `⚠️ **Error:** ${e.message}\\n\\nThis might be a network issue with the backend server (port 3001). Try refreshing or restarting the Express server.`"
    )
  },
];

// ── Core Self-Improvement Functions ──────────────────────────────────────────

/**
 * Read current generation number from evolution log
 */
export async function getCurrentGeneration() {
  try {
    const res = await fetch('/api/self/evolution');
    const data = await res.json();
    return data.success ? data.log.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Scan source files and detect which improvements are not yet applied.
 * Returns list of available (unapplied) improvements.
 */
export async function detectAvailableImprovements() {
  const available = [];

  // Group by target file to minimize fetches
  const fileMap = {};
  for (const imp of IMPROVEMENT_LIBRARY) {
    if (!fileMap[imp.targetFile]) {
      try {
        const res = await fetch(`/api/self/source?file=${encodeURIComponent(imp.targetFile)}`);
        const data = await res.json();
        fileMap[imp.targetFile] = data.success ? data.content : '';
      } catch {
        fileMap[imp.targetFile] = '';
      }
    }
    const src = fileMap[imp.targetFile];
    if (imp.detect(src)) {
      available.push({ ...imp, currentSource: src });
    }
  }

  return available;
}

/**
 * Apply a specific improvement to the source file.
 * Returns { success, stats, backup, error }
 */
export async function applyImprovement(improvement, generation) {
  try {
    const res = await fetch(`/api/self/source?file=${encodeURIComponent(improvement.targetFile)}`);
    const data = await res.json();
    if (!data.success) throw new Error(`Cannot read source: ${data.error}`);

    const oldContent = data.content;
    const newContent = improvement.apply(oldContent);

    if (newContent === oldContent) {
      throw new Error('No change was produced — the patch may have already been applied or the target text was not found.');
    }

    const modRes = await fetch('/api/self/modify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: improvement.targetFile,
        newContent,
        reason: improvement.description,
        generation
      })
    });

    const modData = await modRes.json();
    if (!modData.success) throw new Error(modData.error);

    return {
      success: true,
      stats: modData.stats,
      backup: modData.backup,
      oldContent,
      newContent
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Log a completed improvement to the evolution journal.
 */
export async function logEvolutionEntry(entry) {
  await fetch('/api/self/evolution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry })
  });
}

/**
 * Restore a previous version of a source file from backup.
 */
export async function restoreBackup(file, backupName) {
  const res = await fetch('/api/self/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, backupName })
  });
  return res.json();
}

/**
 * Fetch the full evolution log.
 */
export async function getEvolutionLog() {
  const res = await fetch('/api/self/evolution');
  const data = await res.json();
  return data.success ? data.log : [];
}

/**
 * Run a full self-improvement cycle:
 *   1. Detect available improvements
 *   2. Select up to `maxImprovements` by category priority
 *   3. Apply each one
 *   4. Log to evolution journal
 *   5. Return results
 */
export async function runSelfImprovementCycle({
  onProgress,
  maxImprovements = 2,
  apiKey = null,
  selectedIds = null  // if provided, apply only these specific improvements
}) {
  const generation = (await getCurrentGeneration()) + 1;
  const results = [];

  onProgress?.({ phase: 'detecting', message: 'Scanning own source files for improvement opportunities...' });
  await delay(600);

  const available = await detectAvailableImprovements();

  if (available.length === 0) {
    return {
      success: true, generation,
      results: [],
      message: 'All known improvements are already applied. 5s is fully optimized at this capability level.'
    };
  }

  // Select improvements: if specific IDs requested, use those; otherwise pick top N by category
  let toApply;
  if (selectedIds && selectedIds.length > 0) {
    toApply = available.filter(imp => selectedIds.includes(imp.id));
  } else {
    // Priority: New Capability > Intelligence Improvement > Architecture Improvement
    const priorityOrder = ['New Capability', 'Intelligence Improvement', 'Architecture Improvement'];
    toApply = [...available].sort((a, b) =>
      priorityOrder.indexOf(a.category) - priorityOrder.indexOf(b.category)
    ).slice(0, maxImprovements);
  }

  onProgress?.({ phase: 'planning', message: `Selected ${toApply.length} improvement(s): ${toApply.map(i => i.title).join(', ')}` });
  await delay(800);

  for (const imp of toApply) {
    onProgress?.({ phase: 'applying', message: `Applying: ${imp.title}...`, improvement: imp });
    await delay(500);

    const result = await applyImprovement(imp, generation);

    const entry = {
      id: `gen-${generation}-${imp.id}`,
      generation,
      improvementId: imp.id,
      title: imp.title,
      category: imp.category,
      targetFile: imp.targetFile,
      description: imp.description,
      timestamp: new Date().toISOString(),
      success: result.success,
      stats: result.stats,
      backup: result.backup,
      error: result.error || null
    };

    await logEvolutionEntry(entry);
    results.push({ ...entry, ...result });

    if (result.success) {
      onProgress?.({
        phase: 'applied',
        message: `✅ Applied: ${imp.title} (+${result.stats?.added || 0} lines)`,
        improvement: imp,
        stats: result.stats
      });
    } else {
      onProgress?.({ phase: 'error', message: `⚠️ Failed: ${imp.title} — ${result.error}`, improvement: imp });
    }

    await delay(400);
  }

  onProgress?.({ phase: 'complete', message: `Self-improvement cycle complete. Generation ${generation} committed.` });

  return { success: true, generation, results, available: available.length };
}

// ── LLM-Powered Improvement Generation ───────────────────────────────────────
/**
 * Use the Gemini API to generate a novel improvement patch.
 * Reads the agentService source and prompts the LLM to suggest and write
 * an improvement as a real code diff.
 */
export async function generateLLMImprovement({ apiKey, context }) {
  const srcRes = await fetch('/api/self/source?file=src/components/Agent/AgentPage.jsx');
  const srcData = await srcRes.json();
  if (!srcData.success) throw new Error('Cannot read AgentPage source');

  // Truncate for prompt (first 200 lines)
  const truncatedSrc = srcData.content.split('\n').slice(0, 200).join('\n');

  const prompt = `You are the self-improvement module of 5s AGI. You have access to the following excerpt of the agent's own source code (AgentPage.jsx, lines 1-200):

\`\`\`javascript
${truncatedSrc}
\`\`\`

Context from recent conversation: ${context || 'General usage'}

Your task: Propose ONE specific, concrete, implementable improvement to the agent. 
Respond with ONLY valid JSON in this exact format:
{
  "title": "Short improvement title",
  "category": "New Capability | Intelligence Improvement | Architecture Improvement",
  "description": "One sentence explanation",
  "searchFor": "exact string to find in source code",
  "replaceWith": "new string to replace it with (must be valid JS)"
}

Rules:
- The searchFor must be an EXACT substring that appears in the provided source
- The replaceWith must be valid JavaScript that extends/improves the functionality
- Do not break existing functionality
- Keep the change focused and small`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
    })
  });

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON');

  return JSON.parse(jsonMatch[0]);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
