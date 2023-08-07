import * as THREE from 'three';
import * as math from 'mathjs';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CAM_PERSPECTIVE = 0;
const CAM_ORTHO = 1;

let camera, scene, renderer, controls, helpers;
let camera_perspective, camera_ortho, cameras;

const N_VERTICES = 12;
const N_EDGES = 30;
let labels = [];
let lights = [];
let totalTransformationTime = 0;

// Get the user's preferences from cookies
const cookieParams = document.cookie.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    if (name === 'params') {
        return JSON.parse(decodeURIComponent(value));
    }
    return acc;
}, {});

// Merge the cookie preferences with the default preferences
const params = {
    v_num: 1,
    showHelpers: cookieParams.showHelpers ?? false,
    showText: cookieParams.showText ?? false,
    camera: cookieParams.camera ?? CAM_PERSPECTIVE,
    drawFaces: cookieParams.drawFaces ?? true,
    drawEdges: cookieParams.drawEdges ?? true,
    drawPoints: cookieParams.drawPoints ?? false,
    drawNormals: cookieParams.drawNormals ?? false,
    drawIcoFaces: cookieParams.drawIcoFaces ?? false,
    drawIcoEdges: cookieParams.drawIcoEdges ?? false,
    drawIcoPoints: cookieParams.drawIcoPoints ?? false,
    drawIcoNormals: cookieParams.drawIcoNormals ?? false,
    // drawIcoPointOrder: false,
    normalizeToSphere: cookieParams.normalizeToSphere ?? true,
};

const ico = {
    vertices: undefined,            // Array of vertices
    edges: undefined,               // Array of edges
    triangles: undefined,           // Array of triangles for each face
    // pointsGeometry: undefined,      // Geometry for points
    // edgesGeometry: undefined,       // Geometry for edges
    // pointsOrderGeometry: undefined, // Geometry for point order
    // faceGeometry: undefined,        // Geometry for faces
    normals: undefined,             // Array of normals
    centroids: undefined,           // Array of centroids
    drawPoints: undefined,          // Function to add points to the scene
    drawEdges: undefined,           // Function to add edges to the scene
    drawFaces: undefined,           // Function to add faces to the scene
    drawNormals: undefined,         // Function to add normals to the scene
    // drawPointOrder: undefined,      // Function to add point order to the scene
    transformationMatrices: undefined,  // Store the 4x4 transformation matrices for efficiency.
};

if (WebGL.isWebGLAvailable()) {
    init();
    render();
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.useLegacyLights = false;
    renderer.localClippingEnabled = true;

    // Remove renderer if it already exists
    if (document.body.contains(renderer.domElement)) {
        document.body.removeChild(renderer.domElement);
    }
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    initLights();
    initCamera();

    // GUI
    const gui = new GUI();
    // Add camera selector
    gui.add(params, 'camera', { perspective: CAM_PERSPECTIVE, orthographic: CAM_ORTHO }).name('camera').onChange(onParamsChange);
    gui.add(params, 'v_num', 0, 100).step(1).onChange(onParamsChange);
    // Add toggle for xyz axes
    helpers = new THREE.AxesHelper(5);
    gui.add(params, 'showHelpers').name('show helpers').onChange(onParamsChange);
    
    // Add faces, lines, and points toggles
    gui.add(params, 'drawFaces').name('draw faces').onChange(onParamsChange);
    gui.add(params, 'drawEdges').name('draw edges').onChange(onParamsChange);
    gui.add(params, 'drawPoints').name('draw points').onChange(onParamsChange);
    gui.add(params, 'drawNormals').name('draw normals').onChange(onParamsChange);
    gui.add(params, 'drawIcoFaces').name('draw icosahedron faces').onChange(onParamsChange);
    gui.add(params, 'drawIcoEdges').name('draw icosahedron edges').onChange(onParamsChange);
    gui.add(params, 'drawIcoPoints').name('draw icosahedron points').onChange(onParamsChange);
    gui.add(params, 'drawIcoNormals').name('draw icosahedron normals').onChange(onParamsChange);
    // gui.add(params, 'drawIcoPointOrder').name('draw icosahedron point order').onChange(onParamsChange);
    // gui.add(params, 'showText').name('show text').onChange(onParamsChange);
    gui.add(params, 'normalizeToSphere').name('normalize to sphere').onChange(onParamsChange);

    generateIcosahedron();
    onParamsChange();

    window.addEventListener('resize', onWindowResize);
}

function initLights() {
    const light1 = new THREE.HemisphereLight(0xffffff, 0x080808, 4.5);
    light1.position.set(-1.25, 1, 1.25);
    light1.intensity = 1.1;
    const light2 = new THREE.HemisphereLight(0xffffff, 0x080808, 4.5);
    light2.position.set(1.25, 1, -1.25);
    light2.intensity = 0.5;
    lights.push(light1);
    lights.push(light2);
}

function initCamera() {
    camera_perspective = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 200);
    camera_ortho = new THREE.OrthographicCamera(window.innerWidth / -600, window.innerWidth / 600, window.innerHeight / 600, window.innerHeight / -600, 1, 200);
    cameras = [camera_perspective, camera_ortho];
    cameras.forEach((c) => {
        c.position.set(-1.5, 2.5, 3.0);
        controls = new OrbitControls(c, renderer.domElement);
        controls.addEventListener('change', render); // use only if there is no animation loop
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.enablePan = false;
    });
}


function onWindowResize() {
    cameras.forEach((c) => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function onParamsChange() {
    // Save the user's preferences to cookies
    document.cookie = `params=${encodeURIComponent(JSON.stringify(params))}`;

    // Select camera based on params
    camera = params.camera === CAM_PERSPECTIVE ? camera_perspective : camera_ortho;

    // Remove all objects from the scene
    scene.children = [];

    // Add the lights back
    lights.forEach((l) => scene.add(l));

    // Add the helpers back
    helpers.visible = params.showHelpers;
    scene.add(helpers);

    // Add the objects back
    if (params.drawIcoPoints) ico.drawPoints();
    if (params.drawIcoEdges) ico.drawEdges();
    if (params.drawIcoPointOrder) ico.drawPointOrder();
    if (params.drawIcoFaces) ico.drawFaces();
    if (params.drawIcoNormals) ico.drawNormals();
    drawDome();

    render();
}


function render() {
    if (params.showText && labels.length > 0) {
        // Make all labels face the camera
        for (let i = 0; i < N_VERTICES; i++) {
            labels[i].lookAt(camera.position);
        }
    }

    renderer.render(scene, camera);
}

// TODO: Add more color options
const pToC = (p, use_sat = true) => {
    const phi = Math.atan2(p[1], p[0]); // azimuthal angle [-pi, pi]
    let theta = Math.acos(p[2]); // polar angle [0, pi]
    if (isNaN(theta)) theta = 1.0;
    const hue = phi / (2.0 * Math.PI) + 0.5; // map to [0, 1]
    const saturation = use_sat ? theta / Math.PI / 4 + 0.6 : 0.5; // map to [0, 1]
    const lightness = 0.5; // for maximum brightness in HSL
    const color = new THREE.Color();
    color.setHSL(hue, saturation, lightness);
    return [color.r, color.g, color.b];
};

function generateIcosahedron() {
    // This function generates an icosahedron and returns the vertices and faces
    // and can be run once at initialization
    let startTime = performance.now();

    // Create the points
    // Create a material
    var material = new THREE.PointsMaterial({ vertexColors: true, size: 0.1 });
    // Create a geometry
    var geometry = new THREE.BufferGeometry();
    // Create a vertices array
    const p0 = [1 / 2, (1 + Math.sqrt(5)) / 4, 0.0];
    const points = [];
    const pointColors = [];
    const vertices = new Float32Array(N_VERTICES * 3);
    const vertexColors = new Float32Array(N_VERTICES * 3);
    for (let i = 0; i < N_VERTICES; i++) {
        let xi, yi, zi;
        xi = parseInt(i / 4);
        yi = xi + 1;
        zi = yi + 1;
        xi %= 3;
        yi %= 3;
        zi %= 3;
        // Copy original point with index offsets and negate either x or y coord (z is always 0)
        // The edge generation is highly dependent on the order of the points
        const x_neg = -2 * ((i + 0) / 2 % 2 >= 1) + 1;
        const y_neg = -2 * ((i + 1) / 2 % 2 >= 1) + 1;
        let x = p0[0] * x_neg;
        let y = p0[1] * y_neg;
        let z = p0[2];
        // Also swap for the points array
        let p = [x, y, z];
        // normalize the point
        p = math.multiply(p, 1 / math.norm(p));
        const p2 = [p[xi], p[yi], p[zi]];
        vertices[i * 3 + 0] = p[xi];
        vertices[i * 3 + 1] = p[yi];
        vertices[i * 3 + 2] = p[zi];
        points.push(new THREE.Vector3(p2[0], p2[1], p2[2]));
        // Set color based on vertex position
        const color = new THREE.Color();
        color.setHSL(i / N_VERTICES, 1.0, 0.5);
        vertexColors[i * 3 + 0] = color.r;
        vertexColors[i * 3 + 1] = color.g;
        vertexColors[i * 3 + 2] = color.b;
        pointColors.push(color);
    }
    // Create an attribute for the geometry and another for color
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
    // Create the point geometry
    var pointsGeometry = new THREE.Points(geometry, material);
    // Add the point to the scene
    if (params.showText) {
        labels = [];
        // Add text labels
        for (let i = 0; i < N_VERTICES; i++) {
            const label = createTextLabel(i.toString(), 'white');
            label.position.copy(points[i]);
            label.position.add(new THREE.Vector3(0.05, 0.05, 0));
            scene.add(label);
            labels.push(label);
        }
    }
    ico.vertices = vertices;
    // ico.pointsGeometry = pointsGeometry;
    ico.drawPoints = () => scene.add(pointsGeometry);

    // Create the edges
    // Create a material
    const edgesMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
    // Create a geometry
    const edgesGeometry = new THREE.BufferGeometry();
    // Create an array for the vertices
    // const edgesVertices = new Float32Array(30 * 3);
    const edges = [];
    const edgeColors = [];
    const ind = [];
    const edgeIndices = [];
    // console.log(pointColors);
    const addEdge = (i, j) => {
        if (i === j) return;
        const s = [i, j].sort().toString();
        if (ind.includes(s)) {
            throw new Error('Edge already exists');
        }
        ind.push([i, j].sort().toString());
        edgeIndices.push([i, j].sort());
        edges.push(new THREE.Line3(points[i], points[j]));
        edgeColors.push(pointColors[i]);
        edgeColors.push(pointColors[j]);
    };
    // Generate the edges
    for (let i = 0; i < N_VERTICES; i++) {
        addEdge(i, (i + 3) % N_VERTICES);
        // These patterns create the edges of the icosahedron with no duplicates based on the ordering of the points
        if (i % 2 === 0) {
            addEdge(i, (i + 4) % N_VERTICES);
        }
        if (i % 4 === 0) {
            addEdge(i, (i + 7) % N_VERTICES);
        }
        if (i % 4 === 1) {
            addEdge(i, (i + 1) % N_VERTICES);
        }
        if (i % 4 === 3) {
            addEdge(i, (i + 2) % N_VERTICES);
            addEdge(i, (i + 6) % N_VERTICES);
        }
    }
    // console.log(edges.length);
    edgeIndices.sort();
    // console.log(edgeIndices);
    // Create arrays for the vertices and colors
    const edgesVertices = new Float32Array(N_EDGES * 2 * 3);
    const edgesVertexColors = new Float32Array(N_EDGES * 2 * 3);
    // Populate the arrays
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const color1 = edgeColors[i * 2];
        const color2 = edgeColors[i * 2 + 1];
        // console.log(edge);
        edgesVertices[i * 2 * 3 + 0] = edge.start.x;
        edgesVertices[i * 2 * 3 + 1] = edge.start.y;
        edgesVertices[i * 2 * 3 + 2] = edge.start.z;
        edgesVertices[i * 2 * 3 + 3] = edge.end.x;
        edgesVertices[i * 2 * 3 + 4] = edge.end.y;
        edgesVertices[i * 2 * 3 + 5] = edge.end.z;
        edgesVertexColors[i * 2 * 3 + 0] = color1.r;
        edgesVertexColors[i * 2 * 3 + 1] = color1.g;
        edgesVertexColors[i * 2 * 3 + 2] = color1.b;
        edgesVertexColors[i * 2 * 3 + 3] = color2.r;
        edgesVertexColors[i * 2 * 3 + 4] = color2.g;
        edgesVertexColors[i * 2 * 3 + 5] = color2.b;
    }
    // Create attributes for the geometry
    edgesGeometry.setAttribute('position', new THREE.BufferAttribute(edgesVertices, 3));
    edgesGeometry.setAttribute('color', new THREE.BufferAttribute(edgesVertexColors, 3));
    // Create the line object
    const icoEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    // const icoPointOrderLines = new THREE.Line(edgesGeometry, edgesMaterial);
    ico.edges = icoEdges;
    // ico.edgesGeometry = icoEdges;
    // ico.pointsOrderGeometry = icoPointOrderLines;
    ico.drawEdges = () => scene.add(icoEdges);
    // ico.drawPointOrder = () => scene.add(icoPointOrderLines);

    // Create the faces
    // Create the triangle index array
    // Determine all unique combinations of 3 edges
    const indices = [];
    let indS = [];
    for (let i = 0; i < edgeIndices.length; i++) {
        for (let j = 0; j < edgeIndices.length; j++) {
            if (i === j) continue;
            const e1 = edgeIndices[i];
            const e2 = edgeIndices[j];
            let shared = -1;
            let not_shared = [-1, -1];
            // Check that the adges share a vertex
            for (let k = 0; k < 2; k++) {
                if ((not_shared[1] = e2.indexOf(e1[k])) !== -1) {
                    // They share 1 vertex
                    shared = e1[k];
                    // Store the other 2 vertices
                    not_shared[0] = e1[(k + 1) % 2];
                    not_shared[1] = e2[(not_shared[1] + 1) % 2];
                    // console.log(e1, e2, not_shared);
                    break;
                }
            }
            if (not_shared[0] === -1) continue;
            // Find the third edge if it exists
            not_shared.sort();
            // console.log(edgeIndices.map((e) => e.toString()));
            const l = edgeIndices.map((e) => e.toString()).indexOf(not_shared.toString());
            // console.log(edgeIndices.map((e) => e.toString())[l], not_shared.toString());
            if (l !== -1) {
                // Check that we haven't already added this triangle
                const n = [shared, not_shared[0], not_shared[1]];
                n.sort();
                if (indS.indexOf(n.sort().toString()) !== -1) {
                    // console.log('Already added');
                    continue;
                }
                indS.push(n.sort().toString());
                indices.push(n);
                // console.log(shared, not_shared[0], not_shared[1]);
            }
        }
    }
    indices.sort();
    // console.log(indices);
    indices.forEach((i) => {
        const p0 = points[i[0]];
        const p1 = points[i[1]];
        const p2 = points[i[2]];
        const q0 = [p0.x, p0.y, p0.z];
        const q1 = [p1.x, p1.y, p1.z];
        const q2 = [p2.x, p2.y, p2.z];
        // console.log(q0, q1, q2);
        // console.log(points[i[0]], points[i[1]], points[i[2]]);
    });
    const trianglesFlat = new Uint16Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
        trianglesFlat[i * 3] = indices[i][0];
        trianglesFlat[i * 3 + 1] = indices[i][1];
        trianglesFlat[i * 3 + 2] = indices[i][2];
    }
    // Create material
    const faceMaterial = new THREE.MeshToonMaterial({ side: THREE.DoubleSide, vertexColors: true });
    faceMaterial.flatShading = true;
    geometry.setIndex(indices.flat());
    const faceMesh = new THREE.Mesh(geometry, faceMaterial);
    // ico.facesGeometry = geometry;
    ico.drawFaces = () => scene.add(faceMesh);

    // Draw all of the normal vectors as lines from the triangle centers
    let triangles = indices.map((i) => [points[i[0]], points[i[1]], points[i[2]]]);
    triangles = triangles.map((t) => t.map((p) => [p.x, p.y, p.z]));
    // Sort in order to get outward facing normals -- Put the most negative point first
    // triangles = triangles.map((t) => t.sort((a, b) => math.subtract(math.sum(a), math.sum(b))));
    triangles = triangles.map((t) => math.transpose(t));
    // triangles.forEach((t, i) => printMatrix(t, `Triangle ${i}`));
    // triangles.forEach((t, i) => [0, 0, 0].forEach((_, j) => console.log(`Triangle ${i}, ${j}`, math.norm(math.flatten(math.column(t, j))))));
    const normals = triangles.map((t) => getNormalVector(t));
    const centroids = triangles.map((t) => findTriangleCentroid(t));
    ico.triangles = triangles;
    ico.normals = normals;
    ico.centroids = centroids;
    ico.drawNormals = () => triangles.forEach((t, i) => drawVector(centroids[i], normals[i], 0.1));

    let endTime = performance.now();
    console.log(`Time to create icosahedron: ${endTime - startTime} ms`);
}

function drawDome() {
    // Geodesic Dome
    // https://en.wikipedia.org/wiki/Geodesic_dome
    let startTime = performance.now();

    // Subdivide the triangles
    const v = params.v_num;
    const face_base = generateDomeFace(v);
    const face_points = face_base.points;
    // printMatrix(face_points, 'face_points');
    console.log(face_points[0])
    const face_lines = face_base.lines;
    // printMatrix(face_lines, 'face_lines');
    const face_triangles = face_base.triangles;
    // printMatrix(face_triangles, 'face_triangles');
    // Add a z and a 1 to each point
    // face_points.map((p, i) => console.log(p.length, p, i));
    const fp = face_points.map((p) => [...p, 1.0]);
    // all values are point arrays...
    // const fl = face_lines.map((l) => l.map((p) => [...p, 1.0]));
    // const ft = face_triangles.map((t) => t.map((p) => [...p, 1.0]));

    // line and triangle values are point indices

    // Create the points
    const default_triangle = math.transpose([
        [0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0],
        [1 / 2, Math.sqrt(3) / 2, 0.0],
    ]);
    if (ico.transformationMatrices ?? 1) ico.transformationMatrices = ico.triangles.map((t) => getTransformationMatrix(default_triangle, t));
    console.log(ico.transformationMatrices);
    console.log(`Generating Transformation Matrices took ${totalTransformationTime} ms.`)
    ico.triangles.forEach((t, i) => {
        // if (i !== 0) return;
        const M = ico.transformationMatrices[i];
        // Now transform the points
        let transformed_points = math.multiply(M, math.transpose(fp));
        // remove the 1
        transformed_points = math.transpose(transformed_points).map((p) => p.slice(0, 3));
        let transformed_lines = face_lines.map((l) => l.map((pi) => transformed_points[pi]));
        let transformed_triangles = face_triangles.map((t) => t.map((pi) => transformed_points[pi]));

        // Now normalize the points to the unit sphere
        if (params.normalizeToSphere) {
            transformed_points = transformed_points.map((p) => math.multiply(p, 1 / math.norm(p) * 1.0002));
            transformed_lines = transformed_lines.map((l) => l.map((p) => math.multiply(p, 1 / math.norm(p) * 1.0001)));
            transformed_triangles = transformed_triangles.map((t) => t.map((p) => math.multiply(p, 1 / math.norm(p))));
        }

        // Color the points
        let _point_colors = transformed_points.map((p) => pToC(p, false));
        let point_colors = new Float32Array(_point_colors.length * 3);
        _point_colors.forEach((c, i) => {
            point_colors[i * 3 + 0] = c[0];
            point_colors[i * 3 + 1] = c[1];
            point_colors[i * 3 + 2] = c[2];
        });
        let _line_colors = transformed_lines.map((l) => l.map((p) => pToC(p), false));
        let line_colors = new Float32Array(_line_colors.length * 3 * 2);
        _line_colors.forEach((c, i) => {
            c.forEach((c2, j) => {
                line_colors[i * 3 * 2 + j * 3 + 0] = c2[0];
                line_colors[i * 3 * 2 + j * 3 + 1] = c2[1];
                line_colors[i * 3 * 2 + j * 3 + 2] = c2[2];
            });
        });
        // Color the triangles
        let _triangle_colors = transformed_triangles.map((t) => t.map((p) => pToC(p)));
        let triangle_colors = new Float32Array(_triangle_colors.length * 3 * 3);
        _triangle_colors.forEach((c, i) => {
            c.forEach((c2, j) => {
                triangle_colors[i * 3 * 3 + j * 3 + 0] = c2[0];
                triangle_colors[i * 3 * 3 + j * 3 + 1] = c2[1];
                triangle_colors[i * 3 * 3 + j * 3 + 2] = c2[2];
            });
        });

        // Draw the points
        const material = new THREE.PointsMaterial({ vertexColors: true, size: 0.1 });
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(transformed_points.flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(point_colors, 3));
        const pointsGeometry = new THREE.Points(geometry, material);

        // Draw the lines
        const lineMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 6 });
        const lineGeometry = new THREE.BufferGeometry();
        const lineVertices = new Float32Array(math.flatten(transformed_lines));
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(lineVertices, 3));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(line_colors, 3));
        const lineObject = new THREE.LineSegments(lineGeometry, lineMaterial);

        // Draw the triangles
        const triangleMaterial = new THREE.MeshToonMaterial({ side: THREE.DoubleSide, vertexColors: true });
        const triangleGeometry = new THREE.BufferGeometry();
        const triangleVertices = new Float32Array(math.flatten(transformed_triangles));
        triangleGeometry.setAttribute('position', new THREE.BufferAttribute(triangleVertices, 3));
        triangleGeometry.setAttribute('color', new THREE.BufferAttribute(triangle_colors, 3));
        triangleMaterial.flatShading = true;
        const triangleObject = new THREE.Mesh(triangleGeometry, triangleMaterial);

        if (params.drawFaces) scene.add(triangleObject);
        if (params.drawEdges) scene.add(lineObject);
        if (params.drawPoints) scene.add(pointsGeometry);

    });

    let endTime = performance.now();
    console.log(`Rendered in ${endTime - startTime} ms`);
}

function getTransformationMatrix(t0, t1) {
    let startTime = performance.now();

    // Get the transformation matrix from t0 to t1
    // Let's try this again, but try to get the transformation matrix as the inverse of 4 vectors in the triangle, along with their centroid
    const P = math.transpose([
        [...math.flatten(math.column(t0, 0)), 1],
        [...math.flatten(math.column(t0, 1)), 1],
        [...math.flatten(math.column(t0, 2)), 1],
        [...math.flatten(
            math.cross(
                math.subtract(
                    math.flatten(
                        math.column(t0, 2)),
                    math.flatten(
                        math.column(t0, 0)
                    )
                ),
                math.subtract(
                    math.flatten(
                        math.column(t0, 1)
                    ),
                    math.flatten(
                        math.column(t0, 0)
                    )
                )
            )
        ),
            0],
    ]);
    const Q = math.transpose([
        [...math.flatten(math.column(t1, 0)), 1],
        [...math.flatten(math.column(t1, 1)), 1],
        [...math.flatten(math.column(t1, 2)), 1],
        [...math.flatten(
            math.cross(
                math.subtract(
                    math.flatten(
                        math.column(t1, 2)
                    ),
                    math.flatten(
                        math.column(t1, 0)
                    )
                ),
                math.subtract(
                    math.flatten(
                        math.column(t1, 1)
                    ),
                    math.flatten(
                        math.column(t1, 0)
                    )
                )
            )
        ),
            0],
    ]);
    // Compute inverse of P and Q
    const P_inv = math.inv(P);
    const Q_inv = math.inv(Q);
    // Compute M
    let M = math.multiply(Q, P_inv);
    // printMatrix(M, 'M');

    let endTime = performance.now();
    // console.log(`getTransformationMatrix() took ${startTime - endTime} ms.`);
    totalTransformationTime += endTime - startTime;

    return M;
}

// Returns the location of the point for the intersection of 60 degree lines with offsets p and q
function intersect60(p, q) {
    const m = 1.0 / Math.sqrt(3.0);
    const y = (q - p) / 2.0 / m;
    const x = (p + q) / 2.0;
    return [x, -y, 0.0];
}

function generateDomeFace(v) {
    let startTime = performance.now();

    const points = []; // Array of actual point values on x, y plane
    const lines = []; // Array of point indeces for lines
    const triangles = []; // Array of point indices for triangles
    const layers = []; // Array of layers, layers contain their point indices
    // v is the dome frequency (# of times to subdivide the triange)
    for (let p = 0; p <= v + 1; p++) {
        layers.push([]);
        const layer = layers[p];
        for (let q = 0; q <= v + 1; q++) {
            if (p < q) continue;
            const origin = intersect60(p, q);
            // Total edge length = 1
            const point = math.multiply(origin, 1 / (v + 1));
            layer.push(points.length);
            points.push(point);
        }
    }

    const triangle_colors = [];
    const triangle = (p1, p2, p3, color) => {
        triangles.push([p1, p2, p3]);
        triangle_colors.push(color);
    };
    // Draw the triangles
    for (let p = 0; p < layers.length - 1; p++) {
        // Draw the triangles in the layer to the next layer
        const layer = layers[p];
        const nextLayer = layers[p + 1];
        for (let q = 0; q < nextLayer.length - 1; q++) {
            // Add triangles which go up from current point
            triangle(layer[q], nextLayer[q], nextLayer[q + 1], 0);
            if (p > q) {
                // Add triangles which go down from current point conditionally
                triangle(layer[q], layer[q + 1], nextLayer[q + 1], 1)
            }
        }
    }

    const line = (p1, p2) => {
        lines.push([p1, p2]);
    };
    // Connect points with lines
    for (let p = 1; p < layers.length; p++) {
        // First connect adjacent points in the same layer
        const layer = layers[p];
        for (let q = 0; q < layer.length - 1; q++) {
            line(layer[q], layer[q + 1]);
        }
        // Now connect each point in previous layer to the current layer (2 new lines each)
        const prevLayer = layers[p - 1];
        for (let q = 0; q < prevLayer.length; q++) {
            line(prevLayer[q], layer[q]);
            line(prevLayer[q], layer[q + 1]);
        }
    }

    // const point = (p) => {
    //     points.push(p);
    // };
    // // Draw the points on top
    // for (let p = 0; p < layers.length; p++) {
    //     const layer = layers[p];
    //     for (let q = 0; q < layer.length; q++) {
    //         point(layer[q]);
    //     }
    // }

    let endTime = performance.now();
    console.log(`generateDomeFace took ${endTime - startTime} ms.`)

    return {
        points,
        lines,
        triangles,
    };
}

// function drawLine() {
//     //create a blue LineBasicMaterial
//     const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
//     const points = [];
//     points.push(new THREE.Vector3(-1, 0, 0));
//     points.push(new THREE.Vector3(0, 1, 0));
//     points.push(new THREE.Vector3(1, 0, 0));
//     const geometry = new THREE.BufferGeometry().setFromPoints(points);
//     const line = new THREE.Line(geometry, material);
//     scene.add(line);
//     return line;
// }

// function createTextSprite(message, color) {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     context.font = '24px Arial';
//     context.fillStyle = color;
//     context.fillText(message, 0, 24);

//     const texture = new THREE.CanvasTexture(canvas);
//     const material = new THREE.SpriteMaterial({ map: texture });
//     const sprite = new THREE.Sprite(material);

//     // Set the sprite scale
//     sprite.scale.set(1, 0.5, 1);

//     return sprite;
// }

function printMatrix(matrix, name = undefined) {
    const log = (name, ...args) => name === undefined ? console.log(...args) : console.log(name, ...args);
    if (matrix instanceof math.Matrix) {
        // return console.log(...(matrix.map((value) => value)));
        return log(name, ...matrix._data);
    }
    log(name, ...matrix);
}

function getNormalVector(t) {
    // Always return the normal vector pointing outwards
    const normal1 = math.cross(
        math.subtract(
            math.flatten(
                math.column(t, 2)
            ),
            math.flatten(
                math.column(t, 0)
            )
        ),
        math.subtract(
            math.flatten(
                math.column(t, 1)
            ),
            math.flatten(
                math.column(t, 0)
            )
        )
    );
    const normal2 = math.cross(
        math.subtract(
            math.flatten(
                math.column(t, 1)
            ),
            math.flatten(
                math.column(t, 0)
            )
        ),
        math.subtract(
            math.flatten(
                math.column(t, 2)
            ),
            math.flatten(
                math.column(t, 0)
            )
        )
    );
    const p0 = math.flatten(math.column(t, 0));
    return math.dot(normal1, p0) > 0 ? normal1 : normal2;
}

function createTextLabel(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Make the canvas and context transparent
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = '50px Arial';
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(1.0, 0.5);
    const label = new THREE.Mesh(geometry, material);

    return label;
}

function findTriangleCentroid(triangle) {
    // Find the centroid of a triangle
    // printMatrix(triangle, 'triangle');
    // printMatrix(math.flatten(math.column(triangle, 0)), 'skjdf')
    const centroid = math.multiply(math.add(math.flatten(math.column(triangle, 0)), math.flatten(math.column(triangle, 1)), math.flatten(math.column(triangle, 2))), 1 / 3);
    // printMatrix(centroid, 'centroid');
    return centroid;
}

function drawVector(origin, direction, length, color = 0xff0000) {
    // Convert the origin and direction to THREE.Vector3
    const originVector = new THREE.Vector3(...origin);
    let directionVector = new THREE.Vector3(...direction);

    // Normalize the direction vector to get a unit vector
    directionVector.normalize();

    // Scale the direction vector to the desired length
    directionVector.multiplyScalar(length);

    // Calculate the end point by adding the scaled direction vector to the origin
    const endPoint = originVector.clone().add(directionVector);

    // Create a line geometry from the origin to the end point
    const geometry = new THREE.BufferGeometry().setFromPoints([originVector, endPoint]);

    // Create a line material
    const material = new THREE.LineBasicMaterial({ color });

    // Create a line and add it to the scene
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}
