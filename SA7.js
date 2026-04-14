import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- GLOBAL VARIABLES ---
let scene, camera, renderer, controls;
let star;
let particles = [];
let remnant;

let state = 'MAIN_SEQUENCE';
let mass = 1.0;


const container = document.getElementById('canvas-container');
const massSlider = document.getElementById('mass-slider');
const massVal = document.getElementById('mass-val');
const triggerBtn = document.getElementById('trigger-btn');
const resetBtn = document.getElementById('reset-btn');
const classVal = document.getElementById('class-val');
const statusVal = document.getElementById('status');

function init() {
    scene = new THREE.Scene();

    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const posArray = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const starMat = new THREE.PointsMaterial({ size: 0.02, color: 0xffffff });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const light = new THREE.PointLight(0xffffff, 2);
    light.position.set(5, 5, 5);
    scene.add(light);
    triggerBtn.onclick = triggerSupernova;
    resetBtn.onclick = () => {
        location.reload();
    }
    createStar()
    animate();
}
init()

massSlider.oninput = (e) => {
    mass = parseFloat(e.target.value);
    massVal.innerText = mass.toFixed(1);

    const scale = 0.5 + (mass * 0.05);
    star.scale.set(scale, scale, scale);

    star.material.color.setHex(getStarColor(mass));
    star.material.emissive.setHex(getStarColor(mass));

    // 🔥 ADD THIS PART
    if (mass < 2) {
        classVal.innerText = "Yellow Dwarf";
    } else if (mass < 8) {
        classVal.innerText = "Main Sequence Star";
    } else if (mass < 25) {
        classVal.innerText = "Blue Supergiant";
    } else {
        classVal.innerText = "Hypergiant";
    }

    statusVal.innerText = "Stable";
};

function getStarColor(m) {
    if (m < 2) return 0xffaa33;
    if (m < 8) return 0xffffff;
    if (m < 25) return 0x3366ff;
    return 0x5500ff;
}

function createStar() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    const material = new THREE.MeshStandardMaterial({
        color: getStarColor(mass),
        emissive: getStarColor(mass),
        emissiveIntensity: 1.5
    });

    star = new THREE.Mesh(geometry, material);
    scene.add(star);
}

function triggerSupernova() {
    state = 'EXPLODING';
    massSlider.disabled = true;
    triggerBtn.disabled = true;

    // Create particles
    for (let i = 0; i < 200; i++) {
        const geo = new THREE.SphereGeometry(0.02, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

        const p = new THREE.Mesh(geo, mat);
        p.position.copy(star.position);

        p.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );

        scene.add(p);
        particles.push(p);
    }

    let timer = 0;

    const explosionInterval = setInterval(() => {
        timer += 0.1;

        star.scale.addScalar(0.2);
        star.material.emissiveIntensity += 1;

        if (timer > 2) {
            clearInterval(explosionInterval);
            createRemnant();
        }
    }, 50);
}

function createRemnant() {
    scene.remove(star);
    state = 'REMNANT';

    if (mass < 8) {
        const geo = new THREE.SphereGeometry(0.2, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xccffff });
        remnant = new THREE.Mesh(geo, mat);
        document.getElementById('status').innerText = "Result: White Dwarf";
    } else if (mass < 25) {
        const group = new THREE.Group();

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );

        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.4, 10),
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );

        group.add(core, beam);
        remnant = group;
        document.getElementById('status').innerText = "Result: Pulsar/Neutron Star";
    } else {
        const group = new THREE.Group();

        const hole = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.8, 0.1, 16, 100),
            new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff0000 })
        );

        ring.rotation.x = Math.PI / 2;

        group.add(hole, ring);
        if (mass > 40) {
                    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 20),
                     new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.6}));
                    group.add(jet);
                    document.getElementById('status').innerText = "Result: Quasar";
                } else {
                    document.getElementById('status').innerText = "Result: Black Hole";
                }
        remnant = group;
    }

    scene.add(remnant);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    if (state === 'MAIN_SEQUENCE' && star) {
        star.rotation.y += 0.005;

        const scale = 1 + Math.sin(time * 2) * 0.02;
        star.scale.set(scale, scale, scale);
    }

    if (state === 'REMNANT' && remnant) {
        if (mass >= 8 && mass < 25) {
            remnant.rotation.z += 0.2;
        } else {
            remnant.rotation.y += 0.01;
        }
    }
   
    particles.forEach(p => {
        p.position.add(p.velocity);
    });


    controls.update();
    renderer.render(scene, camera);
}
