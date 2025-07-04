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
            countdownInterval: null
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
        this.createOasis();
        this.createUndergroundShelters();
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
        
        // Sonidos simulados con oscilladores
        this.createAmbientSound();
    }
    
    createAmbientSound() {
        // Sonido ambiente de ciudad
        this.ambientOscillator = this.audioContext.createOscillator();
        this.ambientGain = this.audioContext.createGain();
        
        this.ambientOscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        this.ambientOscillator.type = 'sine';
        this.ambientGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        
        this.ambientOscillator.connect(this.ambientGain);
        this.ambientGain.connect(this.audioContext.destination);
        this.ambientOscillator.start();
    }
    
    playSirenSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 1);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 2);
    }
    
    playExplosionSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
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
            4: 'Plaga de Langostas'
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
            { intensity: 0.1, duration: 10000, message: 'Temblores leves...' },
            { intensity: 0.3, duration: 8000, message: 'El terremoto se intensifica...' },
            { intensity: 0.6, duration: 6000, message: '¡TERREMOTO FUERTE!' },
            { intensity: 1.0, duration: 5000, message: '¡TERREMOTO DEVASTADOR!' },
            { intensity: 1.5, duration: 0, message: '¡APOCALIPSIS NUCLEAR!' }
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
                        this.playSirenSound();
                    }, 2000);
                }
                
                if (phase === 3) {
                    this.startPyramidDestruction();
                }
                
                if (phase === 4) {
                    this.startNuclearApocalypse();
                    return;
                }
                
                phase++;
                setTimeout(progressEarthquake, stage.duration);
            }
        };
        
        progressEarthquake();
    }
    
    startMeteorRain() {
        this.gameState.phase = 'meteor_rain';
        this.showStatus('¡LLUVIA DE METEORITOS! ¡Esquívalos!');
        
        this.renderer.setClearColor(0x4B0000);
        this.scene.fog.color.setHex(0xFF6600);
        
        this.meteorInterval = setInterval(() => {
            this.createMeteor();
        }, 800);
        
        // Completar nivel después de 60 segundos
        setTimeout(() => this.completeLevel(), 60000);
    }
    
    startHailstorm() {
        this.gameState.phase = 'hailstorm';
        this.showStatus('¡GRANIZO MORTAL! ¡Busca refugio!');
        
        this.renderer.setClearColor(0x2F4F4F);
        this.scene.fog.color.setHex(0x708090);
        
        this.hailInterval = setInterval(() => {
            this.createHailstone();
        }, 300);
        
        setTimeout(() => this.completeLevel(), 45000);
    }
    
    startLocustPlague() {
        this.gameState.phase = 'locust_plague';
        this.showStatus('¡PLAGA DE LANGOSTAS! ¡Sobrevive!');
        
        this.renderer.setClearColor(0x2F2F00);
        this.scene.fog.color.setHex(0x8B8000);
        
        this.createLocustSwarm();
        
        this.locustDamageInterval = setInterval(() => {
            if (!this.checkRefugeSafety()) {
                this.player.health -= 1;
                this.updateHealthUI();
            }
        }, 2000);
        
        setTimeout(() => this.completeLevel(), 40000);
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
        
        if (this.gameState.currentLevel < this.gameState.maxLevel) {
            this.gameState.currentLevel++;
            // Tiempo ajustado para cada nivel
            const levelTimes = [60, 50, 45, 40];
            this.gameState.timeToEarthquake = levelTimes[this.gameState.currentLevel - 1] || 40;
            this.gameState.phase = 'exploration';
            this.gameState.levelStartTime = Date.now();
            this.gameState.survivalTime = 0;
            
            // Restaurar cielo
            this.renderer.setClearColor(0xFDB813);
            this.scene.fog.color.setHex(0xFDB813);
            
            // Limpiar meteoros y efectos
            this.meteors.forEach(meteor => this.scene.remove(meteor));
            this.meteors = [];
            
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
    }
    
    startNuclearApocalypse() {
        this.gameState.phase = 'nuclear_apocalypse';
        this.showStatus('¡RADIACIÓN NUCLEAR! ¡CORRE AL BUNKER!');
        
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
    }
    
    createMeteor() {
        const meteorGeometry = new THREE.SphereGeometry(2, 8, 8);
        const meteorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff4400
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
                -20 - Math.random() * 10,
                (Math.random() - 0.5) * 2
            ),
            damage: 25
        };
        
        this.meteors.push(meteor);
        this.scene.add(meteor);
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
        
        // Verificar colisiones con edificios
        const playerBoundingBox = new THREE.Box3(
            new THREE.Vector3(newPosition.x - 1, newPosition.y - 1, newPosition.z - 1),
            new THREE.Vector3(newPosition.x + 1, newPosition.y + 1, newPosition.z + 1)
        );
        
        let canMove = true;
        this.buildings.forEach(building => {
            if (!building.userData.isDestroyed) {
                building.userData.boundingBox.setFromObject(building);
                if (playerBoundingBox.intersectsBox(building.userData.boundingBox)) {
                    canMove = false;
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
                // Meteoros y granizo normales
                meteor.position.add(meteor.userData.velocity);
                
                // Verificar colisión con el suelo
                if (meteor.position.y <= 2) {
                    this.playExplosionSound();
                    
                    // Verificar colisión con jugador
                    const distance = meteor.position.distanceTo(this.player.position);
                    if (distance < 10 && !this.checkRefugeSafety()) {
                        this.player.health -= meteor.userData.damage || 25;
                        this.updateHealthUI();
                    }
                    
                    // Remover meteoro
                    this.scene.remove(meteor);
                    this.meteors.splice(index, 1);
                    
                    // Crear efecto de explosión
                    this.createExplosionEffect(meteor.position);
                }
            }
        });
    }
    
    createExplosionEffect(position) {
        const explosionGeometry = new THREE.SphereGeometry(5, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff8800,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Animar y remover
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            explosion.scale.setScalar(scale);
            explosion.material.opacity -= 0.05;
            
            if (explosion.material.opacity <= 0) {
                this.scene.remove(explosion);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
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
}

// Inicializar el simulador cuando la página se cargue
window.addEventListener('load', () => {
    const simulator = new TokyoDisasterSimulator();
});
