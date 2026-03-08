import { useState, useEffect, useRef } from "react";
import { Block } from "../types/Block";
import BlockCard from "../components/BlockCard";
import libraryData from "../data/library.json";
import html2canvas from "html2canvas";

// Estructura de marcas y productos
interface Brand {
  id: string;
  name: string;
  blockFiles: string[];
}

// Estructura de slices para exportación
interface Slice {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Cache de bloques cargados (base de datos en memoria)
const blockCache: Map<string, Block> = new Map();

// Función para cargar un bloque desde su archivo JSON
async function loadBlock(blockPath: string): Promise<Block | null> {
  // Si ya está en cache, devolverlo
  if (blockCache.has(blockPath)) {
    return blockCache.get(blockPath)!;
  }
  
  try {
    console.log(`Loading block from: /_BRANDS/${blockPath}`);
    const response = await fetch(`/_BRANDS/${blockPath}`);
    if (!response.ok) throw new Error(`Failed to load block: ${blockPath}`);
    const block: Block = await response.json();
    console.log(`Loaded block:`, block.id, block);
    blockCache.set(blockPath, block);
    return block;
  } catch (error) {
    console.error(`Error loading block ${blockPath}:`, error);
    return null;
  }
}

// Función para cargar todos los bloques de una marca
async function loadBrandBlocks(blockFiles: string[]): Promise<Block[]> {
  const promises = blockFiles.map(file => loadBlock(file));
  const results = await Promise.all(promises);
  return results.filter((block): block is Block => block !== null);
}

const brands: Brand[] = libraryData.brands.map((brand: any) => ({
  id: brand.id,
  name: brand.name,
  blockFiles: brand.blockFiles || [],
}));

export default function CampaignBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [libraryBlocks, setLibraryBlocks] = useState<Map<string, Block[]>>(new Map());
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignName, setCampaignName] = useState<string>("SOTW - " + new Date().toISOString().split("T")[0]);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set(["delizie"]));
  const [draggedLibraryBlock, setDraggedLibraryBlock] = useState<Block | null>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "slice">("edit");
  const [slices, setSlices] = useState<Slice[]>([]);
  const [drawingSlice, setDrawingSlice] = useState<{startX: number; startY: number; currentX: number; currentY: number} | null>(null);
  const campaignRef = useRef<HTMLDivElement>(null);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string; message: string; type: 'success' | 'warning' | 'error' | 'info'} | null>(null);
  const [saveBlockModal, setSaveBlockModal] = useState<{block: Block; brandName: string; blockId: string; imageName: string; imageFile: File | null} | null>(null);

  const showModal = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setModalContent({ title, message, type });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const openSaveBlockModal = (block: Block) => {
    // Extract brand name from imageSrc path if available
    const pathMatch = block.imageSrc?.match(/_BRANDS\/([^/]+)\//);  const existingBrand = pathMatch ? pathMatch[1] : 'New Brand';
    const existingId = block.originalId || block.sku || 'NEW-ID';
    const imageMatch = block.imageSrc?.match(/\/([^/]+\.png)$/i);
    const existingImage = imageMatch ? imageMatch[1] : `${existingId}.png`;
    
    setSaveBlockModal({
      block,
      brandName: existingBrand,
      blockId: existingId,
      imageName: existingImage,
      imageFile: null,
    });
  };

  const closeSaveBlockModal = () => {
    setSaveBlockModal(null);
  };

  const saveBlockAsNew = async () => {
    if (!saveBlockModal) return;
    
    const { block, brandName, blockId, imageName, imageFile } = saveBlockModal;
    
    try {
      // Upload image first if provided
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('brandName', brandName);
        
        const imageResponse = await fetch('http://localhost:3001/api/images', {
          method: 'POST',
          body: formData,
        });
        
        if (!imageResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        console.log('Image uploaded successfully');
      }
      
      // Create clean block data
      const blockData = {
        id: blockId,
        title: block.title,
        sku: blockId,
        imageSrc: `/_BRANDS/${brandName}/${imageName}`,
        imageOffsetX: block.imageOffsetX || 0,
        imageOffsetY: block.imageOffsetY || 0,
        imageScale: block.imageScale || 1,
        price: block.price || '$0.00',
        packSize: block.packSize || '',
        description: block.description || '',
        template: block.template || 'zig_product',
        visible: true,
      };
      
      // Send block data to backend API
      const response = await fetch('http://localhost:3001/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName,
          blockId,
          blockData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save block');
      }
      
      const result = await response.json();
      console.log('Block saved:', result);
      
      closeSaveBlockModal();
      
      setTimeout(() => {
        showModal(
          'Block Saved! 💾',
          `Block "${blockId}" saved successfully to _BRANDS/${brandName}/!\n\n${imageFile ? '✅ Image uploaded\n' : '⚠️ Don\'t forget to add the image manually\n'}✅ library.json updated automatically\n\nReload the page (F5) to see it in the library.`,
          'success'
        );
      }, 300);
    } catch (error) {
      console.error('Error saving block:', error);
      showModal(
        'Save Error',
        `Could not save block.\n\nError: ${error}\n\nMake sure the backend server is running (npm run dev).`,
        'error'
      );
    }
  };

  // Load library blocks from JSON files on mount
  useEffect(() => {
    async function loadLibrary() {
      console.log('Loading library blocks...');
      const newLibraryBlocks = new Map<string, Block[]>();
      for (const brand of brands) {
        const blocks = await loadBrandBlocks(brand.blockFiles);
        console.log(`Loaded ${blocks.length} blocks for brand: ${brand.id}`);
        newLibraryBlocks.set(brand.id, blocks);
      }
      setLibraryBlocks(newLibraryBlocks);
      setLibraryLoaded(true);
      console.log('Library blocks loaded:', newLibraryBlocks);
      console.log('Block cache size:', blockCache.size);
    }
    loadLibrary();
  }, []);

  // Load campaign from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("currentCampaign");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // New format: array of block IDs
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
          // Load blocks from cache by ID
          const loadedBlocks: Block[] = [];
          for (const blockId of parsed) {
            // Find block in cache by ID
            const block = Array.from(blockCache.values()).find(b => b.id === blockId);
            if (block) {
              loadedBlocks.push({ ...block, originalId: block.id, id: `block-${Date.now()}-${Math.random()}` });
            }
          }
          setBlocks(loadedBlocks);
        } 
        // Old format with full block objects
        else if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
          setBlocks(parsed);
        } 
        // Object format
        else if (parsed.blocks) {
          if (Array.isArray(parsed.blocks) && typeof parsed.blocks[0] === 'string') {
            // Array of IDs
            const loadedBlocks: Block[] = [];
            for (const blockId of parsed.blocks) {
              const block = Array.from(blockCache.values()).find(b => b.id === blockId);
              if (block) {
                loadedBlocks.push({ ...block, originalId: block.id, id: `block-${Date.now()}-${Math.random()}` });
              }
            }
            setBlocks(loadedBlocks);
          } else {
            // Array of full objects (old format)
            setBlocks(parsed.blocks);
          }
          if (parsed.name) setCampaignName(parsed.name);
        }
      } catch (e) {
        console.error("Error loading campaign:", e);
      }
    }
  }, [libraryBlocks]); // Wait for library to load first

  // Auto-save to localStorage when blocks change (save only IDs)
  useEffect(() => {
    if (blocks.length > 0) {
      const blockIds = blocks.map(b => b.id);
      const campaign = {
        name: campaignName,
        blockIds: blockIds,
      };
      localStorage.setItem("currentCampaign", JSON.stringify(campaign));
    }
  }, [blocks, campaignName]);

  const exportCampaign = () => {
    // Export full block data with all modifications
    const campaign = {
      name: campaignName,
      blocks: blocks.map(b => ({
        ...b,
        // Keep originalId for reference, remove temporary canvas id
        id: b.originalId || b.id,
      })),
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(campaign, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = campaignName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `${safeName}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    // Show instructions after download
    setTimeout(() => {
      showModal(
        'Campaign Exported! 📁',
        `File downloaded: ${safeName}.json\n\nYour campaign with all block modifications has been saved.\n\nTo load it later, click "Open from File" and select this JSON file.`,
        'success'
      );
    }, 500);
  };

  const exportAllBlocks = () => {
    if (blocks.length === 0) {
      showModal('No Blocks', 'Add some blocks to the campaign first!', 'warning');
      return;
    }

    // Group blocks by their original ID to avoid duplicates
    const uniqueBlocks = new Map<string, Block>();
    blocks.forEach(block => {
      // Use SKU as the key to deduplicate
      const key = block.sku || block.id;
      if (!uniqueBlocks.has(key)) {
        uniqueBlocks.set(key, block);
      }
    });

    // Export each unique block as a separate JSON file
    uniqueBlocks.forEach((block, originalId) => {
      // Create a clean copy with the original ID
      const blockData = {
        id: originalId,
        title: block.title,
        sku: block.sku,
        price: block.price,
        packSize: block.packSize,
        description: block.description,
        bannerImage: block.bannerImage,
        imageSrc: block.imageSrc,
        imageOffsetY: block.imageOffsetY,
        imageOffsetX: block.imageOffsetX,
        imageScale: block.imageScale,
        newBadgePosition: block.newBadgePosition,
        contentOffsetX: block.contentOffsetX,
        contentOffsetY: block.contentOffsetY,
        blockSpacing: block.blockSpacing,
        blockHeight: block.blockHeight,
        descriptionWidth: block.descriptionWidth,
        template: block.template,
        visible: block.visible,
      };

      // Remove undefined values
      Object.keys(blockData).forEach(key => {
        if (blockData[key as keyof typeof blockData] === undefined) {
          delete blockData[key as keyof typeof blockData];
        }
      });

      const dataStr = JSON.stringify(blockData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${originalId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });

    showModal(
      'Blocks Exported! 📦',
      `Exported ${uniqueBlocks.size} unique block(s).\n\nReplace the downloaded files in:\n_BRANDS/[Brand Name]/ folder`,
      'success'
    );
  };

  const importCampaign = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!libraryLoaded) {
      showModal(
        'Please Wait',
        'Library is still loading...\n\nTry again in a few seconds.',
        'info'
      );
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        console.log('Importing campaign:', imported);
        
        // New format with full blocks data
        if (imported.blocks && Array.isArray(imported.blocks)) {
          // Load blocks directly with new canvas IDs
          const loadedBlocks: Block[] = imported.blocks.map((block: any) => ({
            ...block,
            originalId: block.id,
            id: `block-${Date.now()}-${Math.random()}`,
          }));
          
          setBlocks(loadedBlocks);
          if (imported.name) setCampaignName(imported.name);
          
          showModal(
            'Campaign Loaded!',
            `Successfully imported ${loadedBlocks.length} block(s) with all modifications.`,
            'success'
          );
        }
        // Legacy format with blockIds (for backwards compatibility)
        else if (imported.blockIds && Array.isArray(imported.blockIds)) {
          const loadedBlocks: Block[] = [];
          const notFound: string[] = [];
          
          for (const blockId of imported.blockIds) {
            const block = Array.from(blockCache.values()).find(b => b.id === blockId);
            if (block) {
              loadedBlocks.push({ ...block, originalId: block.id, id: `block-${Date.now()}-${Math.random()}` });
              console.log(`Found block ${blockId}`);
            } else {
              notFound.push(blockId);
              console.warn(`Block not found: ${blockId}`);
            }
          }
          
          if (notFound.length > 0) {
            showModal(
              'Some Blocks Missing',
              `Missing blocks: ${notFound.join(', ')}\n\nMake sure all blocks are in _BRANDS/ folder.\n\nLoaded ${loadedBlocks.length} of ${imported.blockIds.length} blocks.`,
              'warning'
            );
          }
          
          setBlocks(loadedBlocks);
          if (imported.name) setCampaignName(imported.name);
          
          if (loadedBlocks.length > 0) {
            showModal(
              'Campaign Loaded!',
              `Successfully imported ${loadedBlocks.length} blocks.`,
              'success'
            );
          }
        } 
        // Old format with full block objects (backwards compatibility)
        else if (Array.isArray(imported)) {
          setBlocks(imported);
        }
      } catch (error) {
        console.error('Import error:', error);
        showModal('Import Error', 'Could not read campaign file.\n\nMake sure it\'s a valid JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const toggleBrand = (brandId: string) => {
    setExpandedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  };

  const addBlockFromLibrary = (libraryBlock: Block) => {
    // Check if product already exists in campaign
    const alreadyExists = blocks.some(
      (b) => b.sku === libraryBlock.sku || b.id === libraryBlock.id
    );
    
    if (alreadyExists) {
      return; // Don't add duplicates
    }
    
    const newBlock: Block = {
      ...libraryBlock,
      originalId: libraryBlock.id,
      id: `block-${Date.now()}-${Math.random()}`,
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleLibraryDragStart = (block: Block) => {
    setDraggedLibraryBlock(block);
  };

  const handleCampaignDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCampaignDrop = (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    if (draggedLibraryBlock) {
      console.log('Dropping block:', draggedLibraryBlock);
      
      // Check if product already exists in campaign
      const alreadyExists = blocks.some(
        (b) => b.sku === draggedLibraryBlock.sku || b.id === draggedLibraryBlock.id
      );
      
      if (alreadyExists) {
        setDraggedLibraryBlock(null);
        return; // Don't add duplicates
      }
      
      const newBlock: Block = {
        ...draggedLibraryBlock,
        originalId: draggedLibraryBlock.id,
        id: `block-${Date.now()}-${Math.random()}`,
      };
      console.log('New block created with imageSrc:', newBlock.imageSrc);
      
      if (insertIndex !== undefined) {
        const newBlocks = [...blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        setBlocks(newBlocks);
      } else {
        setBlocks([...blocks, newBlock]);
      }
      setDraggedLibraryBlock(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedBlockIndex(index);
    setEditingBlockId(null); // Close editing when dragging
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === index) return;

    setDropTargetIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedBlockIndex === null) return;

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedBlockIndex];
    
    newBlocks.splice(draggedBlockIndex, 1);
    newBlocks.splice(index, 0, draggedBlock);
    
    setBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
    setDropTargetIndex(null);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];

    setBlocks(newBlocks);
  };

  const updateBlock = (id: string, field: keyof Block, value: any) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
      )
    );
  };

  // Slice functions
  const exportSlices = async () => {
    if (!campaignRef.current || slices.length === 0) return;

    for (const slice of slices) {
      try {
        const canvas = await html2canvas(campaignRef.current, {
          x: slice.x,
          y: slice.y,
          width: slice.width,
          height: slice.height,
          scale: 2, // Higher quality
          backgroundColor: "#ffffff",
          logging: false,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${campaignName}-${slice.name}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      } catch (error) {
        console.error(`Error exporting slice ${slice.name}:`, error);
      }
    }
  };

  const handleSliceMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "slice" || !campaignRef.current) return;
    
    const rect = campaignRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + campaignRef.current.scrollLeft;
    const y = e.clientY - rect.top + campaignRef.current.scrollTop;
    
    setDrawingSlice({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  const handleSliceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "slice" || !drawingSlice ||!campaignRef.current) return;
    
    const rect = campaignRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + campaignRef.current.scrollLeft;
    const y = e.clientY - rect.top + campaignRef.current.scrollTop;
    
    setDrawingSlice({
      ...drawingSlice,
      currentX: x,
      currentY: y,
    });
  };

  const handleSliceMouseUp = () => {
    if (mode !== "slice" || !drawingSlice) return;
    
    const x = Math.min(drawingSlice.startX, drawingSlice.currentX);
    const y = Math.min(drawingSlice.startY, drawingSlice.currentY);
    const width = Math.abs(drawingSlice.currentX - drawingSlice.startX);
    const height = Math.abs(drawingSlice.currentY - drawingSlice.startY);
    
    if (width > 10 && height > 10) { // Minimum size
      const newSlice: Slice = {
        id: `slice-${Date.now()}`,
        name: `slice-${slices.length + 1}`,
        x,
        y,
        width,
        height,
      };
      setSlices([...slices, newSlice]);
    }
    
    setDrawingSlice(null);
  };

  const deleteSlice = (id: string) => {
    setSlices(slices.filter(s => s.id !== id));
  };

  const updateSliceName = (id: string, name: string) => {
    setSlices(slices.map(s => s.id === id ? {...s, name} : s));
  };

  const openEditor = (blockId: string) => {
    setEditingBlockId(blockId);
  };

  const closeEditor = () => {
    setEditingBlockId(null);
  };

  const toggleEditor = (blockId: string) => {
    setEditingBlockId((prev) => (prev === blockId ? null : blockId));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Left Panel - Controls */}
      <div
        style={{
          width: 280,
          height: "100vh",
          overflowY: "auto",
          background: "#ffffff",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          borderRight: "1px solid #e5e7eb",
          boxShadow: "2px 0 8px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#1f2937", letterSpacing: "-0.02em" }}>
            Campaign
          </h1>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Builder & Settings
          </div>
        </div>

        {/* Campaign Name */}
        <div>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#f9fafb",
              color: "#1f2937",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              boxShadow: "none",
              boxSizing: "border-box",
              transition: "all 0.2s",
              fontWeight: 500,
            }}
            onFocus={(e) => {
              e.target.style.background = "#ffffff";
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "none";
            }}
            onBlur={(e) => {
              e.target.style.background = "#f9fafb";
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Mode Toggle */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Mode
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setMode("edit")}
              style={{
                flex: 1,
                padding: "7px 10px",
                background: mode === "edit" ? "#3b82f6" : "#ffffff",
                color: mode === "edit" ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: mode === "edit" ? "#3b82f6" : "#e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 11,
                transition: "all 0.2s",
              }}
            >
              ✏️
            </button>
            <button
              onClick={() => setMode("preview")}
              style={{
                flex: 1,
                padding: "7px 10px",
                background: mode === "preview" ? "#10b981" : "#ffffff",
                color: mode === "preview" ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: mode === "preview" ? "#10b981" : "#e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 11,
                transition: "all 0.2s",
              }}
            >
              👁️
            </button>
            <button
              onClick={() => setMode("slice")}
              style={{
                flex: 1,
                padding: "7px 10px",
                background: mode === "slice" ? "#f59e0b" : "#ffffff",
                color: mode === "slice" ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: mode === "slice" ? "#f59e0b" : "#e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 11,
                transition: "all 0.2s",
              }}
            >
              ✂️
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "#e5e7eb" }} />

        {/* Campaign Actions */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Actions
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={exportCampaign}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#8b5cf6",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.25)",
              }}
              title="Download campaign as JSON file"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7c3aed";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#8b5cf6";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(139, 92, 246, 0.25)";
              }}
            >
              <span style={{ fontSize: 16 }}>💾</span>
              <span>Export Campaign</span>
            </button>

            <button
              onClick={exportAllBlocks}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#f59e0b",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)",
              }}
              title="Download all block configurations as JSON files"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#d97706";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f59e0b";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.25)";
              }}
            >
              <span style={{ fontSize: 16 }}>📦</span>
              <span>Export All Blocks</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#14b8a6",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(20, 184, 166, 0.25)",
              }}
              title="Open campaign from JSON file"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0d9488";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(20, 184, 166, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#14b8a6";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(20, 184, 166, 0.25)";
              }}
            >
              <span style={{ fontSize: 16 }}>📂</span>
              <span>Open from File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importCampaign}
              style={{ display: "none" }}
            />

            <button
              onClick={() => {
                if (confirm("Clear current campaign and start fresh?")) {
                  setBlocks([]);
                  localStorage.removeItem("currentCampaign");
                }
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#ffffff",
                color: "#ef4444",
                border: "1px solid #fee2e2",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              title="Clear campaign and start new"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#fee2e2";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={{ fontSize: 16 }}>✨</span>
              <span>New Campaign</span>
            </button>
          </div>
        </div>

        {/* Slices Management */}
        {mode === "slice" && (
          <div>
            <div
              style={{
                padding: "12px",
                background: "#fffbeb",
                borderRadius: 8,
                border: "1px solid #fde68a",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                ✂️ Slices ({slices.length})
              </div>
              
              {slices.length === 0 ? (
                <div style={{ fontSize: 12, color: "#78716c", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
                  Draw rectangles on the campaign to create slices
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {slices.map((slice, idx) => (
                    <div
                      key={slice.id}
                      style={{
                        background: "#ffffff",
                        padding: "8px",
                        borderRadius: 6,
                        border: "1px solid #fde68a",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", minWidth: 20 }}>
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={slice.name}
                          onChange={(e) => updateSliceName(slice.id, e.target.value)}
                          style={{
                            flex: 1,
                            padding: "4px 6px",
                            fontSize: 11,
                            border: "1px solid #e5e7eb",
                            borderRadius: 4,
                            outline: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={() => deleteSlice(slice.id)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 6px",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="Delete slice"
                        >
                          🗑️
                        </button>
                      </div>
                      <div style={{ fontSize: 10, color: "#78716c", paddingLeft: 26 }}>
                        {slice.width}×{slice.height}px
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {slices.length > 0 && (
                <button
                  onClick={exportSlices}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: "8px 12px",
                    background: "#f59e0b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  title="Export all slices as PNG files"
                >
                  📥 Export All Slices
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <div
            style={{
              padding: "12px",
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Statistics
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Total Blocks</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{blocks.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Campaign Area */}
      <div style={{ flex: 1, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", background: "#f8f9fa" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            padding: "20px",
          }}
        >
          <div
            ref={campaignRef}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
              padding: "40px 30px",
              paddingLeft: mode === "edit" ? "60px" : "30px",
              minHeight: 500,
              position: "relative",
              cursor: mode === "slice" ? "crosshair" : "default",
            }}
            onDragOver={handleCampaignDragOver}
            onDrop={(e) => handleCampaignDrop(e)}
            onMouseDown={mode === "slice" ? handleSliceMouseDown : undefined}
            onMouseMove={mode === "slice" ? handleSliceMouseMove : undefined}
            onMouseUp={mode === "slice" ? handleSliceMouseUp : undefined}
          >
        {blocks.map((block, index) => (
            <div 
              key={block.id}
              draggable={mode === "edit" && editingBlockId !== block.id}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              style={{
                position: "relative",
                opacity: draggedBlockIndex === index ? 0.5 : 1,
                transition: "opacity 0.2s",
                cursor: mode === "edit" && draggedBlockIndex !== null ? "grabbing" : "default",
              }}
              onDoubleClick={() => {
                if (mode === "edit") {
                  if (editingBlockId === block.id) {
                    closeEditor();
                  } else {
                    openEditor(block.id);
                  }
                }
              }}
            >
              {dropTargetIndex === index && draggedBlockIndex !== null && draggedBlockIndex !== index && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "#4CAF50",
                    zIndex: 100,
                    boxShadow: "0 0 8px rgba(76, 175, 80, 0.6)",
                  }}
                />
              )}
              
              {mode === "edit" && (
                <div
                  style={{
                    position: "absolute",
                    left: -24,
                    top: 10,
                    width: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      width: 20,
                      height: 80,
                      background: "linear-gradient(135deg, #555 0%, #333 100%)",
                      borderRadius: "6px",
                      cursor: draggedBlockIndex === index ? "grabbing" : "grab",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      color: "#fff",
                      fontSize: 8,
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div>⋮</div>
                    <div>⋮</div>
                    <div>⋮</div>
                  </div>
                  <button
                    onClick={() => openSaveBlockModal(block)}
                    style={{
                      width: 32,
                      height: 32,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "all 0.2s",
                      marginBottom: 4,
                    }}
                    title="Save as new block"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#10b981";
                      e.currentTarget.style.borderColor = "#10b981";
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                    }}
                  >
                    💾
                  </button>
                  <button
                    onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))}
                    style={{
                      width: 32,
                      height: 32,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "all 0.2s",
                    }}
                    title="Remove from campaign"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ef4444";
                      e.currentTarget.style.borderColor = "#ef4444";
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                    }}
                  >
                    ❌
                  </button>
                </div>
              )}

            <BlockCard
              block={block}
              isEditing={mode === "edit" && editingBlockId === block.id}
              onUpdateImage={(updates) => {
                if (updates.imageOffsetX !== undefined) {
                  updateBlock(block.id, "imageOffsetX", updates.imageOffsetX);
                }
                if (updates.imageOffsetY !== undefined) {
                  updateBlock(block.id, "imageOffsetY", updates.imageOffsetY);
                }
                if (updates.imageScale !== undefined) {
                  updateBlock(block.id, "imageScale", updates.imageScale);
                }
              }}
              onUpdateContent={(updates) => {
                if (updates.contentOffsetX !== undefined) {
                  updateBlock(block.id, "contentOffsetX", updates.contentOffsetX);
                }
                if (updates.contentOffsetY !== undefined) {
                  updateBlock(block.id, "contentOffsetY", updates.contentOffsetY);
                }
              }}
              onUpdateSpacing={(spacing) => {
                updateBlock(block.id, "blockSpacing", spacing);
              }}
              onUpdateHeight={(height) => {
                updateBlock(block.id, "blockHeight", height);
              }}
              onUpdateDescriptionWidth={(width) => {
                updateBlock(block.id, "descriptionWidth", width);
              }}
              onUpdateField={(field, value) => {
                updateBlock(block.id, field, value);
              }}
            />
          </div>
        ))}
        
        {/* Slice Overlay */}
        {mode === "slice" && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
            {/* Existing Slices */}
            {slices.map((slice, idx) => (
              <div
                key={slice.id}
                style={{
                  position: "absolute",
                  left: slice.x,
                  top: slice.y,
                  width: slice.width,
                  height: slice.height,
                  border: "2px solid #f59e0b",
                  background: "rgba(245, 158, 11, 0.1)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: 4,
                }}
              >
                <div style={{
                  background: "#f59e0b",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                }}>
                  {idx + 1}. {slice.name}
                </div>
              </div>
            ))}
            
            {/* Drawing Slice */}
            {drawingSlice && (
              <div
                style={{
                  position: "absolute",
                  left: Math.min(drawingSlice.startX, drawingSlice.currentX),
                  top: Math.min(drawingSlice.startY, drawingSlice.currentY),
                  width: Math.abs(drawingSlice.currentX - drawingSlice.startX),
                  height: Math.abs(drawingSlice.currentY - drawingSlice.startY),
                  border: "2px dashed #3b82f6",
                  background: "rgba(59, 130, 246, 0.1)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{
                  background: "#3b82f6",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}>
                  {Math.abs(drawingSlice.currentX - drawingSlice.startX)}×{Math.abs(drawingSlice.currentY - drawingSlice.startY)}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Library Sidebar - Brands Accordion */}
      <div
        style={{
          width: 340,
          height: "100vh",
          overflowY: "auto",
          borderLeft: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1f2937", letterSpacing: "-0.01em" }}>
            Library
          </h2>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Drag blocks to add
          </div>
        </div>

        {/* Brands List */}
        <div style={{ padding: "12px" }}>
          {brands.map((brand) => {
            const isExpanded = expandedBrands.has(brand.id);
            
            return (
              <div key={brand.id} style={{ marginBottom: 8 }}>
                {/* Brand Header */}
                <button
                  onClick={() => toggleBrand(brand.id)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: isExpanded ? "#f9fafb" : "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.background = isExpanded ? "#f9fafb" : "#ffffff";
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                    {brand.name}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                    ›
                  </span>
                </button>

                {/* Products List (Collapsed/Expanded) */}
                {isExpanded && (
                  <div style={{ padding: "12px 0 0 0" }}>
                    {(libraryBlocks.get(brand.id) || []).map((product) => {
                      const alreadyInCampaign = blocks.some(
                        (b) => b.sku === product.sku || b.id === product.id
                      );

                      return (
                        <div
                          key={product.id}
                          draggable={!alreadyInCampaign}
                          onDragStart={() => !alreadyInCampaign && handleLibraryDragStart(product)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: 8,
                            marginBottom: 10,
                            cursor: alreadyInCampaign ? "not-allowed" : "grab",
                            transition: "all 0.2s",
                            opacity: alreadyInCampaign ? 0.4 : 1,
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            if (!alreadyInCampaign) {
                              e.currentTarget.style.borderColor = "#3b82f6";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          {/* Mini Block Preview - Grid Layout */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "85px 1fr",
                              gap: 8,
                              minHeight: 55,
                            }}
                          >
                            {/* Image Container */}
                            <div
                              style={{
                                position: "relative",
                                overflow: "hidden",
                                background: "#f9fafb",
                                borderRadius: 6,
                                border: "1px solid #f3f4f6",
                              }}
                            >
                              {(product.imageSrc || product.bannerImage) && (
                                <img
                                  src={product.imageSrc || product.bannerImage || ""}
                                  alt={product.sku || product.title || ""}
                                  style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "auto",
                                    top: product.template === "category_banner" ? "50%" : `${(product.imageOffsetY || 0) / 2}px`,
                                    left: product.template === "category_banner" ? "50%" : `${(product.imageOffsetX || 0) / 2}px`,
                                    transform: product.template === "category_banner" 
                                      ? "translate(-50%, -50%) scale(0.5)" 
                                      : `scale(${(product.imageScale || 1) * 0.8})`,
                                    transformOrigin: product.template === "category_banner" ? "center" : "top left",
                                  }}
                                />
                              )}
                            </div>

                            {/* Content Container */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                overflow: "hidden",
                              }}
                            >
                              {/* Title */}
                              <div
                                style={{
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: "#333",
                                  lineHeight: 1.2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  marginBottom: 2,
                                }}
                              >
                                {product.title || "Untitled"}
                              </div>

                              {/* SKU & Price */}
                              <div>
                                {product.sku && (
                                  <div
                                    style={{
                                      fontSize: 7,
                                      fontWeight: 600,
                                      color: "#666",
                                      marginBottom: 1,
                                    }}
                                  >
                                    {product.sku}
                                  </div>
                                )}
                                {product.price && (
                                  <div
                                    style={{
                                      fontSize: 7,
                                      fontWeight: 700,
                                      color: "#000",
                                    }}
                                  >
                                    {product.price.split(" ")[0]}
                                  </div>
                                )}
                              </div>

                              {/* Description snippet */}
                              {product.description && (
                                <div
                                  style={{
                                    fontSize: 6.5,
                                    color: "#888",
                                    lineHeight: 1.15,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    marginTop: 2,
                                  }}
                                >
                                  {product.description.substring(0, 80)}...
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          {alreadyInCampaign && (
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "#10b981",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                              }}
                              title="Already in campaign"
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Modal */}
      {modalContent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(4px)",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "32px",
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              position: "relative",
              animation: "modalSlideIn 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 32 }}>
                {modalContent.type === 'success' && '✅'}
                {modalContent.type === 'warning' && '⚠️'}
                {modalContent.type === 'error' && '❌'}
                {modalContent.type === 'info' && 'ℹ️'}
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                {modalContent.title}
              </h2>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#64748b",
                whiteSpace: "pre-line",
              }}
            >
              {modalContent.message}
            </p>
            <button
              onClick={closeModal}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "12px",
                background: "#14b8a6",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0d9488";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#14b8a6";
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Save Block Modal */}
      {saveBlockModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(4px)",
          }}
          onClick={closeSaveBlockModal}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "32px",
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              position: "relative",
              animation: "modalSlideIn 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 32 }}>💾</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Save Block as New
              </h2>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Brand Name
              </label>
              <input
                type="text"
                value={saveBlockModal.brandName}
                onChange={(e) => setSaveBlockModal({...saveBlockModal, brandName: e.target.value})}
                placeholder="e.g., Delizie Di Calabria"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Block ID / SKU
              </label>
              <input
                type="text"
                value={saveBlockModal.blockId}
                onChange={(e) => setSaveBlockModal({...saveBlockModal, blockId: e.target.value})}
                placeholder="e.g., TC25"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Image Filename
              </label>
              <input
                type="text"
                value={saveBlockModal.imageName}
                onChange={(e) => setSaveBlockModal({...saveBlockModal, imageName: e.target.value})}
                placeholder="e.g., TC25.png"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Upload Image (optional)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSaveBlockModal({
                      ...saveBlockModal, 
                      imageFile: file,
                      imageName: file.name
                    });
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              />
              {saveBlockModal.imageFile && (
                <div style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#166534",
                }}>
                  ✅ {saveBlockModal.imageFile.name} selected
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={closeSaveBlockModal}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveBlockAsNew}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#059669";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#10b981";
                }}
              >
                Save Block
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
