// Create a scene
var scene = new THREE.Scene();

// Create a camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

// Create a renderer and add it to the DOM
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a BufferGeometry instance
var geometry = new THREE.BufferGeometry();

// Create vertices for the triangle
var vertices = new Float32Array([
  1.0,  1.0,  0.0,  // Vertex 1
 -1.0, -1.0,  0.0,  // Vertex 2
  1.0, -1.0,  0.0   // Vertex 3
]);

// Create uv for the triangle
var uvs = new Float32Array([
  1.0,  1.0,  // uv 1
  0.0,  0.0,  // uv 2
  1.0,  0.0   // uv 3
]);

// Create color for the triangle
var colors = new Float32Array([
  1.0,  0.0,  0.0,  // color 1
  0.0,  1.0,  0.0,  // color 2
  0.0,  0.0,  1.0   // color 3
]);

// Add attributes for the BufferGeometry
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Create a material
var material = new THREE.MeshBasicMaterial({
  side: THREE.DoubleSide,
  vertexColors: true
});

// Create a mesh and add it to the scene
var triangle = new THREE.Mesh(geometry, material);
scene.add(triangle);

// Create a render loop
function animate() {
  requestAnimationFrame(animate);
  triangle.rotation.x += 0.01;
  triangle.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();
