import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const app = express();
const PORT = 3001;
const WORKSPACE_DIR = process.cwd();

app.use(cors());
app.use(express.json());

// Helper to check if file is within workspace to prevent path traversal
function safePath(relativePath) {
  const absolutePath = path.resolve(WORKSPACE_DIR, relativePath);
  if (!absolutePath.startsWith(WORKSPACE_DIR)) {
    throw new Error('Access denied: path is outside the workspace');
  }
  return absolutePath;
}

// 1. File management endpoints
app.get('/api/files', async (req, res) => {
  try {
    const listAllFiles = async (dir, fileList = []) => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        const resPath = path.resolve(dir, file.name);
        // Exclude system files and node modules
        if (
          file.name === 'node_modules' ||
          file.name === '.git' ||
          file.name === 'dist' ||
          file.name.startsWith('temp_sandbox_')
        ) {
          continue;
        }
        if (file.isDirectory()) {
          await listAllFiles(resPath, fileList);
        } else {
          const stats = await fs.promises.stat(resPath);
          fileList.push({
            path: path.relative(WORKSPACE_DIR, resPath).replace(/\\/g, '/'),
            size: stats.size,
            mtime: stats.mtime
          });
        }
      }
      return fileList;
    };
    const files = await listAllFiles(WORKSPACE_DIR);
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/file', async (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'filePath parameter required' });
    }
    const absPath = safePath(filePath);
    const content = await fs.promises.readFile(absPath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/file', async (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'filePath is required' });
    }
    const absPath = safePath(filePath);
    // Ensure directories exist
    await fs.promises.mkdir(path.dirname(absPath), { recursive: true });
    await fs.promises.writeFile(absPath, content, 'utf-8');
    res.json({ success: true, message: 'File written successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/file', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'filePath is required' });
    }
    const absPath = safePath(filePath);
    await fs.promises.unlink(absPath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Code Execution Sandbox Endpoint
app.post('/api/sandbox/run', async (req, res) => {
  const { code, language = 'javascript' } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'code is required' });
  }

  const isJS = language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js';
  const fileExt = isJS ? '.js' : '.py';
  const runCmd = isJS ? 'node' : 'python';
  const tempFilename = `temp_sandbox_${Date.now()}${fileExt}`;
  const tempFilePath = path.join(WORKSPACE_DIR, tempFilename);

  try {
    await fs.promises.writeFile(tempFilePath, code, 'utf-8');
    exec(`${runCmd} "${tempFilePath}"`, { timeout: 10000 }, async (error, stdout, stderr) => {
      // Clean up the temp file
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }

      if (error && error.killed) {
        return res.json({
          success: false,
          error: 'Execution timed out (limit: 10 seconds)',
          stdout,
          stderr
        });
      }

      res.json({
        success: !error,
        stdout,
        stderr,
        error: error ? error.message : null
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Memory storage endpoints
const MEMORY_FILE = path.join(WORKSPACE_DIR, 'memory.json');

app.get('/api/memory', async (req, res) => {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      return res.json({ success: true, memories: [] });
    }
    const data = await fs.promises.readFile(MEMORY_FILE, 'utf-8');
    res.json({ success: true, memories: JSON.parse(data) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/memory', async (req, res) => {
  try {
    const { memories } = req.body;
    if (!Array.isArray(memories)) {
      return res.status(400).json({ success: false, error: 'memories must be an array' });
    }
    await fs.promises.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf-8');
    res.json({ success: true, message: 'Memories saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. LLM API Proxy
app.post('/api/agent/chat', async (req, res) => {
  const { messages, systemInstruction, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'API key is required for LLM agent interaction.'
    });
  }

  try {
    // Format messages for Gemini API format (contents format)
    const contents = messages.map(m => {
      let role = 'user';
      if (m.role === 'assistant') role = 'model';
      else if (m.role === 'system') role = 'user'; // System instructions handled separately in v1beta

      return {
        role,
        parts: [{ text: m.content }]
      };
    });

    const body = {
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({ success: true, reply: replyText });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GOALS — Persistent multi-session goal tracking
// ─────────────────────────────────────────────────────────────────────────────
const GOALS_FILE = path.join(WORKSPACE_DIR, 'goals.json');

app.get('/api/goals', async (req, res) => {
  try {
    if (!fs.existsSync(GOALS_FILE)) return res.json({ success: true, goals: [] });
    const data = await fs.promises.readFile(GOALS_FILE, 'utf-8');
    res.json({ success: true, goals: JSON.parse(data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/goals', async (req, res) => {
  try {
    const { goals } = req.body;
    await fs.promises.writeFile(GOALS_FILE, JSON.stringify(goals, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CORRECTIONS — 5s learns from user feedback
// ─────────────────────────────────────────────────────────────────────────────
const CORRECTIONS_FILE = path.join(WORKSPACE_DIR, 'corrections.json');

app.get('/api/corrections', async (req, res) => {
  try {
    if (!fs.existsSync(CORRECTIONS_FILE)) return res.json({ success: true, corrections: [] });
    const data = await fs.promises.readFile(CORRECTIONS_FILE, 'utf-8');
    res.json({ success: true, corrections: JSON.parse(data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/corrections', async (req, res) => {
  try {
    const { correction } = req.body;
    let list = [];
    if (fs.existsSync(CORRECTIONS_FILE)) {
      const data = await fs.promises.readFile(CORRECTIONS_FILE, 'utf-8');
      list = JSON.parse(data);
    }
    list.push({ ...correction, id: Date.now(), timestamp: new Date().toISOString() });
    await fs.promises.writeFile(CORRECTIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    res.json({ success: true, total: list.length });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SELF-MODIFICATION ENDPOINTS
// 5s can read and rewrite its own source files (with safety backups)
// ─────────────────────────────────────────────────────────────────────────────

const SRC_DIR = path.join(WORKSPACE_DIR, 'src');
const EVOLUTION_FILE = path.join(WORKSPACE_DIR, 'self_evolution.json');
const BACKUPS_DIR = path.join(WORKSPACE_DIR, '.self_backups');

// Safety: only allow modifying files inside src/ directory
function safeSrcPath(relativePath) {
  const abs = path.resolve(WORKSPACE_DIR, relativePath);
  if (!abs.startsWith(SRC_DIR)) {
    throw new Error(`Self-modification blocked: "${relativePath}" is outside src/`);
  }
  return abs;
}

// Read a source file (returns content + line count)
app.get('/api/self/source', async (req, res) => {
  try {
    const { file } = req.query;
    if (!file) return res.status(400).json({ success: false, error: 'file param required' });
    const abs = safeSrcPath(file);
    const content = await fs.promises.readFile(abs, 'utf-8');
    res.json({ success: true, content, lines: content.split('\n').length, file });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// List all modifiable source files
app.get('/api/self/sources', async (req, res) => {
  try {
    const listSrc = async (dir, out = []) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await listSrc(full, out);
        else if (/\.(js|jsx|css)$/.test(e.name)) {
          const stat = await fs.promises.stat(full);
          out.push({ file: path.relative(WORKSPACE_DIR, full).replace(/\\/g, '/'), size: stat.size });
        }
      }
      return out;
    };
    const files = await listSrc(SRC_DIR);
    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Apply a self-modification: backup old, write new, return diff metadata
app.post('/api/self/modify', async (req, res) => {
  try {
    const { file, newContent, reason, generation } = req.body;
    if (!file || !newContent) {
      return res.status(400).json({ success: false, error: 'file and newContent are required' });
    }

    const abs = safeSrcPath(file);

    // Read existing content
    let oldContent = '';
    try {
      oldContent = await fs.promises.readFile(abs, 'utf-8');
    } catch (_) { /* new file */ }

    // Write backup
    await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });
    const backupName = `${file.replace(/\//g, '__')}.gen${generation || 0}.bak`;
    await fs.promises.writeFile(path.join(BACKUPS_DIR, backupName), oldContent, 'utf-8');

    // Apply new content
    await fs.promises.writeFile(abs, newContent, 'utf-8');

    // Compute diff stats
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const added = newLines.filter(l => !oldLines.includes(l)).length;
    const removed = oldLines.filter(l => !newLines.includes(l)).length;

    res.json({
      success: true,
      backup: backupName,
      stats: { added, removed, oldLines: oldLines.length, newLines: newLines.length }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Restore from backup
app.post('/api/self/restore', async (req, res) => {
  try {
    const { backupName, file } = req.body;
    const backupPath = path.join(BACKUPS_DIR, backupName);
    const targetPath = safeSrcPath(file);
    const content = await fs.promises.readFile(backupPath, 'utf-8');
    await fs.promises.writeFile(targetPath, content, 'utf-8');
    res.json({ success: true, message: `Restored ${file} from backup` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get evolution log
app.get('/api/self/evolution', async (req, res) => {
  try {
    if (!fs.existsSync(EVOLUTION_FILE)) {
      return res.json({ success: true, log: [] });
    }
    const data = await fs.promises.readFile(EVOLUTION_FILE, 'utf-8');
    res.json({ success: true, log: JSON.parse(data) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Save evolution log entry
app.post('/api/self/evolution', async (req, res) => {
  try {
    const { entry } = req.body;
    let log = [];
    if (fs.existsSync(EVOLUTION_FILE)) {
      const data = await fs.promises.readFile(EVOLUTION_FILE, 'utf-8');
      log = JSON.parse(data);
    }
    log.push(entry);
    await fs.promises.writeFile(EVOLUTION_FILE, JSON.stringify(log, null, 2), 'utf-8');
    res.json({ success: true, generation: log.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
