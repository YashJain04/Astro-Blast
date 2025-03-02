import * as THREE from 'three';
import { initKeyboardControls, heightController, lengthController, fpsController, debugCamController, settings, ammoController, showHitboxController } from './guiControls.js'; 
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // allows loading models in .glb format
import { FireEffect } from './fire.js'; // fire particles

// variable to keep track of our game (initially the game is not started)
let gameStatus = false;

// if the game has not started
if (!gameStatus) {
    // load our background image
    document.body.style.backgroundImage = "url('models/spaceBackground6.webp')";

    // preserve the aspect ratio for high quality and cover the entire page
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';

    // make sure it is not scrollable
    document.body.style.backgroundAttachment = 'fixed';

    // create the initial welcome game text
    const welcomeText = document.createElement('div');
    welcomeText.id = 'game-text';
    welcomeText.innerText = 'Welcome to AstroBlast';
    welcomeText.style.position = 'absolute';
    welcomeText.style.top = '40%';
    welcomeText.style.left = '50%';
    welcomeText.style.transform = 'translate(-50%, -50%)';
    welcomeText.style.fontFamily = "'Press Start 2P', sans-serif"; // 8 bit font
    welcomeText.style.fontSize = '30px';
    welcomeText.style.color = 'white';
    welcomeText.style.textAlign = 'center';
    welcomeText.style.textShadow = '4px 4px 8px black';

    // create the start button
    const startButton = document.createElement('button');
    startButton.innerText = 'START GAME';
    startButton.style.position = 'absolute';
    startButton.style.top = '55%';
    startButton.style.left = '50%';
    startButton.style.transform = 'translate(-50%, -50%)';
    startButton.style.fontFamily = "'Press Start 2P', sans-serif";
    startButton.style.fontSize = '20px';
    startButton.style.padding = '10px 20px';
    startButton.style.background = 'red';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.cursor = 'pointer';
    startButton.style.textShadow = '2px 2px 4px black';
    
    // initially since the game has not started make the health bar invisible from the HTML document
    const healthBar = document.getElementById('healthBar');
    const healthBarContainer = document.getElementById('healthBarContainer');
    if (healthBar) healthBar.style.visibility = 'hidden';
    if (healthBarContainer) healthBarContainer.style.visibility = 'hidden';

    // if the start button is clicked - remove the current text on the screen and call the start game function
    startButton.addEventListener('click', () => {
        // set the game status to be true because the user clicked the button to start the game
        gameStatus = true;
        
        // call the start game function
        startGame();

        // remove current text and buttons
        welcomeText.remove();
        startButton.remove();
    });

    // add elements to document
    document.body.appendChild(welcomeText);
    document.body.appendChild(startButton);
}

/**
 * function that is responsible for the game starting
 */
function startGame() {
    // indicate that the game has started
    console.log("Game Started!")

    // render our health bar right away
    const healthBar = document.getElementById('healthBar');
    const healthBarContainer = document.getElementById('healthBarContainer');
    if (healthBar) healthBar.style.visibility = 'visible';
    if (healthBarContainer) healthBarContainer.style.visibility = 'visible';

    // all content and drawings will be organized in a scenegraph
    const scene = new THREE.Scene();

    // initialize a camera to look at scene's content and drawings
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // setting up the camera's position
    camera.position.x = 6;
    camera.position.y = 3;
    camera.position.z = 0;

    // initialize a renderer and set a state (size)
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // add the output of the renderer to the HTML element
    document.body.appendChild(renderer.domElement);

    // use ambient lighting for brighter scene
    const ambientLight = new THREE.AmbientLight('white');
    scene.add(ambientLight);
    
    // only display axes and let the user move the camera if in debug mode (off by default)
    const axesHelper = new THREE.AxesHelper(2);
    const gridhelper = new THREE.GridHelper(50, 50);
    
    // create controls
    let controls;
    debugCamController.onChange((value) => {
        if(controls == null)
            controls = new OrbitControls(camera, renderer.domElement);
    
        controls.enableDamping = value;
        controls.enablePan = value;
        controls.enableRotate = value;
    
        if(value)
            scene.add(axesHelper);
        else
            scene.remove(axesHelper);
    });

    // added vertical grid
    const verticalGrid = new THREE.GridHelper(50, 50);
    verticalGrid.rotation.x = Math.PI / 2; // rotate 90 degrees to align with the YZ plane
    verticalGrid.position.z = -25; // move the grid to the back of the scene
    //scene.add(verticalGrid, gridhelper);

    // add the controls, axis lines/helper, and the ambient lighting to the scene
    scene.add(controls, axesHelper, ambientLight);

    // keep track of the hit boxes (rectangles around objects)
    const hitboxes = []

    // variables to keep track of rocket and bullets
    let rocketGroup, rocketHealth, rocket;
    rocketHealth = 100;
    let bulletModel;
    let lastShotTime = 0;

    // variables to keep track of missiles/projectiles
    const missileSpeed = 0.25;
    const missileLifetime = 5000; // 5 seconds in milliseconds
    const targetDistanceThreshold = 10; // minimum distance for missle to target asteroid 

    // keep track of all bullets and asteroids
    const bullets = [];
    const asteroids = [];
    const explosions = [];
    const secondaryBullets = [];
    let lastSecondaryShotTimes = 0;

    // variable for all the stars in the background
    const starField = createStarField();

    /**
     * keys state
     * 0 : up key
     * 1 : right key pressed
     * 2 : down key pressed
     * 3 : left key pressed
     */
    let arrowKeysState = [false, false, false, false] 
    initKeypressEventListeners()

    // create a group for the rocket and add it to the scene after rotating in Y
    rocketGroup = new THREE.Group()
    rocketGroup.rotateY(-Math.PI/2)
    scene.add(rocketGroup)

    let orangeCone, orangeCone2, orangeCone3;
    let AmmoJS = 0

    const shields = [];
    let shieldActive = false;
    let shieldActivationTime = 0;
    setInterval(createShieldPowerUp, 7500);

    // initialize a loader to load models in .glb format
    const loader = new GLTFLoader();
    
    // load our spaceship
    loader.load('models/spaceship.glb', function (gltf) {
        // add it to scene
        scene.add(gltf.scene);
        rocket = gltf.scene;

        
        // add rocket to our rocket group
        rocketGroup.add(rocket)

        // scale the rocket in size
        rocket.scale.set(0.2, 0.2, 0.2);
        const rocketHitbox = new THREE.BoxHelper(rocket, 'green')
        // rocketHitbox.scale.set(0.9, 1.2, 0.8)
        rocketHitbox.scale.set(0.1, 0.1, 0.1)
        rocketHitbox.update()
        hitboxes.push(rocketHitbox)
        rocketGroup.add(rocketHitbox)
    


        // TODO: position the rocket to the center of the scene
        // rocket.position.x = 5;
        // rocket.position.y = 0.5;
        rocket.position.y = 0.5;
    
        // create geometries and materials
        const sphereGeometry = new THREE.ConeGeometry(1, 2, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
        orangeCone = new THREE.Mesh(sphereGeometry, sphereMaterial);
        orangeCone.position.set(0, 5.4, -10.25);
        orangeCone.rotation.x = -Math.PI / 2;

        // add to our rocket
        rocket.add(orangeCone);
    
        orangeCone2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        orangeCone2.position.set(-1.5, 3, -10.25);
        orangeCone2.rotation.x = -Math.PI / 2;

        // add to our rocket
        rocket.add(orangeCone2);
    
        orangeCone3 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        orangeCone3.position.set(1.5, 3, -10.25);
        orangeCone3.rotation.x = -Math.PI / 2;

        // add to our rocket
        rocket.add(orangeCone3);

    }, undefined, function (error) {
        // in case of error
        console.error(error);
    });

    // load our rockets
    loader.load('models/rocket.glb', function (gltf) {
        // create bullet model
        bulletModel = gltf.scene;

        // scale the bullet in size
        bulletModel.scale.set(0.05, 0.05, 0.05);
    }, undefined, function (error) {
        // in case of error
        console.error(error);
    });

    // create a shield for our rocket and add it to our group while scaling in size
    const material = new THREE.PointsMaterial({
        color: 0x0050FF,
        size: 0.1, // adjust size
        transparent: false,
        opacity: 0.9
    });
    
    // add the shield
    const shield = new THREE.Points(new THREE.IcosahedronGeometry(5, 5), material);
    rocketGroup.add(shield);
    shield.scale.set(0.5, 0.5, 0.75);
    shield.visible = false

    // TODO: warp field (could be removed later, its just a placeholder)
    const warpField = new THREE.PointsMaterial({
        color: 0x0050FF, // orange colour
        size: 0.1, // adjust size
        transparent: false,
        opacity: 0.9
    });

    // add the warp
    const warp = new THREE.Points(new THREE.IcosahedronGeometry(5, 8), warpField);
    scene.add(warp);
    warp.scale.set(2, 2, 25);
    warp.rotateY(Math.PI / 2);

    /**
     * initialises AmmoJS library
     */
    function initAmmoJS(){
        Ammo().then(ammo=>{
            AmmoJS = ammo 
        })
    }

    /**
     * listen for key presses
     */
    function initKeypressEventListeners(){

        function onKeyDown(event){
            if (event.key == 'ArrowUp') {
                arrowKeysState[0] = true;
            }
            if (event.key == 'ArrowRight' || event.key == 'D' || event.key == 'd') {
                arrowKeysState[1] = true;
            }
            if (event.key == 'ArrowDown') {
                arrowKeysState[2] = true;
            }
            if (event.key == 'ArrowLeft' || event.key == "A" || event.key == 'a') {
                arrowKeysState[3] = true;
            } 
        }

        function onKeyUp(event){
            if (event.key == 'ArrowUp') {
                arrowKeysState[0] = false;
            }
            if (event.key == 'ArrowRight' || event.key == 'D' || event.key == 'd') {
                arrowKeysState[1] = false;
            }
            if (event.key == 'ArrowDown') {
                arrowKeysState[2] = false;
            }
            if (event.key == 'ArrowLeft' || event.key == "A" || event.key == 'a') {
                arrowKeysState[3] = false;
            } 
        }

        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);

    }

    /**
     * responsible for creating our asteroids
     */
    function createAsteroid() {
        const numAsteroidModels = 6;
        const randomlyChosenAsteroidModel = Math.floor(Math.random() * numAsteroidModels) + 1;
        
        loader.load(`models/asteroids/asteroid${randomlyChosenAsteroidModel}.glb`, function (gltf) {

            const singleAsteroidGroup = new THREE.Group() //THREE.Group used to store a single asteroid
            singleAsteroidGroup.position.set(-25, 0, Math.random() * 14 - 7); // Start from the left side with random Z position
            
            if (gameStatus) {
                scene.add(singleAsteroidGroup)
            }

            const asteroid = gltf.scene;
            // TODO: We should remove this line... no longer needed so I commented it out.
            // asteroid.position.set(-40, 1, Math.random() * 14 - 7);
            singleAsteroidGroup.add(asteroid)
            
            const asteroidHitbox = new THREE.BoxHelper(asteroid, 'red')
            singleAsteroidGroup.add(asteroidHitbox)
            hitboxes.push(asteroidHitbox)

            
            
            asteroids.push(singleAsteroidGroup);
            

        }, undefined, function (error) {
            console.error(error);
        });
    }

    // call this function thus creating asteroids every second
    setInterval(createAsteroid, 1000);

    function createExplosion(position) {
        const material = new THREE.PointsMaterial({
            color: 0xEEEEEE,
            size: 0.1,
            transparent: false,
            opacity: 1.0
        });
        const explosion = new THREE.Points(new THREE.SphereGeometry(5), material);
        explosion.geometry.scale(0.01, 0.01, 0.01);
        explosion.position.set(position.x, position.y, position.z);
    
        explosions.push(explosion);
        scene.add(explosion);
    }
    
    camera.position.x = 6;
    camera.position.y = 4;
    camera.rotateY(Math.PI / 2);
    camera.rotateX(-0.3);

    const missileFireEffects = {};
    const fireEffectShip = new FireEffect(rocketGroup); // used for fire particle

    // add a listener for key downs
    document.addEventListener('keydown', (event) => {
        const now = Date.now(); 
        if (event.code === 'Space' && settings.ammo > 0 && bulletModel && now - lastShotTime >= 500) {
            lastShotTime = now;
            ammoController.updateDisplay();
            
            const bullet = bulletModel.clone();
            bullet.position.copy(rocketGroup.position);
            bullet.position.y = rocket.position.y;
            bullet.position.x -= 1.25; 
            bullet.position.y += 1.35; 
            bullet.rotation.z = -0 ;

            // Create a small red sphere on top of the bullet
            const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const redSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            redSphere.position.set(0, 0.1, 0);
            bullet.add(redSphere);

            scene.add(bullet);
            bullets.push({ mesh: bullet, spawnTime: Date.now() }); // Store the spawn time of the bullet and the mesh itself
            console.log('Pew pew');
            missileFireEffects[bullet.uuid] = new FireEffect(scene);
        }
        if (event.key === 'f'){
            shield.visible = !shield.visible;
            warp.visible = !warp.visible; 
            fireEffectShip.visible();
        }
        // Secondary Bullet - Fires when pressing "v"
        if (event.key === 'v' && settings.ammo > 0 && now - lastSecondaryShotTimes >= 500) {
            lastSecondaryShotTimes = now;
            const secondaryBulletGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.2); // Small rectangle
            const secondaryBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow color
            const secondaryBullet = new THREE.Mesh(secondaryBulletGeometry, secondaryBulletMaterial);
            
            secondaryBullet.position.copy(rocketGroup.position);
            secondaryBullet.position.y = rocket.position.y;
            secondaryBullet.position.x -= 1.5; 
            secondaryBullet.position.y += 1.35;
            secondaryBullet.scale.set(0.5, 0.5, 0.5);

            scene.add(secondaryBullet);
            secondaryBullets.push(secondaryBullet);
            console.log('Secondary bullet fired');
            
        }
    });

    // angular velocity and acceleration of the spaceship
    let angularVelocity = 0.01
    let angularAcceleration = 0

    let linearVelocity = [0, 0, 0]
    let linearAcceleration = [0, 0, 0]

    /**
     * this function animates the spaceship. It will apply the idle/moving animations etc depending on the state of the key presses
     */
    function animateSpaceship(){
        if (rocket != null){  
            const DAMPING_FACTOR = 0.007
            const INERTIA = 0.001

            //if player is not pressing 'left' or 'right', display idle animation
            if (!arrowKeysState[1] && !arrowKeysState[3]){

                //physics for movement of the spaceship
                linearAcceleration[1] = -1 * INERTIA * rocket.position.y
                linearVelocity[1] += linearAcceleration[1]
                rocket.position.y += linearVelocity[1] + 0.5 * linearAcceleration[1]

                //physics for rotation of the spaceship
                angularAcceleration = -1 * INERTIA * rocket.rotation.z - DAMPING_FACTOR * angularVelocity
                angularVelocity += angularAcceleration
                rocket.rotation.z += angularVelocity + 0.5 * angularAcceleration

            }
            else{

                const HEIGHT_DIP_CAP = -0.5
                const DIP_ACCELERATION = -0.0005
                const rotationAngleCap = 0.2 * Math.PI

                linearAcceleration[1] = DIP_ACCELERATION
                linearVelocity[1] += linearAcceleration[1]
                rocket.position.y += linearVelocity[1] + 0.5 * linearAcceleration[1]
                if (rocket.position.y <= HEIGHT_DIP_CAP){
                    linearVelocity[1] = 0
                    rocket.position.y = HEIGHT_DIP_CAP
                }

                //player is pressing left key
                if (arrowKeysState[3] && rocketGroup.position.z <= 6){
                    rocketGroup.position.z += 0.05
                    rocket.rotateZ(-0.01)
                    if (rocket.rotation.z <=  -1 * rotationAngleCap){
                        rocket.rotation.z = -1 * rotationAngleCap
                    }
                    rocketGroup.position.z += 0.05
                }

                //player is pressing right key
                else if (arrowKeysState[1] && rocketGroup.position.z >= -6){
                    rocketGroup.position.z -= 0.05
                    rocket.rotateZ(0.01)
                    if (rocket.rotation.z >= rotationAngleCap){
                        rocket.rotation.z = rotationAngleCap
                    }
                }
            }
        }
    }

    // added light to the scene, otherwise stuff was black
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    animate(fpsController.getValue()); //60 FPS by default, can be changed on the dat.gui
    initKeyboardControls();

    /**
     * Function to update homing behavior for multiple missiles
     * @param {*} missiles 
     * @param {*} asteroid 
     */
    function updateHomingMissiles(missiles, targets) {
        const currentTime = Date.now();
        const initialForwardTime = 750; // 0.75 seconds to go forward before homing

        for (let i = missiles.length - 1; i >= 0; i--) {
            let missile = missiles[i];

            if (currentTime - missile.spawnTime > missileLifetime) {
                scene.remove(missile.mesh);
                missiles.splice(i, 1);
                continue;
            }

            let directionVector;

            if (currentTime - missile.spawnTime < initialForwardTime) {
                // Initial forward movement
                directionVector = new THREE.Vector3(-1, 0, 0); 
                missile.mesh.position.addScaledVector(directionVector, missileSpeed);

            }
            
            else {
                // Homing behavior
                let closestTarget = findClosestTarget(missile.mesh.position, targets);
                if (closestTarget) { // Check if a target was found
                
                    // If the missile has collided with the target, remove it
                    if(closestTarget.position.distanceTo(missile.mesh.position) < 0.1) {
                        scene.remove(closestTarget);
                        scene.remove(missile.mesh);
                        missiles.splice(i, 1);
                        createExplosion(closestTarget.position);
                        // Go closer to the target
                    }
                    
                    else {
                        directionVector = new THREE.Vector3().subVectors(closestTarget.position, missile.mesh.position);
                        directionVector.normalize();
                        missile.mesh.position.addScaledVector(directionVector, missileSpeed);
                    }
                }
                
                else {
                    // What to do if no target is found after initial time? Keep going forward
                    directionVector = new THREE.Vector3(0, 0, 1);
                    missile.mesh.position.addScaledVector(directionVector, missileSpeed);
                }
            }

            //if (missileFireEffects[missile.mesh.uuid]) {
            //    missileFireEffects[missile.mesh.uuid].animate(missile.mesh.position.z, missile.mesh.position.y, 0.25);
            //}


        }
    }

    /**
     * Finds the closest target while prioritizing those with a lower X position.
     * @param {THREE.Vector3} position - The current missile position.
     * @param {Array} targets - List of potential targets.
     * @returns The closest target considering weighted distances.
     */
    function findClosestTarget(position, targets) {
        return targets.reduce((closest, target) => {
            let dx = target.position.x - position.x;
            let dy = target.position.y - position.y;
            let dz = target.position.z - position.z;

            // Adjust weighting based on X position
            let xWeight = dx > 0 ? 10 : 0.5; // More weight for negative X, less for positive X
            let weightedDx = dx * xWeight;

            let weightedDistance = Math.sqrt(weightedDx * weightedDx + dy * dy + dz * dz);

            let closestDx = closest.position.x - position.x;
            let closestDy = closest.position.y - position.y;
            let closestDz = closest.position.z - position.z;
            
            let closestXWeight = closestDx < 0 ? 1.5 : 0.7;
            let closestWeightedDx = closestDx * closestXWeight;

            let closestWeightedDistance = Math.sqrt(closestWeightedDx * closestWeightedDx + closestDy * closestDy + closestDz * closestDz);

            return weightedDistance < closestWeightedDistance ? target : closest;
        }, targets[0]);
    }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param {*} collisionStatus boolean to track where it was called from
     */
    function updateHealthBar(collisionStatus) {

        // if the spaceship actually collided with an asteroid this will execute
        if (collisionStatus && !shield.visible) {
            const healthBar = document.getElementById('healthBar');
            
            // Update the health bar’s width based on the current health
            rocketHealth -= 10;
            healthBar.style.width = rocketHealth + '%';
        }

        // if the spaceship hit a shield icon...solidify the health bar to look like rock
        if (!collisionStatus && shield.visible) {
            const healthBar = document.getElementById('healthBar');
            
            // give the health bar a rock-like appearance
            healthBar.style.backgroundColor = 'gray';
            healthBar.style.backgroundImage = 'url("models/rockTexture.jpg")'; // load the rock texture
            healthBar.style.backgroundSize = 'cover';
            healthBar.style.borderRadius = '5px';
            healthBar.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5)';
            healthBar.style.pointerEvents = 'none';
        }

        // else if the spaceship is not currently shielded and not in collision with anything
        else if (!collisionStatus && !shield.visible) {
            const healthBar = document.getElementById('healthBar');
        
            // apply the gradient background
            let gradient;
            if (rocketHealth < 30) {
            gradient = 'red'; // solid red when on low health
            }

            else if (rocketHealth >= 30 && rocketHealth <= 50) {
                gradient = 'linear-gradient(to right, red, orange)'; // gradient from red to orange when health bar is halfish health
            }
            
            else if (rocketHealth > 50 && rocketHealth <= 70) {
                gradient = 'linear-gradient(to right, red, orange, yellow)'; // gradient from red to orange to yellow when health bar is more than halfish health
            }
            
            else {
            gradient = 'linear-gradient(to right, red, orange, yellow, green)'; // full gradient from red to orange to yellow to green when health bar is nearly full
            }
            
            // apply the gradient and some other styles
            healthBar.style.background = gradient;
            healthBar.style.borderRadius = '0px';
            healthBar.style.boxShadow = 'inset 0 0 5px rgba(0, 0, 0, 0.5);';
            healthBar.style.pointerEvents = 'auto';
        }
        

        // if the health bar is 0 or less, end the game
        if (rocketHealth <= 0) {
            // print the status of the game to the user in the console
            console.log("Game Over! Spaceship destroyed.");

            // TODO:
            // triggerExplosion();
            
            // call the end game function
            endGame();
        }
    }

    /**
     * function to create 1000 random stars in the background of the game with randomly generated different positions and adds it to the scene
     * @returns the star field which contains all of our stars
     */
    function createStarField() {
        // create a random set of 1000 stars
        const starCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);

        // set the x, y, z positions
        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }

        // set the positions
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // create the star material
        const material = new THREE.PointsMaterial({
            color: 0xffffff,  // White stars
            size: 0.75,  // Adjust star size
            transparent: true
        });

        // create the stars from the geometry and the material
        const stars = new THREE.Points(geometry, material)
        
        // add stars to the scene
        scene.add(stars);

        // return all of our stars
        return stars;
    }

/**
 * function to animate our stars so that they are not static and move in the spaceships direction
 */
    function animateStars() {
        const positions = starField.geometry.attributes.position.array;

        // change stars to go from left-right (can change in other directions as well)
        for (let i = 0; i < positions.length; i += 3) {
            // change value for speed
            positions[i] -= 2

            // in case stars go out of FOV and screen view, rearrange them
            if (positions[i] < -500) {
                positions[i] = 500;
            }
        }

        starField.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * create celestial objects
     * - responsible for creating the planets and moon
     * - responsible for creating the volumetric nebula
     */
    function createCelestialObjects() {
        createPlanetsAndMoon();
        // TODO:
        // createVolumetricNebula();
    }

    /**
     * function to create all of our individual planets and the moon
     */
    function createPlanetsAndMoon() {
        createEarth();
        createSaturn();
        createVenus();
        createMoon();
    }

    /**
     * create earth
     */
    function createEarth() {
        // load our earth texture
        const textureLoader = new THREE.TextureLoader();
        const planetTexture = textureLoader.load('models/earthTexture.jpeg');

        // create sphere for the earth
        const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
        const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });

        // create the planet and add it to our scene
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(-48, 0, -15);
        scene.add(planet);

        // add a nice atmosphere to the planet (earth is blue)
        createAtmosphere(planet, 1);

        // rotate the planet continuously
        function animateEarth() {
            requestAnimationFrame(animate)

            // rotate the planet around the y axis
            planet.rotation.y += 0.01;
        }

        // start the animation so that earth is rotating
        animateEarth();
    }

    /**
     * create saturn
     */
    function createSaturn() {
        // load our saturn texture
        const textureLoader = new THREE.TextureLoader();
        
        // planet texture
        const planetTexture = textureLoader.load('models/saturnTexture.jpg');

        // saturn has rings so give that a nice texture too
        const ringTexture = textureLoader.load('models/ringsTexture.jpg');

        // create sphere for saturn
        const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
        const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });

        // create the planet and add it to our scene
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(-50, 0, 20);
        scene.add(planet);

        // create ring geometry and material
        const ringGeometry = new THREE.RingGeometry(9, 7, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            map: ringTexture,
            side: THREE.DoubleSide,
            transparent: true,
        });

        // construct the rings and add it to our scene (same spot as our saturn planet)
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.position.set(-50, 0, 20);

        // tilt it so it looks realistic
        rings.rotation.x = Math.PI / 2.5;

        // add it to our scene
        scene.add(rings);

        // give it a nice atmosphere, saturn is light brownish
        createAtmosphere(planet, 2);

        // rotate the planet so that it is moving
        function animateSaturn() {
            requestAnimationFrame(animate);

            // we only want the planet to rotate - NOT THE RINGS
            planet.rotation.y += 0.005;
        }

        // call the animation function to rotate our planet
        animateSaturn();
    }

    /**
     * create venus
     */
    function createVenus() {
        // load the venus texture
        const textureLoader = new THREE.TextureLoader();
        const planetTexture = textureLoader.load('models/venusTexture.jpg');

        // create sphere for venus
        const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
        const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });

        // construct our planet and add it to the scene
        const venus = new THREE.Mesh(planetGeometry, planetMaterial);
        venus.position.set(-20, 0, 25);
        scene.add(venus);

        // add a nice atmosphere (venus is dark brownish)
        createAtmosphere(venus, 3);
        
        // start animating our venus so that it is rotating
        function animateVenus() {
            requestAnimationFrame(animateVenus);

            // rotate venus around the y axis
            venus.rotation.y += 0.005;
        }

        // call the function to animate venus
        animateVenus();
    }

    /**
     * function to create our moon
     */
    function createMoon() {
        // load our moon texture
        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load('models/moonTexture.jpg');

        // create a sphere for the moon
        const moonGeometry = new THREE.SphereGeometry(2, 64, 64);
        const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });

        // construct our moon and add it to the scene
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(-5, 0, -10);
        scene.add(moon);

        // add an atmosphere for our moon which is greyish
        createAtmosphere(moon, 4);

        // start animating our moon
        function animateMoon() {
            requestAnimationFrame(animateMoon);

            // rotate the moon around the y axis
            moon.rotation.y += 0.01;
        }

        // start animating the moon so it is rotating
        animateMoon();
    }

    /**
     * create atmosphere for planets
     * - earth = bluish
     * - saturn = sandish colour (light brown)
     * - venus = dark brownish
     * - moon = greyish
     * @param {*} planet the planet we will be applying the texture too
     * @param {*} specifier the specifier helps indicate which planet it is for specific colours
     * @returns NONE
     */
    function createAtmosphere(planet, specifier) {
        // of the 4 cases, 3 of them are a planet this line makes the geometry so that it is a little bit bigger than the plane itself to show it
        let atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);
        let atmosphereColor;

        // determine the colour
        switch (specifier) {
            case 1:
                // earth is blue
                atmosphereColor = new THREE.Color(0.2, 0.5, 1.0);
                break;
            case 2:
                // saturn is sandish
                atmosphereColor = new THREE.Color(0.9, 0.7, 0.4);
                break;
            case 3:
                // venus is dark brown
                atmosphereColor = new THREE.Color(0.4, 0.2, 0.1);
                break;
            case 4:
                // change the size because moon is relatively smaller than other planets
                atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
                
                // moon is greyish
                atmosphereColor = new THREE.Color(0.2, 0.2, 0.2);
                break;

            // in case of an invalid number (dead code)
            default:
                console.log("Testing...");
                return;
        }

        // create out atmosphere material from shaders
        const atmosphereMaterial = new THREE.ShaderMaterial({
            // vertex shader
            vertexShader: ` // Simple vertex shader
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,

            // fragment shader
            fragmentShader: ` // Fading effect based on the selected color
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.8 - dot(vNormal, vec3(0,0,1)), 3.0);
                    gl_FragColor = vec4(${atmosphereColor.r}, ${atmosphereColor.g}, ${atmosphereColor.b}, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });

        // actually create the atmosphere from the materials and geometries defined
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

        // add it to our planet parameter passed in
        planet.add(atmosphere);
    }

    /**
     * TODO:
     * create volumetric nebula...
     */
    function createVolumetricNebula() {
    }

    /**
     * TODO:
     * function to explode the spaceship on destruction
     */
    function triggerExplosion() {
        // create a particle system for explosion when the spaceship dies
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const explosion = new THREE.Mesh(geometry, material);

        // position it too where the rocket was
        explosion.position.set(rocket.position.x, rocket.position.y, rocket.position.z);
        scene.add(explosion);


        // animate it
        animateExplosion(explosion);
    }

    /**
     * TODO:
     * function to animate the explosion
     * @param {} explosion 
     */
    function animateExplosion(explosion) {
        // create some animation
        const scaleTween = new THREE.TWEEN.Tween(explosion.scale)
            .to({ x: 10, y: 10, z: 10 }, 500)
            .onComplete(() => {

                // remove the animation
                scene.remove(explosion);
            });
        scaleTween.start();
    }


    /**
     * function responsible for end game functionality
     */
    function endGame() {
        // print the status of the game to the user
        console.log("We are ending the game.")

        // set the current game status to false
        gameStatus = false;

        // remove objects from the scene
        const n = scene.children.length - 1; 
        for (var i = n; i > -1; i--) {
            scene.remove(scene.children[i]);
            console.log("Removing all children and objects of scene.")
        } 

        // clear the scene for additional safety
        scene.clear();

        // create game over text
        const gameOverText = document.createElement('div');
        gameOverText.id = 'game-over-text';
        gameOverText.innerText = 'GAME OVER';

        // apply styles to game over text
        gameOverText.style.position = 'absolute';
        gameOverText.style.top = '50%';
        gameOverText.style.left = '50%';
        gameOverText.style.transform = 'translate(-50%, -50%)';
        gameOverText.style.fontFamily = "'Press Start 2P', sans-serif";
        gameOverText.style.fontSize = '40px';
        gameOverText.style.color = 'red';
        gameOverText.style.textAlign = 'center';
        gameOverText.style.textShadow = '4px 4px 8px black';
        
        // add it to the document
        document.body.appendChild(gameOverText);

        // we restart the game automatically (have the user do it through button clicks is hard due to animation frames)
        // the clicks do not get registered during the game session
        const countdownText = document.createElement('div');
        countdownText.id = 'countdown-text';
        countdownText.innerText = 'Restarting Soon...';
        
        // add some styles
        countdownText.style.position = 'absolute';
        countdownText.style.top = 'calc(50% + 60px)';
        countdownText.style.left = '50%';
        countdownText.style.transform = 'translate(-40%, -50%)';
        countdownText.style.fontFamily = "'Press Start 2P', sans-serif"; // 8 bit font, but fall back on regular sans-serif
        countdownText.style.fontSize = '20px';
        countdownText.style.color = 'white';
        countdownText.style.textAlign = 'center';
        countdownText.style.textShadow = '2px 2px 4px black';
        countdownText.style.zIndex = '1000';
        countdownText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        countdownText.style.padding = '5px 10px';
        countdownText.style.borderRadius = '5px';
            
        // display to the user that we are restarting the game
        document.body.appendChild(countdownText);

        // create a sprite for a broken heart like in video games
        const heartImage = document.createElement('img');
        heartImage.src = 'models/heartbreak-Photoroom.png';
        heartImage.alt = 'Broken Heart';

        // apply styles
        heartImage.style.position = 'absolute';
        heartImage.style.top = '50%';
        heartImage.style.left = 'calc(50% + 225px)';
        heartImage.style.transform = 'translate(-50%, -50%)';
        heartImage.style.width = '80px';
        heartImage.style.height = '80px';
        heartImage.style.filter = 'brightness(1.2) contrast(1.5)';

        // add it to our document
        document.body.appendChild(heartImage);

        // automatically restar the game after 8 seconds
        // having the user do it on clicks is hard
        setTimeout(() => {
            console.log("We are restarting the game");
            
            // set the game status to false
            gameStatus = false;

            // remove any text
            gameOverText.remove();

            // FORCE RELOAD...
            location.replace(window.location.href);
        }, 3000);
    }

    // create our celestial objects
    createCelestialObjects();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * exhaust animation
     */
    function exaustAnimation() {
        const cones = [orangeCone, orangeCone2, orangeCone3];

        cones.forEach((cone, index) => {
            // Randomly change color to different shades of orange
            const hue = (20 + Math.sin(Date.now() * 0.003 + index) * 10) % 360; // Hue oscillates between 10-30
            const slowOrange = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
            cone.material.color.set(slowOrange);

            // Pulsing effect (scaling up and down)
            const scale = 1 + 0.075 * Math.sin(Date.now() * 0.005);
            cone.scale.set(scale, scale, scale);
        });
    }

    /**
     * Secondary bullet animation
     */
    function secondaryBulletAnimation(){
        for (let i = secondaryBullets.length - 1; i >= 0; i--) {
            secondaryBullets[i].position.x -= 0.15;

            // if there are asteroids
            if (asteroids.length > 0){
                let closestTarget = findClosestTarget(secondaryBullets[i].position, asteroids);
                // If the bullet has collided with the target, remove it
                if(closestTarget.position.distanceTo(secondaryBullets[i].position) < 0.5) {
                    scene.remove(closestTarget);
                    scene.remove(secondaryBullets[i]);
                    secondaryBullets.splice(i, 1);
                    createExplosion(closestTarget.position);
                }
            }

            // Remove bullets if they go out of bounds
            if (secondaryBullets[i].position.x < -30) {
                scene.remove(secondaryBullets[i]);
                secondaryBullets.splice(i, 1);
            }
        } 
    }

    /**
     * Function to create a shield power-up icon
     */
    function createShieldPowerUp() {
        loader.load('models/shieldIcon.glb', function (gltf) {
            const shieldPowerUp = gltf.scene;
            
            shieldPowerUp.position.set(-25, -2, (Math.random()*15)-1); // Spawn randomly along the Z-axis
            shieldPowerUp.scale.set(4, 4, 4);

            scene.add(shieldPowerUp);
            shields.push(shieldPowerUp); 
            shieldPowerUp.rotateY(Math.PI / 2);
        }, undefined, function (error) {
            console.error("Error loading shield power-up:", error);
        });
    }

    /**
     * update the shield power up and apply it to the spaceship based on the distance
     */
    function updateShieldPowerUp() {
        shields.forEach((shieldIcon, index) => {
            shieldIcon.position.x += 0.15; // Move shield icons from left to right

            // Calculate distance between the spaceship and the shield icon
            const xDistance = rocketGroup.position.x - shieldIcon.position.x;
            const zDistance = rocketGroup.position.z - shieldIcon.position.z;
            const distance = Math.sqrt(xDistance * xDistance + zDistance * zDistance);

            // console.log(distance);
            // TODO: Fix the distance...
            if (distance < 6.5) { // If shield icon is close to the spaceship (6.5)
                console.log("Shield collected!");

                if (!shieldActive) {
                    shield.visible = true; // Turn on the shield
                    shieldActive = true;
                    shieldActivationTime = Date.now(); // Start shield timer
                }

                // Remove shield icon after collecting
                scene.remove(shieldIcon);
                shields.splice(index, 1);
            }

            if (shieldIcon.position.x > 15) { // Remove shield icons when they go off-screen
                scene.remove(shieldIcon);
                shields.splice(index, 1);
            }
        });

        // Handle shield expiration and color change
        if (shieldActive) {
            let elapsed = (Date.now() - shieldActivationTime) / 5000; // Progress from 0 to 1 over 5 seconds

            // Smoothly transition color from blue to yellow
            let shieldColor = new THREE.Color().lerpColors(
                new THREE.Color(0x0050FF), // Start (blue)
                new THREE.Color(0xFFFF00), // End (yellow)
                elapsed // Interpolation factor (0 to 1)
            );
            shield.material.color.set(shieldColor);

            if (elapsed >= 1) { // Turn off shield after 5 seconds
                shield.visible = false;
                shieldActive = false;
                console.log("Shield deactivated.");
            }
        }
    }

    /**
     * function used to check if the hitbox of an asteroid collides with the hitbox of the spaceship
     * */
    function checkForAsteroidCollision(){
        

        if (rocketGroup.children[3]){
            const rocketHitbox = new THREE.Box3().setFromObject(rocketGroup.children[3]) 

            asteroids.forEach(asteroidGroup=>{
                if (asteroidGroup.children[1]){
                    const asteroidHitbox = new THREE.Box3().setFromObject(asteroidGroup) 
                    if (rocketHitbox.intersectsBox(asteroidHitbox)){
                        // console.log(asteroidGroup.children[0].children[0].position)
                        handleCollision(asteroidGroup)
                    }
                }      
            })
        }
        

    }

    /**
     * called when a collision between an asteroid and the rocket has been detected
     * old logic at the bottom of the function
     * */
    function handleCollision(asteroidGroup){
        asteroidGroup.children.forEach(child=>{
            asteroidGroup.remove(child)
        })
        // console.log(asteroidGroup.children)
        asteroids.filter(a=>a==asteroidGroup)
        scene.remove(asteroidGroup)

        updateHealthBar(true);
    }

    // FPS related stuff
    let previousDelta = 0
    function animate(currentDelta) {

        if (showHitboxController.getValue()){
            hitboxes.forEach(hitbox=>{
                hitbox.visible = true
            })
        }
        else{
            hitboxes.forEach(hitbox=>{
                hitbox.visible = false
            })
            
        }

        checkForAsteroidCollision()
        

        // console.log()
        

        requestAnimationFrame(animate);
        if (!orangeCone || !orangeCone2 || !orangeCone3) return; // Wait for the spaceship to load

        // check if the rocket is hit
        // checkCollisions()

        animateStars();

        var delta = currentDelta - previousDelta
        // console.log(delta)
        const FPS = fpsController.getValue()

        if (FPS && delta < 1000 / FPS) {
            return;
        }

        animateSpaceship()
        if (rocketGroup && rocket && rocketGroup.position && rocket.position) { // It kept crashing for some reason withouth this (I'm guessing its trying to access the position before its created?)
            fireEffectShip.animate(rocketGroup.position.z, rocket.position.y, 1); 
        }
        //console.log(rocket.position.y)
        //console.log(rocketGroup.position)
        //console.log(rocketGroup.position.z);

        if(asteroids.length != 0){updateHomingMissiles(bullets, asteroids)}
        exaustAnimation();
        secondaryBulletAnimation();
        updateShieldPowerUp();

        asteroids.forEach((asteroid, index) => {
            asteroid.position.x += 0.15; // Move asteroids from left to right
            if (asteroid.position.x > 15) { // Remove asteroid when it goes off-screen
                scene.remove(asteroid);
                asteroids.splice(index, 1);
            }
        });

        explosions.forEach((explosion, index) => {
            explosion.geometry.scale(1.4, 1.4, 1.4);
            explosion.material.opacity -= 0.3;
    
            if(explosion.material.opacity == 0) {
                scene.remove(explosion);
                explosions.splice(index, 1);
            }
        });

        shield.rotation.z += 0.01;
        warp.rotation.z += 0.015;

        renderer.render(scene, camera);

        previousDelta = currentDelta;

        updateHealthBar(false);
    }

    /**
     * function to check for collisions and update health bar
     * OLD FUNCTION, NEW FUNCTION HAS BEEN DEFINED BELOW
     */
    // function checkCollisions() {
    //     // for each asteroid check the distance to the rocket
    //     asteroids.forEach((asteroid, index) => {
    //         const distance = rocketGroup.position.distanceTo(asteroid.position);

    //         // if the asteroid is extremely close to rocket it has been hit
    //         if (distance < 2) {
    //             console.log("Rocket has been hit by the asteroid");

    //             rocketHealth -= 10; // reduce the health
    //             updateHealthBar() // update the health bar

    //             // remove the asteroid after the collision
    //             scene.remove(asetroid);
    //             asteroids.splice(index, 1);
    //         }
    //     });
    // }
}