/* ======================================================
   INTERACTIVE 3D RUBIK'S CUBE
   ====================================================== */

(function () {
    // State
    const COLORS = {
        front: '#c41e3a',   // Red
        back: '#ff5800',    // Orange
        right: '#0051ba',   // Blue
        left: '#009e60',    // Green
        top: '#ffd500',     // Yellow
        bottom: '#ffffff'   // White
    };

    const FACE_MAP = {
        front: { axis: 'z', layer: 1, dir: 1 },
        back: { axis: 'z', layer: -1, dir: -1 },
        right: { axis: 'x', layer: 1, dir: 1 },
        left: { axis: 'x', layer: -1, dir: -1 },
        top: { axis: 'y', layer: -1, dir: -1 },
        bottom: { axis: 'y', layer: 1, dir: 1 }
    };

    let cubeState = [];
    let sceneRotX = -25;
    let sceneRotY = 35;
    let isDragging = false;
    let lastMouseX, lastMouseY;
    let isAnimating = false;
    let overlay = null;

    // Initialize cube state: 27 cubies, each with position and face colors
    function initCubeState() {
        cubeState = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const cubie = {
                        x, y, z,
                        faces: {
                            front: z === 1 ? COLORS.front : '#111',
                            back: z === -1 ? COLORS.back : '#111',
                            right: x === 1 ? COLORS.right : '#111',
                            left: x === -1 ? COLORS.left : '#111',
                            top: y === -1 ? COLORS.top : '#111',
                            bottom: y === 1 ? COLORS.bottom : '#111'
                        },
                        transform: ''
                    };
                    cubeState.push(cubie);
                }
            }
        }
    }

    function buildOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'rubik-overlay';
        overlay.innerHTML = `
            <div class="rubik-overlay-bg"></div>
            <div class="rubik-overlay-content">
                <div class="rubik-close-btn" id="rubik-close">&times;</div>
                <div class="rubik-3d-scene" id="rubik-3d-scene">
                    <div class="rubik-3d-cube" id="rubik-3d-cube"></div>
                </div>
                <div class="rubik-controls">
                    <button onclick="window.rubikReset()">Reset</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close button
        document.getElementById('rubik-close').addEventListener('click', closeRubikOverlay);
        overlay.querySelector('.rubik-overlay-bg').addEventListener('click', closeRubikOverlay);

        // Scene drag (orbit)
        const scene = document.getElementById('rubik-3d-scene');
        scene.addEventListener('mousedown', onSceneMouseDown);
        scene.addEventListener('touchstart', onSceneTouchStart, { passive: false });

        document.addEventListener('mousemove', onSceneMouseMove);
        document.addEventListener('mouseup', onSceneMouseUp);
        document.addEventListener('touchmove', onSceneTouchMove, { passive: false });
        document.addEventListener('touchend', onSceneTouchEnd);

        renderCube();

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('visible'));
    }

    function renderCube() {
        const container = document.getElementById('rubik-3d-cube');
        if (!container) return;
        container.innerHTML = '';

        const size = 58;
        const gap = 3;
        const unit = size + gap;

        cubeState.forEach((cubie, idx) => {
            const el = document.createElement('div');
            el.className = 'rubik-cubie';
            el.style.transform = `${cubie.transform} translate3d(${cubie.x * unit}px, ${cubie.y * unit}px, ${cubie.z * unit}px)`;

            const faceNames = ['front', 'back', 'right', 'left', 'top', 'bottom'];
            const faceTransforms = {
                front: `translateZ(${size / 2}px)`,
                back: `translateZ(${-size / 2}px) rotateY(180deg)`,
                right: `translateX(${size / 2}px) rotateY(90deg)`,
                left: `translateX(${-size / 2}px) rotateY(-90deg)`,
                top: `translateY(${-size / 2}px) rotateX(90deg)`,
                bottom: `translateY(${size / 2}px) rotateX(-90deg)`
            };

            faceNames.forEach(face => {
                const faceEl = document.createElement('div');
                faceEl.className = 'rubik-cubie-face';
                faceEl.style.width = size + 'px';
                faceEl.style.height = size + 'px';
                faceEl.style.transform = faceTransforms[face];

                const color = cubie.faces[face];
                if (color !== '#111') {
                    const sticker = document.createElement('div');
                    sticker.className = 'rubik-sticker';
                    sticker.style.background = color;
                    sticker.dataset.face = face;
                    sticker.dataset.cubieIdx = idx;
                    faceEl.appendChild(sticker);
                }

                el.appendChild(faceEl);
            });

            container.appendChild(el);
        });

        updateSceneRotation();
    }

    function updateSceneRotation() {
        const cube = document.getElementById('rubik-3d-cube');
        if (cube) {
            cube.style.transform = `rotateX(${sceneRotX}deg) rotateY(${sceneRotY}deg)`;
        }
    }

    // --- Orbit controls (drag from anywhere) ---
    let dragStartX, dragStartY;
    let dragMoved = false;
    let clickedSticker = null;
    const DRAG_THRESHOLD = 5;

    function onSceneMouseDown(e) {
        isDragging = true;
        dragMoved = false;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        clickedSticker = e.target.classList.contains('rubik-sticker') ? e.target : null;
        e.preventDefault();
    }

    function onSceneMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const totalDx = Math.abs(e.clientX - dragStartX);
        const totalDy = Math.abs(e.clientY - dragStartY);
        if (totalDx > DRAG_THRESHOLD || totalDy > DRAG_THRESHOLD) dragMoved = true;
        sceneRotY += dx * 0.5;
        sceneRotX -= dy * 0.5;
        sceneRotX = Math.max(-80, Math.min(80, sceneRotX));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        updateSceneRotation();
    }

    function onSceneMouseUp() {
        if (isDragging && !dragMoved && clickedSticker) {
            const face = clickedSticker.dataset.face;
            if (face) onStickerClick(face);
        }
        isDragging = false;
        clickedSticker = null;
    }

    function onSceneTouchStart(e) {
        if (e.touches.length === 1) {
            isDragging = true;
            dragMoved = false;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
            clickedSticker = e.target.classList.contains('rubik-sticker') ? e.target : null;
            e.preventDefault();
        }
    }

    function onSceneTouchMove(e) {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;
        const totalDx = Math.abs(e.touches[0].clientX - dragStartX);
        const totalDy = Math.abs(e.touches[0].clientY - dragStartY);
        if (totalDx > DRAG_THRESHOLD || totalDy > DRAG_THRESHOLD) dragMoved = true;
        sceneRotY += dx * 0.5;
        sceneRotX -= dy * 0.5;
        sceneRotX = Math.max(-80, Math.min(80, sceneRotX));
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        updateSceneRotation();
        e.preventDefault();
    }

    function onSceneTouchEnd() {
        if (isDragging && !dragMoved && clickedSticker) {
            const face = clickedSticker.dataset.face;
            if (face) onStickerClick(face);
        }
        isDragging = false;
        clickedSticker = null;
    }

    // --- Face rotation ---
    function onStickerClick(face) {
        if (isAnimating) return;
        const fm = FACE_MAP[face];
        rotateFace(fm.axis, fm.layer, fm.dir);
    }

    function rotateFace(axis, layer, direction) {
        if (isAnimating) return;
        isAnimating = true;

        // Find cubies on this layer
        const layerCubies = cubeState.filter(c => c[axis] === layer);

        // Animate rotation
        const container = document.getElementById('rubik-3d-cube');
        const allCubieEls = container.querySelectorAll('.rubik-cubie');

        const angle = direction * 90;
        const rotAxis = axis === 'x' ? 'X' : axis === 'y' ? 'Y' : 'Z';

        // Apply CSS transition to layer cubies
        layerCubies.forEach(cubie => {
            const idx = cubeState.indexOf(cubie);
            const el = allCubieEls[idx];
            if (el) {
                el.style.transition = 'transform 0.35s ease';
                const current = el.style.transform;
                el.style.transform = `rotate${rotAxis}(${angle}deg) ${current}`;
            }
        });

        setTimeout(() => {
            // Apply state rotation
            applyRotation(axis, layer, direction);
            // Re-render
            const allEls = container.querySelectorAll('.rubik-cubie');
            allEls.forEach(el => el.style.transition = '');
            renderCube();
            isAnimating = false;
        }, 380);
    }

    function applyRotation(axis, layer, direction) {
        cubeState.forEach(cubie => {
            if (cubie[axis] !== layer) return;

            let { x, y, z } = cubie;
            let newFaces = { ...cubie.faces };

            if (axis === 'x') {
                // Rotate around X axis
                if (direction > 0) {
                    cubie.y = z;
                    cubie.z = -y;
                    newFaces = {
                        front: cubie.faces.top,
                        back: cubie.faces.bottom,
                        right: cubie.faces.right,
                        left: cubie.faces.left,
                        top: cubie.faces.back,
                        bottom: cubie.faces.front
                    };
                } else {
                    cubie.y = -z;
                    cubie.z = y;
                    newFaces = {
                        front: cubie.faces.bottom,
                        back: cubie.faces.top,
                        right: cubie.faces.right,
                        left: cubie.faces.left,
                        top: cubie.faces.front,
                        bottom: cubie.faces.back
                    };
                }
            } else if (axis === 'y') {
                // Rotate around Y axis
                if (direction > 0) {
                    cubie.x = -z;
                    cubie.z = x;
                    newFaces = {
                        front: cubie.faces.left,
                        back: cubie.faces.right,
                        right: cubie.faces.front,
                        left: cubie.faces.back,
                        top: cubie.faces.top,
                        bottom: cubie.faces.bottom
                    };
                } else {
                    cubie.x = z;
                    cubie.z = -x;
                    newFaces = {
                        front: cubie.faces.right,
                        back: cubie.faces.left,
                        right: cubie.faces.back,
                        left: cubie.faces.front,
                        top: cubie.faces.top,
                        bottom: cubie.faces.bottom
                    };
                }
            } else if (axis === 'z') {
                // Rotate around Z axis
                if (direction > 0) {
                    cubie.x = y;
                    cubie.y = -x;
                    newFaces = {
                        front: cubie.faces.front,
                        back: cubie.faces.back,
                        right: cubie.faces.bottom,
                        left: cubie.faces.top,
                        top: cubie.faces.right,
                        bottom: cubie.faces.left
                    };
                } else {
                    cubie.x = -y;
                    cubie.y = x;
                    newFaces = {
                        front: cubie.faces.front,
                        back: cubie.faces.back,
                        right: cubie.faces.top,
                        left: cubie.faces.bottom,
                        top: cubie.faces.left,
                        bottom: cubie.faces.right
                    };
                }
            }

            cubie.faces = newFaces;
        });
    }

    // --- Shuffle ---
    window.rubikShuffle = function () {
        if (isAnimating) return;
        const axes = ['x', 'y', 'z'];
        const layers = [-1, 0, 1];
        const dirs = [-1, 1];
        let moves = 15;
        let i = 0;

        function doMove() {
            if (i >= moves) return;
            const axis = axes[Math.floor(Math.random() * 3)];
            const layer = layers[Math.floor(Math.random() * 3)];
            const dir = dirs[Math.floor(Math.random() * 2)];
            isAnimating = false;
            rotateFace(axis, layer, dir);
            i++;
            setTimeout(doMove, 420);
        }
        doMove();
    };

    window.rubikReset = function () {
        if (isAnimating) return;
        initCubeState();
        sceneRotX = -25;
        sceneRotY = 35;
        renderCube();
    };

    // --- Open / Close ---
    function openRubikOverlay() {
        initCubeState();
        sceneRotX = -25;
        sceneRotY = 35;
        buildOverlay();
    }

    function closeRubikOverlay() {
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                overlay = null;
            }, 400);
        }
    }

    // Expose
    window.openRubikOverlay = openRubikOverlay;
})();
