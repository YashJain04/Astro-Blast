// guiControls.js
import dat from 'dat.gui'; 

// Define your settings object
export const settings = { 
  ammo: 100,
  FPS: 60,
  debug_cam: false,
  showHitbox: true
};

// Initialize the GUI
export const gui = new dat.GUI();
gui.close();

// Add controllers for the parameters
export const fpsController = gui.add(settings, 'FPS', 1, 165);
export const debugCamController = gui.add(settings, "debug_cam");
export const showHitboxController = gui.add(settings, 'showHitbox');

// AMMO Section
export const ammoController = gui.add(settings, 'ammo', 0, 100).listen();
let lastShotTime = 0;
function handleSpacebar(event) {
    if (event.code === 'Space') {
      const currentTime = Date.now();
      if (currentTime - lastShotTime >= 500) {
        if (settings.ammo > 1) {
          settings.ammo -= 1;
          ammoController.updateDisplay();
        }
        lastShotTime = currentTime;
      }
    }
}
const ammoInput = ammoController.domElement.querySelector('input');
ammoInput.disabled = true;
ammoController.domElement.style.pointerEvents = 'none';

// Optional: helper function to update the controllers
export function updateGUI() { 
  fpsController.updateDisplay()
  showHitboxController.updateDisplay()
}

export function initKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowUp': 
          break;
        case 'ArrowDown': 
          break;
        case 'D':
        case 'd':
        case 'ArrowRight': 
          break;
        case 'A':
        case 'a':
        case 'ArrowLeft': 
          break;
        default:
          break;
      }
      handleSpacebar(event);
    });
}
