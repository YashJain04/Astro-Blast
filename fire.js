import * as THREE from 'three';

/**
 * FireEffect class to create fire particles
 */
export class FireEffect {
    constructor(scene) {
        this.scene = scene;
        this.particleCount = 200;
        this.fireParticles = [];
          
        // Particle system
        this.particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const fireTexture = new THREE.TextureLoader().load('models/fire.jpeg');
        this.particleMaterial = new THREE.PointsMaterial({
            color: 0xffa500,
            size: 0.05,
            map: fireTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);
    }

    createFireParticle(origin, locationZ, locationY) {
        const index = Math.floor(Math.random() * this.particleCount);
        const positionAttribute = this.particleGeometry.getAttribute('position');
        positionAttribute.setXYZ(index, origin.x, locationY, locationZ);
        

        const direction = new THREE.Vector3( //direction where the firew ill go
            (Math.random() - 0.5) * 0.5, // Fire particles move right
            (Math.random() - 0.5) * 0.5,
            Math.random() * -1
        ).normalize().multiplyScalar(0.2);

        const lifeTime = 50 + Math.random() * 30;
        const colorAttribute = this.particleGeometry.getAttribute('color');
        const startColor = new THREE.Color(0xffa500);
        colorAttribute.setXYZ(index, startColor.r, startColor.g, startColor.b);

        return { index, direction, lifeTime };
    }

    updateParticles() {
        const positionAttribute = this.particleGeometry.getAttribute('position');
        const colorAttribute = this.particleGeometry.getAttribute('color');

        for (let i = this.fireParticles.length - 1; i >= 0; i--) {
            const particle = this.fireParticles[i];
            const vertex = new THREE.Vector3(
                positionAttribute.getX(particle.index),
                positionAttribute.getY(particle.index),
                positionAttribute.getZ(particle.index)
            );
            vertex.add(particle.direction);
            positionAttribute.setXYZ(particle.index, vertex.x, vertex.y, vertex.z);

            particle.lifeTime--;

            if (particle.lifeTime <= 0) {
                this.fireParticles.splice(i, 1);
                positionAttribute.setXYZ(particle.index, 0, 0, 0);
            } else {
                const ageFactor = 1 - (particle.lifeTime / 80);
                const currentColor = new THREE.Color(0xffa500).lerp(new THREE.Color(0xff0000), ageFactor);
                colorAttribute.setXYZ(particle.index, currentColor.r, currentColor.g, currentColor.b);
            }
        }

        positionAttribute.needsUpdate = true;
        colorAttribute.needsUpdate = true;
    }

    /**
     * Uses the Z location information from rocketGroup and the Y information from rocket to decide where the fire comes from
     * @param {*} locationZ 
     * @param {*} locationY 
     * 
     */
    animate(locationZ, locationY) {
        //console.log(location);
        const coneBaseCenter = new THREE.Vector3(-1, 0, 0); // Fire starts from left, moves right
        for (let i = 0; i < 5; i++) {
            this.fireParticles.push(this.createFireParticle(coneBaseCenter, locationZ, locationY));
        }
        this.updateParticles();
    }
}