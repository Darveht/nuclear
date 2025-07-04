
// Simulador 3D - Terremoto en Tokio
class TokyoDisasterSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = {
            position: new THREE.Vector3(0, 2, 0),
            rotation: new THREE.Vector2(0, 0),
            health: 100,
            isRunning: false
        };
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isLocked = false;
        
        // Mobile controls
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.joystick = {
            active: false,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };
        this.touchLook = {
            active: false,
            lastX: 0,
            lastY: 0,
            identifier: null
        };
        this.runPressed = false;
        
        this.buildings = [];
        this.meteors = [];
        this.refuges = [];
        this.groundCracks = [];
        this.lighthouse = null;
        this.phoneAlert = null;
        
        this.gameState = {
            phase: 'exploration', // exploration, pre_earthquake, earthquake, nuclear_apocalypse
            timeToEarthquake: 60, // Nivel 1: 60 segundos
            earthquakeIntensity: 0,
            earthquakePhase: 0, // 0: calm, 1: tremors, 2: moderate, 3: strong, 4: devastating
            isGameOver: false,
            currentLevel: 1,
            maxLevel: 4,
            levelComplete: false,
            survivalTime: 0,
            levelStartTime: 0,
            countdownInterval: null,
            timeOfDay: 0, // 0-24 hours
            dayNightSpeed: 0.1 // Speed of day/night cycle
        };
        
        this.sounds = {
            ambient: null,
            earthquake: null,
            siren: null,
            explosion: null
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupLighting();
        this.createEgypt();
        this.setupControls();
        this.setupAudio();
        this.setupUI();
        this.animate();
        
        // Ocultar loading
        document.getElementById('loading').style.display = 'none';
        
        // Iniciar contador
        this.startCountdown();
    }
    
    setupScene() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xFDB813, 100, 800); // Niebla dorada del desierto
        
        // Crear cámara
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(this.player.position);
        
        // Crear renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xFDB813); // Cielo dorado del desierto
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLighting() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Luz direccional (sol)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
    }
    
    createEgypt() {
        this.createSandGround();
        this.createPyramids();
        this.createModernMansion();
        this.createOasis();
        this.createUndergroundShelters();
        this.createDesertRocks();
        this.createCacti();
        this.createSandDunesExtended();
    }
    
    createSandGround() {
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 }); // Sandy brown
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Crear dunas de arena
        this.createSandDunes();
        
        // Guardar posiciones originales de vértices
        this.originalGroundVertices = [...this.ground.geometry.attributes.position.array];
    }
    
    createSandDunes() {
        for (let i = 0; i < 15; i++) {
            const duneGeometry = new THREE.SphereGeometry(
                Math.random() * 20 + 10,
                16,
                8,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            );
            const duneMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
            const dune = new THREE.Mesh(duneGeometry, duneMaterial);
            
            dune.position.set(
                (Math.random() - 0.5) * 800,
                0,
                (Math.random() - 0.5) * 800
            );
            dune.scale.y = 0.3;
            
            this.scene.add(dune);
        }
    }
    
    createGroundCracks() {
        // Crear grietas realistas en el suelo
        for (let i = 0; i < 20; i++) {
            this.createCrack();
        }
    }
    
    createCrack() {
        const crackPoints = [];
        const startX = (Math.random() - 0.5) * 800;
        const startZ = (Math.random() - 0.5) * 800;
        let currentX = startX;
        let currentZ = startZ;
        
        // Generar puntos de la grieta de forma orgánica
        for (let i = 0; i < 50; i++) {
            crackPoints.push(new THREE.Vector3(currentX, 0.1, currentZ));
            currentX += (Math.random() - 0.5) * 20;
            currentZ += (Math.random() - 0.5) * 20;
        }
        
        // Crear geometría de la grieta
        const crackGeometry = new THREE.BufferGeometry().setFromPoints(crackPoints);
        const crackMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
        const crack = new THREE.Line(crackGeometry, crackMaterial);
        
        this.groundCracks.push({
            line: crack,
            points: crackPoints,
            progress: 0
        });
        
        this.scene.add(crack);
    }
    
    animateGroundCracks() {
        this.groundCracks.forEach(crack => {
            if (crack.progress < crack.points.length) {
                crack.progress += 0.5;
                const visiblePoints = crack.points.slice(0, Math.floor(crack.progress));
                crack.line.geometry.setFromPoints(visiblePoints);
                crack.line.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Deformar el terreno en las grietas
        const positions = this.ground.geometry.attributes.position.array;
        const vertices = this.ground.geometry.attributes.position;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // Verificar proximidad a grietas
            this.groundCracks.forEach(crack => {
                crack.points.forEach(point => {
                    const distance = Math.sqrt((x - point.x) ** 2 + (z - point.z) ** 2);
                    if (distance < 10) {
                        positions[i + 1] -= 0.02; // Hundir el terreno
                    }
                });
            });
        }
        
        vertices.needsUpdate = true;
    }
    
    createPyramids() {
        const pyramidSizes = [
            { base: 40, height: 60, color: 0xD2B48C },
            { base: 30, height: 45, color: 0xDEB887 },
            { base: 25, height: 35, color: 0xF4A460 },
            { base: 50, height: 80, color: 0xD2B48C },
            { base: 20, height: 30, color: 0xDEB887 }
        ];
        
        // Crear pirámides principales
        const pyramidPositions = [
            { x: -100, z: -100 },
            { x: 120, z: -80 },
            { x: -150, z: 120 },
            { x: 80, z: 150 },
            { x: 0, z: -200 },
            { x: 200, z: 0 },
            { x: -80, z: 80 },
            { x: 150, z: -150 }
        ];
        
        pyramidPositions.forEach((pos, index) => {
            const size = pyramidSizes[index % pyramidSizes.length];
            const pyramid = this.createPyramid(size);
            pyramid.position.set(pos.x, size.height / 2, pos.z);
            
            this.buildings.push(pyramid);
            this.scene.add(pyramid);
        });
    }
    
    createPyramid(size) {
        const geometry = new THREE.ConeGeometry(size.base, size.height, 4);
        
        // Crear textura de pirámide más realista
        const pyramidTexture = this.createPyramidTexture();
        const material = new THREE.MeshLambertMaterial({ 
            color: size.color,
            map: pyramidTexture
        });
        
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        pyramid.rotation.y = Math.PI / 4;
        
        // Crear bloques de piedra para destrucción
        const debrisGroup = new THREE.Group();
        for (let i = 0; i < 25; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                Math.random() * 4 + 2,
                Math.random() * 3 + 1,
                Math.random() * 4 + 2
            );
            const debrisMaterial = new THREE.MeshLambertMaterial({ color: size.color });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                (Math.random() - 0.5) * size.base,
                (Math.random() - 0.5) * size.height,
                (Math.random() - 0.5) * size.base
            );
            debris.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 3
                ),
                angularVelocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                )
            };
            debrisGroup.add(debris);
        }
        
        // Añadir jeroglíficos más detallados
        const hieroglyphGeometry = new THREE.PlaneGeometry(5, 5);
        const hieroglyphTexture = this.createHieroglyphTexture();
        const hieroglyphMaterial = new THREE.MeshBasicMaterial({ 
            map: hieroglyphTexture,
            transparent: true
        });
        
        for (let i = 0; i < 4; i++) {
            const hieroglyph = new THREE.Mesh(hieroglyphGeometry, hieroglyphMaterial);
            const angle = (i / 4) * Math.PI * 2;
            const radius = size.base * 0.8;
            hieroglyph.position.set(
                Math.cos(angle) * radius,
                size.height * 0.4,
                Math.sin(angle) * radius
            );
            hieroglyph.lookAt(
                hieroglyph.position.x * 2,
                size.height * 0.4,
                hieroglyph.position.z * 2
            );
            pyramid.add(hieroglyph);
        }
        
        // Añadir base de piedra
        const baseGeometry = new THREE.CylinderGeometry(size.base * 1.1, size.base * 1.1, 3, 4);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -size.height / 2 - 1.5;
        base.rotation.y = Math.PI / 4;
        pyramid.add(base);
        
        pyramid.userData = { 
            originalPosition: pyramid.position.clone(),
            originalRotation: pyramid.rotation.clone(),
            isDestroyed: false,
            fallSpeed: 0,
            destructionProgress: 0,
            debris: debrisGroup,
            boundingBox: new THREE.Box3().setFromObject(pyramid),
            isPyramid: true
        };
        
        return pyramid;
    }
    
    createPyramidTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fondo de piedra arenisca
        context.fillStyle = '#D2B48C';
        context.fillRect(0, 0, 512, 512);
        
        // Agregar líneas de bloques de piedra
        context.strokeStyle = '#A0522D';
        context.lineWidth = 2;
        
        for (let y = 0; y < 512; y += 40) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(512, y);
            context.stroke();
        }
        
        for (let x = 0; x < 512; x += 60) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, 512);
            context.stroke();
        }
        
        // Agregar desgaste y sombras
        context.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 20 + 5;
            context.fillRect(x, y, size, size);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        return texture;
    }
    
    createHieroglyphTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Fondo transparente
        context.clearRect(0, 0, 256, 256);
        
        // Dibujar jeroglíficos estilizados
        context.fillStyle = '#8B4513';
        context.font = 'bold 40px Arial';
        context.textAlign = 'center';
        
        const hieroglyphs = ['𓀀', '𓁹', '𓃭', '𓄿', '𓅓', '𓆑'];
        const selectedHieroglyph = hieroglyphs[Math.floor(Math.random() * hieroglyphs.length)];
        
        context.fillText(selectedHieroglyph, 128, 80);
        context.fillText('𓈖', 128, 140);
        context.fillText('𓊪', 128, 200);
        
        // Agregar marco decorativo
        context.strokeStyle = '#8B4513';
        context.lineWidth = 4;
        context.strokeRect(20, 20, 216, 216);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createOasis() {
        // Crear oasis con agua
        const oasisPositions = [
            { x: 0, z: 0 },
            { x: -180, z: 60 },
            { x: 100, z: -120 },
            { x: 200, z: 180 }
        ];
        
        oasisPositions.forEach(pos => {
            // Agua del oasis
            const waterGeometry = new THREE.CircleGeometry(15, 32);
            const waterMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x006994,
                transparent: true,
                opacity: 0.8
            });
            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2;
            water.position.set(pos.x, 0.1, pos.z);
            this.scene.add(water);
            
            // Palmeras alrededor del oasis
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 20 + Math.random() * 10;
                const palmX = pos.x + Math.cos(angle) * radius;
                const palmZ = pos.z + Math.sin(angle) * radius;
                
                this.createPalm(palmX, palmZ);
            }
        });
    }
    
    createModernMansion() {
        const mansionGroup = new THREE.Group();
        
        // Edificio principal (tres pisos) - MÁS GRANDE
        const mainBuildingGeometry = new THREE.BoxGeometry(120, 35, 60);
        const mainBuildingMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC }); // Beige claro
        const mainBuilding = new THREE.Mesh(mainBuildingGeometry, mainBuildingMaterial);
        mainBuilding.position.set(0, 17.5, 0);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        
        // Ala izquierda (dos pisos) - MÁS GRANDE
        const leftWingGeometry = new THREE.BoxGeometry(45, 25, 40);
        const leftWingMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 }); // Gris claro
        const leftWing = new THREE.Mesh(leftWingGeometry, leftWingMaterial);
        leftWing.position.set(-82, 12.5, -15);
        leftWing.castShadow = true;
        leftWing.receiveShadow = true;
        
        // Ala derecha (dos pisos) - MÁS GRANDE
        const rightWingGeometry = new THREE.BoxGeometry(40, 22, 45);
        const rightWingMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
        const rightWing = new THREE.Mesh(rightWingGeometry, rightWingMaterial);
        rightWing.position.set(80, 11, 8);
        rightWing.castShadow = true;
        rightWing.receiveShadow = true;
        
        // Techo principal (plano moderno) - ajustado al nuevo tamaño
        const mainRoofGeometry = new THREE.BoxGeometry(122, 2, 62);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
        mainRoof.position.set(0, 36, 0);
        
        // Techos de las alas (ajustados al nuevo tamaño)
        const leftRoofGeometry = new THREE.BoxGeometry(47, 2, 42);
        const leftRoof = new THREE.Mesh(leftRoofGeometry, roofMaterial);
        leftRoof.position.set(-82, 26, -15);
        
        const rightRoofGeometry = new THREE.BoxGeometry(42, 2, 47);
        const rightRoof = new THREE.Mesh(rightRoofGeometry, roofMaterial);
        rightRoof.position.set(80, 23, 8);
        
        // Ventanas grandes (estilo moderno)
        this.createMansionWindows(mansionGroup);
        
        // Piscina moderna
        this.createMansionPool(mansionGroup);
        
        // Entrada principal con columnas
        this.createMansionEntrance(mansionGroup);
        
        // Garaje moderno
        this.createMansionGarage(mansionGroup);
        
        // Iluminación exterior
        this.createMansionLighting(mansionGroup);
        
        // Jardín moderno
        this.createMansionGarden(mansionGroup);
        
        mansionGroup.add(mainBuilding);
        mansionGroup.add(leftWing);
        mansionGroup.add(rightWing);
        mansionGroup.add(mainRoof);
        mansionGroup.add(leftRoof);
        mansionGroup.add(rightRoof);
        
        // Crear interior de la mansión
        this.createMansionInterior(mansionGroup);
        
        // Posicionar la mansión en el desierto
        mansionGroup.position.set(200, 0, -200);
        
        mansionGroup.userData = {
            originalPosition: mansionGroup.position.clone(),
            originalRotation: mansionGroup.rotation.clone(),
            isDestroyed: false,
            boundingBox: new THREE.Box3().setFromObject(mansionGroup),
            isMansion: true,
            allowEntry: true // Permitir entrada a la mansión
        };
        
        this.buildings.push(mansionGroup);
        this.scene.add(mansionGroup);
    }
    
    createMansionWindows(mansionGroup) {
        // Ventanas del edificio principal (grandes ventanales)
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        
        // Ventanas frontales
        for (let i = 0; i < 4; i++) {
            const windowGeometry = new THREE.PlaneGeometry(8, 12);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(-24 + i * 16, 15, 20.1);
            mansionGroup.add(window);
            
            // Ventanas segundo piso
            const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
            window2.position.set(-24 + i * 16, 25, 20.1);
            mansionGroup.add(window2);
        }
        
        // Ventanas laterales
        for (let i = 0; i < 3; i++) {
            const windowGeometry = new THREE.PlaneGeometry(6, 10);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(40.1, 12 + i * 8, -15 + i * 15);
            window.rotation.y = Math.PI / 2;
            mansionGroup.add(window);
        }
    }
    
    createMansionPool(mansionGroup) {
        // Piscina rectangular moderna
        const poolGeometry = new THREE.BoxGeometry(40, 2, 20);
        const poolMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.position.set(0, -0.5, 40);
        mansionGroup.add(pool);
        
        // Borde de la piscina
        const poolBorderGeometry = new THREE.BoxGeometry(44, 1, 24);
        const poolBorderMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        const poolBorder = new THREE.Mesh(poolBorderGeometry, poolBorderMaterial);
        poolBorder.position.set(0, 0.5, 40);
        mansionGroup.add(poolBorder);
        
        // Tumbonas junto a la piscina
        for (let i = 0; i < 4; i++) {
            const chairGeometry = new THREE.BoxGeometry(3, 1, 8);
            const chairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            chair.position.set(-15 + i * 10, 1, 55);
            mansionGroup.add(chair);
        }
    }
    
    createMansionEntrance(mansionGroup) {
        // Columnas de entrada modernas
        for (let i = 0; i < 2; i++) {
            const columnGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(-8 + i * 16, 7.5, 25);
            mansionGroup.add(column);
        }
        
        // Puerta principal grande
        const doorGeometry = new THREE.BoxGeometry(6, 12, 0.5);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 6, 20.5);
        mansionGroup.add(door);
        
        // Escalones de entrada
        for (let i = 0; i < 3; i++) {
            const stepGeometry = new THREE.BoxGeometry(20, 1, 3);
            const stepMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(0, i * 1, 22 + i * 1.5);
            mansionGroup.add(step);
        }
    }
    
    createMansionGarage(mansionGroup) {
        // Garaje para varios coches
        const garageGeometry = new THREE.BoxGeometry(25, 12, 20);
        const garageMaterial = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        const garage = new THREE.Mesh(garageGeometry, garageMaterial);
        garage.position.set(-70, 6, 20);
        mansionGroup.add(garage);
        
        // Puertas del garaje
        for (let i = 0; i < 2; i++) {
            const garageDoorGeometry = new THREE.PlaneGeometry(10, 10);
            const garageDoorMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
            const garageDoor = new THREE.Mesh(garageDoorGeometry, garageDoorMaterial);
            garageDoor.position.set(-75 + i * 10, 6, 30.1);
            mansionGroup.add(garageDoor);
        }
    }
    
    createMansionLighting(mansionGroup) {
        // Luces exteriores modernas
        const lightPositions = [
            { x: -30, z: 30 },
            { x: 30, z: 30 },
            { x: -60, z: 10 },
            { x: 60, z: 10 }
        ];
        
        lightPositions.forEach(pos => {
            // Poste de luz moderno
            const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 4, pos.z);
            
            // Luz
            const lightGeometry = new THREE.SphereGeometry(1, 8, 8);
            const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFAA });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(pos.x, 8, pos.z);
            
            // Luz point light para iluminación real
            const pointLight = new THREE.PointLight(0xFFFFAA, 1, 50);
            pointLight.position.set(pos.x, 8, pos.z);
            
            mansionGroup.add(pole);
            mansionGroup.add(light);
            mansionGroup.add(pointLight);
        });
    }
    
    createMansionGarden(mansionGroup) {
        // Jardín moderno con diseño geométrico
        const gardenPositions = [
            { x: -20, z: 60, size: 8 },
            { x: 20, z: 60, size: 6 },
            { x: -40, z: 45, size: 10 },
            { x: 40, z: 45, size: 7 }
        ];
        
        gardenPositions.forEach(pos => {
            // Base de césped circular
            const grassGeometry = new THREE.CircleGeometry(pos.size, 16);
            const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            grass.rotation.x = -Math.PI / 2;
            grass.position.set(pos.x, 0.1, pos.z);
            
            // Plantas ornamentales
            for (let i = 0; i < 3; i++) {
                const plantGeometry = new THREE.SphereGeometry(1.5, 8, 8);
                const plantMaterial = new THREE.MeshLambertMaterial({ color: 0x006400 });
                const plant = new THREE.Mesh(plantGeometry, plantMaterial);
                const angle = (i / 3) * Math.PI * 2;
                plant.position.set(
                    pos.x + Math.cos(angle) * pos.size * 0.6,
                    1.5,
                    pos.z + Math.sin(angle) * pos.size * 0.6
                );
                mansionGroup.add(plant);
            }
            
            mansionGroup.add(grass);
        });
    }
    
    createMansionInterior(mansionGroup) {
        // Habitaciones interiores
        const rooms = [
            // Sala principal
            { x: 0, y: 5, z: 0, w: 100, h: 8, d: 50, color: 0xF5DEB3 },
            // Cocina
            { x: -30, y: 5, z: -20, w: 30, h: 8, d: 20, color: 0xFFFFFF },
            // Dormitorio principal
            { x: 30, y: 15, z: 0, w: 40, h: 8, d: 30, color: 0xE6E6FA },
            // Baño
            { x: 30, y: 5, z: -25, w: 20, h: 8, d: 15, color: 0x87CEEB },
            // Estudio
            { x: -40, y: 15, z: 10, w: 25, h: 8, d: 25, color: 0xDEB887 }
        ];
        
        rooms.forEach(room => {
            // Suelo de la habitación
            const floorGeometry = new THREE.PlaneGeometry(room.w, room.d);
            const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(room.x, room.y, room.z);
            mansionGroup.add(floor);
            
            // Techo de la habitación
            const ceilingGeometry = new THREE.PlaneGeometry(room.w, room.d);
            const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set(room.x, room.y + room.h, room.z);
            mansionGroup.add(ceiling);
        });
        
        // Muebles
        this.createMansionFurniture(mansionGroup);
        
        // Escaleras interiores
        this.createMansionStairs(mansionGroup);
    }
    
    createMansionFurniture(mansionGroup) {
        // Sofá en sala principal
        const sofaGeometry = new THREE.BoxGeometry(8, 3, 4);
        const sofaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
        sofa.position.set(-10, 6.5, 0);
        mansionGroup.add(sofa);
        
        // Mesa de centro
        const tableGeometry = new THREE.BoxGeometry(6, 1, 3);
        const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(-10, 5.5, 8);
        mansionGroup.add(table);
        
        // Cama en dormitorio
        const bedGeometry = new THREE.BoxGeometry(8, 2, 6);
        const bedMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(30, 6, 0);
        mansionGroup.add(bed);
        
        // Cocina (isla central)
        const kitchenGeometry = new THREE.BoxGeometry(12, 4, 6);
        const kitchenMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        const kitchen = new THREE.Mesh(kitchenGeometry, kitchenMaterial);
        kitchen.position.set(-30, 7, -20);
        mansionGroup.add(kitchen);
        
        // Escritorio en estudio
        const deskGeometry = new THREE.BoxGeometry(10, 1, 4);
        const deskMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(-40, 6, 10);
        mansionGroup.add(desk);
    }
    
    createMansionStairs(mansionGroup) {
        // Escaleras principales
        for (let i = 0; i < 10; i++) {
            const stepGeometry = new THREE.BoxGeometry(20, 1, 3);
            const stepMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(0, 5 + i * 1, -15 + i * 1);
            mansionGroup.add(step);
        }
        
        // Barandillas
        const railGeometry = new THREE.BoxGeometry(2, 8, 1);
        const railMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const leftRail = new THREE.Mesh(railGeometry, railMaterial);
        leftRail.position.set(-8, 10, -10);
        mansionGroup.add(leftRail);
        
        const rightRail = new THREE.Mesh(railGeometry, railMaterial);
        rightRail.position.set(8, 10, -10);
        mansionGroup.add(rightRail);
    }
    
    createDesertRocks() {
        // Rocas del desierto distribuidas por el mapa
        for (let i = 0; i < 30; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(
                Math.random() * 5 + 2
            );
            const rockMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B7D6B
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            rock.position.set(
                (Math.random() - 0.5) * 900,
                Math.random() * 2,
                (Math.random() - 0.5) * 900
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.scene.add(rock);
        }
    }
    
    createCacti() {
        // Cactus del desierto
        for (let i = 0; i < 25; i++) {
            const cactusGroup = new THREE.Group();
            
            // Tronco principal del cactus
            const trunkGeometry = new THREE.CylinderGeometry(1, 1.5, 8, 8);
            const cactusColor = 0x228B22;
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: cactusColor });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 4;
            
            // Brazos del cactus
            if (Math.random() > 0.5) {
                const armGeometry = new THREE.CylinderGeometry(0.7, 0.8, 4, 8);
                const arm = new THREE.Mesh(armGeometry, trunkMaterial);
                arm.position.set(2, 6, 0);
                arm.rotation.z = Math.PI / 3;
                cactusGroup.add(arm);
            }
            
            if (Math.random() > 0.7) {
                const armGeometry = new THREE.CylinderGeometry(0.6, 0.7, 3, 8);
                const arm = new THREE.Mesh(armGeometry, trunkMaterial);
                arm.position.set(-1.5, 7, 0);
                arm.rotation.z = -Math.PI / 4;
                cactusGroup.add(arm);
            }
            
            cactusGroup.add(trunk);
            
            cactusGroup.position.set(
                (Math.random() - 0.5) * 800,
                0,
                (Math.random() - 0.5) * 800
            );
            
            cactusGroup.castShadow = true;
            cactusGroup.receiveShadow = true;
            
            this.scene.add(cactusGroup);
        }
    }
    
    createSandDunesExtended() {
        // Dunas de arena más variadas y realistas
        for (let i = 0; i < 10; i++) {
            const duneGeometry = new THREE.SphereGeometry(
                Math.random() * 25 + 15,
                16,
                8,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            );
            const duneMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xDEB887
            });
            const dune = new THREE.Mesh(duneGeometry, duneMaterial);
            
            dune.position.set(
                (Math.random() - 0.5) * 900,
                0,
                (Math.random() - 0.5) * 900
            );
            dune.scale.y = 0.2 + Math.random() * 0.3;
            dune.rotation.y = Math.random() * Math.PI * 2;
            
            dune.receiveShadow = true;
            
            this.scene.add(dune);
        }
    }
    
    createPalm(x, z) {
        // Tronco de palmera
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 12, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 6, z);
        
        // Hojas de palmera
        const leavesGeometry = new THREE.SphereGeometry(4, 8, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, 12, z);
        leaves.scale.y = 0.6;
        
        this.scene.add(trunk);
        this.scene.add(leaves);
    }
    
    createUndergroundShelters() {
        const shelterPositions = [
            { x: -60, z: -60 },
            { x: 70, z: 70 },
            { x: -90, z: 90 },
            { x: 110, z: -80 }
        ];
        
        shelterPositions.forEach(pos => {
            // Crear entrada del bunker MÁS GRANDE
            const entranceGeometry = new THREE.CylinderGeometry(8, 8, 4, 8);
            const entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
            entrance.position.set(pos.x, 2, pos.z);
            
            // Crear escaleras bajando MÁS ANCHAS
            const stairsGeometry = new THREE.BoxGeometry(12, 2, 20);
            const stairsMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const stairs = new THREE.Mesh(stairsGeometry, stairsMaterial);
            stairs.position.set(pos.x, -3, pos.z);
            
            // Crear bunker subterráneo MUCHO MÁS GRANDE
            const bunkerGeometry = new THREE.BoxGeometry(50, 20, 50);
            const bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
            const bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
            bunker.position.set(pos.x, -15, pos.z);
            
            // Crear paredes del bunker
            const wallGeometry = new THREE.BoxGeometry(60, 25, 4);
            const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x3C3C3C });
            
            // Paredes norte y sur
            const wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
            wallNorth.position.set(pos.x, -15, pos.z + 30);
            const wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
            wallSouth.position.set(pos.x, -15, pos.z - 30);
            
            // Paredes este y oeste
            const wallGeometry2 = new THREE.BoxGeometry(4, 25, 60);
            const wallEast = new THREE.Mesh(wallGeometry2, wallMaterial);
            wallEast.position.set(pos.x + 30, -15, pos.z);
            const wallWest = new THREE.Mesh(wallGeometry2, wallMaterial);
            wallWest.position.set(pos.x - 30, -15, pos.z);
            
            // Techo del bunker
            const roofGeometry = new THREE.BoxGeometry(60, 4, 60);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(pos.x, -5, pos.z);
            
            // Señal de refugio nuclear MÁS GRANDE Y VISIBLE
            const signGeometry = new THREE.PlaneGeometry(15, 10);
            const signMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFFF00,
                map: this.createNuclearShelterSignTexture()
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(pos.x, 15, pos.z);
            
            // Añadir luces dentro del bunker
            const bunkerLight = new THREE.PointLight(0x00ff00, 2, 100);
            bunkerLight.position.set(pos.x, -10, pos.z);
            this.scene.add(bunkerLight);
            
            // Torre de ventilación visible
            const ventGeometry = new THREE.CylinderGeometry(2, 2, 12, 8);
            const ventMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const ventTower = new THREE.Mesh(ventGeometry, ventMaterial);
            ventTower.position.set(pos.x + 15, 6, pos.z + 15);
            
            entrance.userData = { isRefuge: true };
            bunker.userData = { isRefuge: true };
            stairs.userData = { isRefuge: true };
            roof.userData = { isRefuge: true };
            
            this.refuges.push(entrance, bunker, stairs, roof);
            this.scene.add(entrance);
            this.scene.add(stairs);
            this.scene.add(bunker);
            this.scene.add(wallNorth);
            this.scene.add(wallSouth);
            this.scene.add(wallEast);
            this.scene.add(wallWest);
            this.scene.add(roof);
            this.scene.add(sign);
            this.scene.add(ventTower);
        });
    }
    
    createNuclearShelterSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#ffff00';
        context.fillRect(0, 0, 256, 128);
        context.fillStyle = '#000000';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText('☢️ BUNKER NUCLEAR', 128, 40);
        context.fillText('NUCLEAR SHELTER', 128, 70);
        context.fillText('☢️', 128, 100);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createNuclearLighthouse() {
        // Torre del faro nuclear
        const towerGeometry = new THREE.CylinderGeometry(4, 5, 40, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0, 20, 0);
        
        // Luz del faro nuclear (verde radiactivo)
        const lightGeometry = new THREE.SphereGeometry(3, 8, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(0, 35, 0);
        
        // Luz direccional del faro nuclear
        this.lighthouseLight = new THREE.SpotLight(0x00ff00, 3, 300, Math.PI / 4, 0.1);
        this.lighthouseLight.position.set(0, 35, 0);
        this.lighthouseLight.target.position.set(50, 0, 0);
        this.lighthouseLight.castShadow = true;
        
        this.lighthouse = new THREE.Group();
        this.lighthouse.add(tower);
        this.lighthouse.add(light);
        this.lighthouse.add(this.lighthouseLight);
        this.lighthouse.add(this.lighthouseLight.target);
        
        this.scene.add(this.lighthouse);
    }
    
    createNuclearMeteor() {
        const meteorGeometry = new THREE.SphereGeometry(3, 8, 8);
        const meteorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00ff00
        });
        const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);
        
        // Posición aleatoria en el cielo
        meteor.position.set(
            (Math.random() - 0.5) * 400,
            100 + Math.random() * 50,
            (Math.random() - 0.5) * 400
        );
        
        meteor.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                -15 - Math.random() * 10,
                (Math.random() - 0.5) * 2
            ),
            damage: 35,
            isNuclear: true
        };
        
        this.meteors.push(meteor);
        this.scene.add(meteor);
    }
    
    createPhoneAlert() {
        const alertDiv = document.createElement('div');
        alertDiv.id = 'phone-alert';
        alertDiv.innerHTML = `
            <div class="phone">
                <div class="phone-screen">
                    <div class="alert-icon">☢️</div>
                    <div class="alert-title">ALERTA NUCLEAR</div>
                    <div class="alert-message">Terremoto detectado - Busque refugio en bunker nuclear inmediatamente</div>
                    <div class="alert-time">${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 10000);
    }
    
    setupControls() {
        // Desktop controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        if (!this.isMobile) {
            document.addEventListener('mousemove', (e) => {
                if (this.isLocked) {
                    this.mouse.x -= e.movementX * 0.002; // Invertir horizontal
                    this.mouse.y -= e.movementY * 0.002; // Invertir vertical
                    this.mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouse.y));
                }
            });
            
            document.addEventListener('click', () => {
                if (!this.isLocked) {
                    this.renderer.domElement.requestPointerLock();
                }
            });
            
            document.addEventListener('pointerlockchange', () => {
                this.isLocked = document.pointerLockElement === this.renderer.domElement;
            });
        } else {
            // Mobile controls
            this.setupMobileControls();
        }
    }
    
    setupMobileControls() {
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        const runButton = document.getElementById('run-button');
        
        // Joystick controls
        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = joystickBase.getBoundingClientRect();
            this.joystick.centerX = rect.left + rect.width / 2;
            this.joystick.centerY = rect.top + rect.height / 2;
            this.joystick.active = true;
            this.handleJoystickMove(e.touches[0]);
        });
        
        joystickBase.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystick.active) {
                this.handleJoystickMove(e.touches[0]);
            }
        });
        
        joystickBase.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.deltaX = 0;
            this.joystick.deltaY = 0;
            joystickStick.style.transform = 'translate(-50%, -50%)';
        });
        
        // Run button
        runButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.runPressed = true;
            runButton.style.transform = 'scale(0.95)';
        });
        
        runButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.runPressed = false;
            runButton.style.transform = 'scale(1)';
        });
        
        // Touch look controls (for camera) - ALWAYS ACTIVE for mobile
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            // Support multiple touches - joystick can work while camera moves
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const joystickArea = document.getElementById('joystick-container').getBoundingClientRect();
                const runButtonArea = document.getElementById('run-button').getBoundingClientRect();
                
                const isInJoystickArea = touch.clientX >= joystickArea.left && 
                                       touch.clientX <= joystickArea.right && 
                                       touch.clientY >= joystickArea.top && 
                                       touch.clientY <= joystickArea.bottom;
                
                const isInRunButtonArea = touch.clientX >= runButtonArea.left && 
                                        touch.clientX <= runButtonArea.right && 
                                        touch.clientY >= runButtonArea.top && 
                                        touch.clientY <= runButtonArea.bottom;
                
                // If this touch is for camera (not in control areas)
                if (!isInJoystickArea && !isInRunButtonArea) {
                    this.touchLook.active = true;
                    this.touchLook.lastX = touch.clientX;
                    this.touchLook.lastY = touch.clientY;
                    this.touchLook.identifier = touch.identifier;
                    break;
                }
            }
        });
        
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            // Always allow camera movement if touch look is active
            if (this.touchLook.active) {
                // Find the camera control touch by identifier
                let cameraTouch = null;
                for (let i = 0; i < e.touches.length; i++) {
                    if (e.touches[i].identifier === this.touchLook.identifier) {
                        cameraTouch = e.touches[i];
                        break;
                    }
                }
                
                if (cameraTouch) {
                    const deltaX = cameraTouch.clientX - this.touchLook.lastX;
                    const deltaY = cameraTouch.clientY - this.touchLook.lastY;
                    
                    this.mouse.x -= deltaX * 0.003;
                    this.mouse.y -= deltaY * 0.003;
                    this.mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouse.y));
                    
                    this.touchLook.lastX = cameraTouch.clientX;
                    this.touchLook.lastY = cameraTouch.clientY;
                }
            }
        });
        
        this.renderer.domElement.addEventListener('touchend', (e) => {
            // Check if the camera touch ended
            let cameraEnded = true;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.touchLook.identifier) {
                    cameraEnded = false;
                    break;
                }
            }
            
            if (cameraEnded) {
                this.touchLook.active = false;
                this.touchLook.identifier = null;
            }
        });
    }
    
    handleJoystickMove(touch) {
        const deltaX = touch.clientX - this.joystick.centerX;
        const deltaY = touch.clientY - this.joystick.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 50;
        
        if (distance <= maxDistance) {
            this.joystick.deltaX = deltaX / maxDistance;
            this.joystick.deltaY = deltaY / maxDistance;
            document.getElementById('joystick-stick').style.transform = 
                `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            const limitedX = Math.cos(angle) * maxDistance;
            const limitedY = Math.sin(angle) * maxDistance;
            this.joystick.deltaX = limitedX / maxDistance;
            this.joystick.deltaY = limitedY / maxDistance;
            document.getElementById('joystick-stick').style.transform = 
                `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
        }
    }
    
    setupAudio() {
        // Crear contexto de audio
        if (typeof(AudioContext) !== "undefined") {
            this.audioContext = new AudioContext();
        } else {
            this.audioContext = new webkitAudioContext();
        }
        
        // Variables para música de fondo
        this.backgroundMusic = null;
        this.musicGain = null;
        
        // Sonidos simulados con oscilladores
        this.createAmbientSound();
    }
    
    createAmbientSound() {
        // Sonido ambiente del desierto más suave
        this.ambientOscillator = this.audioContext.createOscillator();
        this.ambientGain = this.audioContext.createGain();
        
        this.ambientOscillator.frequency.setValueAtTime(40, this.audioContext.currentTime);
        this.ambientOscillator.type = 'sine';
        this.ambientGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        
        this.ambientOscillator.connect(this.ambientGain);
        this.ambientGain.connect(this.audioContext.destination);
        this.ambientOscillator.start();
    }
    
    playDisasterMusic() {
        // Crear música dramática de fondo para desastres
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        this.musicGain.connect(this.audioContext.destination);
        
        // Crear múltiples osciladores para música más compleja
        const frequencies = [220, 440, 330, 165]; // Notas dramáticas
        this.musicOscillators = [];
        
        frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            osc.type = index % 2 === 0 ? 'sawtooth' : 'sine';
            
            gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 2);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start();
            
            this.musicOscillators.push(osc);
            
            // Variaciones en las frecuencias para crear tensión
            setTimeout(() => {
                if (osc) {
                    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, this.audioContext.currentTime + 1);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, this.audioContext.currentTime + 3);
                }
            }, index * 500);
        });
        
        // Añadir percusión dramática
        this.createDramaticDrums();
    }
    
    createDramaticDrums() {
        const playDrum = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.frequency.setValueAtTime(60, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.1);
            osc.type = 'sawtooth';
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
            
            gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.2);
        };
        
        // Ritmo de tambores cada 0.8 segundos
        this.drumInterval = setInterval(playDrum, 800);
    }
    
    playNuclearSiren() {
        // Alarma nuclear más realista y aterradora
        const siren1 = this.audioContext.createOscillator();
        const siren2 = this.audioContext.createOscillator();
        const gainNode1 = this.audioContext.createGain();
        const gainNode2 = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Dos tonos que crean el efecto de sirena nuclear
        siren1.frequency.setValueAtTime(400, this.audioContext.currentTime);
        siren1.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 1.5);
        siren1.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 3);
        siren1.type = 'sawtooth';
        
        siren2.frequency.setValueAtTime(600, this.audioContext.currentTime);
        siren2.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 1.5);
        siren2.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 3);
        siren2.type = 'square';
        
        // Filtro para hacer el sonido más amenazante
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        gainNode1.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3);
        
        gainNode2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3);
        
        siren1.connect(gainNode1);
        siren2.connect(gainNode2);
        gainNode1.connect(filter);
        gainNode2.connect(filter);
        filter.connect(this.audioContext.destination);
        
        siren1.start();
        siren2.start();
        siren1.stop(this.audioContext.currentTime + 3);
        siren2.stop(this.audioContext.currentTime + 3);
    }
    
    playSirenSound() {
        this.playNuclearSiren();
    }
    
    playExplosionSound() {
        // Explosión mucho más realista con múltiples capas
        const now = this.audioContext.currentTime;
        
        // Capa 1: Explosión inicial (bombo profundo)
        const explosion1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        const filter1 = this.audioContext.createBiquadFilter();
        
        explosion1.frequency.setValueAtTime(80, now);
        explosion1.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        explosion1.type = 'sawtooth';
        
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(150, now);
        
        gain1.gain.setValueAtTime(0.8, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        explosion1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        
        // Capa 2: Crujido y debris
        const crackle = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        const filter2 = this.audioContext.createBiquadFilter();
        
        crackle.frequency.setValueAtTime(3000, now);
        crackle.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        crackle.type = 'square';
        
        filter2.type = 'highpass';
        filter2.frequency.setValueAtTime(1000, now);
        
        gain2.gain.setValueAtTime(0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        crackle.connect(filter2);
        filter2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        
        // Capa 3: Eco de la explosión
        const echo = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        const delay = this.audioContext.createDelay();
        
        echo.frequency.setValueAtTime(200, now + 0.1);
        echo.frequency.exponentialRampToValueAtTime(50, now + 1);
        echo.type = 'triangle';
        
        delay.delayTime.setValueAtTime(0.2, now);
        
        gain3.gain.setValueAtTime(0.3, now + 0.1);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        
        echo.connect(delay);
        delay.connect(gain3);
        gain3.connect(this.audioContext.destination);
        
        // Iniciar todos los sonidos
        explosion1.start(now);
        explosion1.stop(now + 0.8);
        
        crackle.start(now + 0.05);
        crackle.stop(now + 0.5);
        
        echo.start(now + 0.1);
        echo.stop(now + 1.2);
        
        // Añadir ruido blanco para hacer más realista
        this.addExplosionNoise(now);
    }
    
    addExplosionNoise(startTime) {
        // Crear ruido blanco para la explosión
        const bufferSize = this.audioContext.sampleRate * 0.5; // 0.5 segundos de ruido
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generar ruido blanco
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        whiteNoise.buffer = buffer;
        
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(500, startTime);
        noiseFilter.Q.setValueAtTime(2, startTime);
        
        noiseGain.gain.setValueAtTime(0.3, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        whiteNoise.start(startTime);
        whiteNoise.stop(startTime + 0.5);
    }
    
    stopBackgroundMusic() {
        if (this.musicOscillators) {
            this.musicOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // Ignorar errores si ya está parado
                }
            });
            this.musicOscillators = [];
        }
        
        if (this.drumInterval) {
            clearInterval(this.drumInterval);
            this.drumInterval = null;
        }
        
        if (this.musicGain) {
            this.musicGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        }
    }
    
    setupUI() {
        this.timerElement = document.getElementById('countdown');
        this.healthElement = document.getElementById('health-value');
        this.statusElement = document.getElementById('status');
    }
    
    startCountdown() {
        this.gameState.levelStartTime = Date.now();
        this.updateLevelUI();
        
        // Limpiar intervalo anterior si existe
        if (this.gameState.countdownInterval) {
            clearInterval(this.gameState.countdownInterval);
        }
        
        this.gameState.countdownInterval = setInterval(() => {
            this.gameState.timeToEarthquake--;
            this.gameState.survivalTime = Math.floor((Date.now() - this.gameState.levelStartTime) / 1000);
            this.timerElement.textContent = this.gameState.timeToEarthquake;
            this.updateLevelUI();
            
            if (this.gameState.timeToEarthquake <= 0) {
                clearInterval(this.gameState.countdownInterval);
                this.gameState.countdownInterval = null;
                this.startLevelDisaster();
            }
        }, 1000);
    }
    
    updateLevelUI() {
        const levelInfo = document.getElementById('level-info');
        if (!levelInfo) {
            const uiOverlay = document.getElementById('ui-overlay');
            const levelDiv = document.createElement('div');
            levelDiv.id = 'level-info';
            levelDiv.style.background = 'rgba(0, 100, 200, 0.8)';
            levelDiv.style.padding = '10px 15px';
            levelDiv.style.borderRadius = '5px';
            levelDiv.style.marginBottom = '10px';
            levelDiv.style.fontWeight = 'bold';
            uiOverlay.insertBefore(levelDiv, uiOverlay.firstChild);
        }
        
        const levelNames = {
            1: 'Terremoto',
            2: 'Lluvia de Meteoritos',
            3: 'Granizo Mortal',
            4: 'Apocalipsis Nuclear'
        };
        
        document.getElementById('level-info').innerHTML = 
            `Nivel ${this.gameState.currentLevel}: ${levelNames[this.gameState.currentLevel]} | Tiempo: ${this.gameState.survivalTime}s`;
    }
    
    startLevelDisaster() {
        switch(this.gameState.currentLevel) {
            case 1:
                this.startEarthquake();
                break;
            case 2:
                this.startMeteorRain();
                break;
            case 3:
                this.startHailstorm();
                break;
            case 4:
                this.startLocustPlague();
                break;
        }
    }
    
    startEarthquake() {
        this.gameState.phase = 'pre_earthquake';
        document.getElementById('timer').style.display = 'none';
        
        // ¡NUEVA MÚSICA DE FONDO DRAMÁTICA!
        this.playDisasterMusic();
        
        // Crear alerta de teléfono
        this.createPhoneAlert();
        
        // Mostrar mensaje
        this.showStatus('Temblores detectados... ¡Busca refugio!');
        
        // Iniciar proceso gradual del terremoto
        this.startGradualEarthquake();
    }
    
    startGradualEarthquake() {
        let phase = 0;
        const earthquakeStages = [
            { intensity: 0.1, duration: 8000, message: 'Temblores leves...' },
            { intensity: 0.3, duration: 6000, message: 'El terremoto se intensifica...' },
            { intensity: 0.6, duration: 5000, message: '¡TERREMOTO FUERTE!' },
            { intensity: 1.0, duration: 4000, message: '¡TERREMOTO DEVASTADOR!' },
            { intensity: 0.8, duration: 3000, message: 'El terremoto se calma...' },
            { intensity: 0.3, duration: 2000, message: 'Temblores finales...' }
        ];
        
        const progressEarthquake = () => {
            if (phase < earthquakeStages.length) {
                const stage = earthquakeStages[phase];
                this.gameState.earthquakeIntensity = stage.intensity;
                this.gameState.earthquakePhase = phase;
                
                this.showStatus(stage.message);
                
                // Añadir efectos visuales según la fase
                if (phase === 1) {
                    document.body.classList.add('earthquake');
                    this.createGroundCracks();
                }
                
                if (phase === 2) {
                    this.sirenInterval = setInterval(() => {
                        this.playNuclearSiren();
                    }, 3000);
                }
                
                if (phase === 3) {
                    this.startPyramidDestruction();
                }
                
                phase++;
                setTimeout(progressEarthquake, stage.duration);
            } else {
                // Completar nivel 1 después de que termine el terremoto
                setTimeout(() => {
                    this.completeLevel();
                }, 2000);
            }
        };
        
        progressEarthquake();
    }
    
    startMeteorRain() {
        this.gameState.phase = 'meteor_rain';
        this.showStatus('¡LLUVIA DE METEORITOS! ¡Esquívalos!');
        
        // ¡NUEVA MÚSICA DE FONDO DRAMÁTICA!
        this.playDisasterMusic();
        
        this.renderer.setClearColor(0x4B0000);
        this.scene.fog.color.setHex(0xFF6600);
        
        this.meteorInterval = setInterval(() => {
            this.createMeteor();
            // Crear meteoros adicionales para mayor intensidad
            if (Math.random() > 0.3) {
                setTimeout(() => this.createMeteor(), 200);
            }
        }, 600);
        
        // Completar nivel después de 60 segundos
        setTimeout(() => this.completeLevel(), 60000);
    }
    
    startHailstorm() {
        this.gameState.phase = 'hailstorm';
        this.showStatus('¡GRANIZO MORTAL! ¡Busca refugio!');
        
        // ¡NUEVA MÚSICA DE FONDO DRAMÁTICA!
        this.playDisasterMusic();
        
        this.renderer.setClearColor(0x2F4F4F);
        this.scene.fog.color.setHex(0x708090);
        
        this.hailInterval = setInterval(() => {
            this.createHailstone();
        }, 300);
        
        setTimeout(() => this.completeLevel(), 45000);
    }
    
    startLocustPlague() {
        // Nivel 4 ahora es apocalipsis nuclear
        this.startNuclearApocalypse();
    }
    
    createHailstone() {
        const hailGeometry = new THREE.SphereGeometry(1.5, 6, 6);
        const hailMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xE0FFFF,
            transparent: true,
            opacity: 0.8
        });
        const hailstone = new THREE.Mesh(hailGeometry, hailMaterial);
        
        hailstone.position.set(
            (Math.random() - 0.5) * 400,
            100 + Math.random() * 50,
            (Math.random() - 0.5) * 400
        );
        
        hailstone.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                -25 - Math.random() * 15,
                (Math.random() - 0.5) * 1
            ),
            damage: 15
        };
        
        this.meteors.push(hailstone);
        this.scene.add(hailstone);
    }
    
    createLocustSwarm() {
        for (let i = 0; i < 50; i++) {
            const locustGeometry = new THREE.SphereGeometry(0.3, 4, 4);
            const locustMaterial = new THREE.MeshBasicMaterial({ color: 0x8B8000 });
            const locust = new THREE.Mesh(locustGeometry, locustMaterial);
            
            locust.position.set(
                (Math.random() - 0.5) * 200,
                5 + Math.random() * 15,
                (Math.random() - 0.5) * 200
            );
            
            locust.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 2
                ),
                isLocust: true
            };
            
            this.meteors.push(locust);
            this.scene.add(locust);
        }
    }
    
    completeLevel() {
        this.clearAllIntervals();
        
        // Parar música de fondo
        this.stopBackgroundMusic();
        
        if (this.gameState.currentLevel < this.gameState.maxLevel) {
            this.gameState.currentLevel++;
            // Tiempo ajustado para cada nivel
            const levelTimes = [60, 50, 45, 40];
            this.gameState.timeToEarthquake = levelTimes[this.gameState.currentLevel - 1] || 40;
            this.gameState.phase = 'exploration';
            this.gameState.levelStartTime = Date.now();
            this.gameState.survivalTime = 0;
            this.gameState.earthquakeIntensity = 0; // Resetear intensidad del terremoto
            
            // Restaurar cielo
            this.renderer.setClearColor(0xFDB813);
            this.scene.fog.color.setHex(0xFDB813);
            
            // Limpiar meteoros y efectos
            this.meteors.forEach(meteor => this.scene.remove(meteor));
            this.meteors = [];
            
            // Remover efectos de terremoto
            document.body.classList.remove('earthquake');
            
            // Remover faro nuclear si existe
            if (this.lighthouse) {
                this.scene.remove(this.lighthouse);
                this.lighthouse = null;
            }
            
            // Mostrar timer nuevamente
            document.getElementById('timer').style.display = 'block';
            
            this.showStatus(`¡Nivel ${this.gameState.currentLevel - 1} Completado! Preparándose para el Nivel ${this.gameState.currentLevel}...`);
            
            setTimeout(() => {
                this.startCountdown();
            }, 3000);
        } else {
            this.showStatus('¡FELICIDADES! ¡Has sobrevivido a todas las plagas de Egipto!');
            this.gameState.isGameOver = true;
        }
    }
    
    clearAllIntervals() {
        if (this.sirenInterval) clearInterval(this.sirenInterval);
        if (this.meteorInterval) clearInterval(this.meteorInterval);
        if (this.hailInterval) clearInterval(this.hailInterval);
        if (this.locustDamageInterval) clearInterval(this.locustDamageInterval);
        if (this.radiationInterval) clearInterval(this.radiationInterval);
        if (this.drumInterval) clearInterval(this.drumInterval);
        
        // Parar música de fondo
        this.stopBackgroundMusic();
    }
    
    startNuclearApocalypse() {
        this.gameState.phase = 'nuclear_apocalypse';
        this.showStatus('¡RADIACIÓN NUCLEAR! ¡CORRE AL BUNKER!');
        
        // ¡NUEVA MÚSICA DE FONDO DRAMÁTICA!
        this.playDisasterMusic();
        
        // Cambiar el cielo a rojo nuclear
        this.renderer.setClearColor(0x8B0000);
        this.scene.fog.color.setHex(0xFF4500);
        
        // Crear faro de alerta nuclear
        this.createNuclearLighthouse();
        
        // Empezar a generar meteoritos nucleares
        this.meteorInterval = setInterval(() => {
            this.createNuclearMeteor();
        }, 1500);
        
        // Efectos de radiación
        this.radiationInterval = setInterval(() => {
            if (!this.checkRefugeSafety()) {
                this.player.health -= 2; // Daño por radiación
                this.updateHealthUI();
            }
        }, 1000);
        
        // Completar nivel después de 45 segundos
        setTimeout(() => this.completeLevel(), 45000);
    }
    
    createMeteor() {
        // Crear grupo para el meteorito completo
        const meteorGroup = new THREE.Group();
        
        // Núcleo del meteorito (más grande y brillante)
        const meteorGeometry = new THREE.SphereGeometry(4, 12, 12);
        const meteorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            emissive: 0xff2200 // Error corregido: usar MeshLambertMaterial
        });
        const meteorCore = new THREE.Mesh(meteorGeometry, meteorMaterial);
        
        // Usar MeshLambertMaterial en su lugar
        const meteorCorrectedMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff6600
        });
        meteorCore.material = meteorCorrectedMaterial;
        
        // Aura brillante alrededor del meteorito
        const auraGeometry = new THREE.SphereGeometry(6, 12, 12);
        const auraMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff8800,
            transparent: true,
            opacity: 0.3
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        
        // Cola de fuego del meteorito
        const tailGeometry = new THREE.ConeGeometry(2, 15, 8);
        const tailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 8, 0); // Posicionar la cola detrás
        tail.rotation.x = Math.PI; // Rotar para que apunte hacia atrás
        
        // Partículas de chispas
        const sparklesGroup = new THREE.Group();
        for (let i = 0; i < 15; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.3, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffaa00
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.set(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8
            );
            sparklesGroup.add(spark);
        }
        
        // Luz del meteorito
        const meteorLight = new THREE.PointLight(0xff4400, 3, 50);
        meteorLight.position.set(0, 0, 0);
        
        // Ensamblar el meteorito
        meteorGroup.add(meteorCore);
        meteorGroup.add(aura);
        meteorGroup.add(tail);
        meteorGroup.add(sparklesGroup);
        meteorGroup.add(meteorLight);
        
        // Posición aleatoria en el cielo (más alto para ser más visible)
        meteorGroup.position.set(
            (Math.random() - 0.5) * 600,
            150 + Math.random() * 100,
            (Math.random() - 0.5) * 600
        );
        
        meteorGroup.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                -15 - Math.random() * 10,
                (Math.random() - 0.5) * 3
            ),
            damage: 25,
            sparkles: sparklesGroup,
            tail: tail,
            aura: aura,
            light: meteorLight
        };
        
        this.meteors.push(meteorGroup);
        this.scene.add(meteorGroup);
    }
    
    startPyramidDestruction() {
        this.buildings.forEach((pyramid, index) => {
            setTimeout(() => {
                if (!pyramid.userData.isDestroyed && Math.random() > 0.6) {
                    pyramid.userData.isDestroyed = true;
                    pyramid.userData.fallSpeed = 0.05; // Más lento para pirámides
                }
            }, Math.random() * 15000);
        });
    }
    
    updatePlayer() {
        if (this.gameState.isGameOver) return;
        
        const speed = (this.keys['Space'] || this.runPressed) ? 0.5 : 0.2;
        const direction = new THREE.Vector3();
        
        if (this.isMobile) {
            // Mobile joystick controls
            if (this.joystick.active) {
                direction.x += this.joystick.deltaX * speed;
                direction.z += this.joystick.deltaY * speed;
            }
        } else {
            // Desktop WASD controls
            if (this.keys['KeyW']) direction.z -= speed;
            if (this.keys['KeyS']) direction.z += speed;
            if (this.keys['KeyA']) direction.x -= speed;
            if (this.keys['KeyD']) direction.x += speed;
        }
        
        // Aplicar rotación de la cámara a la dirección
        direction.applyEuler(new THREE.Euler(0, this.mouse.x, 0));
        
        // Aplicar efecto de terremoto al movimiento
        if (this.gameState.earthquakeIntensity > 0) {
            direction.add(new THREE.Vector3(
                (Math.random() - 0.5) * this.gameState.earthquakeIntensity * 0.1,
                0,
                (Math.random() - 0.5) * this.gameState.earthquakeIntensity * 0.1
            ));
        }
        
        // Calcular nueva posición
        const newPosition = this.player.position.clone().add(direction);
        
        // Verificar colisiones con edificios (excepto mansión que permite entrada)
        const playerBoundingBox = new THREE.Box3(
            new THREE.Vector3(newPosition.x - 1, newPosition.y - 1, newPosition.z - 1),
            new THREE.Vector3(newPosition.x + 1, newPosition.y + 1, newPosition.z + 1)
        );
        
        let canMove = true;
        this.buildings.forEach(building => {
            if (!building.userData.isDestroyed) {
                building.userData.boundingBox.setFromObject(building);
                if (playerBoundingBox.intersectsBox(building.userData.boundingBox)) {
                    // Permitir entrada solo a la mansión
                    if (!building.userData.isMansion || !building.userData.allowEntry) {
                        canMove = false;
                    }
                }
            }
        });
        
        if (canMove) {
            this.player.position.copy(newPosition);
        }
        
        // Limitar movimiento
        this.player.position.x = Math.max(-240, Math.min(240, this.player.position.x));
        this.player.position.z = Math.max(-240, Math.min(240, this.player.position.z));
        
        // Verificar si está en refugio
        this.checkRefugeSafety();
    }
    
    checkRefugeSafety() {
        const playerPos = this.player.position;
        const isInRefuge = this.refuges.some(refuge => {
            const distance = playerPos.distanceTo(refuge.position);
            return distance < 25; // Aumentado el rango para bunkers más grandes
        });
        
        if (isInRefuge && (this.gameState.phase === 'nuclear_apocalypse' || this.gameState.phase === 'earthquake')) {
            this.player.health = Math.min(100, this.player.health + 0.5);
        }
        
        return isInRefuge;
    }
    
    updateMeteors() {
        this.meteors.forEach((meteor, index) => {
            if (meteor.userData.isLocust) {
                // Movimiento de langostas (revoloteando)
                meteor.userData.velocity.x += (Math.random() - 0.5) * 0.1;
                meteor.userData.velocity.z += (Math.random() - 0.5) * 0.1;
                meteor.userData.velocity.y += (Math.random() - 0.5) * 0.05;
                
                // Perseguir al jugador ligeramente
                const direction = this.player.position.clone().sub(meteor.position).normalize();
                meteor.userData.velocity.add(direction.multiplyScalar(0.02));
                
                meteor.position.add(meteor.userData.velocity);
                
                // Límites de altura para langostas
                if (meteor.position.y < 2) meteor.position.y = 2;
                if (meteor.position.y > 20) meteor.position.y = 20;
                
                // Verificar colisión con jugador
                const distance = meteor.position.distanceTo(this.player.position);
                if (distance < 3 && !this.checkRefugeSafety()) {
                    this.player.health -= 0.5;
                    this.updateHealthUI();
                }
            } else {
                // Meteoros y granizo normales - mejorar visibilidad
                meteor.position.add(meteor.userData.velocity);
                
                // Animar efectos del meteorito durante el vuelo
                if (meteor.userData.sparkles) {
                    // Rotar chispas
                    meteor.userData.sparkles.rotation.y += 0.2;
                    meteor.userData.sparkles.children.forEach(spark => {
                        spark.position.add(new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            (Math.random() - 0.5) * 0.5,
                            (Math.random() - 0.5) * 0.5
                        ));
                    });
                }
                
                // Animar cola de fuego
                if (meteor.userData.tail) {
                    meteor.userData.tail.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.3;
                }
                
                // Pulsar aura
                if (meteor.userData.aura) {
                    meteor.userData.aura.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
                }
                
                // Verificar colisión con el suelo
                if (meteor.position.y <= 2) {
                    // Sonido removido - solo música de fondo
                    
                    // Verificar colisión con jugador
                    const distance = meteor.position.distanceTo(this.player.position);
                    if (distance < 15 && !this.checkRefugeSafety()) {
                        this.player.health -= meteor.userData.damage || 25;
                        this.updateHealthUI();
                        
                        // Efecto de pantalla roja si recibe daño
                        this.createDamageFlash();
                    }
                    
                    // Crear efecto de explosión ANTES de remover
                    this.createExplosionEffect(meteor.position.clone());
                    
                    // Remover meteoro
                    this.scene.remove(meteor);
                    this.meteors.splice(index, 1);
                }
            }
        });
    }
    
    createDamageFlash() {
        // Efecto visual cuando el jugador recibe daño
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 200);
    }
    
    createExplosionEffect(position) {
        // Grupo de explosión principal
        const explosionGroup = new THREE.Group();
        explosionGroup.position.copy(position);
        
        // Bola de fuego principal (más grande)
        const fireballGeometry = new THREE.SphereGeometry(8, 16, 16);
        const fireballMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 0.9
        });
        const fireball = new THREE.Mesh(fireballGeometry, fireballMaterial);
        
        // Anillo de expansión
        const ringGeometry = new THREE.RingGeometry(5, 15, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff8800,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        
        // Columna de humo
        const smokeGeometry = new THREE.CylinderGeometry(3, 8, 20, 8);
        const smokeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.7
        });
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.y = 10;
        
        // Partículas de escombros
        const debrisGroup = new THREE.Group();
        for (let i = 0; i < 20; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5
            );
            const debrisMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x8B4513
            });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                (Math.random() - 0.5) * 10,
                Math.random() * 5,
                (Math.random() - 0.5) * 10
            );
            debris.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    Math.random() * 6 + 2,
                    (Math.random() - 0.5) * 8
                )
            };
            debrisGroup.add(debris);
        }
        
        // Luz de explosión intensa
        const explosionLight = new THREE.PointLight(0xff4400, 5, 100);
        explosionLight.position.set(0, 5, 0);
        
        // Ensamblar explosión
        explosionGroup.add(fireball);
        explosionGroup.add(ring);
        explosionGroup.add(smoke);
        explosionGroup.add(debrisGroup);
        explosionGroup.add(explosionLight);
        
        this.scene.add(explosionGroup);
        
        // Crear cráter en el suelo
        this.createCrater(position);
        
        // Animar explosión
        let scale = 0.1;
        let time = 0;
        const animate = () => {
            time += 0.05;
            scale += 0.15;
            
            // Animar bola de fuego
            fireball.scale.setScalar(scale);
            fireball.material.opacity = Math.max(0, 1 - time);
            
            // Animar anillo
            ring.scale.setScalar(scale * 1.5);
            ring.material.opacity = Math.max(0, 0.6 - time);
            
            // Animar humo
            smoke.scale.setScalar(1 + time * 0.5);
            smoke.position.y = 10 + time * 5;
            smoke.material.opacity = Math.max(0, 0.7 - time);
            
            // Animar escombros
            debrisGroup.children.forEach(debris => {
                debris.position.add(debris.userData.velocity.clone().multiplyScalar(0.1));
                debris.userData.velocity.y -= 0.2; // Gravedad
                debris.rotation.x += 0.1;
                debris.rotation.y += 0.1;
                debris.rotation.z += 0.1;
            });
            
            // Reducir intensidad de luz
            explosionLight.intensity = Math.max(0, 5 - time * 3);
            
            if (time < 2) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosionGroup);
            }
        };
        animate();
    }
    
    createCrater(position) {
        // Crear cráter visible en el suelo
        const craterGeometry = new THREE.RingGeometry(2, 12, 16);
        const craterMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x222222,
            side: THREE.DoubleSide
        });
        const crater = new THREE.Mesh(craterGeometry, craterMaterial);
        crater.position.set(position.x, 0.1, position.z);
        crater.rotation.x = -Math.PI / 2;
        this.scene.add(crater);
        
        // Agregar rocas alrededor del cráter
        for (let i = 0; i < 8; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(
                Math.random() * 2 + 1
            );
            const rockMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            const radius = 8 + Math.random() * 5;
            rock.position.set(
                position.x + Math.cos(angle) * radius,
                1,
                position.z + Math.sin(angle) * radius
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.scene.add(rock);
        }
    }
    
    updateBuildings() {
        this.buildings.forEach((building, index) => {
            if (building.userData.isDestroyed) {
                building.userData.destructionProgress += 0.01;
                
                if (building.userData.destructionProgress < 1) {
                    // Fase de agrietamiento
                    building.userData.fallSpeed += 0.01;
                    building.rotation.x += building.userData.fallSpeed * 0.05;
                    building.rotation.z += building.userData.fallSpeed * 0.03;
                    
                    // Vibración durante destrucción
                    building.position.x = building.userData.originalPosition.x + 
                        (Math.random() - 0.5) * building.userData.destructionProgress * 2;
                    building.position.z = building.userData.originalPosition.z + 
                        (Math.random() - 0.5) * building.userData.destructionProgress * 2;
                } else {
                    // Fase de caída
                    building.userData.fallSpeed += 0.03;
                    building.rotation.x += building.userData.fallSpeed * 0.1;
                    building.rotation.z += building.userData.fallSpeed * 0.08;
                    building.position.y -= building.userData.fallSpeed;
                    
                    // Cuando el edificio toque el suelo, crear escombros
                    if (building.position.y <= -10 && !building.userData.debrisCreated) {
                        building.userData.debrisCreated = true;
                        this.scene.add(building.userData.debris);
                        building.visible = false;
                        this.playExplosionSound();
                    }
                }
                
                // Actualizar bounding box
                building.userData.boundingBox.setFromObject(building);
                
            } else if (this.gameState.earthquakeIntensity > 0) {
                // Efecto de vibración del terremoto
                const shakeIntensity = this.gameState.earthquakeIntensity * 0.5;
                building.position.x = building.userData.originalPosition.x + 
                    (Math.random() - 0.5) * shakeIntensity;
                building.position.z = building.userData.originalPosition.z + 
                    (Math.random() - 0.5) * shakeIntensity;
                building.rotation.x = building.userData.originalRotation.x + 
                    (Math.random() - 0.5) * shakeIntensity * 0.1;
                building.rotation.z = building.userData.originalRotation.z + 
                    (Math.random() - 0.5) * shakeIntensity * 0.1;
            }
        });
        
        // Actualizar escombros
        this.buildings.forEach(building => {
            if (building.userData.debris && building.userData.debris.children.length > 0) {
                building.userData.debris.children.forEach(debris => {
                    if (debris.position.y > -20) {
                        debris.userData.velocity.y -= 0.02; // Gravedad
                        debris.position.add(debris.userData.velocity);
                        debris.rotation.x += debris.userData.angularVelocity.x;
                        debris.rotation.y += debris.userData.angularVelocity.y;
                        debris.rotation.z += debris.userData.angularVelocity.z;
                        
                        // Fricción
                        debris.userData.velocity.multiplyScalar(0.98);
                    }
                });
            }
        });
    }
    
    updateCamera() {
        // Aplicar efecto de terremoto a la cámara
        let cameraShake = new THREE.Vector3(0, 0, 0);
        if (this.gameState.earthquakeIntensity > 0) {
            cameraShake.set(
                (Math.random() - 0.5) * this.gameState.earthquakeIntensity,
                (Math.random() - 0.5) * this.gameState.earthquakeIntensity * 0.5,
                (Math.random() - 0.5) * this.gameState.earthquakeIntensity
            );
        }
        
        this.camera.position.copy(this.player.position).add(cameraShake);
        
        // Aplicar rotaciones de manera correcta como en Roblox
        this.camera.rotation.order = 'YXZ'; // Importante: orden de rotación
        this.camera.rotation.x = this.mouse.y; // Pitch (arriba/abajo)
        this.camera.rotation.y = this.mouse.x; // Yaw (izquierda/derecha)
        this.camera.rotation.z = 0; // Sin roll
    }
    
    updateHealthUI() {
        this.healthElement.textContent = Math.max(0, Math.floor(this.player.health));
        const healthBar = document.getElementById('health');
        
        if (this.player.health < 30) {
            healthBar.classList.add('low');
        }
        
        if (this.player.health <= 0 && !this.gameState.isGameOver) {
            this.gameOver();
        }
    }
    
    showStatus(message) {
        this.statusElement.textContent = message;
        this.statusElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.statusElement.classList.add('hidden');
        }, 3000);
    }
    
    gameOver() {
        this.gameState.isGameOver = true;
        this.showStatus('GAME OVER - Recarga para intentar de nuevo');
        
        // Detener todos los intervalos
        if (this.sirenInterval) clearInterval(this.sirenInterval);
        if (this.meteorInterval) clearInterval(this.meteorInterval);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePlayer();
        this.updateMeteors();
        this.updateBuildings();
        this.updateCamera();
        this.updateDayNightCycle();
        
        // Rotar el faro
        if (this.lighthouse && this.gameState.phase !== 'exploration') {
            this.lighthouse.rotation.y += 0.02;
            
            // Hacer que la luz del faro ilumine la ciudad
            const time = Date.now() * 0.001;
            this.lighthouseLight.target.position.set(
                Math.sin(time) * 100,
                0,
                Math.cos(time) * 100
            );
        }
        
        // Animar grietas del suelo
        if (this.gameState.phase !== 'exploration') {
            this.animateGroundCracks();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateDayNightCycle() {
        // Usar tiempo real del usuario
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        this.gameState.timeOfDay = hours + (minutes / 60);
        
        // Calcular colores basados en la hora
        const hour = this.gameState.timeOfDay;
        let skyColor, fogColor, sunIntensity;
        
        if (hour >= 6 && hour < 8) {
            // Amanecer (6:00 - 8:00)
            const t = (hour - 6) / 2;
            skyColor = this.interpolateColor(0x191970, 0xFDB813, t); // Azul oscuro a dorado
            fogColor = this.interpolateColor(0x4B0082, 0xFDB813, t);
            sunIntensity = 0.3 + t * 0.7;
        } else if (hour >= 8 && hour < 18) {
            // Día (8:00 - 18:00)
            skyColor = 0xFDB813; // Dorado del desierto
            fogColor = 0xFDB813;
            sunIntensity = 1.0;
        } else if (hour >= 18 && hour < 20) {
            // Atardecer (18:00 - 20:00)
            const t = (hour - 18) / 2;
            skyColor = this.interpolateColor(0xFDB813, 0xFF4500, t); // Dorado a naranja
            fogColor = this.interpolateColor(0xFDB813, 0xFF6347, t);
            sunIntensity = 1.0 - t * 0.5;
        } else if (hour >= 20 && hour < 22) {
            // Crepúsculo (20:00 - 22:00)
            const t = (hour - 20) / 2;
            skyColor = this.interpolateColor(0xFF4500, 0x191970, t); // Naranja a azul oscuro
            fogColor = this.interpolateColor(0xFF6347, 0x2F2F4F, t);
            sunIntensity = 0.5 - t * 0.3;
        } else {
            // Noche (22:00 - 6:00)
            skyColor = 0x191970; // Azul nocturno
            fogColor = 0x2F2F4F;
            sunIntensity = 0.2;
        }
        
        // Aplicar cambios solo si no estamos en una fase de desastre
        if (this.gameState.phase === 'exploration') {
            this.renderer.setClearColor(skyColor);
            this.scene.fog.color.setHex(fogColor);
            this.sunLight.intensity = sunIntensity;
            
            // Mover posición del sol
            const sunAngle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
            this.sunLight.position.set(
                Math.cos(sunAngle) * 200,
                Math.sin(sunAngle) * 200 + 50,
                50
            );
            
            // Cambiar color de la luz del sol
            if (hour >= 18 && hour <= 20) {
                this.sunLight.color.setHex(0xFF6347); // Naranja al atardecer
            } else if (hour >= 6 && hour <= 8) {
                this.sunLight.color.setHex(0xFFD700); // Dorado al amanecer
            } else if (hour > 20 || hour < 6) {
                this.sunLight.color.setHex(0x4169E1); // Azul en la noche
            } else {
                this.sunLight.color.setHex(0xFFFFFF); // Blanco durante el día
            }
        }
        
        // Mostrar hora en la UI
        this.updateTimeUI();
    }
    
    interpolateColor(color1, color2, t) {
        const r1 = (color1 >> 16) & 255;
        const g1 = (color1 >> 8) & 255;
        const b1 = color1 & 255;
        
        const r2 = (color2 >> 16) & 255;
        const g2 = (color2 >> 8) & 255;
        const b2 = color2 & 255;
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return (r << 16) | (g << 8) | b;
    }
    
    updateTimeUI() {
        const hour = Math.floor(this.gameState.timeOfDay);
        const minute = Math.floor((this.gameState.timeOfDay - hour) * 60);
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        let timeDisplay = document.getElementById('time-display');
        if (!timeDisplay) {
            timeDisplay = document.createElement('div');
            timeDisplay.id = 'time-display';
            timeDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
            timeDisplay.style.color = 'white';
            timeDisplay.style.padding = '8px 12px';
            timeDisplay.style.borderRadius = '5px';
            timeDisplay.style.marginBottom = '10px';
            timeDisplay.style.fontWeight = 'bold';
            timeDisplay.style.fontSize = '16px';
            document.getElementById('ui-overlay').appendChild(timeDisplay);
        }
        
        let timeOfDayText = '';
        if (hour >= 6 && hour < 12) timeOfDayText = '🌅 Mañana';
        else if (hour >= 12 && hour < 18) timeOfDayText = '☀️ Tarde';
        else if (hour >= 18 && hour < 22) timeOfDayText = '🌆 Atardecer';
        else timeOfDayText = '🌙 Noche';
        
        timeDisplay.innerHTML = `🕐 ${timeString} - ${timeOfDayText}`;
    }
}

// Inicializar el simulador cuando la página se cargue
window.addEventListener('load', () => {
    const simulator = new TokyoDisasterSimulator();
});
