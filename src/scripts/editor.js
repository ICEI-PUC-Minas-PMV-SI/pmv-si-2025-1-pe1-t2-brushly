console.log('Script file loaded!');
alert('Script is loading!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Script is running!');
    alert('DOM Content Loaded!');
    
    const undoButton = document.getElementById('undo-button');
    console.log('Undo button found:', !!undoButton);
    
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            console.log('UNDO BUTTON CLICKED!');
            alert('Undo button clicked!');
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
            drawImageWithAspectRatio(img);
            sessionStorage.removeItem('imagemBase64');
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
});