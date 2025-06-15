document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    const markerToolButton = document.getElementById('marker-tool-button');
    const fileInput = document.getElementById('file-input');
    const customButtonEdicao = document.getElementById('custom-button-edicao');
    const fileNameEdicao = document.getElementById('file-name-edicao');
    const abrirImagemModal = document.getElementById('abrir-imagem');
    const exportarImagemModal = document.getElementById('exportar-imagem');
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');

    let canvas, ctx;
    let isDrawing = false;
    let isMarkerActive = false;
    let lastX, lastY;
    let currentImage = null;

    // Action Stack System
    const MAX_STACK_SIZE = 50;
    let actionStack = [];
    let currentActionIndex = -1;
    let isActionInProgress = false;

    class CanvasAction {
        constructor(type, data) {
            this.type = type;
            this.data = data;
            this.timestamp = Date.now();
        }
    }

    function saveCanvasState() {
        if (!canvas) return null;
        return canvas.toDataURL('image/png');
    }

    function loadCanvasState(dataURL) {
        if (!canvas || !ctx) return;
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }

    function pushAction(type, data) {
        if (isActionInProgress) return;

        // Remove any future actions if we're not at the end of the stack
        if (currentActionIndex < actionStack.length - 1) {
            actionStack = actionStack.slice(0, currentActionIndex + 1);
        }

        // Add new action
        const action = new CanvasAction(type, data);
        actionStack.push(action);
        currentActionIndex = actionStack.length - 1;

        // Maintain stack size limit
        if (actionStack.length > MAX_STACK_SIZE) {
            actionStack.shift();
            currentActionIndex--;
        }

        updateUndoRedoButtons();
    }

    function undo() {
        if (currentActionIndex < 0) return;

        isActionInProgress = true;
        currentActionIndex--;
        loadCanvasState(actionStack[currentActionIndex].data);
        updateUndoRedoButtons();
        isActionInProgress = false;
    }

    function redo() {
        if (currentActionIndex >= actionStack.length - 1) return;

        isActionInProgress = true;
        currentActionIndex++;
        loadCanvasState(actionStack[currentActionIndex].data);
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
        const initialState = saveCanvasState();
        if (initialState) {
            actionStack = [new CanvasAction('initial', initialState)];
            currentActionIndex = 0;
            updateUndoRedoButtons();
        }
    }

    // Event Listeners for Undo/Redo
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            if (currentActionIndex > 0) undo();
        });
    }

    if (redoButton) {
        redoButton.addEventListener('click', () => {
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

    let markerColor = 'rgba(255, 255, 0, 0.4)';
    let markerLineWidth = 20;
    let markerColorIndicator = document.getElementById('marker-color-indicator');
    let markerColorInput = document.getElementById('marker-color-input');
    let markerOpacityInput = document.getElementById('marker-opacity');
    let opacityValue = document.getElementById('opacity-value');

    function initializeCanvas() {
        if (canvas) {
            // Canvas already exists, just update its size
            const currentState = saveCanvasState();
            canvas.width = mainContent.clientWidth > 0 ? mainContent.clientWidth : 600;
            canvas.height = mainContent.clientHeight > 0 ? mainContent.clientHeight : 400;
            if (currentState) {
                loadCanvasState(currentState);
            }
        } else {
            canvas = document.createElement('canvas');
            canvas.id = 'imageCanvas';
            mainContent.innerHTML = '';
            mainContent.appendChild(canvas);
            ctx = canvas.getContext('2d');
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
        
        canvas.width = newCanvasWidth;
        canvas.height = newCanvasHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
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
    
    function updateMarkerColor() {
        const color = markerColorInput.value;
        const opacity = markerOpacityInput.value / 100;
        markerColor = hexToRgba(color, opacity);
        if (markerColorIndicator) {
            markerColorIndicator.style.backgroundColor = color;
            markerColorIndicator.style.opacity = opacity;
        }
    }

    function hexToRgba(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    if (markerColorInput && markerOpacityInput) {
        markerColorInput.addEventListener('input', updateMarkerColor);
        markerOpacityInput.addEventListener('input', () => {
            opacityValue.textContent = `${markerOpacityInput.value}%`;
            updateMarkerColor();
        });
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
        
        // Save state after drawing is complete
        const currentState = saveCanvasState();
        if (currentState) {
            pushAction('draw', currentState);
        }
    }

    function setupCanvasEventListeners() {
        if (!canvas) return;
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing); 
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

    // Initialize action stack when the page loads
    setTimeout(initializeActionStack, 100);
});