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

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
