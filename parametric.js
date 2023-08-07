/*
TODO
- Add parameters to GUI
- Twisted SURFACE_FUNCTION
- Add color to points based on rate of change (euclidean distance? no
    actually probably distance along the curve but can be approxed from last position) -- this way we 
can visualize curvature of surfaces

*/


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { create } from 'mathjs';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();


renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.25;

function surface( u, v, target ) {
    u *= Math.PI;
    v *= 2 * Math.PI;
    u = u * 3;
    const x = Math.cos( u ) * Math.sin( v );
    const y = Math.sin( u ) * Math.sin( v );
    const z = Math.cos( v );
    target.set( x, y, z );
}

function fake_geodesic (u, v, target) {
    u *= 2* Math.PI;
    v *= 2 * Math.PI;
    const x = Math.cos( u ) * Math.sin( v );
    const y = Math.sin( u ) * Math.sin( v );
    const z = Math.cos( v );
    target.set( x, y, z );
}

function sphere(u, v, target) {
    u *= 2* Math.PI;
    v *= Math.PI;
    const x = Math.cos( u ) * Math.sin( v );
    const y = Math.sin( u ) * Math.sin( v );
    const z = Math.cos( v );
    target.set( x, y, z );
}

function cylinder(u, v, target) {
    u *= 2* Math.PI;
    v *= 2 * Math.PI;
    const x = Math.cos( u );
    const y = Math.sin( u );
    const z = u;
    target.set( x, y, z );

}

function hyperbolic_paraboloid(u, v, target) {
    u *= 2* Math.PI;
    v *= 2 * Math.PI;
    const x = u;
    const y = v;
    const z = u * v;
    target.set( x, y, z );
}

function butterfly_curve(theta, theta2, target) {
    theta *= 2*Math.PI;
    theta2 *= 2 * Math.PI;
    const x = Math.sin(theta) * (Math.exp(Math.cos(theta)) - 2 * Math.cos(4 * theta) - Math.pow(Math.sin(theta/12), 5));
    const y = Math.cos(theta) * (Math.exp(Math.cos(theta)) - 2 * Math.cos(4 * theta) - Math.pow(Math.sin(theta/12), 5));
    const z = Math.pow(Math.sin(theta/2), 3);
    target.set( x, y, z );
}

function twisted_torus(u, v, target) {
    u *= 4* Math.PI;
    v *= 2 * Math.PI;
    const x = Math.sin(u) + 2* Math.sin(2*u);
    const y = Math.cos(u) - 2* Math.cos(2*u);
    const z = -Math.sin(3*u);
    target.set( x, y, z );
}

let phase = 0;
let speed = 0.001;
function torus(u, v, target) {
    phase += speed;
    u = 2* Math.PI;
    v *= 2 * Math.PI;
    const x = (2 + Math.cos(v)) * Math.cos(u);
    const y = (2 + Math.cos(v)) * Math.sin(u);
    const z = Math.cos(v);
    target.set( x, y, z );
}


const N_SLICES = 100;
const N_STACKS = 100;
let SURFACE_FUNCTION = twisted_torus;
const geometry = new ParametricGeometry( SURFACE_FUNCTION, N_SLICES, N_STACKS);
const material = new THREE.MeshBasicMaterial( { color: 0x00ffff, wireframe: true } );



// const numVertices = geometry.attributes.position.count;
// const colors = new Float32Array(numVertices * 3);

// for (let i = 0; i < numVertices; i++) {
//     colors[i * 3] = Math.random();     // red
//     colors[i * 3 + 1] = Math.random(); // green
//     colors[i * 3 + 2] = Math.random(); // blue
// }

// geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// const material = new THREE.PointsMaterial({size: 0.01, vertexColors: true});

const points = new THREE.Points(geometry, material);
scene.add(points);

const mesh = new THREE.Points( geometry, material );
scene.add( mesh );

camera.position.z = 15;

// let arrow;
// let arrows = [];

// function create_arrow(u, v, surface_function) {
//     let point = new THREE.Vector3();
//     surface_function(u, v, point);

//     arrow = new THREE.ArrowHelper( point.normalize(), new THREE.Vector3(0,0,0), point.length(), 0xff0000 );
//     scene.add( arrow );
//     arrows.push(arrow);
// }

// function uv_array() {
//     const uvs = [];
//     for (let i = 0; i < 1; i += 1/N_SLICES) {
//         for (let j = 0; j < 1; j += 1/N_STACKS) {
//             uvs.push([i, j]);
//         }
//     }
//     return uvs;
// }

// let uvs = uv_array();
// const N = 100;
// let animation_iteration = 0;
// create_arrow(0,0);

function animate() {
    requestAnimationFrame( animate );
    controls.update();

    // if (arrows.length > N) {
    //     scene.remove(arrows.shift());
    // }

    // new_u, new_v = uvs[animation_iteration][0], uvs[animation_iteration][1];
    // create_arrow(new_u, new_v, SURFACE_FUNCTION);
    points.geometry.dispose();
    points.geometry = new ParametricGeometry( SURFACE_FUNCTION, N_SLICES, N_STACKS);
    
    const numVertices = geometry.attributes.position.count;
    const colors = new Float32Array(numVertices * 3);

    // for (let i = 0; i < numVertices; i++) {
    //     colors[i * 3] = Math.random();     // red
    //     colors[i * 3 + 1] = Math.random(); // green
    //     colors[i * 3 + 2] = Math.random(); // blue
    // }

    // geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    renderer.render( scene, camera );

    // mesh.rotation.x += 0.01;
    // mesh.rotation.y += 0.01;
    // mesh.rotation.z += 0.01;

    // animation_iteration += 1;
    // if (animation_iteration >= uvs.length) {
    //     animation_iteration = 0;
    // }
}

animate();