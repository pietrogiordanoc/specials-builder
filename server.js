import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const brandName = req.body.brandName || 'Default';
    const brandPath = path.join(__dirname, '_BRANDS', brandName);
    
    // Create brand folder if it doesn't exist
    if (!fs.existsSync(brandPath)) {
      fs.mkdirSync(brandPath, { recursive: true });
    }
    
    cb(null, brandPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// API: Save block
app.post('/api/blocks', (req, res) => {
  try {
    const { brandName, blockId, blockData } = req.body;
    
    if (!brandName || !blockId || !blockData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create brand folder if it doesn't exist
    const brandPath = path.join(__dirname, '_BRANDS', brandName);
    if (!fs.existsSync(brandPath)) {
      fs.mkdirSync(brandPath, { recursive: true });
    }
    
    // Save block JSON file
    const blockFilePath = path.join(brandPath, `${blockId}.json`);
    fs.writeFileSync(blockFilePath, JSON.stringify(blockData, null, 2));
    
    // Update library.json
    updateLibraryJson(brandName, blockId);
    
    res.json({ 
      success: true, 
      message: 'Block saved successfully',
      path: blockFilePath 
    });
  } catch (error) {
    console.error('Error saving block:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload image
app.post('/api/images', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    res.json({ 
      success: true, 
      message: 'Image uploaded successfully',
      path: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get all brands (auto-discover from _BRANDS folder)
app.get('/api/brands', (req, res) => {
  try {
    const brandsPath = path.join(__dirname, '_BRANDS');
    
    if (!fs.existsSync(brandsPath)) {
      return res.json({ brands: [] });
    }
    
    const brands = [];
    const folders = fs.readdirSync(brandsPath, { withFileTypes: true });
    
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const brandPath = path.join(brandsPath, folder.name);
        const files = fs.readdirSync(brandPath);
        const blockFiles = files
          .filter(file => file.endsWith('.json'))
          .map(file => `${folder.name}/${file}`);
        
        if (blockFiles.length > 0) {
          brands.push({
            id: folder.name.toLowerCase().replace(/\s+/g, '-'),
            name: folder.name,
            blockFiles
          });
        }
      }
    }
    
    res.json({ brands });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Refresh library.json (regenerate from file system)
app.post('/api/library/refresh', (req, res) => {
  try {
    const brandsPath = path.join(__dirname, '_BRANDS');
    
    if (!fs.existsSync(brandsPath)) {
      return res.status(404).json({ error: '_BRANDS folder not found' });
    }
    
    const brands = [];
    const folders = fs.readdirSync(brandsPath, { withFileTypes: true });
    
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const brandPath = path.join(brandsPath, folder.name);
        const files = fs.readdirSync(brandPath);
        const blockFiles = files
          .filter(file => file.endsWith('.json'))
          .map(file => `${folder.name}/${file}`);
        
        if (blockFiles.length > 0) {
          brands.push({
            id: folder.name.toLowerCase().replace(/\s+/g, '-'),
            name: folder.name,
            blockFiles
          });
        }
      }
    }
    
    // Update library.json
    const libraryPath = path.join(__dirname, 'src', 'data', 'library.json');
    const libraryData = { brands };
    fs.writeFileSync(libraryPath, JSON.stringify(libraryData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Library refreshed successfully',
      brands 
    });
  } catch (error) {
    console.error('Error refreshing library:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update library.json
function updateLibraryJson(brandName, blockId) {
  const libraryPath = path.join(__dirname, 'src', 'data', 'library.json');
  
  let library = { brands: [] };
  
  // Read existing library
  if (fs.existsSync(libraryPath)) {
    const libraryContent = fs.readFileSync(libraryPath, 'utf-8');
    library = JSON.parse(libraryContent);
  }
  
  // Find or create brand
  const brandId = brandName.toLowerCase().replace(/\s+/g, '-');
  let brand = library.brands.find(b => b.id === brandId);
  
  if (!brand) {
    brand = {
      id: brandId,
      name: brandName,
      blockFiles: []
    };
    library.brands.push(brand);
  }
  
  // Add block file if not exists
  const blockFileName = `${brandName}/${blockId}.json`;
  if (!brand.blockFiles.includes(blockFileName)) {
    brand.blockFiles.push(blockFileName);
  }
  
  // Save updated library
  fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
}

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
});
