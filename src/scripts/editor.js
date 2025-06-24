console.log('Script file loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Script is running!');
    
    const undoButton = document.getElementById('undo-button');
    console.log('Undo button found:', !!undoButton);
    
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            console.log('UNDO BUTTON CLICKED!');
        });
    }
});

// Replace with:

console.log('Script file loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Script is running!');
    
    const mainContent = document.querySelector('.main-content');
    const markerToolButton = document.getElementById('marker-tool-button');
    const fileInput = document.getElementById('file-input');
    const customButtonEdicao = document.getElementById('custom-button-edicao');
    const fileNameEdicao = document.getElementById('file-name-edicao');
    const abrirImagemModal = document.getElementById('abrir-imagem');
    const exportarImagemModal = document.getElementById('exportar-imagem');
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');
    const adjustmentsToolButton = document.getElementById('adjustments-tool-button');
    const brightnessSlider = document.getElementById('brightness-slider');
    const gammaSlider = document.getElementById('gamma-slider');
    const brightnessValue = document.getElementById('brightness-value');
    const gammaValue = document.getElementById('gamma-value');
    const filtersToolButton = document.getElementById('filters-tool-button');
    
    console.log('Elements found:', {
        mainContent: !!mainContent,
        undoButton: !!undoButton,
        redoButton: !!redoButton
    });

    let canvas, ctx;
    let isDrawing = false;
    let isMarkerActive = false;
    let isCuttingActive = false;
    let lastX, lastY;
    let currentImage = null;
    let selectionStartX, selectionStartY;
    let selectionEndX, selectionEndY;
    let isSelecting = false;
    let overlayCanvas, overlayCtx;
    let brightness = 100; // 100% = no change
    let gamma = 1.0; // 1.0 = no change
    let originalImageData = null; // Store original image data for adjustments
    let lastAppliedBrightness = 100; // Store last applied brightness
    let lastAppliedGamma = 1.0; // Store last applied gamma
    let originalImage = null; // Store the original unmodified image
    let hasAdjustmentsApplied = false; // Track if any adjustments have been applied
    let canvasStateBeforeAdjustments = null;
    let baseStateForAdjustments = null; // Separate state for adjustments
    
    // Filter System
    let currentFilter = 'none'; // Current applied filter
    let selectedFilter = 'none'; // Currently selected filter in modal
    let hasFilterApplied = false; // Track if any filter has been applied

    // Action Stack System
    const MAX_STACK_SIZE = 50;
    let actionStack = [];
    let currentActionIndex = -1;
    let isActionInProgress = false;

    class CanvasAction {
        constructor(type, data, originalImage = null, canvasWidth = null, canvasHeight = null) {
            this.type = type;
            this.data = data;
            this.originalImage = originalImage; // Store original image for crop operations
            this.canvasWidth = canvasWidth; // Store canvas width
            this.canvasHeight = canvasHeight; // Store canvas height
            this.timestamp = Date.now();
        }
    }

    function saveCanvasState() {
        if (!canvas) return null;
        return {
            dataURL: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height
        };
    }

    function loadCanvasState(dataURL, originalImage = null, canvasWidth = null, canvasHeight = null) {
        if (!canvas || !ctx) return;
        
        console.log('Loading canvas state:', { canvasWidth, canvasHeight, hasOriginalImage: !!originalImage });
        
        const img = new Image();
        img.onload = () => {
            // If this is a crop operation and we have the original image, restore it properly
            if (originalImage) {
                console.log('Restoring original image with dimensions:', { canvasWidth, canvasHeight });
                
                // Reset all state
                isSelecting = false;
                isCuttingActive = false;
                isMarkerActive = false;
                selectionStartX = selectionStartY = selectionEndX = selectionEndY = 0;
                
                // Update current image to the original image
                currentImage = originalImage;
                
                // Use stored canvas dimensions if available, otherwise calculate from original image
                let newCanvasWidth, newCanvasHeight;
                
                if (canvasWidth && canvasHeight) {
                    // Use stored dimensions
                    newCanvasWidth = canvasWidth;
                    newCanvasHeight = canvasHeight;
                    console.log('Using stored dimensions:', { newCanvasWidth, newCanvasHeight });
                } else {
                    // Calculate dimensions from original image
                    const mainContentWidth = mainContent.clientWidth;
                    const mainContentHeight = mainContent.clientHeight;
                    const imgAspectRatio = originalImage.width / originalImage.height;
                    
                    newCanvasWidth = mainContentWidth;
                    newCanvasHeight = newCanvasWidth / imgAspectRatio;
                    
                    if (newCanvasHeight > mainContentHeight) {
                        newCanvasHeight = mainContentHeight;
                        newCanvasWidth = newCanvasHeight * imgAspectRatio;
                    }
                    console.log('Calculated dimensions:', { newCanvasWidth, newCanvasHeight });
                }
                
                // Force canvas dimensions update
                console.log('Before update - Canvas dimensions:', { width: canvas.width, height: canvas.height });
                canvas.width = newCanvasWidth;
                canvas.height = newCanvasHeight;
                console.log('After update - Canvas dimensions:', { width: canvas.width, height: canvas.height });
                
                // Update overlay canvas dimensions
                if (overlayCanvas && overlayCtx) {
                    overlayCanvas.width = newCanvasWidth;
                    overlayCanvas.height = newCanvasHeight;
                    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                }
                
                // Reset canvas state and draw original image
                ctx.setLineDash([]);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 1.0;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
                
                // Reset tool states
                if (cuttingToolButton) {
                    cuttingToolButton.classList.remove('active');
                }
                if (markerToolButton) {
                    markerToolButton.classList.remove('active');
                }
                if (canvas) {
                    canvas.style.cursor = 'default';
                }
                
                // Reattach event listeners to ensure they work properly
                setupCanvasEventListeners();
            } else {
                // For regular operations, restore canvas dimensions and draw the saved state
                if (canvasWidth && canvasHeight) {
                    console.log('Restoring regular operation with dimensions:', { canvasWidth, canvasHeight });
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    
                    if (overlayCanvas && overlayCtx) {
                        overlayCanvas.width = canvasWidth;
                        overlayCanvas.height = canvasHeight;
                        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    }
                }
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
        };
        img.src = dataURL;
    }

    function pushAction(type, data, originalImage = null, canvasWidth = null, canvasHeight = null) {
        if (isActionInProgress) return;

        console.log('Pushing action:', {
            type,
            hasData: !!data,
            hasOriginalImage: !!originalImage,
            canvasWidth,
            canvasHeight,
            currentActionIndex,
            actionStackLength: actionStack.length
        });

        // Remove any future actions if we're not at the end of the stack
        if (currentActionIndex < actionStack.length - 1) {
            actionStack = actionStack.slice(0, currentActionIndex + 1);
        }

        // Add new action
        const action = new CanvasAction(type, data, originalImage, canvasWidth, canvasHeight);
        actionStack.push(action);
        currentActionIndex = actionStack.length - 1;

        // Maintain stack size limit
        if (actionStack.length > MAX_STACK_SIZE) {
            actionStack.shift();
            currentActionIndex--;
        }

        updateUndoRedoButtons();
        
        console.log('Action stack after push:', {
            length: actionStack.length,
            currentIndex: currentActionIndex,
            types: actionStack.map(a => a.type)
        });
    }

    function undo() {
        if (currentActionIndex < 0) return;

        isActionInProgress = true;
        currentActionIndex--;
        const action = actionStack[currentActionIndex];
        
        console.log('Undo action:', {
            type: action.type,
            data: action.data,
            originalImage: !!action.originalImage,
            canvasWidth: action.canvasWidth,
            canvasHeight: action.canvasHeight
        });
        
        // Handle both old and new data formats
        const dataURL = typeof action.data === 'string' ? action.data : action.data.dataURL;
        loadCanvasState(dataURL, action.originalImage, action.canvasWidth, action.canvasHeight);
        updateUndoRedoButtons();
        isActionInProgress = false;
    }

    function redo() {
        if (currentActionIndex >= actionStack.length - 1) return;

        isActionInProgress = true;
        currentActionIndex++;
        const action = actionStack[currentActionIndex];
        
        // Handle both old and new data formats
        const dataURL = typeof action.data === 'string' ? action.data : action.data.dataURL;
        loadCanvasState(dataURL, action.originalImage, action.canvasWidth, action.canvasHeight);
        updateUndoRedoButtons();
        isActionInProgress = false;
    }

    function updateUndoRedoButtons() {
        if (undoButton) {
            if (currentActionIndex > 0) {
                undoButton.style.color = '#ffffff';
                undoButton.style.cursor = 'pointer';
                undoButton.classList.add('active');
            } else {
                undoButton.style.color = '#878787';
                undoButton.style.cursor = 'default';
                undoButton.classList.remove('active');
            }
        }
        if (redoButton) {
            if (currentActionIndex < actionStack.length - 1) {
                redoButton.style.color = '#ffffff';
                redoButton.style.cursor = 'pointer';
                redoButton.classList.add('active');
            } else {
                redoButton.style.color = '#878787';
                redoButton.style.cursor = 'default';
                redoButton.classList.remove('active');
            }
        }
    }

    // Initialize action stack with initial canvas state
    function initializeActionStack() {
        console.log('Initializing action stack...');
        const initialState = saveCanvasState();
        console.log('Initial state:', initialState);
        if (initialState) {
            actionStack = [new CanvasAction('initial', initialState, null, initialState.width, initialState.height)];
            currentActionIndex = 0;
            updateUndoRedoButtons();
            console.log('Action stack initialized:', {
                length: actionStack.length,
                currentIndex: currentActionIndex,
                types: actionStack.map(a => a.type)
            });
        } else {
            console.log('No initial state available');
        }
    }

    // Event Listeners for Undo/Redo
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            console.log('Undo button clicked!', {
                currentActionIndex,
                actionStackLength: actionStack.length,
                canUndo: currentActionIndex > 0
            });
            if (currentActionIndex > 0) undo();
        });
    }

    if (redoButton) {
        redoButton.addEventListener('click', () => {
            console.log('Redo button clicked!', {
                currentActionIndex,
                actionStackLength: actionStack.length,
                canRedo: currentActionIndex < actionStack.length - 1
            });
            if (currentActionIndex < actionStack.length - 1) redo();
        });
    }

    // Keyboard shortcuts for Undo/Redo
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) { // metaKey for Mac
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
        }
    });

    let markerColor = '#ffff00';
    let markerLineWidth = 20;
    let markerColorIndicator = document.getElementById('marker-color-indicator');
    let markerColorInput = document.getElementById('marker-color-input');

    function initializeCanvas() {
        if (canvas) {
            // Canvas already exists, just update its size
            const currentState = saveCanvasState();
            canvas.width = mainContent.clientWidth > 0 ? mainContent.clientWidth : 600;
            canvas.height = mainContent.clientHeight > 0 ? mainContent.clientHeight : 400;
            if (currentState) {
                loadCanvasState(currentState.dataURL, null, currentState.width, currentState.height);
            }
        } else {
            // Create main canvas
            canvas = document.createElement('canvas');
            canvas.id = 'imageCanvas';
            mainContent.innerHTML = '';
            mainContent.appendChild(canvas);
            ctx = canvas.getContext('2d');

            // Create overlay canvas for selection
            overlayCanvas = document.createElement('canvas');
            overlayCanvas.id = 'overlayCanvas';
            overlayCanvas.style.position = 'absolute';
            overlayCanvas.style.top = '0';
            overlayCanvas.style.left = '0';
            overlayCanvas.style.pointerEvents = 'none';
            mainContent.appendChild(overlayCanvas);
            overlayCtx = overlayCanvas.getContext('2d');

            setupCanvasEventListeners();
        }
    }

    function loadImageOntoCanvas(imageSrc) {
        initializeCanvas();

        const img = new Image();
        img.onload = () => {
            currentImage = img;
            // Store the original unmodified image
            originalImage = new Image();
            originalImage.src = img.src;
            drawImageWithAspectRatio(img);
            sessionStorage.removeItem('imagemBase64');
            // Reset adjustment data for new image
            originalImageData = null;
            lastAppliedBrightness = 100;
            lastAppliedGamma = 1.0;
            hasAdjustmentsApplied = false;
            resetAdjustmentValues();
            // Reset filter data for new image
            currentFilter = 'none';
            selectedFilter = 'none';
            hasFilterApplied = false;
            // Save initial state after loading image
            setTimeout(initializeActionStack, 100);
        };
        img.onerror = () => {
            console.error("Erro ao carregar imagem.");
            mainContent.innerHTML = '<p style="color:red;">Erro ao carregar imagem.</p>';
        };
        img.src = imageSrc;
    }

    function drawImageWithAspectRatio(img) {
        if (!canvas || !ctx || !img) return;

        const mainContentWidth = mainContent.clientWidth;
        const mainContentHeight = mainContent.clientHeight;
        const imgAspectRatio = img.width / img.height;
        
        let newCanvasWidth = mainContentWidth;
        let newCanvasHeight = newCanvasWidth / imgAspectRatio;

        if (newCanvasHeight > mainContentHeight) {
            newCanvasHeight = mainContentHeight;
            newCanvasWidth = newCanvasHeight * imgAspectRatio;
        }
        
        // Update main canvas
        canvas.width = newCanvasWidth;
        canvas.height = newCanvasHeight;
        
        // Update overlay canvas if it exists
        if (overlayCanvas && overlayCtx) {
            overlayCanvas.width = newCanvasWidth;
            overlayCanvas.height = newCanvasHeight;
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        
        // Reset canvas state
        ctx.setLineDash([]);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
        
        // Clear and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Reset adjustment data when image is redrawn
        originalImageData = null;
    }

    function updateMarkerColor() {
        const color = markerColorInput.value;
        markerColor = color;
        if (markerColorIndicator) {
            markerColorIndicator.style.backgroundColor = color;
            markerColorIndicator.style.opacity = '1';
        }
    }

    if (markerColorInput) {
        markerColorInput.addEventListener('input', updateMarkerColor);
    }

    if (markerToolButton) {
        markerToolButton.addEventListener('click', () => {
            isMarkerActive = !isMarkerActive;
            if (isMarkerActive) {
                markerToolButton.classList.add('active');
                if (canvas) canvas.style.cursor = 'crosshair';
            } else {
                markerToolButton.classList.remove('active');
                if (canvas) canvas.style.cursor = 'default';
            }
        });

        markerToolButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const colorPicker = document.getElementById('marker-color-picker');
            if (colorPicker) {
                colorPicker.style.display = 'flex';
            }
        });
    }

    // Adjustments tool event listener
    if (adjustmentsToolButton) {
        adjustmentsToolButton.addEventListener('click', () => {
            const adjustmentsModal = document.getElementById('adjustments-modal');
            if (adjustmentsModal) {
                // Use the separate base state for adjustments
                if (baseStateForAdjustments) {
                    canvasStateBeforeAdjustments = baseStateForAdjustments;
                } else {
                    // First time opening adjustments, save current state as base
                    baseStateForAdjustments = canvas.toDataURL('image/png');
                    canvasStateBeforeAdjustments = baseStateForAdjustments;
                }
                
                // Use applied values if adjustments have been made, otherwise use defaults
                if (hasAdjustmentsApplied) {
                    brightness = lastAppliedBrightness;
                    gamma = lastAppliedGamma;
                } else {
                    brightness = 100;
                    gamma = 1.0;
                }
                
                // Update sliders and values
                if (brightnessSlider) {
                    brightnessSlider.value = brightness;
                    brightnessValue.textContent = brightness + '%';
                }
                
                if (gammaSlider) {
                    gammaSlider.value = gamma;
                    gammaValue.textContent = gamma.toFixed(1);
                }
                
                // Show preview with current values
                previewAdjustments();
                
                adjustmentsModal.style.display = 'flex';
            }
        });
    }

    // Filters tool event listener
    if (filtersToolButton) {
        filtersToolButton.addEventListener('click', () => {
            const filtersModal = document.getElementById('filters-modal');
            if (filtersModal) {
                // Set selected filter to current applied filter
                selectedFilter = currentFilter;
                updateFilterSelection();
                
                // Show preview with current filter
                previewFilter(selectedFilter);
                
                filtersModal.style.display = 'flex';
            }
        });
    }

    // Filter click event listeners (no longer needed since we use onclick in HTML)

    // Brightness slider event listener
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
            brightness = parseInt(e.target.value);
            brightnessValue.textContent = brightness + '%';
            previewAdjustments();
        });
    }

    // Gamma slider event listener
    if (gammaSlider) {
        gammaSlider.addEventListener('input', (e) => {
            gamma = parseFloat(e.target.value);
            gammaValue.textContent = gamma.toFixed(1);
            previewAdjustments();
        });
    }

    // Initialize marker color
    updateMarkerColor();

    function getMousePos(canvasDom, event) {
        const rect = canvasDom.getBoundingClientRect();
        const scaleX = canvasDom.width / rect.width;
        const scaleY = canvasDom.height / rect.height;
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        if (!isMarkerActive || !canvas || !currentImage) return;
        isDrawing = true;
        const pos = getMousePos(canvas, e);
        [lastX, lastY] = [pos.x, pos.y];
        
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = markerLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.4; // Fixed opacity for marker
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
        if (!isDrawing || !isMarkerActive || !canvas) return;
        const pos = getMousePos(canvas, e);
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        [lastX, lastY] = [pos.x, pos.y];
    }

    function stopDrawing() {
        if (!isDrawing || !canvas) return;
        isDrawing = false;
        ctx.globalAlpha = 1.0; // Reset opacity after drawing
        
        // Save state after drawing is complete
        const currentState = saveCanvasState();
        if (currentState) {
            pushAction('draw', currentState, null, currentState.width, currentState.height);
        }
    }

    // Add cutting tool button event listener
    const cuttingToolButton = document.getElementById('cut-tool-button');
    if (cuttingToolButton) {
        cuttingToolButton.addEventListener('click', () => {
            isCuttingActive = !isCuttingActive;
            isMarkerActive = false; // Deactivate marker tool if active
            if (isCuttingActive) {
                cuttingToolButton.classList.add('active');
                if (canvas) canvas.style.cursor = 'crosshair';
            } else {
                cuttingToolButton.classList.remove('active');
                if (canvas) canvas.style.cursor = 'default';
                // Clear any existing selection
                if (currentImage) {
                    drawImageWithAspectRatio(currentImage);
                }
            }
        });
    }

    function drawSelectionRect() {
        if (!overlayCanvas || !overlayCtx || !isSelecting) return;
        
        // Clear the overlay canvas
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        // Draw selection rectangle on overlay
        overlayCtx.strokeStyle = '#00ff00';
        overlayCtx.lineWidth = 2;
        overlayCtx.setLineDash([5, 5]);
        
        const width = selectionEndX - selectionStartX;
        const height = selectionEndY - selectionStartY;
        
        overlayCtx.strokeRect(selectionStartX, selectionStartY, width, height);
    }

    function cropImage() {
        if (!canvas || !ctx || !currentImage || !isSelecting) return;
        
        // Save the original image state before cropping
        const originalImage = currentImage;
        
        // Immediately disable selection to prevent any drawing
        isSelecting = false;
        isCuttingActive = false;
        if (cuttingToolButton) {
            cuttingToolButton.classList.remove('active');
        }
        if (canvas) canvas.style.cursor = 'default';
        
        // Calculate crop dimensions
        const cropX = Math.min(selectionStartX, selectionEndX);
        const cropY = Math.min(selectionStartY, selectionEndY);
        const cropWidth = Math.abs(selectionEndX - selectionStartX);
        const cropHeight = Math.abs(selectionEndY - selectionStartY);
        
        // Create a temporary canvas for the cropped image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw only the selected portion to the temp canvas
        tempCtx.drawImage(
            canvas,
            cropX, cropY, cropWidth, cropHeight,  // Source rectangle
            0, 0, cropWidth, cropHeight           // Destination rectangle
        );
        
        // Create a new image from the cropped canvas
        const croppedImage = new Image();
        croppedImage.onload = () => {
            // Update the current image
            currentImage = croppedImage;
            
            // Redraw with the new cropped image
            drawImageWithAspectRatio(croppedImage);
            
            // Save the state to the action stack with original image for undo
            const currentState = saveCanvasState();
            console.log('Saving crop state:', {
                width: currentState.width,
                height: currentState.height,
                originalImageWidth: originalImage.width,
                originalImageHeight: originalImage.height
            });
            if (currentState) {
                pushAction('crop', currentState, originalImage, currentState.width, currentState.height);
            }
            
            // Clear all selection state
            selectionStartX = selectionStartY = selectionEndX = selectionEndY = 0;
            
            // Clear overlay
            if (overlayCtx) {
                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            }
        };
        croppedImage.src = tempCanvas.toDataURL('image/png');
    }

    function startSelection(e) {
        if (!isCuttingActive || !canvas || !currentImage) return;
        
        isSelecting = true;
        const pos = getMousePos(canvas, e);
        selectionStartX = pos.x;
        selectionStartY = pos.y;
        selectionEndX = pos.x;
        selectionEndY = pos.y;
    }

    function updateSelection(e) {
        if (!isSelecting || !canvas) return;
        
        const pos = getMousePos(canvas, e);
        selectionEndX = pos.x;
        selectionEndY = pos.y;
        drawSelectionRect();
    }

    function endSelection() {
        if (!isSelecting) return;
        
        // Only crop if there's a meaningful selection (more than 5x5 pixels)
        if (Math.abs(selectionEndX - selectionStartX) > 5 && 
            Math.abs(selectionEndY - selectionStartY) > 5) {
            cropImage();
        } else {
            // If selection is too small, just redraw the image
            if (currentImage) {
                drawImageWithAspectRatio(currentImage);
            }
        }
        
        isSelecting = false;
    }

    function setupCanvasEventListeners() {
        if (!canvas) return;
        
        // Existing event listeners
        canvas.addEventListener('mousedown', (e) => {
            if (isCuttingActive) {
                startSelection(e);
            } else if (isMarkerActive) {
                startDrawing(e);
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isSelecting) {
                updateSelection(e);
            } else if (isDrawing) {
                draw(e);
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            if (isSelecting) {
                endSelection();
            } else if (isDrawing) {
                stopDrawing();
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (isSelecting) {
                endSelection();
            } else if (isDrawing) {
                stopDrawing();
            }
        });
    }
    
    window.addEventListener('resize', () => {
        if (currentImage) {
            drawImageWithAspectRatio(currentImage);
        } else if(canvas && ctx) { 
            canvas.width = mainContent.clientWidth > 0 ? mainContent.clientWidth : 600;
            canvas.height = mainContent.clientHeight > 0 ? mainContent.clientHeight : 400;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = "#AAAAAA";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Nenhuma imagem carregada. Clique em 'Abrir Imagem'.", canvas.width / 2, canvas.height / 2);
        }
    });

    window.exportImage = function() {
        if (!canvas || !currentImage) { 
            alert("Nenhuma imagem para exportar ou canvas não inicializado.");
            return;
        }
        const formatSelect = document.getElementById('format');
        const format = formatSelect.value;
        let mimeType = 'image/png';
        if (format === 'jpeg') mimeType = 'image/jpeg';
        else if (format === 'webp') mimeType = 'image/webp';

        const dataURL = canvas.toDataURL(mimeType, (mimeType === 'image/jpeg' ? 0.9 : undefined)); // Qualidade para JPEG
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `brushly-editada.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (exportarImagemModal) exportarImagemModal.style.display = 'none'; 
    }

    document.querySelectorAll('a.sidebar-button[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetModalId = this.getAttribute('href').substring(1);
            const targetModal = document.getElementById(targetModalId);
            if (targetModal) {
                if (targetModalId === 'exportar-imagem' && !currentImage) {
                    alert("Abra uma imagem antes de exportar.");
                    return;
                }
                targetModal.style.display = 'flex';
            }
        });
    });

    document.querySelectorAll('.modal-page').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) { 
                this.style.display = 'none';
            }
        });
    });

    // Initialize canvas and load image if available
    const base64FromStorage = sessionStorage.getItem('imagemBase64');
    if (base64FromStorage) {
        loadImageOntoCanvas(base64FromStorage);
    } else {
        initializeCanvas(); 
        canvas.width = mainContent.clientWidth > 0 ? mainContent.clientWidth : 600;
        canvas.height = mainContent.clientHeight > 0 ? mainContent.clientHeight : 400;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = "#AAAAAA";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Nenhuma imagem carregada. Clique em 'Abrir Imagem'.", canvas.width / 2, canvas.height / 2);
    }

    if (customButtonEdicao) {
        customButtonEdicao.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                fileNameEdicao.value = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    loadImageOntoCanvas(e.target.result);
                    if (abrirImagemModal) abrirImagemModal.style.display = 'none'; 
                };
                reader.readAsDataURL(file);
            } else {
                fileNameEdicao.value = "Nenhum arquivo selecionado";
            }
        });
    }

    // Initialize action stack when the page loads
    setTimeout(initializeActionStack, 100);
    
    console.log('Script loaded completely!');

    // Adjustment functions
    function previewAdjustments() {
        if (!canvas || !ctx || !baseStateForAdjustments) return;
        
        // Create a temporary canvas to work with the base state
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Load the base state into temp canvas
        const tempImg = new Image();
        tempImg.onload = () => {
            tempCtx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
            
            // Get the original state (with filters) as reference
            const originalImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            const originalData = originalImageData.data;
            
            // Create new image data for the result
            const resultImageData = tempCtx.createImageData(canvas.width, canvas.height);
            const resultData = resultImageData.data;
            
            for (let i = 0; i < originalData.length; i += 4) {
                // Get original pixel values (with filters applied)
                const originalR = originalData[i];
                const originalG = originalData[i + 1];
                const originalB = originalData[i + 2];
                const originalA = originalData[i + 3];
                
                // Apply brightness based on original values
                let r = originalR;
                let g = originalG;
                let b = originalB;
                
                if (brightness !== 100) {
                    const factor = brightness / 100;
                    r = Math.min(255, Math.max(0, originalR * factor));
                    g = Math.min(255, Math.max(0, originalG * factor));
                    b = Math.min(255, Math.max(0, originalB * factor));
                }
                
                // Apply gamma correction based on original values
                if (gamma !== 1.0) {
                    r = Math.pow(r / 255, 1 / gamma) * 255;
                    g = Math.pow(g / 255, 1 / gamma) * 255;
                    b = Math.pow(b / 255, 1 / gamma) * 255;
                }
                
                resultData[i] = r;     // Red
                resultData[i + 1] = g; // Green
                resultData[i + 2] = b; // Blue
                resultData[i + 3] = originalA; // Alpha (unchanged)
            }
            
            // Apply the result to the main canvas
            ctx.putImageData(resultImageData, 0, 0);
        };
        tempImg.src = baseStateForAdjustments;
    }

    function applyAdjustments() {
        if (!canvas || !ctx || !canvasStateBeforeAdjustments) return;
        
        // Save current state before applying adjustments
        const currentState = saveCanvasState();
        if (currentState) {
            pushAction('adjustment', currentState, currentImage, canvas.width, canvas.height);
        }
        
        // Apply the adjustments permanently (synchronously)
        const tempImg = new Image();
        tempImg.onload = () => {
            // Create a temporary canvas to work with the base state
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Load the base state into temp canvas
            tempCtx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
            
            // Get the original state (with filters) as reference
            const originalImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            const originalData = originalImageData.data;
            
            // Create new image data for the result
            const resultImageData = tempCtx.createImageData(canvas.width, canvas.height);
            const resultData = resultImageData.data;
            
            for (let i = 0; i < originalData.length; i += 4) {
                // Get original pixel values (with filters applied)
                const originalR = originalData[i];
                const originalG = originalData[i + 1];
                const originalB = originalData[i + 2];
                const originalA = originalData[i + 3];
                
                // Apply brightness based on original values
                let r = originalR;
                let g = originalG;
                let b = originalB;
                
                if (brightness !== 100) {
                    const factor = brightness / 100;
                    r = Math.min(255, Math.max(0, originalR * factor));
                    g = Math.min(255, Math.max(0, originalG * factor));
                    b = Math.min(255, Math.max(0, originalB * factor));
                }
                
                // Apply gamma correction based on original values
                if (gamma !== 1.0) {
                    r = Math.pow(r / 255, 1 / gamma) * 255;
                    g = Math.pow(g / 255, 1 / gamma) * 255;
                    b = Math.pow(b / 255, 1 / gamma) * 255;
                }
                
                resultData[i] = r;     // Red
                resultData[i + 1] = g; // Green
                resultData[i + 2] = b; // Blue
                resultData[i + 3] = originalA; // Alpha (unchanged)
            }
            
            // Apply the result to the main canvas
            ctx.putImageData(resultImageData, 0, 0);
            
            // Store current values as last applied values
            lastAppliedBrightness = brightness;
            lastAppliedGamma = gamma;
            
            // Mark that adjustments have been applied
            hasAdjustmentsApplied = true;
            
            // Don't update currentImage - keep it separate from adjustments
            // The canvas now shows the adjusted version, but currentImage remains the base state
            
            if (brightnessSlider) {
                brightnessSlider.value = brightness;
                brightnessValue.textContent = brightness + '%';
            }
            
            if (gammaSlider) {
                gammaSlider.value = gamma;
                gammaValue.textContent = gamma.toFixed(1);
            }
            
            originalImageData = null;
            
            // Close modal after adjustments are applied
            const adjustmentsModal = document.getElementById('adjustments-modal');
            if (adjustmentsModal) {
                adjustmentsModal.style.display = 'none';
            }
        };
        tempImg.src = baseStateForAdjustments;
    }

    function resetAdjustments() {
        if (!canvas || !ctx || !baseStateForAdjustments) return;
        
        // Restore the canvas to the base state (with filters, without adjustments)
        const tempImg = new Image();
        tempImg.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        };
        tempImg.src = baseStateForAdjustments;
        
        // Reset adjustment state
        hasAdjustmentsApplied = false;
        lastAppliedBrightness = 100;
        lastAppliedGamma = 1.0;
        
        // Reset adjustment values
        resetAdjustmentValues();
    }

    function resetAdjustmentValues() {
        brightness = 100;
        gamma = 1.0;
        
        if (brightnessSlider) {
            brightnessSlider.value = brightness;
            brightnessValue.textContent = brightness + '%';
        }
        
        if (gammaSlider) {
            gammaSlider.value = gamma;
            gammaValue.textContent = gamma.toFixed(1);
        }
        
        // Reset original image data so it gets captured fresh next time
        originalImageData = null;
    }

    // Filter functions
    function previewFilter(filterType) {
        if (!canvas || !ctx || !originalImage) return;
        
        selectedFilter = filterType;
        updateFilterSelection();
        
        // Draw the original image first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        // Apply the selected filter
        applyFilterToCanvas(filterType);
    }

    function applyFilterToCanvas(filterType) {
        if (!canvas || !ctx) return;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        switch (filterType) {
            case 'warm':
                // Warm filter: increase red and yellow tones
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.2);     // Increase red
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Slightly increase green
                    data[i + 2] = Math.max(0, data[i + 2] * 0.9);   // Decrease blue
                }
                break;
                
            case 'cold':
                // Cold filter: increase blue and cyan tones
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.max(0, data[i] * 0.9);      // Decrease red
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Slightly increase green
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Increase blue
                }
                break;
                
            case 'retro':
                // Retro filter: vintage look with faded colors
                for (let i = 0; i < data.length; i += 4) {
                    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = Math.min(255, gray * 1.1 + 20);     // Red with vintage tint
                    data[i + 1] = Math.min(255, gray * 0.9 + 10); // Green
                    data[i + 2] = Math.max(0, gray * 0.8);        // Blue
                }
                break;
                
            case 'vintage':
                // Vintage filter: sepia-like with faded look
                for (let i = 0; i < data.length; i += 4) {
                    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = Math.min(255, gray * 1.2 + 30);     // Red
                    data[i + 1] = Math.min(255, gray * 1.0 + 20); // Green
                    data[i + 2] = Math.max(0, gray * 0.7);        // Blue
                }
                break;
                
            case 'blackwhite':
                // Black and white filter
                for (let i = 0; i < data.length; i += 4) {
                    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = gray;     // Red
                    data[i + 1] = gray; // Green
                    data[i + 2] = gray; // Blue
                }
                break;
                
            case 'sepia':
                // Sepia filter
                for (let i = 0; i < data.length; i += 4) {
                    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = Math.min(255, gray * 1.3 + 30);     // Red
                    data[i + 1] = Math.min(255, gray * 1.1 + 20); // Green
                    data[i + 2] = Math.max(0, gray * 0.8);        // Blue
                }
                break;
                
            case 'dramatic':
                // Dramatic filter: high contrast with dark tones
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));     // Red
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128)); // Green
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128)); // Blue
                }
                break;
                
            case 'none':
            default:
                // No filter - keep original
                break;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    function updateFilterSelection() {
        // Remove active class from all filter items
        document.querySelectorAll('.filter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected filter item
        const selectedItem = document.querySelector(`[data-filter="${selectedFilter}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    function applyFilter() {
        if (!canvas || !ctx || !originalImage) return;
        
        // Use the currently selected filter
        const filterType = selectedFilter;
        
        // Save current state before applying filter
        const currentState = saveCanvasState();
        if (currentState) {
            pushAction('filter', currentState, currentImage, canvas.width, canvas.height);
        }
        
        // Apply the filter permanently
        currentFilter = filterType;
        hasFilterApplied = true;
        
        // Update current image with filtered version
        const filteredDataURL = canvas.toDataURL('image/png');
        currentImage = new Image();
        currentImage.onload = () => {
            // Image is ready for further operations
        };
        currentImage.src = filteredDataURL;
        
        // Close modal
        const filtersModal = document.getElementById('filters-modal');
        if (filtersModal) {
            filtersModal.style.display = 'none';
        }
    }

    function resetFilter() {
        if (!canvas || !ctx || !originalImage) return;
        
        // Redraw the original image
        drawImageWithAspectRatio(originalImage);
        
        // Reset filter state
        currentFilter = 'none';
        selectedFilter = 'none';
        hasFilterApplied = false;
        
        // Update filter selection
        updateFilterSelection();
    }

    // Make functions globally accessible
    window.applyAdjustments = applyAdjustments;
    window.resetAdjustments = resetAdjustments;
    window.previewFilter = previewFilter;
    window.applyFilter = applyFilter;
    window.resetFilter = resetFilter;
});