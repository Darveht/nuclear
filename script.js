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
            lastY: 0
        };
        this.runPressed = false;
        
        this.buildings = [];
        this.meteors = [];
        this.refuges = [];
        this.groundCracks = [];
        this.lighthouse = null;
        this.phoneAlert = null;
        
        this.gameState = {
            phase: 'exploration', // exploration, earthquake, apocalypse
            timeToEarthquake: 30,
            earthquakeIntensity: 0,
            isGameOver: false
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
        this.createTokyo();
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
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
        
        // Crear cámara
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(this.player.position);
        
        // Crear renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
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
    
    createTokyo() {
        this.createGround();
        this.createBuildings();
        this.createStreets();
        this.createRefuges();
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Guardar posiciones originales de vértices
        this.originalGroundVertices = [...this.ground.geometry.attributes.position.array];
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
    
    createBuildings() {
        const buildingTypes = [
            { width: 8, height: 30, depth: 8, color: 0x888888 },
            { width: 12, height: 45, depth: 10, color: 0x666666 },
            { width: 6, height: 20, depth: 6, color: 0x999999 },
            { width: 15, height: 60, depth: 12, color: 0x555555 },
            { width: 10, height: 35, depth: 8, color: 0x777777 }
        ];
        
        for (let x = -200; x <= 200; x += 25) {
            for (let z = -200; z <= 200; z += 25) {
                if (Math.abs(x) < 10 && Math.abs(z) < 10) continue; // Espacio para el jugador
                if (Math.random() > 0.7) continue; // No todos los espacios tienen edificios
                
                const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
                const building = this.createBuilding(type);
                building.position.set(
                    x + (Math.random() - 0.5) * 10,
                    type.height / 2,
                    z + (Math.random() - 0.5) * 10
                );
                
                this.buildings.push(building);
                this.scene.add(building);
            }
        }
    }
    
    createBuilding(type) {
        const geometry = new THREE.BoxGeometry(type.width, type.height, type.depth);
        const material = new THREE.MeshLambertMaterial({ color: type.color });
        const building = new THREE.Mesh(geometry, material);
        building.castShadow = true;
        building.receiveShadow = true;
        
        // Crear debris (escombros) para cuando se destruya
        const debrisGroup = new THREE.Group();
        for (let i = 0; i < 10; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                Math.random() * 2 + 1,
                Math.random() * 2 + 1,
                Math.random() * 2 + 1
            );
            const debrisMaterial = new THREE.MeshLambertMaterial({ color: type.color });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                (Math.random() - 0.5) * type.width,
                (Math.random() - 0.5) * type.height,
                (Math.random() - 0.5) * type.depth
            );
            debris.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    Math.random() * 3,
                    (Math.random() - 0.5) * 5
                ),
                angularVelocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2
                )
            };
            debrisGroup.add(debris);
        }
        
        // Ventanas
        const windowGeometry = new THREE.PlaneGeometry(1, 1);
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.3 ? 0xffff00 : 0x000044
        });
        
        for (let i = 0; i < 20; i++) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(
                (Math.random() - 0.5) * type.width * 0.8,
                (Math.random() - 0.5) * type.height * 0.8,
                type.depth / 2 + 0.1
            );
            building.add(window);
        }
        
        building.userData = { 
            originalPosition: building.position.clone(),
            originalRotation: building.rotation.clone(),
            isDestroyed: false,
            fallSpeed: 0,
            destructionProgress: 0,
            debris: debrisGroup,
            boundingBox: new THREE.Box3().setFromObject(building)
        };
        
        return building;
    }
    
    createStreets() {
        // Calles horizontales
        for (let x = -250; x <= 250; x += 50) {
            const streetGeometry = new THREE.PlaneGeometry(500, 4);
            const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2;
            street.position.set(0, 0.1, x);
            this.scene.add(street);
        }
        
        // Calles verticales
        for (let z = -250; z <= 250; z += 50) {
            const streetGeometry = new THREE.PlaneGeometry(4, 500);
            const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2;
            street.position.set(z, 0.1, 0);
            this.scene.add(street);
        }
    }
    
    createRefuges() {
        const refugePositions = [
            { x: -50, z: -50 },
            { x: 50, z: 50 },
            { x: -80, z: 80 },
            { x: 100, z: -70 }
        ];
        
        refugePositions.forEach(pos => {
            // Crear entrada del refugio
            const entranceGeometry = new THREE.BoxGeometry(8, 4, 8);
            const entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
            entrance.position.set(pos.x, 2, pos.z);
            
            // Crear escaleras bajando
            const stairsGeometry = new THREE.BoxGeometry(6, 1, 15);
            const stairsMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const stairs = new THREE.Mesh(stairsGeometry, stairsMaterial);
            stairs.position.set(pos.x, -2, pos.z);
            
            // Crear refugio subterráneo
            const refugeGeometry = new THREE.BoxGeometry(20, 8, 20);
            const refugeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const refuge = new THREE.Mesh(refugeGeometry, refugeMaterial);
            refuge.position.set(pos.x, -6, pos.z);
            
            // Señal de refugio
            const signGeometry = new THREE.PlaneGeometry(4, 2);
            const signMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                map: this.createRefugeSignTexture()
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(pos.x, 6, pos.z);
            
            entrance.userData = { isRefuge: true };
            refuge.userData = { isRefuge: true };
            
            this.refuges.push(entrance, refuge);
            this.scene.add(entrance);
            this.scene.add(stairs);
            this.scene.add(refuge);
            this.scene.add(sign);
        });
    }
    
    createRefugeSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#ffff00';
        context.fillRect(0, 0, 256, 128);
        context.fillStyle = '#000000';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText('REFUGIO', 128, 50);
        context.fillText('SHELTER', 128, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createLighthouse() {
        // Torre del faro
        const towerGeometry = new THREE.CylinderGeometry(3, 4, 30, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0, 15, 0);
        
        // Luz del faro
        const lightGeometry = new THREE.SphereGeometry(2, 8, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(0, 25, 0);
        
        // Luz direccional del faro
        this.lighthouseLight = new THREE.SpotLight(0xff0000, 2, 200, Math.PI / 6, 0.1);
        this.lighthouseLight.position.set(0, 25, 0);
        this.lighthouseLight.target.position.set(50, 0, 0);
        this.lighthouseLight.castShadow = true;
        
        this.lighthouse = new THREE.Group();
        this.lighthouse.add(tower);
        this.lighthouse.add(light);
        this.lighthouse.add(this.lighthouseLight);
        this.lighthouse.add(this.lighthouseLight.target);
        
        this.scene.add(this.lighthouse);
    }
    
    createPhoneAlert() {
        const alertDiv = document.createElement('div');
        alertDiv.id = 'phone-alert';
        alertDiv.innerHTML = `
            <div class="phone">
                <div class="phone-screen">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-title">ALERTA DE TERREMOTO</div>
                    <div class="alert-message">Por favor refúgiese inmediatamente</div>
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
        }, 8000);
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
                    this.mouse.x += e.movementX * 0.002;
                    this.mouse.y += e.movementY * 0.002;
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
        
        // Touch look controls (for camera)
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.touchLook.active = true;
                this.touchLook.lastX = e.touches[0].clientX;
                this.touchLook.lastY = e.touches[0].clientY;
            }
        });
        
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.touchLook.active && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - this.touchLook.lastX;
                const deltaY = e.touches[0].clientY - this.touchLook.lastY;
                
                this.mouse.x += deltaX * 0.005;
                this.mouse.y += deltaY * 0.005;
                this.mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouse.y));
                
                this.touchLook.lastX = e.touches[0].clientX;
                this.touchLook.lastY = e.touches[0].clientY;
            }
        });
        
        this.renderer.domElement.addEventListener('touchend', (e) => {
            this.touchLook.active = false;
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
        const countdown = setInterval(() => {
            this.gameState.timeToEarthquake--;
            this.timerElement.textContent = this.gameState.timeToEarthquake;
            
            if (this.gameState.timeToEarthquake <= 0) {
                clearInterval(countdown);
                this.startEarthquake();
            }
        }, 1000);
    }
    
    startEarthquake() {
        this.gameState.phase = 'earthquake';
        document.getElementById('timer').style.display = 'none';
        
        // Mantener cielo azul, crear faro rojo
        this.createLighthouse();
        
        // Crear alerta de teléfono
        this.createPhoneAlert();
        
        // Añadir clase earthquake al body
        document.body.classList.add('earthquake');
        
        // Mostrar mensaje
        this.showStatus('¡TERREMOTO! ¡BUSCA REFUGIO!');
        
        // Empezar sirenas
        this.sirenInterval = setInterval(() => {
            this.playSirenSound();
        }, 3000);
        
        // Iniciar intensidad del terremoto
        this.gameState.earthquakeIntensity = 1;
        
        // Crear grietas en el suelo
        this.createGroundCracks();
        
        // Después de 10 segundos, empezar fase apocalíptica
        setTimeout(() => {
            this.startApocalypse();
        }, 10000);
    }
    
    startApocalypse() {
        this.gameState.phase = 'apocalypse';
        this.showStatus('¡METEORITOS! ¡CORRE!');
        
        // Aumentar intensidad del terremoto
        this.gameState.earthquakeIntensity = 2;
        
        // Empezar a generar meteoritos
        this.meteorInterval = setInterval(() => {
            this.createMeteor();
        }, 2000);
        
        // Empezar destrucción de edificios
        this.startBuildingDestruction();
    }
    
    createMeteor() {
        const meteorGeometry = new THREE.SphereGeometry(2, 8, 8);
        const meteorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff4400,
            emissive: 0x441100
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
    
    startBuildingDestruction() {
        this.buildings.forEach((building, index) => {
            setTimeout(() => {
                if (!building.userData.isDestroyed && Math.random() > 0.7) {
                    building.userData.isDestroyed = true;
                    building.userData.fallSpeed = 0.1;
                }
            }, Math.random() * 20000);
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
            return distance < 8;
        });
        
        if (isInRefuge && this.gameState.phase === 'apocalypse') {
            this.player.health = Math.min(100, this.player.health + 0.5);
        }
        
        return isInRefuge;
    }
    
    updateMeteors() {
        this.meteors.forEach((meteor, index) => {
            meteor.position.add(meteor.userData.velocity);
            
            // Verificar colisión con el suelo
            if (meteor.position.y <= 2) {
                this.playExplosionSound();
                
                // Verificar colisión con jugador
                const distance = meteor.position.distanceTo(this.player.position);
                if (distance < 10 && !this.checkRefugeSafety()) {
                    this.player.health -= meteor.userData.damage;
                    this.updateHealthUI();
                }
                
                // Remover meteoro
                this.scene.remove(meteor);
                this.meteors.splice(index, 1);
                
                // Crear efecto de explosión
                this.createExplosionEffect(meteor.position);
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
        this.camera.rotation.x = this.mouse.y;
        this.camera.rotation.y = this.mouse.x;
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
