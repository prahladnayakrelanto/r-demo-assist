const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const { exec, spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Directory paths
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const PRESENTATIONS_DIR = path.join(ROOT_DIR, 'public', 'presentations');
const SLIDES_DIR = path.join(PRESENTATIONS_DIR, 'slides');
const PPTX_DIR = path.join(PRESENTATIONS_DIR);

// Data file paths
const ACCELERATORS_FILE = path.join(DATA_DIR, 'accelerators.json');
const SLIDEDECKS_FILE = path.join(DATA_DIR, 'slidedecks.json');
const USER_PREFERENCES_FILE = path.join(DATA_DIR, 'userPreferences.json');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the presentations directory exists
    if (!fsSync.existsSync(PPTX_DIR)) {
      fsSync.mkdirSync(PPTX_DIR, { recursive: true });
    }
    cb(null, PPTX_DIR);
  },
  filename: function (req, file, cb) {
    // Sanitize filename - remove special characters
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    cb(null, sanitized);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow .pptx files
    if (path.extname(file.originalname).toLowerCase() === '.pptx') {
      cb(null, true);
    } else {
      cb(new Error('Only .pptx files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [DATA_DIR, PRESENTATIONS_DIR, SLIDES_DIR];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// Helper function to read JSON file
async function readJsonFile(filePath, defaultData = []) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    await writeJsonFile(filePath, defaultData);
    return defaultData;
  }
}

// Helper function to write JSON file
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Extract slides from PPTX using Python
async function extractSlides(pptxPath, outputFolderName) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(SLIDES_DIR, outputFolderName);
    
    // Create output directory
    if (!fsSync.existsSync(outputDir)) {
      fsSync.mkdirSync(outputDir, { recursive: true });
    }

    // Python script to extract slides
    const pythonScript = `
import sys
import os
import json

# Add paths for imports
sys.path.insert(0, r'${ROOT_DIR.replace(/\\/g, '\\\\')}')

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt
    import copy
    
    pptx_path = r'${pptxPath.replace(/\\/g, '\\\\')}'
    output_dir = r'${outputDir.replace(/\\/g, '\\\\')}'
    
    # Open the source presentation
    src_prs = Presentation(pptx_path)
    slide_count = len(src_prs.slides)
    
    slides_content = []
    
    for idx, slide in enumerate(src_prs.slides, 1):
        # Extract text content
        text_content = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    for run in paragraph.runs:
                        if run.text.strip():
                            text_content.append(run.text.strip())
            if shape.has_table:
                for row in shape.table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text_content.append(cell.text.strip())
        
        slides_content.append({
            "slideNumber": idx,
            "content": ' '.join(text_content)
        })
        
        # Create individual slide PPTX
        new_prs = Presentation()
        new_prs.slide_width = src_prs.slide_width
        new_prs.slide_height = src_prs.slide_height
        
        try:
            blank_layout = new_prs.slide_layouts[6]
        except:
            blank_layout = new_prs.slide_layouts[0]
        
        new_slide = new_prs.slides.add_slide(blank_layout)
        
        for shape in slide.shapes:
            try:
                el = copy.deepcopy(shape.element)
                new_slide.shapes._spTree.insert_element_before(el, 'p:extLst')
            except:
                pass
        
        slide_pptx_path = os.path.join(output_dir, f'slide_{idx:03d}.pptx')
        new_prs.save(slide_pptx_path)
    
    # Save content.json
    with open(os.path.join(output_dir, 'content.json'), 'w', encoding='utf-8') as f:
        json.dump({"slides": slides_content}, f, indent=2, ensure_ascii=False)
    
    # Save metadata
    metadata = {
        "name": os.path.splitext(os.path.basename(pptx_path))[0],
        "folder": os.path.basename(output_dir),
        "slideCount": slide_count,
        "hasContent": True
    }
    with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(json.dumps({"success": True, "slideCount": slide_count}))

except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing Python package: {str(e)}. Install with: pip install python-pptx"}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

    // Write temporary Python script
    const tempScriptPath = path.join(__dirname, 'temp_extract.py');
    fsSync.writeFileSync(tempScriptPath, pythonScript);

    // Determine Python command (use venv on Linux/production)
    const isWindows = process.platform === 'win32';
    const venvPython = path.join(ROOT_DIR, 'venv', 'bin', 'python');
    const pythonCmd = isWindows ? 'python' : (fsSync.existsSync(venvPython) ? venvPython : 'python3');

    // Execute Python script
    exec(`"${pythonCmd}" "${tempScriptPath}"`, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      // Clean up temp script
      try {
        fsSync.unlinkSync(tempScriptPath);
      } catch (e) {}

      if (error) {
        console.error('Python error:', stderr);
        reject(new Error(`Python extraction failed: ${stderr || error.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      } catch (e) {
        // Try using PowerPoint COM as fallback (Windows only)
        extractSlidesWithCOM(pptxPath, outputDir)
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

// Extract slides using PowerPoint COM (Windows fallback)
async function extractSlidesWithCOM(pptxPath, outputDir) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import sys
import json
import os

try:
    import comtypes.client
    
    pptx_path = r'${pptxPath.replace(/\\/g, '\\\\')}'
    output_dir = r'${outputDir.replace(/\\/g, '\\\\')}'
    
    powerpoint = comtypes.client.CreateObject("PowerPoint.Application")
    powerpoint.Visible = 1
    
    presentation = powerpoint.Presentations.Open(os.path.abspath(pptx_path))
    slide_count = len(presentation.Slides)
    
    for i, slide in enumerate(presentation.Slides, 1):
        # Export as PNG
        image_path = os.path.join(output_dir, f'slide_{i:03d}.png')
        slide.Export(os.path.abspath(image_path), "PNG", 1920, 1080)
    
    presentation.Close()
    powerpoint.Quit()
    
    # Save metadata
    metadata = {
        "name": os.path.splitext(os.path.basename(pptx_path))[0],
        "folder": os.path.basename(output_dir),
        "slideCount": slide_count,
        "hasContent": False
    }
    with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(json.dumps({"success": True, "slideCount": slide_count}))

except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

    const tempScriptPath = path.join(__dirname, 'temp_extract_com.py');
    fsSync.writeFileSync(tempScriptPath, pythonScript);

    // COM is Windows-only, so always use 'python'
    exec(`python "${tempScriptPath}"`, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      try {
        fsSync.unlinkSync(tempScriptPath);
      } catch (e) {}

      if (error) {
        reject(new Error(`COM extraction failed: ${stderr || error.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      } catch (e) {
        reject(new Error('Failed to parse extraction result'));
      }
    });
  });
}

// ============================================
// ACCELERATORS API
// ============================================

app.get('/api/accelerators', async (req, res) => {
  try {
    const accelerators = await readJsonFile(ACCELERATORS_FILE, []);
    res.json(accelerators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accelerators' });
  }
});

app.get('/api/accelerators/:id', async (req, res) => {
  try {
    const accelerators = await readJsonFile(ACCELERATORS_FILE, []);
    const accelerator = accelerators.find(a => a.id === parseInt(req.params.id));
    if (!accelerator) {
      return res.status(404).json({ error: 'Accelerator not found' });
    }
    res.json(accelerator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accelerator' });
  }
});

app.post('/api/accelerators', async (req, res) => {
  try {
    const accelerators = await readJsonFile(ACCELERATORS_FILE, []);
    const newAccelerator = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    accelerators.push(newAccelerator);
    await writeJsonFile(ACCELERATORS_FILE, accelerators);
    res.status(201).json(newAccelerator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create accelerator' });
  }
});

app.put('/api/accelerators/:id', async (req, res) => {
  try {
    const accelerators = await readJsonFile(ACCELERATORS_FILE, []);
    const index = accelerators.findIndex(a => a.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Accelerator not found' });
    }
    accelerators[index] = {
      ...accelerators[index],
      ...req.body,
      id: parseInt(req.params.id),
      updatedAt: new Date().toISOString()
    };
    await writeJsonFile(ACCELERATORS_FILE, accelerators);
    res.json(accelerators[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update accelerator' });
  }
});

app.delete('/api/accelerators/:id', async (req, res) => {
  try {
    const accelerators = await readJsonFile(ACCELERATORS_FILE, []);
    const filtered = accelerators.filter(a => a.id !== parseInt(req.params.id));
    if (filtered.length === accelerators.length) {
      return res.status(404).json({ error: 'Accelerator not found' });
    }
    await writeJsonFile(ACCELERATORS_FILE, filtered);
    res.json({ message: 'Accelerator deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete accelerator' });
  }
});

// ============================================
// SLIDE DECKS API
// ============================================

app.get('/api/slidedecks', async (req, res) => {
  try {
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    res.json(slideDecks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slide decks' });
  }
});

app.get('/api/slidedecks/:id', async (req, res) => {
  try {
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    const slideDeck = slideDecks.find(s => s.id === parseInt(req.params.id));
    if (!slideDeck) {
      return res.status(404).json({ error: 'Slide deck not found' });
    }
    res.json(slideDeck);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slide deck' });
  }
});

app.post('/api/slidedecks', async (req, res) => {
  try {
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    const newSlideDeck = {
      id: Date.now(),
      ...req.body,
      author: req.body.author || 'AI First Lab',
      date: req.body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    slideDecks.push(newSlideDeck);
    await writeJsonFile(SLIDEDECKS_FILE, slideDecks);
    res.status(201).json(newSlideDeck);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create slide deck' });
  }
});

app.put('/api/slidedecks/:id', async (req, res) => {
  try {
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    const index = slideDecks.findIndex(s => s.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Slide deck not found' });
    }
    slideDecks[index] = {
      ...slideDecks[index],
      ...req.body,
      id: parseInt(req.params.id),
      updatedAt: new Date().toISOString()
    };
    await writeJsonFile(SLIDEDECKS_FILE, slideDecks);
    res.json(slideDecks[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update slide deck' });
  }
});

app.delete('/api/slidedecks/:id', async (req, res) => {
  try {
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    const filtered = slideDecks.filter(s => s.id !== parseInt(req.params.id));
    if (filtered.length === slideDecks.length) {
      return res.status(404).json({ error: 'Slide deck not found' });
    }
    await writeJsonFile(SLIDEDECKS_FILE, filtered);
    res.json({ message: 'Slide deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slide deck' });
  }
});

// ============================================
// VIDEOS API
// ============================================

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await readJsonFile(VIDEOS_FILE, []);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const videos = await readJsonFile(VIDEOS_FILE, []);
    const video = videos.find(v => v.id === parseInt(req.params.id));
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const videos = await readJsonFile(VIDEOS_FILE, []);
    const newVideo = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    videos.push(newVideo);
    await writeJsonFile(VIDEOS_FILE, videos);
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create video' });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  try {
    const videos = await readJsonFile(VIDEOS_FILE, []);
    const index = videos.findIndex(v => v.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }
    videos[index] = {
      ...videos[index],
      ...req.body,
      id: parseInt(req.params.id),
      updatedAt: new Date().toISOString()
    };
    await writeJsonFile(VIDEOS_FILE, videos);
    res.json(videos[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videos = await readJsonFile(VIDEOS_FILE, []);
    const filtered = videos.filter(v => v.id !== parseInt(req.params.id));
    if (filtered.length === videos.length) {
      return res.status(404).json({ error: 'Video not found' });
    }
    await writeJsonFile(VIDEOS_FILE, filtered);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ============================================
// USER PREFERENCES API
// ============================================

// Helper function to sanitize email for use as key
function sanitizeEmail(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Get user preferences
app.get('/api/user-preferences/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const userKey = sanitizeEmail(email);
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    // Return user's preferences or default empty structure
    const userPrefs = preferences.users[userKey] || {
      email: email,
      playlists: [],
      hiddenAccelerators: [],
      acceleratorOrder: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json(userPrefs);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

// Update user preferences (full update)
app.put('/api/user-preferences/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const userKey = sanitizeEmail(email);
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    // Get existing or create new
    const existingPrefs = preferences.users[userKey] || {
      email: email,
      playlists: [],
      hiddenAccelerators: [],
      acceleratorOrder: [],
      createdAt: new Date().toISOString()
    };
    
    // Update with new data
    preferences.users[userKey] = {
      ...existingPrefs,
      ...req.body,
      email: email, // Ensure email stays correct
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json(preferences.users[userKey]);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Patch user preferences (partial update)
app.patch('/api/user-preferences/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const userKey = sanitizeEmail(email);
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    // Get existing or create new
    const existingPrefs = preferences.users[userKey] || {
      email: email,
      playlists: [],
      hiddenAccelerators: [],
      acceleratorOrder: [],
      createdAt: new Date().toISOString()
    };
    
    // Merge with new data
    preferences.users[userKey] = {
      ...existingPrefs,
      ...req.body,
      email: email,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json(preferences.users[userKey]);
  } catch (error) {
    console.error('Error patching user preferences:', error);
    res.status(500).json({ error: 'Failed to patch user preferences' });
  }
});

// Add playlist
app.post('/api/user-preferences/:email/playlists', async (req, res) => {
  try {
    const email = req.params.email;
    const userKey = sanitizeEmail(email);
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    // Initialize user if not exists
    if (!preferences.users[userKey]) {
      preferences.users[userKey] = {
        email: email,
        playlists: [],
        hiddenAccelerators: [],
        acceleratorOrder: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const newPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      acceleratorIds: [],
      createdAt: new Date().toISOString()
    };
    
    preferences.users[userKey].playlists.push(newPlaylist);
    preferences.users[userKey].updatedAt = new Date().toISOString();
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.status(201).json(newPlaylist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Update playlist
app.put('/api/user-preferences/:email/playlists/:playlistId', async (req, res) => {
  try {
    const email = req.params.email;
    const playlistId = req.params.playlistId;
    const userKey = sanitizeEmail(email);
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    if (!preferences.users[userKey]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const playlistIndex = preferences.users[userKey].playlists.findIndex(p => p.id === playlistId);
    if (playlistIndex === -1) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    preferences.users[userKey].playlists[playlistIndex] = {
      ...preferences.users[userKey].playlists[playlistIndex],
      ...req.body,
      id: playlistId // Ensure ID stays same
    };
    preferences.users[userKey].updatedAt = new Date().toISOString();
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json(preferences.users[userKey].playlists[playlistIndex]);
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// Delete playlist
app.delete('/api/user-preferences/:email/playlists/:playlistId', async (req, res) => {
  try {
    const email = req.params.email;
    const playlistId = req.params.playlistId;
    const userKey = sanitizeEmail(email);
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    if (!preferences.users[userKey]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const initialLength = preferences.users[userKey].playlists.length;
    preferences.users[userKey].playlists = preferences.users[userKey].playlists.filter(p => p.id !== playlistId);
    
    if (preferences.users[userKey].playlists.length === initialLength) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    preferences.users[userKey].updatedAt = new Date().toISOString();
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Toggle accelerator in playlist
app.post('/api/user-preferences/:email/playlists/:playlistId/toggle/:acceleratorId', async (req, res) => {
  try {
    const { email, playlistId, acceleratorId } = req.params;
    const userKey = sanitizeEmail(email);
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    if (!preferences.users[userKey]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const playlist = preferences.users[userKey].playlists.find(p => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    const accIdNum = parseInt(acceleratorId);
    const accIndex = playlist.acceleratorIds.indexOf(accIdNum);
    
    if (accIndex === -1) {
      playlist.acceleratorIds.push(accIdNum);
    } else {
      playlist.acceleratorIds.splice(accIndex, 1);
    }
    
    preferences.users[userKey].updatedAt = new Date().toISOString();
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json(playlist);
  } catch (error) {
    console.error('Error toggling accelerator in playlist:', error);
    res.status(500).json({ error: 'Failed to toggle accelerator' });
  }
});

// Update hidden accelerators
app.put('/api/user-preferences/:email/hidden', async (req, res) => {
  try {
    const email = req.params.email;
    const userKey = sanitizeEmail(email);
    const { hiddenAccelerators } = req.body;
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    // Initialize user if not exists
    if (!preferences.users[userKey]) {
      preferences.users[userKey] = {
        email: email,
        playlists: [],
        hiddenAccelerators: [],
        acceleratorOrder: [],
        createdAt: new Date().toISOString()
      };
    }
    
    preferences.users[userKey].hiddenAccelerators = hiddenAccelerators || [];
    preferences.users[userKey].updatedAt = new Date().toISOString();
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json({ hiddenAccelerators: preferences.users[userKey].hiddenAccelerators });
  } catch (error) {
    console.error('Error updating hidden accelerators:', error);
    res.status(500).json({ error: 'Failed to update hidden accelerators' });
  }
});

// Update accelerator order
app.put('/api/user-preferences/:email/order', async (req, res) => {
  try {
    const email = req.params.email;
    const userKey = sanitizeEmail(email);
    const { acceleratorOrder } = req.body;
    
    const preferences = await readJsonFile(USER_PREFERENCES_FILE, { users: {} });
    
    // Initialize user if not exists
    if (!preferences.users[userKey]) {
      preferences.users[userKey] = {
        email: email,
        playlists: [],
        hiddenAccelerators: [],
        acceleratorOrder: [],
        createdAt: new Date().toISOString()
      };
    }
    
    preferences.users[userKey].acceleratorOrder = acceleratorOrder || [];
    preferences.users[userKey].updatedAt = new Date().toISOString();
    
    await writeJsonFile(USER_PREFERENCES_FILE, preferences);
    res.json({ acceleratorOrder: preferences.users[userKey].acceleratorOrder });
  } catch (error) {
    console.error('Error updating accelerator order:', error);
    res.status(500).json({ error: 'Failed to update accelerator order' });
  }
});

// ============================================
// FILE UPLOAD API
// ============================================

// Upload PPTX and extract slides
app.post('/api/slidedecks/upload', upload.single('pptx'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, category, keywords } = req.body;
    const pptxPath = req.file.path;
    const originalName = req.file.originalname;
    
    // Generate folder name from filename
    const folderName = path.basename(originalName, '.pptx')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');

    console.log(`\n📁 Processing upload: ${originalName}`);
    console.log(`   Output folder: ${folderName}`);

    // Extract slides
    let extractionResult;
    try {
      extractionResult = await extractSlides(pptxPath, folderName);
      console.log(`   ✅ Extracted ${extractionResult.slideCount} slides`);
    } catch (extractError) {
      console.error(`   ❌ Extraction failed: ${extractError.message}`);
      // Clean up uploaded file on failure
      try {
        await fs.unlink(pptxPath);
      } catch (e) {}
      return res.status(500).json({ 
        error: 'Failed to extract slides', 
        details: extractError.message 
      });
    }

    // Parse keywords
    let keywordsArray = [];
    if (keywords) {
      try {
        keywordsArray = JSON.parse(keywords);
      } catch {
        keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      }
    }

    // Create slide deck entry
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    const newSlideDeck = {
      id: Date.now(),
      title: title || path.basename(originalName, '.pptx'),
      description: description || `Presentation: ${originalName}`,
      category: category || 'Enterprise Solutions',
      keywords: keywordsArray,
      slides: extractionResult.slideCount,
      author: 'AI First Lab',
      date: new Date().toISOString().split('T')[0],
      fileUrl: `/presentations/${req.file.filename}`,
      slidesFolder: folderName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    slideDecks.push(newSlideDeck);
    await writeJsonFile(SLIDEDECKS_FILE, slideDecks);

    console.log(`   ✅ Slide deck created with ID: ${newSlideDeck.id}\n`);

    res.status(201).json({
      message: 'Slide deck uploaded and processed successfully',
      slideDeck: newSlideDeck,
      extraction: extractionResult
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload', details: error.message });
  }
});

// Get extraction status / re-extract slides
app.post('/api/slidedecks/:id/extract', async (req, res) => {
  try {
    const slideDecks = await readJsonFile(SLIDEDECKS_FILE, []);
    const slideDeck = slideDecks.find(s => s.id === parseInt(req.params.id));
    
    if (!slideDeck) {
      return res.status(404).json({ error: 'Slide deck not found' });
    }

    const pptxPath = path.join(ROOT_DIR, 'public', slideDeck.fileUrl);
    
    if (!fsSync.existsSync(pptxPath)) {
      return res.status(404).json({ error: 'PPTX file not found' });
    }

    const result = await extractSlides(pptxPath, slideDeck.slidesFolder);
    
    // Update slide count
    const index = slideDecks.findIndex(s => s.id === parseInt(req.params.id));
    slideDecks[index].slides = result.slideCount;
    slideDecks[index].updatedAt = new Date().toISOString();
    await writeJsonFile(SLIDEDECKS_FILE, slideDecks);

    res.json({
      message: 'Slides re-extracted successfully',
      slideDeck: slideDecks[index],
      extraction: result
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to extract slides', details: error.message });
  }
});

// ============================================
// INITIALIZE & START SERVER
// ============================================

async function initializeServer() {
  await ensureDirectories();
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 R-AllAssist Backend Server                          ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║                                                           ║
║   API Endpoints:                                          ║
║   • GET/POST     /api/accelerators                       ║
║   • GET/PUT/DEL  /api/accelerators/:id                   ║
║   • GET/POST     /api/slidedecks                         ║
║   • GET/PUT/DEL  /api/slidedecks/:id                     ║
║   • POST         /api/slidedecks/upload (file upload)    ║
║   • POST         /api/slidedecks/:id/extract             ║
║   • GET/POST     /api/videos                             ║
║   • GET/PUT/DEL  /api/videos/:id                         ║
║   • GET/PUT/PATCH /api/user-preferences/:email           ║
║   • POST/PUT/DEL /api/user-preferences/:email/playlists  ║
║   • PUT          /api/user-preferences/:email/hidden     ║
║   • PUT          /api/user-preferences/:email/order      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

initializeServer();
