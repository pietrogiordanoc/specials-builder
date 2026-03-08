import { Block } from "../types/Block";
import { useState, useRef, useEffect } from "react";

type Props = {
  block: Block;
  isEditing?: boolean;
  onUpdateImage?: (updates: {
    imageOffsetX?: number;
    imageOffsetY?: number;
    imageScale?: number;
  }) => void;
  onUpdateContent?: (updates: {
    contentOffsetX?: number;
    contentOffsetY?: number;
  }) => void;
  onUpdateSpacing?: (spacing: number) => void;
  onUpdateHeight?: (height: number) => void;
  onUpdateDescriptionWidth?: (width: number) => void;
  onUpdateField?: (field: keyof Block, value: any) => void;
};

export default function BlockCard({ block, isEditing, onUpdateImage, onUpdateContent, onUpdateSpacing, onUpdateHeight, onUpdateDescriptionWidth, onUpdateField }: Props) {
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingContent, setIsDraggingContent] = useState(false);
  const [isDraggingSpacing, setIsDraggingSpacing] = useState(false);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [isDraggingDescriptionWidth, setIsDraggingDescriptionWidth] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialImageOffsets = useRef({ x: 0, y: 0 });
  const initialContentOffsets = useRef({ x: 0, y: 0 });
  const initialSpacing = useRef(0);
  const initialHeight = useRef(175);
  const initialDescriptionWidth = useRef(510);
  const initialScale = useRef(1);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isScaling && onUpdateImage) {
        const deltaY = e.clientY - dragStartPos.current.y;
        const scaleDelta = deltaY * -0.005;
        const newScale = Math.max(0.5, Math.min(2, initialScale.current + scaleDelta));
        
        onUpdateImage({ imageScale: Math.round(newScale * 100) / 100 });
      } else if (isDraggingImage && onUpdateImage) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        onUpdateImage({
          imageOffsetX: Math.round(initialImageOffsets.current.x + deltaX),
          imageOffsetY: Math.round(initialImageOffsets.current.y + deltaY),
        });
      } else if (isDraggingContent && onUpdateContent) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        onUpdateContent({
          contentOffsetX: Math.round(initialContentOffsets.current.x + deltaX),
          contentOffsetY: Math.round(initialContentOffsets.current.y + deltaY),
        });
      } else if (isDraggingSpacing && onUpdateSpacing) {
        const deltaY = e.clientY - dragStartPos.current.y;
        const newSpacing = Math.max(-200, Math.min(150, initialSpacing.current + deltaY));
        
        onUpdateSpacing(Math.round(newSpacing));
      } else if (isDraggingHeight && onUpdateHeight) {
        const deltaY = e.clientY - dragStartPos.current.y;
        const newHeight = Math.max(5, initialHeight.current + deltaY);
        
        onUpdateHeight(Math.round(newHeight));
      } else if (isDraggingDescriptionWidth && onUpdateDescriptionWidth) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const newWidth = Math.max(100, Math.min(800, initialDescriptionWidth.current + deltaX));
        
        onUpdateDescriptionWidth(Math.round(newWidth));
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingImage(false);
      setIsDraggingContent(false);
      setIsDraggingSpacing(false);
      setIsDraggingHeight(false);
      setIsDraggingDescriptionWidth(false);
      setIsScaling(false);
    };

    if (isDraggingImage || isDraggingContent || isDraggingSpacing || isDraggingHeight || isDraggingDescriptionWidth || isScaling) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDraggingImage, isDraggingContent, isDraggingSpacing, isDraggingHeight, isDraggingDescriptionWidth, isScaling, onUpdateImage, onUpdateContent, onUpdateSpacing, onUpdateHeight, onUpdateDescriptionWidth]);

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !onUpdateImage) return;
    
    if (e.shiftKey) {
      setIsScaling(true);
      initialScale.current = block.imageScale ?? 1;
    } else {
      setIsDraggingImage(true);
      initialImageOffsets.current = {
        x: block.imageOffsetX ?? 0,
        y: block.imageOffsetY ?? 0,
      };
    }
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const handleContentMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !onUpdateContent) return;
    
    // Don't prevent text editing if clicking on contentEditable element
    const target = e.target as HTMLElement;
    if (target.contentEditable === "true") {
      return;
    }
    
    setIsDraggingContent(true);
    initialContentOffsets.current = {
      x: block.contentOffsetX ?? 0,
      y: block.contentOffsetY ?? 0,
    };
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const handleSpacingMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !onUpdateSpacing) return;
    
    setIsDraggingSpacing(true);
    initialSpacing.current = block.blockSpacing ?? 0;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleHeightMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !onUpdateHeight) return;
    
    setIsDraggingHeight(true);
    initialHeight.current = block.blockHeight ?? 175;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDescriptionWidthMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !onUpdateDescriptionWidth) return;
    
    setIsDraggingDescriptionWidth(true);
    initialDescriptionWidth.current = block.descriptionWidth ?? 510;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isEditing || !onUpdateImage) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const currentScale = block.imageScale ?? 1;
    const newScale = Math.max(0.5, Math.min(2, currentScale + delta));
    
    onUpdateImage({ imageScale: Math.round(newScale * 100) / 100 });
  };
  if (block.template === "category_banner") {
    return (
      <div
        style={{
          marginBottom: 0,
        }}
      >
        {block.bannerImage && (
          <img
            src={block.bannerImage}
            style={{
              width: "100%",
              display: "block",
              objectFit: "cover",
            }}
          />
        )}
      </div>
    );
  }

  if (block.template === "zig_product") {
    return (
      <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          columnGap: 18,
          alignItems: "end",
          padding: "0 0 0 0",
          paddingBottom: block.blockSpacing ?? 0,
          borderBottom: "1px solid #9e9e9e",
          background: isEditing ? "#f5f5f5" : "#fff",
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "relative",
            height: block.blockHeight ?? 175,
            overflow: "visible",
            margin: 0,
            padding: 0,
            zIndex: 5,
          }}
        >
          <img
            src={block.imageSrc || `/images/products/${block.sku}.png`}
            onMouseDown={handleImageMouseDown}
            onWheel={handleWheel}
            style={{
              position: "absolute",
              left: block.imageOffsetX ?? 0,
              bottom: -(block.imageOffsetY ?? 0),
              width: 220,
              maxHeight: 220,
              objectFit: "contain",
              display: "block",
              transform: `scale(${block.imageScale ?? 1})`,
              transformOrigin: "bottom left",
              cursor: isEditing 
                ? (isDraggingImage ? "grabbing" : isScaling ? "ns-resize" : "grab") 
                : "default",
              userSelect: "none",
              zIndex: 10,
            }}
          />
        </div>

        <div
          onMouseDown={isEditing && onUpdateContent ? handleContentMouseDown : undefined}
          style={{
            paddingTop: 22,
            paddingRight: 8,
            paddingBottom: 0,
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#111",
            position: "relative",
            transform: `translate(${block.contentOffsetX ?? 0}px, ${block.contentOffsetY ?? 0}px)`,
            cursor: isEditing && onUpdateContent ? (isDraggingContent ? "grabbing" : "grab") : "default",
            userSelect: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 170px",
              columnGap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#e1251b",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: "4px 9px 3px 9px",
                  borderRadius: 10,
                  marginBottom: 8,
                  ...(block.newBadgePosition === "right" && {
                    position: "absolute",
                    right: 0,
                    top: 0,
                  }),
                }}
              >
                NEW
              </div>

              <div
                contentEditable={isEditing && onUpdateField !== undefined}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (isEditing && onUpdateField) {
                    onUpdateField("title", e.currentTarget.textContent || "");
                  }
                }}
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.624pt",
                  lineHeight: 1.15,
                  marginBottom: 6,
                  outline: isEditing ? "1px dashed #ccc" : "none",
                  padding: isEditing ? "2px 4px" : "0",
                  cursor: isEditing ? "text" : "default",
                }}
              >
                {block.title}
              </div>

              {(block.description || isEditing) && (
                <div style={{ position: "relative", width: "fit-content" }}>
                  <div
                    contentEditable={isEditing && onUpdateField !== undefined}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (isEditing && onUpdateField) {
                        onUpdateField("description", e.currentTarget.textContent || "");
                      }
                    }}
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontWeight: 400,
                      fontSize: "8pt",
                      lineHeight: 1.35,
                      color: "#333",
                      maxWidth: block.descriptionWidth ?? 510,
                      outline: isEditing ? "1px dashed #ccc" : "none",
                      padding: isEditing ? "2px 4px" : "0",
                      cursor: isEditing ? "text" : "default",
                      minHeight: isEditing && !block.description ? "20px" : "auto",
                    }}
                  >
                    {block.description || (isEditing ? "Click to add description..." : "")}
                  </div>
                  {isEditing && onUpdateDescriptionWidth && (
                    <div
                      onMouseDown={handleDescriptionWidthMouseDown}
                      style={{
                        position: "absolute",
                        right: -4,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: "ew-resize",
                        background: isDraggingDescriptionWidth ? "rgba(76, 175, 80, 0.3)" : "transparent",
                        borderRight: isDraggingDescriptionWidth ? "2px solid #4CAF50" : "2px solid transparent",
                        zIndex: 100,
                        pointerEvents: "auto",
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                textAlign: "right",
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
            >
              {block.sku && (
                <div
                  style={{
                    fontSize: "8pt",
                    lineHeight: 1.1,
                    marginBottom: 4,
                    color: "#222",
                  }}
                >
                  {block.sku}
                </div>
              )}

              {(block.packSize || isEditing) && (
                <div
                  contentEditable={isEditing && onUpdateField !== undefined}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    if (isEditing && onUpdateField) {
                      const text = e.currentTarget.textContent || "";
                      const packSize = text.replace("Pack Size ", "");
                      onUpdateField("packSize", packSize);
                    }
                  }}
                  style={{
                    fontSize: "8.5pt",
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "#111",
                    outline: isEditing ? "1px dashed #ccc" : "none",
                    padding: isEditing ? "2px 4px" : "0",
                    cursor: isEditing ? "text" : "default",
                  }}
                >
                  Pack Size {block.packSize || (isEditing ? "..." : "")}
                </div>
              )}

              {(block.price || isEditing) && (
                <div
                  contentEditable={isEditing && onUpdateField !== undefined}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    if (isEditing && onUpdateField) {
                      onUpdateField("price", e.currentTarget.textContent || "");
                    }
                  }}
                  style={{
                    fontSize: "8.5pt",
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "#d32020",
                    marginTop: 3,
                    outline: isEditing ? "1px dashed #ccc" : "none",
                    padding: isEditing ? "2px 4px" : "0",
                    cursor: isEditing ? "text" : "default",
                  }}
                >
                  {block.price || (isEditing ? "Click to add price..." : "")}
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && onUpdateHeight && (
          <div
            onMouseDown={handleHeightMouseDown}
            style={{
              position: "absolute",
              bottom: -10,
              left: 0,
              right: 0,
              height: 20,
              cursor: "ns-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                width: 60,
                height: 12,
                background: isDraggingHeight ? "#2196F3" : "#9e9e9e",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                fontWeight: "bold",
              }}
              title="Drag to adjust block height"
            >
              ⋮
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 20,
        marginBottom: 20,
        background: "#fff",
      }}
    >
      <h3>{block.title}</h3>
      {block.sku && <div>SKU: {block.sku}</div>}
      {block.packSize && <div>Pack: {block.packSize}</div>}
      {block.price && <div>Price: {block.price}</div>}
    </div>
  );
}
